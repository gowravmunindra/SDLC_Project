const express = require('express');
const router = express.Router();
const vibeCodingController = require('../controllers/vibeCodingController');

// Vibe Coding Routes
router.post('/verify-key', vibeCodingController.verifyApiKey);
router.post('/generate-project', vibeCodingController.generateProject);
router.post('/update-project', vibeCodingController.updateProject);

module.exports = router;
