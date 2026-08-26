const config = require('../config/env');

/**
 * Confidence Agent
 * Evaluates RAG retrieval relevance, draft completeness, sentiment, and determines AUTO_SEND vs ESCALATE
 */
const runConfidenceAgent = async (queryText, retrievalResult, draftingResult) => {
  const startTime = Date.now();

  const topRelevance = retrievalResult?.topRelevance || 0;
  const hasCitations = draftingResult?.hasCitations || false;
  const draftLength = draftingResult?.draft?.length || 0;

  // 1. Retrieval Relevance Score (0.0 - 0.50)
  const retrievalComponent = Math.min(0.50, topRelevance * 0.55);

  // 2. Citation / Grounding Score (0.0 - 0.25)
  const citationComponent = hasCitations ? 0.25 : (retrievalResult?.foundMatches ? 0.15 : 0.05);

  // 3. Draft Completeness Score (0.0 - 0.15)
  const completenessComponent = draftLength > 80 ? 0.15 : (draftLength > 30 ? 0.08 : 0.02);

  // 4. Query Clarity Score (0.0 - 0.10)
  const wordsCount = queryText.trim().split(/\s+/).length;
  const clarityComponent = (wordsCount >= 3 && wordsCount <= 120) ? 0.10 : 0.04;

  let totalScore = retrievalComponent + citationComponent + completenessComponent + clarityComponent;

  // Sentiment / Sensitivity Penalty Check
  const lowerQuery = queryText.toLowerCase();
  const negativeWords = ['terrible', 'horrible', 'lawsuit', 'lawyer', 'sue', 'furious', 'fraud', 'scam', 'unacceptable'];
  const hasNegativeSentiment = negativeWords.some(w => lowerQuery.includes(w));

  if (hasNegativeSentiment) {
    totalScore = Math.max(0.20, totalScore - 0.30);
  }

  // Normalization
  totalScore = Number(Math.min(0.98, Math.max(0.10, totalScore)).toFixed(3));

  // Decision logic against thresholds
  const autoSendThreshold = config.CONFIDENCE_THRESHOLD_AUTO_SEND || 0.80;
  const escalateThreshold = config.CONFIDENCE_THRESHOLD_ESCALATE || 0.65;

  let decision = 'ESCALATE';
  if (totalScore >= autoSendThreshold && !hasNegativeSentiment && retrievalResult?.foundMatches) {
    decision = 'AUTO_SEND';
  } else {
    decision = 'ESCALATE';
  }

  const duration = Date.now() - startTime;

  return {
    agent: 'confidence',
    status: 'success',
    duration,
    confidenceScore: totalScore,
    decision,
    autoSendThreshold,
    escalateThreshold,
    hasNegativeSentiment,
    breakdown: {
      retrievalComponent: Number(retrievalComponent.toFixed(3)),
      citationComponent: Number(citationComponent.toFixed(3)),
      completenessComponent: Number(completenessComponent.toFixed(3)),
      clarityComponent: Number(clarityComponent.toFixed(3)),
      sentimentPenalty: hasNegativeSentiment ? -0.30 : 0
    }
  };
};

module.exports = {
  runConfidenceAgent
};
