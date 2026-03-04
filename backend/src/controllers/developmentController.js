const Project = require('../models/Project');
const mistralService = require('../services/mistralService');

// Helper to summarize diagrams for context
const getDiagramSummary = (diagrams) => {
  if (!diagrams) return 'N/A';
  return Object.entries(diagrams)
    .map(([type, data]) => {
      const code = typeof data === 'string' ? data : (data?.code || '')
      if (code.length < 10) return ''
      return `[${type} Diagram]\n${code.substring(0, 1500)}`
    })
    .filter(Boolean)
    .join('\n\n') || 'N/A';
};

// Verify API Key
const verifyApiKey = async (req, res) => {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey || apiKey === 'your_mistral_key_here') {
      return res.status(404).json({
        success: false,
        message: "MISTRAL_API_KEY not found in backend .env file. Please configure your Mistral API key before starting development."
      });
    }
    res.json({ success: true, message: "Mistral API Key Verified." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate Tech Stack Options
const generateTechStack = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const prompt = `Task: Generate two technology stack options for a software project.
Project: ${project.name}
Description: ${project.description}
Requirements Count: ${project.requirements?.functionalRequirements?.length || 0}

Output Format: Provide ONLY a JSON object.
{
  "options": [
    {
      "name": "Recommended Stack",
      "type": "Full Stack",
      "frontend": "e.g. React/Vite",
      "backend": "e.g. Node.js/Express",
      "database": "e.g. MongoDB",
      "auth": "e.g. JWT/Bcrypt",
      "deployment": "e.g. Docker/AWS"
    },
    {
      "name": "Alternative Stack",
      "type": "Full Stack",
      "frontend": "...",
      "backend": "...",
      "database": "...",
      "auth": "...",
      "deployment": "..."
    }
  ]
}`;

    const result = await mistralService.generateJSON(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Tech Stack Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate Folder Structure
const generateStructure = async (req, res) => {
  try {
    const { projectId, techStack, generateType } = req.body; // generateType: Frontend, Backend, Both
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const diagramSummary = getDiagramSummary(project.design?.diagrams);

    const prompt = `Task: Generate a comprehensive, professional-grade project structure for a ${generateType} application.
Tech Stack: 
- Frontend: ${techStack.frontend}
- Backend: ${techStack.backend}
- Database: ${techStack.database}

Reference Design Diagrams:
${diagramSummary}

CRITICAL RULES FOR STRUCTURE GENERATION:
1. ONLY output folders and file names in the specified JSON format.
2. Do NOT generate any code, content, or explanations inside the 'description' fields.
3. Every folder created (e.g., controllers, components) MUST contain relevant files.
4. Total files: 20-25. 
5. Separate 'frontend' and 'backend' if 'Both' is selected.
6. The 'description' field in JSON should only be a brief 1-line summary of the file's purpose (e.g. "User authentication controller").

Output Format:
{
  "structure": {
    "name": "root",
    "type": "folder",
    "children": [ ... ]
  }
}`;
    const result = await mistralService.generateJSON(prompt);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Structure Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate Code for a File
const generateCode = async (req, res) => {
  try {
    const { projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure } = req.body;
    const diagramSummary = getDiagramSummary(diagrams);

    const prompt = `Task: Generate HIGH-QUALITY, PRODUCTION-READY source code for a specific file.
Target File: ${filePath}
Purpose: ${fileDescription}
Tech Stack: Frontend(${techStack?.frontend}), Backend(${techStack?.backend}), Database(${techStack?.database})

CONFIRMED PROJECT STRUCTURE (Reference for Relative Imports):
${JSON.stringify(fullStructure, null, 2)}

STRICT GENERATION RULES:
1. FULL IMPLEMENTATION: Do NOT use placeholders, // TODOs, or empty functions. Every file MUST be fully functional and ready to run.
2. NO ESCAPING: Do NOT output "Intentionally left empty". You must provide a professional implementation regardless of the file type.
3. FILE TYPE COMPLIANCE: 
   - If .css: Provide modern, comprehensive CSS styles. Use variables, flexbox/grid, and professional design patterns.
   - If .jsx/.js (Frontend): Use React/ES6. Implement robust components with hooks, state management, and clear UI. Use relative imports strictly matching the structure.
   - If .js (Backend): Implement deep logic for controllers/models using ${techStack?.backend}. Include error handling and proper status codes.
   - If .json: Provide a complete valid JSON configuration.
4. IMPORT INTEGRITY: Every import statement MUST match a real path found in the CONFIRMED PROJECT STRUCTURE.
5. CODE ONLY: Output ONLY the source code content. No markdown, no explanations, no text before/after the code.
6. DESIGN ALIGNMENT: Strictly align with the architectural patterns and names defined in these diagrams:
${diagramSummary}

Output the complete, perfect source code now:`;

    const code = await mistralService.generate(prompt);
    res.json({ success: true, filePath, code });
  } catch (error) {
    console.error('Code Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyApiKey,
  generateTechStack,
  generateStructure,
  generateCode
};

