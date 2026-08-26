const express = require('express');
const router = express.Router();
const {
  handleChatMessage,
  handleChatStream,
  handleChatEscalate,
  getQuickSuggestions
} = require('../controllers/chatController');

// Chat endpoints
router.post('/message', handleChatMessage);
router.post('/stream', handleChatStream);
router.post('/escalate', handleChatEscalate);
router.get('/suggestions', getQuickSuggestions);

module.exports = router;
