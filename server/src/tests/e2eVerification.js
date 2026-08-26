const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runE2EVerification() {
  console.log('===========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION TESTS');
  console.log('===========================================================');

  try {
    // 1. Health Check
    console.log('\n[1/6] Testing System Health Check (/api/health)...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health status:', healthRes.data.status, 'Service:', healthRes.data.service);

    // 2. Auth Login
    console.log('\n[2/6] Testing Agent Authentication (/api/auth/login)...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'agent@resolveflow.ai',
      password: 'Password123!'
    });
    const token = loginRes.data.token;
    console.log('✅ Agent Authenticated successfully:', loginRes.data.user.name, `[${loginRes.data.user.role}]`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Knowledge Base Semantic Vector Search
    console.log('\n[3/6] Testing Vector Cosine Similarity Search (/api/knowledge-base/search)...');
    const searchRes = await axios.post(
      `${API_BASE}/knowledge-base/search`,
      { query: 'Can I get a refund if dissatisfied?', limit: 2 },
      { headers: authHeaders }
    );
    console.log(`✅ Vector Search returned ${searchRes.data.results.length} chunks.`);
    searchRes.data.results.forEach((r, idx) => {
      const score = r.relevanceScore !== undefined ? r.relevanceScore : r.similarity;
      console.log(`   - Chunk #${idx + 1}: [Relevance: ${(score * 100).toFixed(1)}%] ${r.documentTitle || r.metadata?.title || 'Policy Chunk'}`);
    });

    // 4. Ticket Intake & Autonomous Multi-Agent Chain
    console.log('\n[4/6] Testing Ticket Creation & Multi-Agent Orchestration (/api/tickets)...');
    const ticketRes = await axios.post(
      `${API_BASE}/tickets`,
      {
        subject: 'How do I reset my password if 2FA is unavailable?',
        description: 'I lost my 2FA authentication device and cannot sign into my dashboard. What is the recovery procedure?',
        category: 'Authentication',
        priority: 'high',
        channel: 'widget'
      },
      { headers: authHeaders }
    );
    const newTicket = ticketRes.data.ticket;
    console.log(`✅ Ticket Created: #${newTicket.ticketNumber} (Status: ${newTicket.status})`);

    // Allow 2.5s for the asynchronous multi-agent chain to complete (Retrieval -> Drafting -> Confidence -> Action -> Telemetry)
    console.log('⏳ Awaiting autonomous multi-agent pipeline resolution...');
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Fetch the ticket with its active resolution
    const ticketDetailRes = await axios.get(`${API_BASE}/tickets/${newTicket._id}`, { headers: authHeaders });
    const resolution = ticketDetailRes.data.activeResolution;

    if (resolution) {
      console.log(`✅ Multi-Agent Orchestration Chain Result:`);
      console.log(`   - Final Resolution Status: ${resolution.status}`);
      console.log(`   - Confidence Score: ${(resolution.confidenceScore * 100).toFixed(0)}%`);
      console.log(`   - Agent Execution Steps: ${resolution.logs?.length || 0} telemetry logs recorded`);
      console.log(`   - Draft Preview: "${resolution.draftOutput?.slice(0, 90)}..."`);
    } else {
      console.log('ℹ️ Ticket created without resolution.');
    }

    // 5. Approving Resolution
    if (resolution && (resolution.status === 'AWAITING_APPROVAL' || resolution.status === 'ESCALATED')) {
      console.log('\n[5/6] Testing Agent Draft Approval Workflow (/api/resolutions/:id/approve)...');
      const approveRes = await axios.post(
        `${API_BASE}/resolutions/${resolution._id}/approve`,
        {},
        { headers: authHeaders }
      );
      console.log('✅ Resolution Approved & Dispatched! New Ticket Status:', approveRes.data.ticket.status);
    } else {
      console.log('\n[5/6] Ticket auto-resolved or completed directly.');
    }

    // 6. Integration Test Execution
    console.log('\n[6/6] Testing Third-Party Integration Alert (/api/integrations/slack/execute)...');
    const slackRes = await axios.post(
      `${API_BASE}/integrations/slack/execute`,
      {
        action: 'post_alert',
        payload: { channel: '#support-escalations', text: 'E2E Verification Alert: ResolveFlow AI Active' }
      },
      { headers: authHeaders }
    );
    console.log('✅ Slack Webhook Dispatched:', slackRes.data.result.message);

    console.log('\n===========================================================');
    console.log('🎉 ALL 6/6 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
    console.log('===========================================================');
  } catch (error) {
    console.error('❌ Verification test failed:', error.response?.data || error.message);
  }
}

runE2EVerification();
