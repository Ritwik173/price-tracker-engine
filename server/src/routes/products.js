import { Router } from 'express';
import { prisma } from '../index.js';
import { scrapeProduct } from '../services/scraper.js';
import logger from '../utils/logger.js';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        alerts: true,
      }
    });
    res.json(products);
  } catch (error) {
    logger.error('API', 'Failed to fetch products', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product with price history
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        priceHistory: {
          orderBy: { scrapedAt: 'asc' },
          take: 100, // Limit to last 100 points for chart
        },
        alerts: true,
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    logger.error('API', 'Failed to fetch product details', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// POST add new product
router.post('/', async (req, res) => {
  const { url, targetPrice, contactType, destination, currency } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Product URL is required' });
  }

  if (!contactType || !destination) {
    return res.status(400).json({ error: 'Contact type and destination are required' });
  }

  const selectedCurrency = currency || 'INR';

  try {
    // 1. Scrape the product first to get details and verify it works
    const scrapeResult = await scrapeProduct(url);
    
    if (!scrapeResult.success || !scrapeResult.data) {
      return res.status(400).json({ 
        error: 'Failed to scrape product. Ensure it is a valid Amazon URL.',
        details: scrapeResult.error 
      });
    }

    const { name, price: basePrice, imageUrl, platform, baseCurrency } = scrapeResult.data;

    // Convert price to user's selected currency
    let displayPrice = basePrice;
    try {
      const { convertCurrency } = await import('../services/currencyService.js');
      displayPrice = await convertCurrency(basePrice, baseCurrency, selectedCurrency);
    } catch (err) {
      logger.warn('API', 'Currency conversion failed, using base price', err);
    }

    // 2. Create the product and alert atomically in DB
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          url,
          platform,
          imageUrl,
          currentPrice: displayPrice,
          lowestPrice: displayPrice,
          highestPrice: displayPrice,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          currency: selectedCurrency,
        }
      });

      // Add initial price point
      if (displayPrice) {
        await tx.pricePoint.create({
          data: {
            price: displayPrice,
            currency: selectedCurrency,
            productId: newProduct.id,
          }
        });
      }

      // Add the mandatory alert configuration
      const initialAlert = await tx.alert.create({
        data: {
          type: contactType,
          destination: destination,
          triggerType: 'price_drop',
          productId: newProduct.id,
        }
      });

      return { newProduct, initialAlert };
    });

    // 3. Trigger immediate alert if the initial price is already below the target
    if (targetPrice && displayPrice <= parseFloat(targetPrice)) {
      try {
        const { sendAlert } = await import('../services/alertService.js');
        const { analyzePriceChange } = await import('../services/priceAnalyzer.js');
        
        // Mock a previous state so the analyzer detects the target hit
        const mockPreviousState = { ...product.newProduct, currentPrice: parseFloat(targetPrice) + 1 };
        const analysis = analyzePriceChange(mockPreviousState, displayPrice);
        
        logger.info('API', `Initial price ${displayPrice} is below target ${targetPrice}. Triggering immediate alert.`);
        await sendAlert(product.initialAlert, product.newProduct, displayPrice, analysis);
      } catch (alertErr) {
        logger.error('API', 'Failed to send initial alert', alertErr);
      }
    }

    res.status(201).json(product.newProduct);
  } catch (error) {
    // Check for unique constraint violation (product already exists)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Product is already being tracked' });
    }
    
    logger.error('API', 'Failed to add product', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// PUT update product (e.g. update target price)
router.put('/:id', async (req, res) => {
  const { targetPrice, isActive } = req.body;

  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        targetPrice: targetPrice !== undefined ? targetPrice : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      }
    });
    res.json(product);
  } catch (error) {
    logger.error('API', 'Failed to update product', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('API', 'Failed to delete product', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
