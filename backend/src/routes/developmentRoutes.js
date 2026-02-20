const express = require('express');
const router = express.Router();
const {
    verifyApiKey,
    generateTechStack,
    generateStructure,
    generateCode
} = require('../controllers/developmentController');

router.get('/verify-key', verifyApiKey);
router.post('/generate-tech-stack', generateTechStack);
router.post('/generate-structure', generateStructure);
router.post('/generate-code', generateCode);

module.exports = router;
