const { sendMail } = require('../services/emailService');

async function send() {
  console.log('Sending test email via Resend HTTP API...');
  const result = await sendMail({
    to: 'yakshithanandapu684@gmail.com',
    subject: 'ResolveFlow AI - Resend Live Email Verification',
    text: `Hello,\n\nThis is a verified live support message dispatched via Resend HTTP API to verify full email delivery.\n\nTimestamp: ${new Date().toLocaleString()}\n\nBest regards,\nResolveFlow AI Support Team`
  });

  console.log('✅ Result:', result);
}

send().catch(console.error);
