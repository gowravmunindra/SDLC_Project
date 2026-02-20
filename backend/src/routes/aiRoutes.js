const express = require('express');
const router = express.Router();
const { generateContent, generateJSON, chat } = require('../controllers/aiController');

// Define routes
router.post('/generate', generateContent);
router.post('/generate-json', generateJSON);
router.post('/chat', chat);

module.exports = router;
