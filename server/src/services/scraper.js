import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Extracts the Amazon domain and ASIN from a given URL.
 * Supports standard URLs, dp/, gp/product/, etc.
 * 
 * @param {string} url - The Amazon URL
 * @returns {Object|null} { domain: string, asin: string }
 */
function parseAmazonUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', ''); // e.g. 'amazon.in', 'amazon.com'

    // Extract ASIN using regex. Typical formats: /dp/ASIN, /gp/product/ASIN
    let asinMatch = urlObj.pathname.match(/(?:dp|o|ASIN|gp\/product)\/([A-Z0-9]{10})/i);
    
    // Fallback: look for any 10-character string starting with B0 in the pathname
    if (!asinMatch || !asinMatch[1]) {
      asinMatch = urlObj.pathname.match(/\/(B0[A-Z0-9]{8})(?:\/|\?|$)/i);
    }
    
    if (!asinMatch || !asinMatch[1]) {
      return null;
    }

    return {
      domain,
      asin: asinMatch[1].toUpperCase()
    };
  } catch (error) {
    return null;
  }
}

/**
 * Scrapes an Amazon product using the SerpApi Amazon Product Engine.
 * 
 * @param {string} url - The Amazon product URL
 * @returns {Promise<Object>} { success: boolean, data?: Object, error?: string }
 */
export async function scrapeProduct(url) {
  logger.info('Scraper', `Parsing Amazon URL: ${url}`);
  
  let finalUrl = url;
  let parsed = parseAmazonUrl(finalUrl);

  // If initial parse fails, try to resolve redirects (e.g. for amzn.in shortlinks)
  if (!parsed) {
    try {
      logger.info('Scraper', `Resolving potential short link: ${url}`);
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      finalUrl = res.url;
      parsed = parseAmazonUrl(finalUrl);
    } catch (err) {
      logger.warn('Scraper', `Failed to resolve redirect for ${url}`);
    }
  }

  if (!parsed) {
    return { success: false, error: 'Could not extract ASIN from URL' };
  }

  const { domain, asin } = parsed;
  logger.info('Scraper', `Using SerpApi for ASIN ${asin} on ${domain}...`);

  const serpApiUrl = new URL('https://serpapi.com/search.json');
  serpApiUrl.searchParams.append('engine', 'amazon_product');
  serpApiUrl.searchParams.append('asin', asin);
  serpApiUrl.searchParams.append('amazon_domain', domain);
  serpApiUrl.searchParams.append('api_key', env.serpApiKey);

  try {
    const response = await fetch(serpApiUrl.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(`SerpApi Error: ${data.error}`);
    }

    const product = data.product_results;
    
    if (!product) {
      throw new Error('No product_results found in SerpApi response');
    }

    // Attempt to extract price. SerpApi provides 'extracted_price' as a float, or 'price' as a string/object.
    const price = product.extracted_price || (typeof product.price === 'number' ? product.price : null);

    if (!price) {
      throw new Error('Price could not be determined from SerpApi response');
    }

    // SerpApi stores the main image usually in 'thumbnail' or 'images'[0] or 'thumbnails'[0]
    return {
      success: true,
      data: {
        name: product.title || 'Unknown Product',
        price: parseFloat(price),
        platform: 'amazon',
        baseCurrency: domain === 'amazon.com' ? 'USD' : (domain === 'amazon.in' ? 'INR' : 'USD'),
        imageUrl: product.thumbnail || null
      }
    };
  } catch (error) {
    logger.error('Scraper', `SerpApi scrape failed for ${asin}`, error);
    return { success: false, error: error.message };
  }
}

// Ensure compatibility if other modules try to call closeBrowser during shutdown
export async function closeBrowser() {
  // No longer needed with SerpApi, but keeping the export signature
  logger.info('Scraper', 'Browser close requested, but SerpApi uses standard fetch API. Ignoring.');
}
