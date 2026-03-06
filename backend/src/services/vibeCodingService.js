const mistralService = require('./mistralService');

class VibeCodingService {
    constructor() {
        // No longer using internal baseUrl or rate limit interval for Mistral
    }

    // ── Helper: Rebuild structure from file paths ───────────────────────────
    buildStructureFromFiles(files) {
        const root = { name: 'root', type: 'folder', children: [] };

        files.forEach(file => {
            if (!file.path) return;
            const parts = file.path.split('/').filter(p => p.trim() !== '' && p !== '.');
            let current = root;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                if (!current.children) current.children = [];
                let existing = current.children.find(child => child.name === part);

                if (!existing) {
                    existing = {
                        name: part,
                        type: isFile ? 'file' : 'folder',
                        children: isFile ? undefined : []
                    };
                    current.children.push(existing);
                }

                if (!isFile) {
                    current = existing;
                }
            });
        });

        return root;
    }

    async generateProject(userPrompt, projectContext = '') {
        const prompt = `Task: Generate a FULL-STACK, HIGH-FIDELITY code repository for: "${userPrompt}"
${projectContext ? `\nProject Context (Vision): ${projectContext}` : ''}

Respond with a JSON object containing a professional file list.
Structure:
{
  "files": [
    {"path": "README.md", "code": "# ..."},
    {"path": "frontend/package.json", "code": "{...}"},
    {"path": "backend/package.json", "code": "{...}"}
  ],
  "summary": "Project overview"
}

STRICT PROFESSIONAL RULES:
1. MANDATORY README.md: This must be the VERY FIRST file. It must serve as the central hub for the OVERALL project, containing a clear "HOW TO RUN" section with separate terminal commands for 'frontend' and 'backend'.
2. HIGH-FIDELITY FRONTEND: Concentrate heavily on the Frontend (React/CSS). It must be visually stunning, interactive, and modern (comparable to Claude/Lovable UI generation). Include components (Header, Footer, Feature cards, Dashboard, etc.) and deep CSS styling (animations, gradients, glassmorphism).
3. BACKEND BOILERPLATE: Provide a professional Backend structure. This should include project-specific routing, authentication logic, middleware, and database (MongoDB/SQL) placeholders. Focus on being a functional, clean boilerplate that handles the project's logic.
4. NO IMAGES: Do NOT use any <img> tags or image/icon assets. Use CSS gradients, styled divs, or text-based placeholders for visuals.
5. FOLDER SEPARATION: Clearly separate into 'frontend/' and 'backend/' folders within the root.
6. NO PLACEHOLDERS: All code (both layers) must be fully implemented, modular, and runnable. No "// TODO" or "// Implement later".
7. VOLUME: Return 25-30 files to ensure a deep, professional full-stack implementation.
8. NO MARKDOWN WRAPPERS: Respond ONLY with the JSON object.

Generate the full project JSON now:`;

        const result = await mistralService.generateJSON(prompt);
        result.structure = this.buildStructureFromFiles(result.files);
        return result;
    }

    async updateProject(userPrompt, currentFiles) {
        const filePaths = currentFiles.map(f => f.path).join(', ');

        const prompt = `Update the project based on: "${userPrompt}"
Existing files: ${filePaths}

Respond ONLY with this JSON:
{
  "files": [
    {"path": "path/to/file.js", "code": "full code", "action": "modified|created|deleted"}
  ],
  "summary": "Summary of changes"
}`;

        const result = await mistralService.generateJSON(prompt);
        return result;
    }
}

module.exports = new VibeCodingService();

