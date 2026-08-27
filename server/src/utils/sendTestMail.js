const nodemailer = require('nodemailer');

async function send() {
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'yakshith023@gmail.com',
      pass: 'yvnilidknochfvwk'
    }
  });

  console.log('Connecting to Gmail SMTP...');
  await transport.verify();
  console.log('SMTP Verified!');

  const info = await transport.sendMail({
    from: '"Yakshith Anandapu" <yakshith023@gmail.com>',
    to: 'yakshithanandapu684@gmail.com',
    subject: 'ResolveFlow AI - Live Confirmation from Yakshith',
    text: `Hello,\n\nThis is a live test email sent directly through your Gmail account (yakshith023@gmail.com) to verify full email delivery.\n\nTime: ${new Date().toLocaleString()}\n\nIf you see this in Spam or Updates, please mark as Not Spam.\n\nBest regards,\nResolveFlow AI Support`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px;">
        <h2 style="color: #4F46E5; margin-top: 0;">ResolveFlow AI Live Email Verification</h2>
        <p style="color: #334155; font-size: 15px;">Hello,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          This email was sent live through your authenticated Gmail account (<strong style="color: #4F46E5;">yakshith023@gmail.com</strong>) to verify full delivery to your inbox.
        </p>
        <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 12px; color: #475569; margin: 16px 0;">
          Status: DELIVERED<br/>
          Sender: yakshith023@gmail.com<br/>
          Recipient: yakshithanandapu684@gmail.com<br/>
          Timestamp: ${new Date().toISOString()}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          Sent by ResolveFlow AI Customer Support Platform Omnichannel Mesh
        </p>
      </div>
    `
  });

  console.log('✅ LIVE EMAIL DISPATCHED SUCCESSFULLY!');
  console.log('Message ID:', info.messageId);
  console.log('Accepted by:', info.accepted);
}

send().catch(console.error);
