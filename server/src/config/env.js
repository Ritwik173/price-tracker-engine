import 'dotenv/config';

const env = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // SendGrid
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'alerts@pricetracker.local',

  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',

  // SerpApi
  serpApiKey: process.env.SERPAPI_API_KEY || '',

  // Scraping
  scrapeIntervalHours: parseInt(process.env.SCRAPE_INTERVAL_HOURS || '6', 10),
  maxConcurrentScrapes: parseInt(process.env.MAX_CONCURRENT_SCRAPES || '3', 10),
  scrapeDelayMs: parseInt(process.env.SCRAPE_DELAY_MS || '3000', 10),

  // Helpers
  get isSendgridConfigured() {
    return this.sendgridApiKey && !this.sendgridApiKey.includes('your_');
  },
  get isTwilioConfigured() {
    return this.twilioAccountSid && !this.twilioAccountSid.includes('your_');
  },
};

export default env;
