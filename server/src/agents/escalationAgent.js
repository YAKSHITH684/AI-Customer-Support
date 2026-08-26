/**
 * Escalation Agent
 * Analyzes failure/escalation conditions, classifies root cause reason, and assigns routing/priority tags
 */
const runEscalationAgent = async (queryText, retrievalResult, confidenceResult) => {
  const startTime = Date.now();

  const lowerQuery = queryText.toLowerCase();
  let escalationReason = 'LOW_CONFIDENCE';
  let suggestedPriority = 'medium';
  let routingQueue = 'General Agent Queue';

  // 1. Negative sentiment check
  const negativeWords = ['terrible', 'horrible', 'lawsuit', 'lawyer', 'sue', 'furious', 'fraud', 'scam', 'unacceptable'];
  if (negativeWords.some(w => lowerQuery.includes(w))) {
    escalationReason = 'NEGATIVE_SENTIMENT';
    suggestedPriority = 'urgent';
    routingQueue = 'Priority Executive Support';
  }
  // 2. Policy / Legal / Compliance Sensitive
  else if (lowerQuery.includes('refund') || lowerQuery.includes('cancel') || lowerQuery.includes('gdpr') || lowerQuery.includes('delete account') || lowerQuery.includes('legal')) {
    escalationReason = 'POLICY_SENSITIVE';
    suggestedPriority = 'high';
    routingQueue = 'Billing & Compliance Queue';
  }
  // 3. No relevant context found in RAG
  else if (!retrievalResult?.foundMatches || retrievalResult?.topRelevance < 0.35) {
    escalationReason = 'NO_RELEVANT_CONTEXT';
    suggestedPriority = 'medium';
    routingQueue = 'Knowledge Base Triage';
  }
  // 4. Ambiguous or extremely short query
  else if (queryText.trim().split(/\s+/).length < 3 || lowerQuery.includes('help') && queryText.length < 10) {
    escalationReason = 'AMBIGUOUS_QUERY';
    suggestedPriority = 'low';
    routingQueue = 'Customer Intake';
  }
  // 5. Default low confidence
  else {
    escalationReason = 'LOW_CONFIDENCE';
    suggestedPriority = 'medium';
    routingQueue = 'Tier-1 Support Queue';
  }

  const duration = Date.now() - startTime;

  return {
    agent: 'escalation',
    status: 'success',
    duration,
    escalationReason,
    suggestedPriority,
    routingQueue,
    escalatedAt: new Date()
  };
};

module.exports = {
  runEscalationAgent
};
