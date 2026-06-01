/**
 * Quick test script for the scraper service
 * Usage: npx tsx src/test-scraper.js <product_url>
 * 
 * Example:
 *   npx tsx src/test-scraper.js "https://www.amazon.in/dp/B0D5J4DXRN"
 *   npx tsx src/test-scraper.js "https://www.flipkart.com/apple-iphone-15/p/itm..."
 */

import { scrapeProduct, closeBrowser } from './services/scraper.js';
import { detectPlatform } from './services/selectorConfig.js';

const url = process.argv[2];

if (!url) {
  console.log('\n  📋 Scraper Test Script');
  console.log('  ═══════════════════════════════════════');
  console.log('  Usage: npx tsx src/test-scraper.js <product_url>');
  console.log('');
  console.log('  Examples:');
  console.log('    npx tsx src/test-scraper.js "https://www.amazon.in/dp/B0D5J4DXRN"');
  console.log('    npx tsx src/test-scraper.js "https://www.flipkart.com/some-product/p/itm..."');
  console.log('');
  process.exit(0);
}

console.log('\n🔍 Price Tracker — Scraper Test\n');

// Step 1: Detect platform
const detected = detectPlatform(url);
if (detected) {
  console.log(`✅ Platform detected: ${detected.config.name}`);
} else {
  console.log('❌ Could not detect platform from URL');
  process.exit(1);
}

// Step 2: Scrape
console.log(`🌐 Scraping: ${url.substring(0, 80)}...`);
console.log('   (This may take 10-20 seconds due to browser launch + polite delays)\n');

const startTime = Date.now();
const result = await scrapeProduct(url);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

// Step 3: Display results
if (result.success) {
  console.log('═══════════════════════════════════════════');
  console.log('  ✅ SCRAPE SUCCESSFUL');
  console.log('═══════════════════════════════════════════');
  console.log(`  📦 Product:  ${result.data.name}`);
  console.log(`  💰 Price:    ₹${result.data.price?.toLocaleString('en-IN') || 'N/A'}`);
  console.log(`  🖼️  Image:    ${result.data.imageUrl ? 'Found' : 'Not found'}`);
  console.log(`  📍 Platform: ${result.data.platform}`);
  console.log(`  ✓  Available: ${result.data.available ? 'Yes' : 'No'}`);
  console.log(`  ⏱️  Time:     ${elapsed}s`);
  console.log('═══════════════════════════════════════════\n');
} else {
  console.log('═══════════════════════════════════════════');
  console.log('  ❌ SCRAPE FAILED');
  console.log('═══════════════════════════════════════════');
  console.log(`  Error: ${result.error}`);
  console.log(`  ⏱️  Time: ${elapsed}s`);
  console.log('═══════════════════════════════════════════\n');
}

// Cleanup
await closeBrowser();
process.exit(result.success ? 0 : 1);
