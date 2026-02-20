const freeLlmService = require('../services/freeLlmService');
const llmService = require('../services/llmService');

/**
 * Helper to determine which service to use
 */
const getLlmService = (forceLocal) => {
    if (forceLocal && llmService) {
        console.log('[AIController] Explicitly using Local LLM as requested.');
        return llmService;
    }
    return freeLlmService;
};

const generateContent = async (req, res) => {
    try {
        const { prompt, forceLocal } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const activeService = getLlmService(forceLocal);
        const genMethod = activeService.generate || activeService.generateContent;

        if (typeof genMethod !== 'function') {
            throw new Error(`AI Service does not support generation [forceLocal: ${forceLocal}]`);
        }

        const response = await genMethod.call(activeService, prompt);
        res.json({ text: response });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const generateJSON = async (req, res) => {
    try {
        const { prompt, forceLocal } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const activeService = getLlmService(forceLocal);
        const jsonResponse = await activeService.generateJSON(prompt);

        if (!jsonResponse) {
            return res.status(500).json({ message: 'Failed to generate valid JSON' });
        }
        res.json(jsonResponse);
    } catch (error) {
        console.error('AI JSON Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const chat = async (req, res) => {
    try {
        const { messages, forceLocal } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Messages array is required' });
        }

        const activeService = getLlmService(forceLocal);
        const lastMsg = messages[messages.length - 1];
        const prompt = lastMsg.parts || lastMsg.content;

        const genMethod = activeService.generate || activeService.generateContent;
        if (typeof genMethod !== 'function') {
            throw new Error(`AI Service [Chat] does not support generation [forceLocal: ${forceLocal}]`);
        }

        const response = await genMethod.call(activeService, prompt);
        res.json({ text: response });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateContent,
    generateJSON,
    chat
};
