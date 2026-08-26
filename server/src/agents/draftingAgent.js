const { generateDraft } = require('../services/aiService');

/**
 * Drafting Agent
 * Generates an answer grounded strictly in retrieved context with source citations
 */
const runDraftingAgent = async (queryText, retrievedChunks = []) => {
  const startTime = Date.now();

  const { draft, providerUsed } = await generateDraft(queryText, retrievedChunks);

  // Extract source tags from draft (e.g. [Source: Doc Title])
  const citationMatches = draft.match(/\[Source:\s*([^\]]+)\]/gi) || [];
  const citations = citationMatches.map(m => m.replace(/\[Source:\s*|\]/gi, '').trim());

  const duration = Date.now() - startTime;

  return {
    agent: 'drafting',
    status: 'success',
    duration,
    draft,
    providerUsed,
    citations,
    hasCitations: citations.length > 0
  };
};

module.exports = {
  runDraftingAgent
};
