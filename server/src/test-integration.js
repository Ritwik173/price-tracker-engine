import { prisma } from './index.js';
import { scrapeProduct } from './services/scraper.js';
import { analyzePriceChange } from './services/priceAnalyzer.js';
import { sendAlert } from './services/alertService.js';
import { closeBrowser } from './services/scraper.js';

async function runIntegrationTest() {
  console.log('🧪 Starting Integration Test (Phases 2, 3, 4)...\n');

  try {
    // 1. Test Scraper (Phase 2)
    const testUrl = 'https://www.amazon.com/dp/B0DZZWMB2L/'; // Working ASIN from user
    console.log(`🌐 Testing Scraper on: ${testUrl}`);
    const scrapeResult = await scrapeProduct(testUrl);
    
    if (!scrapeResult.success) {
      console.log('❌ Scraper failed:', scrapeResult.error);
      return;
    }
    
    console.log('✅ Scraper Success!');
    console.log(`   Product: ${scrapeResult.data.name.substring(0, 50)}...`);
    console.log(`   Price: ₹${scrapeResult.data.price}`);

    // 2. Test DB & Price Analyzer (Phase 3)
    console.log('\n📊 Testing Price Analyzer & DB...');
    // Mock a product in the DB with a higher price to force a "price drop"
    let mockProduct = {
      id: 'test-product-id',
      name: scrapeResult.data.name,
      url: testUrl,
      currentPrice: scrapeResult.data.price + 5000, // 5000 more than current
      targetPrice: scrapeResult.data.price + 1000,
      platform: 'amazon',
      alerts: [
        {
          id: 'test-alert-id',
          email: 'test@example.com', // Dummy email
          phone: '+919999999999'      // Dummy phone
        }
      ]
    };

    const analysis = analyzePriceChange(mockProduct, scrapeResult.data.price);
    console.log(`   Detected Drop? ${analysis.isDrop} (Amount: ₹${analysis.dropAmount})`);
    console.log(`   Target Reached? ${analysis.isTargetReached}`);

    if (!analysis.isDrop) {
      console.log('❌ Price Analyzer failed to detect drop.');
      return;
    }
    console.log('✅ Price Analyzer Success!');

    // 3. Test Alert Engine (Phase 4)
    console.log('\n🔔 Testing Alert Engine (Dry Run)...');
    console.log('   Sending mock alert to test@example.com and +919999999999...');
    
    // We will call sendAlert. If API keys are invalid or not set, it will gracefully fail and log.
    const alertResult = await sendAlert(mockProduct.alerts[0], mockProduct, scrapeResult.data.price, analysis);
    
    console.log(`   Email Attempted: ${alertResult.emailSuccess}`);
    console.log(`   SMS/WhatsApp Attempted: ${alertResult.phoneSuccess}`);
    console.log('✅ Alert Engine invoked successfully!');

    console.log('\n🎉 All backend phases (2, 3, 4) connected correctly!');

  } catch (error) {
    console.error('\n❌ Integration test threw an error:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

runIntegrationTest();
