const express = require('express');
const router = express.Router();
const { askGuide } = require('../controllers/aiGuideController');
const { protect } = require('../middleware/auth');

// All AI Guide routes are protected
router.post('/ask', protect, askGuide);

module.exports = router;
