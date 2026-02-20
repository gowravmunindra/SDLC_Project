/**
 * VibeCodingService — Dedicated LLM service for the Development Phase.
 *
 * CRITICAL: This service ONLY uses LLM_API_KEY (apifreellm.com).
 * NO fallback to local model — local model cannot handle complex JSON.
 */

const axios = require('axios');

class VibeCodingService {
    constructor() {
        this.baseUrl = 'https://apifreellm.com/api/v1/chat';
        this.lastRequestTime = 0;
        this.minInterval = 26000; // 26s rate limit
    }

    get apiKey() {
        return process.env.LLM_API_KEY;
    }

    // ── Helper: Rebuild structure from file paths ───────────────────────────
    buildStructureFromFiles(files) {
        const root = { name: 'root', type: 'folder', children: [] };

        files.forEach(file => {
            // Filter out empty parts and clean paths
            const parts = file.path.split('/').filter(p => p.trim() !== '' && p !== '.');
            let current = root;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
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

    // ── Rate limit enforcement ──────────────────────────────────────────────
    async _waitForRateLimit() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.minInterval) {
            const wait = this.minInterval - elapsed;
            console.log(`[VibeCodingService] Rate limit: waiting ${Math.round(wait / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        this.lastRequestTime = Date.now();
    }

    async generate(prompt) {
        const key = this.apiKey;
        if (!key || key.trim() === '' || key.includes('your_actual_key')) {
            throw new Error('LLM_API_KEY is not configured in backend/.env');
        }

        await this._waitForRateLimit();

        try {
            const response = await axios.post(this.baseUrl, {
                message: prompt,
                model: 'apifreellm'
            }, {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 180000
            });

            const data = response.data;
            const text = data.text || data.response || data.content || data.message ||
                (typeof data === 'string' ? data : null);

            if (!text) throw new Error('Empty response from AI');
            return text;
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) throw new Error('Invalid API key');
            if (status === 429) throw new Error('Rate limit exceeded (wait 30s)');
            throw error;
        }
    }

    async generateJSON(prompt) {
        const raw = await this.generate(prompt);
        let text = raw.trim();

        // Strip markdown
        text = text.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) throw new Error('Invalid JSON response');

        text = text.substring(firstBrace, lastBrace + 1);

        try {
            return JSON.parse(text);
        } catch (e) {
            // Attempt simple fix for unescaped newlines in 'code' blocks
            const fixed = text.replace(/"code":\s*"(.*?)",/gs, (match, code) => {
                const escapedCode = code.replace(/\n/g, '\\n').replace(/"/g, '\\"');
                return `"code": "${escapedCode}",`;
            });
            return JSON.parse(fixed);
        }
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

        const result = await this.generateJSON(prompt);
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

        const result = await this.generateJSON(prompt);
        return result;
    }
}

module.exports = new VibeCodingService();
