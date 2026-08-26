const { searchSimilarChunks } = require('../services/embeddingService');

/**
 * Retrieval Agent
 * Searches Knowledge Base for top matching chunks and calculates relevance score
 */
const runRetrievalAgent = async (queryText, resolutionId, ticketId) => {
  const startTime = Date.now();
  
  // Search knowledge base
  const retrievedChunks = await searchSimilarChunks(queryText, 3);
  
  const avgRelevance = retrievedChunks.length > 0
    ? Number((retrievedChunks.reduce((acc, c) => acc + c.relevanceScore, 0) / retrievedChunks.length).toFixed(3))
    : 0;

  const topRelevance = retrievedChunks.length > 0 ? retrievedChunks[0].relevanceScore : 0;

  const sourcesSummary = retrievedChunks.map(c => ({
    title: c.documentTitle,
    section: c.section,
    snippet: c.content.slice(0, 160) + '...',
    relevanceScore: c.relevanceScore
  }));

  const duration = Date.now() - startTime;

  return {
    agent: 'retrieval',
    status: 'success',
    duration,
    retrievedChunks,
    sourcesSummary,
    topRelevance,
    avgRelevance,
    foundMatches: retrievedChunks.length > 0 && topRelevance >= 0.4
  };
};

module.exports = {
  runRetrievalAgent
};
