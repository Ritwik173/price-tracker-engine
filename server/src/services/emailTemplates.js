/**
 * HTML Email Templates for Alerts
 */

export function getPriceDropEmailHtml(product, newPrice, analysis) {
  const currency = product.currency || 'INR';
  const formatPrice = (amount) => amount != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : 'Unknown';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin: 0;">📉 Price Drop Alert!</h2>
      </div>
      
      <p style="font-size: 16px;">Great news! The price for <strong>${product.name}</strong> has dropped.</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product Image" style="max-width: 200px; max-height: 200px; object-fit: contain; margin-bottom: 15px;" />` : ''}
        
        <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">
          ${formatPrice(newPrice)}
        </div>
        
        <div style="font-size: 14px; color: #666; margin-top: 5px; text-decoration: line-through;">
          Was: ${formatPrice(product.currentPrice)}
        </div>
        
        <div style="background-color: #e8f5e9; color: #2e7d32; padding: 5px 10px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-top: 10px;">
          Drops by ${analysis.dropPercentage}% (${formatPrice(analysis.dropAmount)})
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${product.url}" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
          View on ${product.platform === 'amazon' ? 'Amazon' : 'Flipkart'}
        </a>
      </div>
      
      <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        You're receiving this because you set up a price alert via Price Tracker Engine.
      </p>
    </div>
  `;
}

export function getTargetReachedEmailHtml(product, newPrice) {
  const currency = product.currency || 'INR';
  const formatPrice = (amount) => amount != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : 'Unknown';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #1976d2; margin: 0;">🎯 Target Price Reached!</h2>
      </div>
      
      <p style="font-size: 16px;">The price for <strong>${product.name}</strong> has reached your target of ${formatPrice(product.targetPrice)}.</p>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product Image" style="max-width: 200px; max-height: 200px; object-fit: contain; margin-bottom: 15px;" />` : ''}
        
        <div style="font-size: 28px; font-weight: bold; color: #1976d2;">
          ${formatPrice(newPrice)}
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${product.url}" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
          Buy Now on ${product.platform === 'amazon' ? 'Amazon' : 'Flipkart'}
        </a>
      </div>
      
      <p style="font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        You're receiving this because you set up a target price alert via Price Tracker Engine.
      </p>
    </div>
  `;
}
