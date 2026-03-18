const express = require('express');
const router = express.Router();
const { 
    generateContent, 
    generateJSON, 
    chat,
    generateProjectRequirements,
    suggestTechStacks,
    generateProjectDiagrams,
    renderPlantUML
} = require('../controllers/aiController');

// Define routes
router.post('/generate', generateContent);
router.post('/generate-json', generateJSON);
router.post('/chat', chat);
router.post('/requirements', generateProjectRequirements);
router.post('/tech-stacks', suggestTechStacks);
router.post('/diagrams', generateProjectDiagrams);
// New: Backend PlantUML rendering proxy (bypasses browser URL length limits)
// Supports GET (img src) and POST (fetch)
router.get('/plantuml/render', renderPlantUML);
router.post('/plantuml/render', renderPlantUML);

module.exports = router;
