const Resolution = require('../models/Resolution');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { runRetrievalAgent } = require('./retrievalAgent');
const { runDraftingAgent } = require('./draftingAgent');
const { runConfidenceAgent } = require('./confidenceAgent');
const { runEscalationAgent } = require('./escalationAgent');
const { logAgentStep } = require('./monitoringAgent');
const { emitResolutionUpdate, emitTicketUpdate, emitNotification } = require('../config/socket');
const slackIntegration = require('../integrations/slackIntegration');
const Integration = require('../models/Integration');

// Check if LangChain core is available
let isLangChainAvailable = false;
try {
  require('@langchain/core');
  isLangChainAvailable = true;
} catch {
  isLangChainAvailable = false;
}

/**
 * Orchestrator Chain Execution
 * Runs Retrieval -> Drafting -> Confidence -> (AutoSend or Escalation) -> Monitoring
 */
const runAgentChain = async ({ ticketId, messageId, customerQuery, userId }) => {
  const chainStartTime = Date.now();

  // 1. Initialize Resolution Document
  let resolution = await Resolution.create({
    ticketId,
    messageId,
    customerQuery,
    status: 'PENDING',
    ragPipeline: isLangChainAvailable ? 'available' : 'not-installed',
    retryCount: 0
  });

  // Link active resolution to ticket
  await Ticket.findByIdAndUpdate(ticketId, { activeResolution: resolution._id });

  try {
    // Log Orchestrator start
    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'orchestrator',
      level: 'info',
      message: `Orchestrator initiated agent chain for query: "${customerQuery.slice(0, 60)}..."`,
      metadata: { ragPipeline: resolution.ragPipeline }
    });

    // STEP 1: RETRIEVAL AGENT
    resolution.status = 'RETRIEVING';
    await resolution.save();
    emitResolutionUpdate(ticketId, resolution);

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'retrieval',
      level: 'info',
      message: 'Retrieval Agent scanning Knowledge Base vector store...',
      metadata: { query: customerQuery }
    });

    const retrievalResult = await runRetrievalAgent(customerQuery, resolution._id, ticketId);

    resolution.retrievedContextSnapshot = retrievalResult.retrievedChunks;
    resolution.retrievedSources = retrievalResult.sourcesSummary;

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'retrieval',
      level: retrievalResult.foundMatches ? 'success' : 'warning',
      message: retrievalResult.foundMatches
        ? `Retrieval Agent found ${retrievalResult.retrievedChunks.length} relevant knowledge chunks (Top relevance: ${(retrievalResult.topRelevance * 100).toFixed(0)}%).`
        : 'Retrieval Agent: Low vector similarity in knowledge base.',
      metadata: {
        topRelevance: retrievalResult.topRelevance,
        chunksCount: retrievalResult.retrievedChunks.length,
        sources: retrievalResult.sourcesSummary
      }
    });

    // STEP 2: DRAFTING AGENT
    resolution.status = 'DRAFTING';
    await resolution.save();
    emitResolutionUpdate(ticketId, resolution);

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'drafting',
      level: 'info',
      message: 'Drafting Agent synthesizing response grounded in retrieved context...',
      metadata: { contextChunks: retrievalResult.retrievedChunks.length }
    });

    const draftingResult = await runDraftingAgent(customerQuery, retrievalResult.retrievedChunks);

    resolution.draftOutput = draftingResult.draft;
    resolution.aiProvider = draftingResult.providerUsed;

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'drafting',
      level: 'success',
      message: `Drafting Agent generated response using ${draftingResult.providerUsed.toUpperCase()} with ${draftingResult.citations.length} cited source(s).`,
      metadata: {
        provider: draftingResult.providerUsed,
        citations: draftingResult.citations,
        draftSnippet: draftingResult.draft.slice(0, 120) + '...'
      }
    });

    // STEP 3: CONFIDENCE AGENT
    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'confidence',
      level: 'info',
      message: 'Confidence Agent scoring response grounding, sentiment, and validity...',
      metadata: {}
    });

    const confidenceResult = await runConfidenceAgent(customerQuery, retrievalResult, draftingResult);

    resolution.confidenceScore = confidenceResult.confidenceScore;

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'confidence',
      level: confidenceResult.decision === 'AUTO_SEND' ? 'success' : 'warning',
      message: `Confidence Agent computed score: ${(confidenceResult.confidenceScore * 100).toFixed(1)}% -> Decision: ${confidenceResult.decision}`,
      metadata: {
        score: confidenceResult.confidenceScore,
        decision: confidenceResult.decision,
        breakdown: confidenceResult.breakdown
      }
    });

    // STEP 4: DECISION BRANCH (AUTO_SEND vs ESCALATE)
    if (confidenceResult.decision === 'AUTO_SEND') {
      resolution.status = 'AUTO_SENT';
      resolution.finalOutput = draftingResult.draft;
      resolution.duration = Date.now() - chainStartTime;
      await resolution.save();

      // Create outgoing AI message on ticket
      await Message.create({
        ticketId,
        sender: 'ai',
        content: draftingResult.draft,
        isAIDraft: false,
        sourceRefs: retrievalResult.sourcesSummary,
        confidenceScore: confidenceResult.confidenceScore,
        resolutionId: resolution._id
      });

      // Update ticket status to resolved or pending customer reply
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
          status: 'resolved',
          resolvedAt: new Date()
        },
        { new: true }
      ).populate('customer', 'name email');

      await logAgentStep({
        resolutionId: resolution._id,
        ticketId,
        agent: 'monitoring',
        level: 'success',
        message: 'Resolution successfully auto-sent to customer. Ticket resolved.',
        metadata: { autoResolved: true, duration: resolution.duration }
      });

      emitResolutionUpdate(ticketId, resolution);
      emitTicketUpdate(updatedTicket);

      // Create notification
      const notification = await Notification.create({
        owner: updatedTicket.customer?._id || userId,
        ticketId,
        resolutionId: resolution._id,
        type: 'AUTO_RESOLVED',
        title: `Ticket ${updatedTicket.ticketNumber} Auto-Resolved`,
        message: `Your ticket "${updatedTicket.subject}" was automatically resolved by AI.`
      });
      emitNotification(updatedTicket.customer?._id || userId, notification);

    } else {
      // ESCALATION PATH
      const escalationResult = await runEscalationAgent(customerQuery, retrievalResult, confidenceResult);

      resolution.status = 'AWAITING_APPROVAL';
      resolution.escalationReason = escalationResult.escalationReason;
      resolution.duration = Date.now() - chainStartTime;
      await resolution.save();

      // Create AI Draft message awaiting agent approval
      const draftMessage = await Message.create({
        ticketId,
        sender: 'ai',
        content: draftingResult.draft,
        isAIDraft: true,
        sourceRefs: retrievalResult.sourcesSummary,
        confidenceScore: confidenceResult.confidenceScore,
        resolutionId: resolution._id
      });

      // Update ticket priority & status
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        {
          status: 'escalated',
          priority: escalationResult.suggestedPriority,
          tags: Array.from(new Set(['AI_ESCALATED', escalationResult.escalationReason]))
        },
        { new: true }
      ).populate('customer', 'name email');

      await logAgentStep({
        resolutionId: resolution._id,
        ticketId,
        agent: 'escalation',
        level: 'warning',
        message: `Escalation Agent routed ticket to "${escalationResult.routingQueue}". Reason: ${escalationResult.escalationReason}`,
        metadata: {
          reason: escalationResult.escalationReason,
          priority: escalationResult.suggestedPriority,
          queue: escalationResult.routingQueue
        }
      });

      emitResolutionUpdate(ticketId, resolution);
      emitTicketUpdate(updatedTicket);

      // Trigger Slack escalation alert if connected
      try {
        const slackIntegrationDoc = await Integration.findOne({ provider: 'slack', isConnected: true });
        if (slackIntegrationDoc) {
          await slackIntegration.execute('post_escalation_alert', {
            ticketNumber: updatedTicket.ticketNumber,
            subject: updatedTicket.subject,
            priority: updatedTicket.priority,
            escalationReason: escalationResult.escalationReason,
            ticketUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/tickets/${updatedTicket._id}`
          }, slackIntegrationDoc);
        }
      } catch (slackErr) {
        console.warn('Slack alert skipped/failed:', slackErr.message);
      }

      // Notify agents
      const notification = await Notification.create({
        owner: updatedTicket.customer?._id || userId,
        ticketId,
        resolutionId: resolution._id,
        type: 'ESCALATION',
        title: `Escalation: Ticket ${updatedTicket.ticketNumber}`,
        message: `Ticket escalated (${escalationResult.escalationReason}) - AI draft awaiting human review.`
      });
      emitNotification(updatedTicket.customer?._id || userId, notification);
    }

    return resolution;

  } catch (error) {
    console.error('❌ Agent chain execution failed:', error);
    resolution.status = 'FAILED';
    resolution.error = error.message;
    resolution.duration = Date.now() - chainStartTime;
    await resolution.save();

    await logAgentStep({
      resolutionId: resolution._id,
      ticketId,
      agent: 'monitoring',
      level: 'error',
      message: `Agent chain failure: ${error.message}`,
      metadata: { errorStack: error.stack }
    });

    emitResolutionUpdate(ticketId, resolution);
    throw error;
  }
};

module.exports = {
  runAgentChain
};
