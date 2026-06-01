/**
 * Alert Service
 * Handles dispatching alerts via Email (SendGrid) and SMS/WhatsApp (Twilio).
 */

import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { prisma } from '../index.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { getPriceDropEmailHtml, getTargetReachedEmailHtml } from './emailTemplates.js';

// Initialize providers
if (env.sendgridApiKey) {
  sgMail.setApiKey(env.sendgridApiKey);
}

let twilioClient = null;
if (env.twilioAccountSid && env.twilioAuthToken) {
  twilioClient = twilio(env.twilioAccountSid, env.twilioAuthToken);
}

/**
 * Log the alert dispatch to the database
 */
async function logAlert(alertId, type, status, errorMessage = null) {
  try {
    await prisma.alertLog.create({
      data: {
        alertId,
        message: `${type} Alert ${status === 'SUCCESS' ? 'sent' : 'failed'}${errorMessage ? ': ' + errorMessage : ''}`,
        status: status === 'SUCCESS' ? 'sent' : 'failed',
        metadata: errorMessage ? JSON.stringify({ error: errorMessage }) : null
      }
    });
  } catch (error) {
    logger.error('Alerts', `Failed to log alert history for AlertID ${alertId}`, error);
  }
}

/**
 * Send an Email Alert
 */
async function sendEmailAlert(alert, product, newPrice, analysis) {
  if (!env.sendgridApiKey || !env.sendgridFromEmail) {
    logger.warn('Alerts', 'SendGrid is not configured. Skipping email alert.');
    await logAlert(alert.id, 'EMAIL', 'FAILED', 'SendGrid not configured');
    return false;
  }

  try {
    const isTargetHit = analysis.isTargetReached;
    const currency = product.currency || 'INR';
    const formatPrice = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

    const subject = isTargetHit
      ? `🎯 Target Price Reached for ${product.name.substring(0, 30)}...`
      : `📉 Price Drop: ${product.name.substring(0, 30)}... is now ${formatPrice(newPrice)}`;

    const htmlContent = isTargetHit
      ? getTargetReachedEmailHtml(product, newPrice)
      : getPriceDropEmailHtml(product, newPrice, analysis);

    const msg = {
      to: alert.destination,
      from: env.sendgridFromEmail,
      subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    logger.success('Alerts', `Email sent successfully to ${alert.destination}`);
    await logAlert(alert.id, 'EMAIL', 'SUCCESS');
    return true;
  } catch (error) {
    logger.error('Alerts', `Failed to send email to ${alert.destination}`, error);
    await logAlert(alert.id, 'EMAIL', 'FAILED', error.message);
    return false;
  }
}

/**
 * Send a WhatsApp/SMS Alert via Twilio
 */
async function sendPhoneAlert(alert, product, newPrice, analysis) {
  if (!twilioClient || !env.twilioPhoneNumber) {
    logger.warn('Alerts', 'Twilio is not configured. Skipping phone alert.');
    await logAlert(alert.id, 'WHATSAPP', 'FAILED', 'Twilio not configured');
    return false;
  }

  try {
    const isTargetHit = analysis.isTargetReached;
    const currency = product.currency || 'INR';
    const formatPrice = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    
    // Format message
    const emoji = isTargetHit ? '🎯' : '📉';
    const heading = isTargetHit ? 'Target Reached!' : 'Price Drop!';
    const details = isTargetHit
      ? `Current: ${formatPrice(newPrice)} (Target: ${formatPrice(product.targetPrice)})`
      : `Current: ${formatPrice(newPrice)} (Dropped by ${formatPrice(analysis.dropAmount)})`;

    const message = `${emoji} *${heading}*\n\n${product.name}\n${details}\n\nLink: ${product.url}`;

    // Note: If using WhatsApp, the phone number format is 'whatsapp:+91XXXXXXXXXX'
    // For standard SMS, it's just '+91XXXXXXXXXX'
    const to = alert.destination.startsWith('whatsapp:') ? alert.destination : `whatsapp:${alert.destination}`; 
    const toPhone = alert.destination.includes('+') ? alert.destination : `+91${alert.destination}`;

    await twilioClient.messages.create({
      body: message,
      from: env.twilioPhoneNumber,
      to: alert.destination.startsWith('whatsapp:') ? alert.destination : toPhone,
    });

    logger.success('Alerts', `SMS/WhatsApp sent successfully to ${alert.destination}`);
    await logAlert(alert.id, alert.destination.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS', 'SUCCESS');
    return true;
  } catch (error) {
    logger.error('Alerts', `Failed to send SMS/WhatsApp to ${alert.destination}`, error);
    await logAlert(alert.id, 'SMS', 'FAILED', error.message);
    return false;
  }
}

/**
 * Main function to dispatch alerts for a product
 */
export async function sendAlert(alert, product, newPrice, analysis) {
  let emailSuccess = false;
  let phoneSuccess = false;

  const type = alert.type.toLowerCase();

  if (type === 'email') {
    emailSuccess = await sendEmailAlert(alert, product, newPrice, analysis);
  } else if (type === 'whatsapp' || type === 'sms') {
    phoneSuccess = await sendPhoneAlert(alert, product, newPrice, analysis);
  }

  return { emailSuccess, phoneSuccess };
}

export default { sendAlert };
