/**
 * Cron Job: Price Tracker
 * Runs on a schedule to fetch updated prices for all active products.
 */

import cron from 'node-cron';
import { prisma } from '../index.js';
import { scrapeProduct } from '../services/scraper.js';
import { analyzePriceChange, calculateStats } from '../services/priceAnalyzer.js';
import { sendAlert } from '../services/alertService.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

let isTracking = false;

/**
 * Perform tracking run on all active products
 */
export async function runPriceTracker() {
  if (isTracking) {
    logger.warn('Cron', 'Previous tracking run still in progress. Skipping this cycle.');
    return;
  }

  isTracking = true;
  logger.info('Cron', 'Starting scheduled price tracking run...');
  const startTime = Date.now();

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { alerts: { where: { isActive: true } } }
    });

    if (products.length === 0) {
      logger.info('Cron', 'No active products to track.');
      return;
    }

    logger.info('Cron', `Tracking ${products.length} active products.`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      try {
        const scrapeResult = await scrapeProduct(product.url);

        if (!scrapeResult.success || !scrapeResult.data) {
          logger.warn('Cron', `Failed to scrape ${product.name}: ${scrapeResult.error}`);
          failCount++;
          continue;
        }

        const { price: basePrice, baseCurrency, imageUrl, name: scrapedName } = scrapeResult.data;
        
        if (basePrice) {
          // Convert price to user's selected currency
          let newPrice = basePrice;
          try {
            const { convertCurrency } = await import('../services/currencyService.js');
            newPrice = await convertCurrency(basePrice, baseCurrency, product.currency || 'INR');
          } catch (err) {
            logger.warn('Cron', 'Currency conversion failed, using base price', err);
          }

          // Analyze for price drops or target hits
          const analysis = analyzePriceChange(product, newPrice);

          // Save new price point
          await prisma.pricePoint.create({
            data: {
              price: newPrice,
              currency: product.currency || 'INR',
              productId: product.id,
            }
          });

          // Fetch updated history to recalculate stats
          const updatedHistory = await prisma.pricePoint.findMany({
            where: { productId: product.id },
            orderBy: { scrapedAt: 'desc' }
          });
          const stats = calculateStats(updatedHistory);

          // Update product
          await prisma.product.update({
            where: { id: product.id },
            data: {
              currentPrice: newPrice,
              lowestPrice: stats.min,
              highestPrice: stats.max,
              imageUrl: scrapeResult.data.imageUrl || product.imageUrl,
              name: scrapeResult.data.name !== 'Unknown Product' ? scrapeResult.data.name : product.name
            }
          });

          // Log changes
          if (analysis.isDrop) {
            logger.alert(`Price drop for ${product.name}! ₹${product.currentPrice} -> ₹${newPrice} (-${analysis.dropPercentage}%)`);
          } else if (analysis.isTargetReached) {
            logger.alert(`Target reached for ${product.name}! Target: ₹${product.targetPrice}, Current: ₹${newPrice}`);
          }

          // Trigger alerts (Phase 4)
          if ((analysis.isDrop || analysis.isTargetReached) && product.alerts.length > 0) {
            const triggerType = analysis.isTargetReached ? 'target_reached' : 'price_drop';
            logger.info('Cron', `Triggering ${product.alerts.length} alerts for ${product.name} (Trigger: ${triggerType})`);
            
            for (const alert of product.alerts) {
               await sendAlert(alert, product, newPrice, analysis);
            }
          }

          successCount++;
        } else {
          logger.warn('Cron', `Could not extract a valid price for ${product.name}`);
          failCount++;
        }

        // Polite delay between products
        await new Promise(resolve => setTimeout(resolve, env.scrapeDelayMs));

      } catch (err) {
        logger.error('Cron', `Error tracking product ${product.id}`, err);
        failCount++;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.success('Cron', `Tracking run complete in ${elapsed}s. Success: ${successCount}, Failed: ${failCount}`);

  } catch (error) {
    logger.error('Cron', 'Tracking run failed', error);
  } finally {
    isTracking = false;
  }
}

/**
 * Initialize the cron job
 */
export function initCronJobs() {
  // Run based on configured interval (default 6 hours)
  const schedule = `0 */${env.scrapeIntervalHours} * * *`;
  
  logger.info('System', `Initializing Price Tracker cron job (Schedule: ${schedule})`);
  
  cron.schedule(schedule, async () => {
    await runPriceTracker();
  });
}

export default { runPriceTracker, initCronJobs };
