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
    const { projectId, techStack, generateType, isRegenerating } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Detect if we should ignore previous phase outputs
    const usePreviousData = !isRegenerating && project.design?.diagrams;
    const diagramSummary = usePreviousData ? getDiagramSummary(project.design?.diagrams) : 'NOT AVAILABLE (Generate based on Project Title/Description only)';

    const prompt = `Task: Generate a COMPREHENSIVE, PRODUCTION-READY project structure for a ${generateType} application.

PROJECT CONTEXT:
- Title: ${project.name}
- Vision: ${project.description}
- Tech Stack: ${techStack.frontend}, ${techStack.backend}, ${techStack.database}

DEVELOPMENT GUIDELINES (Predefined Generation Prompts):
1. INDEPENDENCE: If design diagrams are marked as NOT AVAILABLE, interpret the project title/description to create a professional, logical architecture from scratch.
2. MANDATORY COMPONENTS: Every generated structure MUST include:
   - UI STYLING: CSS/SCSS files and layout components for a visually professional interface.
   - CORE LOGIC: Dedicated files/services to handle main application behavior (e.g. controllers, services).
   - ENTRY POINT: A clear starting file (index.js, main.jsx, or server.js).
    - DOCUMENTATION: A mandatory "README.md" file for the OVERALL project. This file must serve as the primary documentation hub, clearly summarizing the entire vision, project structure, setup, dependencies, run instructions, and troubleshooting guides for the whole application.
3. MODULARITY: Separate concerns into folders like 'components', 'styles', 'logic', 'routes', 'models'.
4. AUTH & DB PLACEHOLDERS: Provide clear, non-hardcoded slots for authentication and database connections.
5. VOLUME: 20-30 files across logical folders.

REFERENCE DESIGN (IF AVAILABLE):
${diagramSummary}

Output ONLY the JSON structure:
{
  "structure": {
    "name": "${project.name.toLowerCase().replace(/\s+/g, '-')}",
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
    const { projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure, isRegenerating } = req.body;

    // Respect regeneration flag by ignoring diagram context if needed
    const usePreviousData = !isRegenerating && diagrams;
    const diagramSummary = usePreviousData ? getDiagramSummary(diagrams) : 'NOT AVAILABLE';

    let specificRules = "";
    if (filePath.toLowerCase().endsWith('readme.md')) {
      specificRules = `
MANDATORY README SECTIONS:
1. Project Overview (Interpretation of ${fileDescription}).
2. Folder Structure (Tree view based on ${JSON.stringify(fullStructure.name)}).
3. Setup Instructions (Step-by-step local configuration).
4. Dependency Installation (Required npm/pip commands).
5. Run Commands (How to start the app).
6. Troubleshooting (Help for missing dependencies or config issues).
`;
    } else if (filePath.toLowerCase().includes('style') || filePath.toLowerCase().endsWith('.css') || filePath.toLowerCase().endsWith('.scss')) {
      specificRules = "MODERN STYLING RULES: Focus on a premium, visually understandable UI. Use Flexbox/Grid, professional color palettes, and structured layouts.";
    } else if (filePath.toLowerCase().includes('logic') || filePath.toLowerCase().includes('controller') || filePath.toLowerCase().includes('service')) {
      specificRules = "CORE LOGIC RULES: Implement the main behavior described in the project vision. Connect UI interactions to functionality. Keep code modular and scalable.";
    }

    const prompt = `Task: Generate PRODUCTION-LEVEL source code for: ${filePath}
Project: ${fileDescription}
Tech Stack: ${techStack?.frontend || 'React'}, ${techStack?.backend || 'Node'}, ${techStack?.database || 'None'}

PROJECT ARCHITECTURE:
${JSON.stringify(fullStructure, null, 2)}

STRICT GENERATION RULES:
1. NO PLACEHOLDERS: Implement the file FULLY. No "// TODO" or "// Logic here".
2. SEPARATION OF CONCERNS: Keep UI Styling and Core Logic strictly separated.
3. ERROR HANDLING: Include professional try/catch blocks and user-friendly logging.
4. INDEPENDENT INTERPRETATION: Use the file path and project context to infer perfect implementation if diagrams are NOT AVAILABLE.
${specificRules}

REFERENCE LOGIC (IF AVAILABLE):
${diagramSummary}

Output the complete source code for ${filePath} now:`;

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

