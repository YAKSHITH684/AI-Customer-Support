const axios = require('axios');
const config = require('../config/env');
const { searchSimilarChunks } = require('./embeddingService');
const { redactPII } = require('../utils/piiRedactor');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Resolution = require('../models/Resolution');

/**
 * Perform semantic search for chat context
 */
const retrieveChatContext = async (query) => {
  try {
    const results = await searchSimilarChunks(query, 3);
    return results.filter(r => r.relevanceScore >= 0.35);
  } catch (err) {
    console.warn('Chat RAG retrieval warning:', err.message);
    return [];
  }
};

/**
 * Stream conversational response from Groq
 */
const streamGroqChat = async ({
  message,
  history = [],
  retrievedContext = [],
  onChunk,
  onComplete
}) => {
  const safeMessage = redactPII(message);
  
  const contextSnippet = retrievedContext.length > 0
    ? retrievedContext.map(c => `[Document: ${c.documentTitle} | Section: ${c.section}]\n${c.content}`).join('\n\n')
    : 'No relevant internal documentation found for this query.';

  const systemPrompt = `You are ResolveFlow AI, an intelligent, helpful, and empathetic customer support chatbot.
Answer the customer's query accurately using the provided Knowledge Base Context.
Guidelines:
1. When citing facts from the documentation, include inline source citations like [Source: Document Name].
2. If the context does not contain enough information, provide whatever general helpful guidance you can and politely offer to connect them with a human support agent.
3. Keep responses conversational, concise, professional, and well-structured with markdown bullet points if appropriate.

Knowledge Base Context:
${contextSnippet}`;

  // Build OpenAI-format messages list with history
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content
    })),
    { role: 'user', content: safeMessage }
  ];

  // If Groq API key is present, use Groq's high-speed streaming
  if (config.GROQ_API_KEY) {
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        data: {
          model: config.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: formattedMessages,
          temperature: 0.2,
          stream: true
        },
        headers: {
          'Authorization': `Bearer ${config.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      });

      let fullText = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.includes('[DONE]')) continue;
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.replace(/^data: /, ''));
                const token = parsed.choices?.[0]?.delta?.content || '';
                if (token) {
                  fullText += token;
                  if (onChunk) onChunk(token);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          if (onComplete) onComplete(fullText);
          resolve({ text: fullText, provider: 'groq' });
        });

        response.data.on('error', (err) => {
          reject(err);
        });
      });
    } catch (err) {
      console.warn('Groq streaming failed, falling back to non-streaming:', err.response?.data || err.message);
    }
  }

  // Fallback: Generate response without streaming
  const { generateDraft } = require('./aiService');
  const result = await generateDraft(safeMessage, retrievedContext);
  
  if (onChunk) onChunk(result.draft);
  if (onComplete) onComplete(result.draft);
  
  return { text: result.draft, provider: result.providerUsed };
};

/**
 * Escalate an active chat session to a real Ticket
 */
const escalateChatToTicket = async ({ customerEmail, customerName, title, history = [], priority = 'medium' }) => {
  const User = require('../models/User');
  let customer = await User.findOne({ email: customerEmail || 'guest@resolveflow.ai' });
  
  if (!customer) {
    customer = await User.findOne({ role: 'customer' });
  }

  const newTicket = await Ticket.create({
    title: title || `Chat Escalation: ${history[0]?.content?.slice(0, 40) || 'Customer Inquiry'}...`,
    customer: customer ? customer._id : null,
    customerEmail: customerEmail || (customer ? customer.email : 'guest@resolveflow.ai'),
    customerName: customerName || (customer ? customer.name : 'Guest User'),
    priority: priority || 'medium',
    status: 'open',
    channel: 'website_widget',
    tags: ['live-chat', 'escalation', 'groq-assisted']
  });

  // Save the conversation history as messages
  for (const item of history) {
    await Message.create({
      ticket: newTicket._id,
      sender: item.role === 'user' ? (customer ? customer._id : null) : null,
      senderType: item.role === 'user' ? 'customer' : 'bot',
      content: item.content
    });
  }

  // Create initial resolution item
  await Resolution.create({
    ticket: newTicket._id,
    draftResponse: 'A human support agent will join and review your chat history shortly.',
    status: 'NEEDS_REVIEW',
    confidenceScore: 0.5,
    needsHumanReview: true
  });

  return newTicket;
};

module.exports = {
  retrieveChatContext,
  streamGroqChat,
  escalateChatToTicket
};
