const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

/**
 * Initialize nodemailer transporter with SMTP settings
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST || 'smtp.gmail.com',
      port: config.SMTP_PORT || 465,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
    console.log(`✉️ [EmailService] SMTP Transporter configured for ${config.SMTP_USER} (${config.SMTP_HOST}:${config.SMTP_PORT})`);
  }
  return transporter;
};

/**
 * Verify SMTP connection
 */
const verifySMTP = async () => {
  const mailer = getTransporter();
  if (!mailer) {
    return {
      configured: false,
      message: 'SMTP credentials not configured in .env (operating in simulated mode).'
    };
  }

  try {
    await mailer.verify();
    return {
      configured: true,
      success: true,
      message: `SMTP connection established successfully with ${config.SMTP_HOST}`
    };
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    return {
      configured: true,
      success: false,
      error: error.message
    };
  }
};

/**
 * Send an email via SMTP or simulated fallback
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @param {string} [options.ticketNumber] - Optional ticket reference
 */
const sendMail = async ({ to, subject, text, html, ticketNumber }) => {
  const mailer = getTransporter();
  const from = config.SMTP_FROM || (config.SMTP_USER ? `"ResolveFlow AI Support" <${config.SMTP_USER}>` : '"ResolveFlow AI Support" <support@resolveflow.ai>');
  const sub = subject || (ticketNumber ? `[ResolveFlow Support] Ticket ${ticketNumber} Update` : 'ResolveFlow AI Support Notification');

  if (mailer && config.SMTP_USER && config.SMTP_PASS) {
    try {
      console.log(`📤 [EmailService] Sending real email via SMTP to ${to}...`);
      const info = await mailer.sendMail({
        from,
        to,
        subject: sub,
        text: text || '',
        html: html || (text ? `<div style="font-family: sans-serif; line-height: 1.6; color: #333;"><p>${text.replace(/\n/g, '<br/>')}</p><hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/><p style="font-size: 12px; color: #888;">ResolveFlow AI Customer Support Platform</p></div>` : undefined)
      });

      console.log(`✅ [EmailService] Real email sent to ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        isLiveDelivery: true,
        messageId: info.messageId,
        recipient: to,
        sentAt: new Date()
      };
    } catch (error) {
      console.error(`❌ [EmailService] Failed to send email via SMTP to ${to}:`, error.message);
      throw error;
    }
  }

  // Simulated fallback mode
  console.log(`📧 [EmailService: Simulated Mode] To: ${to} | Subject: "${sub}"`);
  console.log(`📧 [EmailService: Content Preview]:\n${text?.slice(0, 150)}...\n`);
  return {
    success: true,
    isLiveDelivery: false,
    messageId: `gmail_msg_${Date.now()}`,
    recipient: to,
    sentAt: new Date(),
    note: 'Email simulated in development mode. Configure SMTP_USER and SMTP_PASS in server/.env for live inbox delivery.'
  };
};

module.exports = {
  getTransporter,
  verifySMTP,
  sendMail
};
