require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigin: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'myvipclubs',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },
  jotformWebhookToken: process.env.JOTFORM_WEBHOOK_TOKEN || '',
};

module.exports = config;
