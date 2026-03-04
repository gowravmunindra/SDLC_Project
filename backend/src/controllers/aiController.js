const mistralService = require('../services/mistralService');

const generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const response = await mistralService.generateContent(prompt);
        res.json({ text: response });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const generateJSON = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const jsonResponse = await mistralService.generateJSON(prompt);

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
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Messages array is required' });
        }

        const response = await mistralService.chat(messages);
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

