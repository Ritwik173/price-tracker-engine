import logger from '../utils/logger.js';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
let cachedRates = null;
let lastFetchTime = null;

// Cache rates for 6 hours
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Fetch latest exchange rates with caching.
 */
async function getExchangeRates() {
  const now = Date.now();
  if (cachedRates && lastFetchTime && (now - lastFetchTime) < CACHE_TTL) {
    return cachedRates;
  }

  try {
    const res = await fetch(EXCHANGE_RATE_API);
    const data = await res.json();
    if (data.result === 'success') {
      cachedRates = data.rates;
      lastFetchTime = now;
      logger.info('CurrencyService', 'Exchange rates updated from API');
      return cachedRates;
    }
    throw new Error('API returned unsuccessful response');
  } catch (error) {
    logger.error('CurrencyService', 'Failed to fetch exchange rates', error);
    // If we have stale cache, return it rather than failing
    if (cachedRates) {
      logger.warn('CurrencyService', 'Falling back to stale exchange rates cache');
      return cachedRates;
    }
    // Fallback static map if API fails completely on first boot
    return { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, AUD: 1.5 };
  }
}

/**
 * Converts an amount from one currency to another using the latest rates based on USD.
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return parseFloat(amount.toFixed(2));
  
  const rates = await getExchangeRates();
  
  // Convert from -> USD -> to
  const amountInUSD = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
  const converted = amountInUSD * (rates[toCurrency] || 1);
  
  return parseFloat(converted.toFixed(2));
}

/**
 * Helper to map an Amazon domain to its native currency.
 */
export function getBaseCurrencyForDomain(domain) {
  const map = {
    'amazon.com': 'USD',
    'amazon.in': 'INR',
    'amazon.co.uk': 'GBP',
    'amazon.de': 'EUR',
    'amazon.fr': 'EUR',
    'amazon.es': 'EUR',
    'amazon.it': 'EUR',
    'amazon.ca': 'CAD',
    'amazon.com.au': 'AUD',
    'amazon.co.jp': 'JPY'
  };
  return map[domain] || 'USD'; // Default fallback
}
