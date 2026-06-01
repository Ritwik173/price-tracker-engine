/**
 * Price Analyzer Service
 * Detects price drops, calculates trends, and determines if alerts should be triggered.
 */

import logger from '../utils/logger.js';

/**
 * Compare new price with historical prices to detect drops or target reached.
 * 
 * @param {object} product - Product record from database
 * @param {number} newPrice - Freshly scraped price
 * @returns {{ isDrop: boolean, isTargetReached: boolean, dropAmount: number, dropPercentage: number }}
 */
export function analyzePriceChange(product, newPrice) {
  if (!newPrice) {
    return { isDrop: false, isTargetReached: false, dropAmount: 0, dropPercentage: 0 };
  }

  const currentPrice = product.currentPrice;
  const targetPrice = product.targetPrice;

  let isDrop = false;
  let dropAmount = 0;
  let dropPercentage = 0;

  // Check for price drop compared to last known price
  if (currentPrice && newPrice < currentPrice) {
    isDrop = true;
    dropAmount = currentPrice - newPrice;
    dropPercentage = Math.round((dropAmount / currentPrice) * 100);
  }

  // Check if target price is reached
  const isTargetReached = targetPrice !== null && newPrice <= targetPrice && (!currentPrice || currentPrice > targetPrice);

  return {
    isDrop,
    isTargetReached,
    dropAmount,
    dropPercentage
  };
}

/**
 * Calculate min, max, and average prices from history
 * 
 * @param {Array<{price: number}>} history - Array of price points
 * @returns {{ min: number, max: number, avg: number }}
 */
export function calculateStats(history) {
  if (!history || history.length === 0) {
    return { min: null, max: null, avg: null };
  }

  const prices = history.map(h => h.price).filter(p => p !== null && !isNaN(p));
  if (prices.length === 0) return { min: null, max: null, avg: null };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  return { min, max, avg };
}

export default { analyzePriceChange, calculateStats };
