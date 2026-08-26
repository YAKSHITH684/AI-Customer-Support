const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Resolution = require('../models/Resolution');
const ResolutionLog = require('../models/ResolutionLog');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Integration = require('../models/Integration');
const Notification = require('../models/Notification');
const { processDocumentChunking } = require('../services/embeddingService');
const { encrypt } = require('./crypto');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting ResolveFlow_AI database seed...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Message.deleteMany({});
    await Resolution.deleteMany({});
    await ResolutionLog.deleteMany({});
    await KnowledgeDocument.deleteMany({});
    await KnowledgeChunk.deleteMany({});
    await Integration.deleteMany({});
    await Notification.deleteMany({});

    console.log('🧹 Cleared existing database collections.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Sarah Chen (Admin)',
      email: 'admin@resolveflow.ai',
      password: 'Password123!',
      role: 'admin'
    });

    const agentUser = await User.create({
      name: 'Marcus Vance (Senior Agent)',
      email: 'agent@resolveflow.ai',
      password: 'Password123!',
      role: 'agent'
    });

    const customerUser = await User.create({
      name: 'Alex Rivera (Acme Corp)',
      email: 'customer@acme.com',
      password: 'Password123!',
      role: 'customer'
    });

    console.log('👤 Created demo users: Admin, Agent, Customer.');

    // 2. Create Knowledge Documents
    const kbDocs = [
      {
        owner: adminUser._id,
        title: 'Account Security & Password Reset Policy',
        description: 'Protocols for resetting passwords, two-factor authentication (2FA), and security best practices.',
        sourceType: 'policy',
        category: 'Authentication',
        rawContent: `ResolveFlow Account Security, Authentication & Password Reset Guidelines:

1. Password Reset Procedure:
Users who have lost access to their account can initiate a password reset directly from the login page by clicking "Forgot Password". 
A secure, time-limited reset link valid for 30 minutes will be delivered to the account's registered email address.
Passwords must contain at least 8 characters, including at least one uppercase letter, one number, and one special symbol.

2. Two-Factor Authentication (2FA):
We strongly recommend enabling 2FA under Settings > Security. ResolveFlow supports standard TOTP authenticator apps including Google Authenticator, Authy, and 1Password.
If a user is locked out of 2FA, they must supply their 16-digit recovery master key or verify their identity with a verified government ID via an escalated human agent.

3. Session Management & Auto-Logout:
Active web sessions expire after 7 days of inactivity. Enterprise SSO sessions through Okta, Azure AD, or Google Workspace follow the organization's identity provider TTL.`
      },
      {
        owner: adminUser._id,
        title: 'Billing, Subscriptions & Invoicing FAQ',
        description: 'Comprehensive guide to subscription tiers, monthly invoicing, payment methods, and tax receipts.',
        sourceType: 'faq',
        category: 'Billing',
        rawContent: `ResolveFlow Billing, Subscriptions, and Invoicing Operations:

1. Accessing Invoices and Receipts:
All past and current invoices are available for download in PDF format under Settings > Billing & Subscriptions. 
Invoices are generated automatically on the 1st of every calendar month for active accounts.

2. Accepted Payment Methods:
We accept Visa, Mastercard, American Express, Discover, PayPal, and ACH direct debit (for annual contracts over $5,000).
Credit card details can be updated securely at any time in the billing portal.

3. Upgrading or Downgrading Plans:
Plan upgrades take effect immediately with prorated billing for the remainder of the cycle. 
Plan downgrades take effect at the beginning of the subsequent billing period.

4. Sales Tax and VAT Exemption:
If your organization is tax-exempt or holds a valid EU VAT identification number, please provide your tax ID under Billing Settings to remove tax charges on upcoming invoices.`
      },
      {
        owner: adminUser._id,
        title: 'Satisfaction Guarantee & Refund Policy',
        description: 'Rules governing refund eligibility, cancellation windows, and dispute resolution.',
        sourceType: 'policy',
        category: 'Billing',
        rawContent: `ResolveFlow 30-Day Money-Back Guarantee & Refund Policy:

1. 30-Day Satisfaction Guarantee:
All first-time subscription purchases are protected by our 30-day money-back guarantee. If you are not completely satisfied with ResolveFlow within 30 days of initial purchase, you are entitled to a 100% full refund with no questions asked.

2. Refund Processing Time:
Refund requests are processed by our billing team within 24 to 48 hours. Once initiated, funds typically reflect in your bank account or on your card statement within 3 to 5 business days depending on your financial institution.

3. Non-Refundable Items:
Custom enterprise on-premise onboarding packages and one-time professional services consulting hours are non-refundable once service delivery has commenced.

4. Subscription Cancellations:
Customers may cancel their subscription at any time via the billing portal. You will retain full access to the platform until the end of your prepaid billing period.`
      },
      {
        owner: adminUser._id,
        title: 'Shipping, Tracking & Hardware Delivery Guide',
        description: 'Procedures for physical support devices, tracking orders, and handling damaged deliveries.',
        sourceType: 'policy',
        category: 'Logistics',
        rawContent: `ResolveFlow Hardware & Peripheral Delivery Logistics:

1. Order Processing:
Hardware accessories (VoIP desk sets, security dongles, on-site edge appliances) are processed within 1 to 2 business days.

2. Delivery Times and Tracking:
- Standard Delivery: 3 to 5 business days within the continental United States and Canada.
- Express Overnight: Next business day delivery for orders placed before 2:00 PM EST.
- Real-time tracking numbers are automatically dispatched via email once the carrier scans the parcel. Customers can also track parcels under My Orders in their portal.

3. Damaged or Lost Shipments:
If a package arrives damaged or fails to arrive within 7 days of the estimated date, submit a ticket with your tracking number. Replacements are dispatched immediately via Priority Express.`
      },
      {
        owner: adminUser._id,
        title: 'API Rate Limits & Webhooks Developer Manual',
        description: 'Technical reference for REST API rate limits, HMAC signatures, and webhook retries.',
        sourceType: 'macro',
        category: 'Developer',
        rawContent: `ResolveFlow Developer API and Webhook Specifications:

1. Rate Limits:
- Free & Starter Tier: 20 requests per second (1,200 req/min).
- Pro & Enterprise Tier: 100 requests per second with bursting up to 250 req/sec.
- Rate-limited responses return HTTP 429 Too Many Requests along with X-RateLimit-Reset headers.

2. Webhook Delivery & Retries:
Webhooks are delivered via POST with a JSON payload. ResolveFlow signs every payload with HMAC SHA-256 using your webhook signing secret, transmitted in the X-ResolveFlow-Signature header.
Failed webhook attempts (HTTP 5xx or timeout > 5000ms) are retried with exponential backoff at 1m, 5m, 15m, 1h, and 6h intervals.`
      }
    ];

    for (const docData of kbDocs) {
      const doc = await KnowledgeDocument.create(docData);
      await processDocumentChunking(doc._id);
    }

    console.log('📚 Seeded Knowledge Base documents and generated semantic vector embeddings.');

    // 3. Create Integrations
    const integrations = [
      {
        owner: adminUser._id,
        provider: 'gmail',
        isConnected: true,
        accountEmail: 'support@resolveflow.ai',
        accountName: 'ResolveFlow Support Inbox',
        scopes: ['gmail.readonly', 'gmail.send'],
        encryptedAccessToken: encrypt('ya29.mock_gmail_access_token_demo'),
        lastSyncedAt: new Date()
      },
      {
        owner: adminUser._id,
        provider: 'slack',
        isConnected: true,
        accountEmail: 'bot@slack.com',
        accountName: 'Engineering & Support Alerts',
        scopes: ['chat:write', 'incoming-webhook'],
        encryptedAccessToken: encrypt('xoxb-mock-slack-token-demo'),
        config: { channel: '#support-escalations' },
        lastSyncedAt: new Date()
      },
      {
        owner: adminUser._id,
        provider: 'website-widget',
        isConnected: true,
        accountName: 'Live Customer Intake Widget',
        config: { widgetKey: 'rf_prod_live_key_99481', theme: 'dark' },
        lastSyncedAt: new Date()
      },
      {
        owner: adminUser._id,
        provider: 'google-sheets',
        isConnected: true,
        accountEmail: 'analytics@resolveflow.ai',
        accountName: 'Customer Support CSAT & Metrics Sheet',
        scopes: ['spreadsheets'],
        encryptedAccessToken: encrypt('ya29.mock_sheets_access_token_demo'),
        config: { spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', sheetName: 'Ticket Analytics' },
        lastSyncedAt: new Date()
      }
    ];

    for (const integ of integrations) {
      await Integration.create(integ);
    }
    console.log('🔌 Seeded Integrations (Gmail, Slack, Website Widget, Google Sheets).');

    // 4. Seed Sample Tickets and Resolutions
    // Ticket 1: Auto-resolved FAQ
    const ticket1 = await Ticket.create({
      ticketNumber: 'TICK-1001',
      subject: 'Forgot password reset link not arriving',
      description: 'I clicked forgot password on the login screen 10 minutes ago but have not received any email to reset it. How can I regain access?',
      customer: customerUser._id,
      category: 'Authentication',
      priority: 'medium',
      channel: 'email',
      status: 'resolved',
      resolvedAt: new Date(Date.now() - 3600 * 1000)
    });

    const msg1Customer = await Message.create({
      ticketId: ticket1._id,
      sender: 'customer',
      senderUser: customerUser._id,
      content: ticket1.description,
      createdAt: new Date(Date.now() - 3650 * 1000)
    });

    const resolution1 = await Resolution.create({
      ticketId: ticket1._id,
      messageId: msg1Customer._id,
      customerQuery: `${ticket1.subject}\n\n${ticket1.description}`,
      status: 'AUTO_SENT',
      confidenceScore: 0.94,
      aiProvider: 'gemini',
      retrievedSources: [
        { title: 'Account Security & Password Reset Policy', section: 'Chunk #1', relevanceScore: 0.92 }
      ],
      draftOutput: `Hello Alex,\n\nThank you for contacting ResolveFlow Support.\n\nBased on our documentation ([Source: Account Security & Password Reset Policy]):\n\nPassword reset links are valid for 30 minutes. Please check your Spam or Junk folder to ensure the email was not filtered. Ensure you enter the exact email registered to your account.\n\nIf you still do not receive the email within 15 minutes, please let us know!\n\nBest regards,\nResolveFlow AI Support Team`,
      finalOutput: `Hello Alex,\n\nThank you for contacting ResolveFlow Support.\n\nBased on our documentation ([Source: Account Security & Password Reset Policy]):\n\nPassword reset links are valid for 30 minutes. Please check your Spam or Junk folder to ensure the email was not filtered. Ensure you enter the exact email registered to your account.\n\nIf you still do not receive the email within 15 minutes, please let us know!\n\nBest regards,\nResolveFlow AI Support Team`,
      duration: 1120
    });

    await Message.create({
      ticketId: ticket1._id,
      sender: 'ai',
      content: resolution1.finalOutput,
      isAIDraft: false,
      sourceRefs: resolution1.retrievedSources,
      confidenceScore: 0.94,
      resolutionId: resolution1._id,
      createdAt: new Date(Date.now() - 3600 * 1000)
    });

    ticket1.activeResolution = resolution1._id;
    await ticket1.save();

    // Logs for Ticket 1
    await ResolutionLog.create([
      { resolutionId: resolution1._id, ticketId: ticket1._id, agent: 'orchestrator', level: 'info', message: 'Orchestrator initialized chain for TICK-1001' },
      { resolutionId: resolution1._id, ticketId: ticket1._id, agent: 'retrieval', level: 'success', message: 'Retrieval Agent matched Account Security Policy (92% relevance)' },
      { resolutionId: resolution1._id, ticketId: ticket1._id, agent: 'drafting', level: 'success', message: 'Drafting Agent synthesized grounded response with 1 citation' },
      { resolutionId: resolution1._id, ticketId: ticket1._id, agent: 'confidence', level: 'success', message: 'Confidence Agent scored 94.0% -> Decision: AUTO_SEND' },
      { resolutionId: resolution1._id, ticketId: ticket1._id, agent: 'monitoring', level: 'success', message: 'Response auto-sent to customer. Ticket resolved.' }
    ]);

    // Ticket 2: Escalated - Policy Sensitive (Refund request)
    const ticket2 = await Ticket.create({
      ticketNumber: 'TICK-1002',
      subject: 'Immediate refund requested for accidental annual renewal',
      description: 'I noticed an unexpected charge on my credit card for the annual plan renewal yesterday. I wanted to cancel my subscription. Please process an immediate refund as I am within 30 days.',
      customer: customerUser._id,
      category: 'Billing',
      priority: 'high',
      channel: 'widget',
      status: 'escalated',
      tags: ['AI_ESCALATED', 'POLICY_SENSITIVE']
    });

    const msg2Customer = await Message.create({
      ticketId: ticket2._id,
      sender: 'customer',
      senderUser: customerUser._id,
      content: ticket2.description,
      createdAt: new Date(Date.now() - 1800 * 1000)
    });

    const resolution2 = await Resolution.create({
      ticketId: ticket2._id,
      messageId: msg2Customer._id,
      customerQuery: `${ticket2.subject}\n\n${ticket2.description}`,
      status: 'AWAITING_APPROVAL',
      confidenceScore: 0.58,
      escalationReason: 'POLICY_SENSITIVE',
      aiProvider: 'gemini',
      retrievedSources: [
        { title: 'Satisfaction Guarantee & Refund Policy', section: 'Chunk #1', relevanceScore: 0.88 },
        { title: 'Billing, Subscriptions & Invoicing FAQ', section: 'Chunk #1', relevanceScore: 0.74 }
      ],
      draftOutput: `Hello Alex,\n\nThank you for reaching out to billing support.\n\nAccording to our 30-Day Money-Back Guarantee ([Source: Satisfaction Guarantee & Refund Policy]), you are fully eligible for a 100% refund on your recent annual subscription charge if requested within 30 days.\n\nI have routed your transaction details to our Senior Billing Specialist who will initiate the refund to your original payment method (3-5 business days) and confirm cancellation of your annual renewal.\n\nBest regards,\nResolveFlow Support Team`,
      duration: 1450
    });

    await Message.create({
      ticketId: ticket2._id,
      sender: 'ai',
      content: resolution2.draftOutput,
      isAIDraft: true,
      sourceRefs: resolution2.retrievedSources,
      confidenceScore: 0.58,
      resolutionId: resolution2._id,
      createdAt: new Date(Date.now() - 1750 * 1000)
    });

    ticket2.activeResolution = resolution2._id;
    await ticket2.save();

    await ResolutionLog.create([
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'orchestrator', level: 'info', message: 'Orchestrator initiated agent chain for TICK-1002' },
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'retrieval', level: 'success', message: 'Retrieval Agent matched Refund Policy & Billing FAQ (88% relevance)' },
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'drafting', level: 'success', message: 'Drafting Agent generated refund explanation with 2 citations' },
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'confidence', level: 'warning', message: 'Confidence Agent scored 58.0% -> Sensitive financial refund query -> Decision: ESCALATE' },
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'escalation', level: 'warning', message: 'Escalation Agent routed ticket to "Billing & Compliance Queue". Reason: POLICY_SENSITIVE' },
      { resolutionId: resolution2._id, ticketId: ticket2._id, agent: 'monitoring', level: 'info', message: 'AI Draft queued for Human Agent review. Slack alert triggered.' }
    ]);

    // Ticket 3: Technical Webhook Integration
    const ticket3 = await Ticket.create({
      ticketNumber: 'TICK-1003',
      subject: 'Webhook HMAC SHA-256 signature verification failed',
      description: 'We are receiving webhooks on our endpoint but our HMAC SHA-256 validation is failing. Is the signature calculated over the raw body string or parsed JSON?',
      customer: customerUser._id,
      category: 'Developer',
      priority: 'medium',
      channel: 'manual',
      status: 'open',
      assignedAgent: agentUser._id
    });

    const msg3Customer = await Message.create({
      ticketId: ticket3._id,
      sender: 'customer',
      senderUser: customerUser._id,
      content: ticket3.description,
      createdAt: new Date(Date.now() - 900 * 1000)
    });

    const resolution3 = await Resolution.create({
      ticketId: ticket3._id,
      messageId: msg3Customer._id,
      customerQuery: `${ticket3.subject}\n\n${ticket3.description}`,
      status: 'AUTO_SENT',
      confidenceScore: 0.89,
      aiProvider: 'gemini',
      retrievedSources: [
        { title: 'API Rate Limits & Webhooks Developer Manual', section: 'Chunk #1', relevanceScore: 0.91 }
      ],
      draftOutput: `Hello Alex,\n\nThank you for contacting developer support.\n\nBased on our Developer Manual ([Source: API Rate Limits & Webhooks Developer Manual]):\n\nResolveFlow generates the HMAC SHA-256 signature over the raw, unparsed UTF-8 request body payload using your webhook signing secret. If your web server parses or mutates whitespace before computing the hash, signature validation will fail.\n\nPlease ensure your verification code inspects the raw binary/text buffer before JSON parsing.\n\nBest regards,\nResolveFlow Developer Support`,
      finalOutput: `Hello Alex,\n\nThank you for contacting developer support.\n\nBased on our Developer Manual ([Source: API Rate Limits & Webhooks Developer Manual]):\n\nResolveFlow generates the HMAC SHA-256 signature over the raw, unparsed UTF-8 request body payload using your webhook signing secret. If your web server parses or mutates whitespace before computing the hash, signature validation will fail.\n\nPlease ensure your verification code inspects the raw binary/text buffer before JSON parsing.\n\nBest regards,\nResolveFlow Developer Support`,
      duration: 1300
    });

    await Message.create({
      ticketId: ticket3._id,
      sender: 'ai',
      content: resolution3.finalOutput,
      isAIDraft: false,
      sourceRefs: resolution3.retrievedSources,
      confidenceScore: 0.89,
      resolutionId: resolution3._id,
      createdAt: new Date(Date.now() - 850 * 1000)
    });

    ticket3.activeResolution = resolution3._id;
    await ticket3.save();

    await ResolutionLog.create([
      { resolutionId: resolution3._id, ticketId: ticket3._id, agent: 'orchestrator', level: 'info', message: 'Chain executed for TICK-1003' },
      { resolutionId: resolution3._id, ticketId: ticket3._id, agent: 'retrieval', level: 'success', message: 'Retrieval Agent matched Developer Manual (91% relevance)' },
      { resolutionId: resolution3._id, ticketId: ticket3._id, agent: 'confidence', level: 'success', message: 'Confidence Agent scored 89.0% -> Decision: AUTO_SEND' },
      { resolutionId: resolution3._id, ticketId: ticket3._id, agent: 'monitoring', level: 'success', message: 'Resolution auto-sent to customer.' }
    ]);

    // 5. Seed Notifications
    await Notification.create([
      {
        owner: agentUser._id,
        ticketId: ticket2._id,
        resolutionId: resolution2._id,
        type: 'ESCALATION',
        title: 'New Escalation: TICK-1002 (Refund Policy)',
        message: 'Ticket TICK-1002 requires human review: AI draft awaiting approval in billing queue.',
        isRead: false
      },
      {
        owner: customerUser._id,
        ticketId: ticket1._id,
        resolutionId: resolution1._id,
        type: 'AUTO_RESOLVED',
        title: 'Ticket TICK-1001 Resolved',
        message: 'Your ticket regarding password reset instructions has been answered and resolved.',
        isRead: true
      },
      {
        owner: adminUser._id,
        type: 'INTEGRATION_ALERT',
        title: 'Integrations Connected',
        message: 'Gmail, Slack, Chat Widget, and Google Sheets integrations are operating normally.',
        isRead: false
      }
    ]);

    console.log('🔔 Seeded notifications.');
    console.log('✅ Database seeding finished successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
};

const seedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding demo data...');
      await seedDatabase();
    }
  } catch (err) {
    console.warn('Auto-seed check error:', err.message);
  }
};

if (require.main === module) {
  seedDatabase().then(async () => {
    await disconnectDB();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase, seedIfEmpty };


