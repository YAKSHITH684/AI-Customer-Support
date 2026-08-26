const { retrieveChatContext, streamGroqChat, escalateChatToTicket } = require('../services/chatService');
const { emitTicketUpdate, emitNotification } = require('../config/socket');

/**
 * Handle non-streaming / standard chat message API
 */
const handleChatMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message text is required.' });
    }

    // 1. Retrieve Knowledge Base Context
    const retrievedContext = await retrieveChatContext(message);

    // 2. Generate response with Groq
    let finalOutput = '';
    const result = await streamGroqChat({
      message,
      history,
      retrievedContext,
      onChunk: (chunk) => { finalOutput += chunk; }
    });

    // 3. Extract citations and compute confidence
    const topScore = retrievedContext.length > 0 ? retrievedContext[0].relevanceScore : 0.4;
    const confidence = Math.min(0.98, Math.max(0.45, Math.round(topScore * 100) / 100));

    return res.status(200).json({
      success: true,
      response: finalOutput || result.text,
      provider: result.provider,
      confidence,
      sources: retrievedContext.map(c => ({
        title: c.documentTitle,
        section: c.section,
        relevance: Math.round(c.relevanceScore * 100)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Server-Sent Events (SSE) Streaming Chat API
 */
const handleChatStream = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message text is required.' });
    }

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const retrievedContext = await retrieveChatContext(message);

    // Send initial context meta
    res.write(`data: ${JSON.stringify({
      type: 'context',
      sources: retrievedContext.map(c => ({
        title: c.documentTitle,
        section: c.section,
        relevance: Math.round(c.relevanceScore * 100)
      }))
    })}\n\n`);

    await streamGroqChat({
      message,
      history,
      retrievedContext,
      onChunk: (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      },
      onComplete: (fullText) => {
        res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
};

/**
 * Escalate Chat to a Live Ticket
 */
const handleChatEscalate = async (req, res, next) => {
  try {
    const { customerEmail, customerName, title, history = [], priority = 'medium' } = req.body;

    const newTicket = await escalateChatToTicket({
      customerEmail: req.user?.email || customerEmail,
      customerName: req.user?.name || customerName,
      title,
      history,
      priority
    });

    // Notify agents of incoming escalation
    emitTicketUpdate(newTicket);

    return res.status(201).json({
      success: true,
      message: 'Chat conversation successfully escalated to a support ticket.',
      ticket: newTicket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dynamic Quick Suggestions
 */
const getQuickSuggestions = (req, res) => {
  return res.status(200).json({
    success: true,
    suggestions: [
      { text: 'How do I reset my password?', category: 'security' },
      { text: 'What is your refund and return policy?', category: 'billing' },
      { text: 'How can I track my package delivery?', category: 'shipping' },
      { text: 'Where can I find API rate limit documentation?', category: 'developer' }
    ]
  });
};

module.exports = {
  handleChatMessage,
  handleChatStream,
  handleChatEscalate,
  getQuickSuggestions
};
