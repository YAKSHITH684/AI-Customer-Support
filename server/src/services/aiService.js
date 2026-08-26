const axios = require('axios');
const config = require('../config/env');
const { redactPII } = require('../utils/piiRedactor');

/**
 * Deterministic Canned-Response Matcher
 * Produces structured, grounded responses based on retrieved context and common patterns
 */
const generateDeterministicResponse = (query, retrievedContext = []) => {
  const q = query.toLowerCase();

  // If we have relevant retrieved context, synthesize a response citing those documents
  if (retrievedContext && retrievedContext.length > 0 && retrievedContext[0].relevanceScore >= 0.4) {
    const topDoc = retrievedContext[0];
    const citedSources = retrievedContext.slice(0, 2).map(c => `[Source: ${c.documentTitle || 'Knowledge Base'}]`).join(' ');

    return `Hello,\n\nThank you for reaching out to ResolveFlow Support.\n\nBased on our documentation (${citedSources}):\n\n${topDoc.content.trim()}\n\nIf you need any further assistance or have additional questions, please feel free to reply to this ticket.\n\nBest regards,\nResolveFlow AI Support Team`;
  }

  // Pre-configured intelligent canned responses for common support inquiries
  if (q.includes('password') || q.includes('reset') || q.includes('login') || q.includes('forgot')) {
    return `Hello,\n\nTo reset your password:\n1. Visit the login page and click "Forgot Password".\n2. Enter your registered email address.\n3. Check your inbox for the password reset link (valid for 30 minutes).\n4. Choose a secure password with at least 8 characters.\n\n[Source: Account Security & Authentication Policy]\n\nPlease let us know if you encounter any further issues.\n\nBest regards,\nResolveFlow AI Support Team`;
  }

  if (q.includes('billing') || q.includes('invoice') || q.includes('receipt') || q.includes('payment') || q.includes('charge')) {
    return `Hello,\n\nThank you for contacting billing support.\n\nYou can view and download all past invoices directly from your **Settings > Billing & Subscriptions** tab. Invoices are generated automatically on the 1st of every calendar month.\n\n[Source: Billing & Subscription FAQ]\n\nIf you notice an unexpected charge or need to update your payment method, please reply with the invoice number.\n\nBest regards,\nResolveFlow Billing Team`;
  }

  if (q.includes('shipping') || q.includes('track') || q.includes('delivery') || q.includes('order')) {
    return `Hello,\n\nRegarding your order and delivery inquiry:\n- Orders are typically processed within 1-2 business days.\n- Tracking numbers are emailed automatically once your package has shipped.\n- You can also track your live parcel status under **My Orders** in your portal.\n\n[Source: Shipping & Logistics Guide]\n\nBest regards,\nResolveFlow Logistics Team`;
  }

  if (q.includes('refund') || q.includes('cancel') || q.includes('return')) {
    return `Hello,\n\nUnder our standard 30-day satisfaction guarantee, you are eligible for a full refund if requested within 30 days of purchase.\n\nTo process your request, our support specialist will review your transaction details shortly.\n\n[Source: Returns and Cancellation Policy]\n\nBest regards,\nResolveFlow Support Team`;
  }

  // Generic grounded fallback
  return `Hello,\n\nThank you for reaching out. We have received your inquiry regarding "${query.slice(0, 80)}...".\n\nOur team is reviewing the details to provide you with the most accurate resolution. A support specialist will follow up shortly if additional clarification is required.\n\nBest regards,\nResolveFlow AI Assistant`;
};

/**
 * Generate AI response using OpenRouter
 */
const generateOpenRouterResponse = async (query, contextSnippet) => {
  const safeQuery = redactPII(query);
  const prompt = `You are an expert customer support AI agent for ResolveFlow. 
Use strictly the provided Knowledge Base Context to answer the customer's query.
Cite your sources inline with [Source: Document Name].
If the context does not contain enough information to answer, state clearly what you know and note that a human agent will assist.

Knowledge Base Context:
${contextSnippet || 'No specific document found.'}

Customer Query:
${safeQuery}

Helpful, professional, concise response:`;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: config.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are ResolveFlow AI, an intelligent, empathetic customer support assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    },
    {
      headers: {
        'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.CLIENT_URL,
        'X-Title': 'ResolveFlow AI Support'
      },
      timeout: 20000
    }
  );

  return response.data?.choices?.[0]?.message?.content;
};

/**
 * Generate AI response using Google Gemini SDK
 */
const generateGeminiResponse = async (query, contextSnippet) => {
  const safeQuery = redactPII(query);
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL || 'gemini-1.5-flash' });

  const prompt = `You are ResolveFlow AI, an intelligent customer support agent.
Answer the customer's question using the knowledge base context below.
Always include inline citations like [Source: Document Name] when referencing context.

Context:
${contextSnippet || 'No specific context.'}

Customer Question:
${safeQuery}

Provide a polite, accurate, and concise response:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Generate AI response using Groq Cloud API
 */
const generateGroqResponse = async (query, contextSnippet) => {
  const safeQuery = redactPII(query);
  const prompt = `You are an expert customer support AI agent for ResolveFlow.
Use strictly the provided Knowledge Base Context to answer the customer's query.
Cite your sources inline with [Source: Document Name].
If the context does not contain enough information to answer, state clearly what you know and note that a human agent will assist.

Knowledge Base Context:
${contextSnippet || 'No specific document found.'}

Customer Query:
${safeQuery}

Helpful, professional, concise response:`;

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: config.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are ResolveFlow AI, an intelligent, empathetic customer support assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    },
    {
      headers: {
        'Authorization': `Bearer ${config.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  return response.data?.choices?.[0]?.message?.content;
};

/**
 * Main AI Draft Generator Router
 * Groq -> Gemini -> OpenRouter -> Deterministic Fallback
 */
const generateDraft = async (query, retrievedContext = []) => {
  const contextSnippet = retrievedContext
    .map(c => `[Document: ${c.documentTitle} | Section: ${c.section}]\n${c.content}`)
    .join('\n\n');

  let providerUsed = 'deterministic';
  let draft = '';

  // 1. Try Groq if API key configured (Fastest inference)
  if (config.GROQ_API_KEY) {
    try {
      draft = await generateGroqResponse(query, contextSnippet);
      providerUsed = 'groq';
      return { draft, providerUsed };
    } catch (err) {
      console.warn('Groq generation failed, falling back to next provider:', err.response?.data || err.message);
    }
  }

  // 2. Try Google Gemini if API key configured
  if (config.GEMINI_API_KEY) {
    try {
      draft = await generateGeminiResponse(query, contextSnippet);
      providerUsed = 'gemini';
      return { draft, providerUsed };
    } catch (err) {
      console.warn('Gemini generation failed, falling back to next provider:', err.message);
    }
  }

  // 3. Try OpenRouter if API key configured
  if (config.OPENROUTER_API_KEY) {
    try {
      draft = await generateOpenRouterResponse(query, contextSnippet);
      providerUsed = 'openrouter';
      return { draft, providerUsed };
    } catch (err) {
      console.warn('OpenRouter generation failed, falling back to deterministic:', err.message);
    }
  }

  // 4. Fallback to Deterministic Matcher
  draft = generateDeterministicResponse(query, retrievedContext);
  return {
    draft,
    providerUsed: 'deterministic'
  };
};

module.exports = {
  generateDraft,
  generateDeterministicResponse
};
