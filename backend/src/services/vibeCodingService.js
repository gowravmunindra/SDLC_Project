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
        const prompt = `Generate a COMPLETE project for: "${userPrompt}"
${projectContext ? `\nContext: ${projectContext}` : ''}

Respond ONLY with this JSON structure:
{
  "files": [
    {"path": "src/index.js", "code": "..."}
  ],
  "summary": "Brief summary"
}

RULES:
1. Return 10-15 files maximum.
2. Ensure paths are clear (e.g. "backend/server.js").
3. NO placeholders.`;

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

