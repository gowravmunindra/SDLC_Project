const mistralService = require('../services/mistralService');
const { renderSVG } = require('../services/plantumlService');

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

const generateProjectRequirements = async (req, res) => {
    try {
        const { projectName, projectDescription } = req.body;

        // projectName is mandatory — it's what the AI anchors requirements to
        if (!projectName || !projectName.trim()) {
            return res.status(400).json({ message: 'Project name is required to generate requirements' });
        }

        const result = await mistralService.generateRequirements(projectName.trim(), (projectDescription || '').trim());
        res.json(result);
    } catch (error) {
        console.error('AI Requirements Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const suggestTechStacks = async (req, res) => {
    try {
        const { requirements } = req.body;
        if (!requirements) return res.status(400).json({ message: 'Requirements are required' });

        const result = await mistralService.suggestTechStacks(requirements);
        res.json(result);
    } catch (error) {
        console.error('AI Tech Stack Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const generateProjectDiagrams = async (req, res) => {
    try {
        const { requirements, type } = req.body;
        if (!requirements) return res.status(400).json({ message: 'Requirements are required' });

        const result = await mistralService.generateDiagrams(requirements, type);
        res.json(result);
    } catch (error) {
        console.error('AI Diagram Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const renderPlantUML = async (req, res) => {
    try {
        // Support both GET (query param) and POST (body)
        let code = req.body?.code;
        
        // GET with ?code= base64 encoded param (for use in <img src="">)
        if (!code && req.query?.code) {
            try {
                // Decode from base64
                code = decodeURIComponent(escape(atob(decodeURIComponent(req.query.code))));
            } catch (e) {
                code = decodeURIComponent(req.query.code);
            }
        }

        if (!code) return res.status(400).json({ message: 'PlantUML code is required' });

        const svg = await renderSVG(code);
        res.set('Content-Type', 'image/svg+xml');
        res.set('Cache-Control', 'public, max-age=3600');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(svg);
    } catch (error) {
        console.error('PlantUML Render Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    generateContent,
    generateJSON,
    chat,
    generateProjectRequirements,
    suggestTechStacks,
    generateProjectDiagrams,
    renderPlantUML
};

