const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT  — injected as a "system" role message on every API call.
// This primes the model to behave as a professional senior developer.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a world-class senior software engineer and architect with 15+ years of experience building production-grade web applications.

Your core competencies:
• React 18 + Vite 5 + React Router 6 (frontend)
• Node.js 18 + Express 4 + Mongoose 8 + MongoDB (backend)
• JWT authentication, bcryptjs, helmet, cors, morgan
• Clean architecture, separation of concerns, DRY principles
• Modern ES6+ JavaScript / JSX syntax
• Professional CSS with custom properties, Flexbox, and CSS Grid

Your professional standards (non-negotiable):
1. Every function and component you write is FULLY IMPLEMENTED — no TODOs, no stubs.
2. All imports resolve to real files — you never reference a path that doesn't exist.
3. Code is syntactically valid and runs without modification.
4. You use ONLY the pinned dependency versions specified in the prompt.
5. You follow consistent naming conventions and clean code structure.
6. Your CSS creates polished, professional interfaces — never unstyled raw HTML.
7. You handle errors properly: try/catch in async functions, loading/error states in React.
8. You NEVER wrap code responses in markdown fences (\`\`\`) unless specifically asked.
9. When asked for JSON, you return only the raw JSON object — no prose, no explanation.
10. When asked for source code, you return only the source code — nothing else.

Treat every task as if a real user will download your output, run npm install, and expect it to work immediately.`;

class MistralService {
    constructor() {
        this.apiKey  = process.env.MISTRAL_API_KEY;
        this.baseUrl = 'https://api.mistral.ai/v1/chat/completions';
        this.model   = 'mistral-large-latest';
    }

    /**
     * Core generation method.
     * Always sends a system prompt + user prompt for maximum quality.
     */
    async generate(prompt, isJson = false) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('MISTRAL_API_KEY is not configured in backend/.env');
        }

        try {
            console.log(`[Mistral] Generating ${isJson ? 'JSON' : 'text'} response...`);

            const payload = {
                model: this.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: prompt }
                ],
                // Low temperature = consistent, deterministic, professional output
                temperature: 0.1,
                // Allow long completions for full file generation
                max_tokens: 8192
            };

            if (isJson) {
                payload.response_format = { type: 'json_object' };
            }

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 600000 // 10 minutes — needed for large full-stack generation
            });

            const content = response.data.choices[0].message.content;

            if (isJson) {
                try {
                    return JSON.parse(content);
                } catch (parseError) {
                    console.error('[Mistral] JSON parse failed, attempting extraction...');
                    // LLM may have included explanatory text around the JSON
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    throw new Error('Mistral returned malformed JSON. Try again.');
                }
            }

            return content;

        } catch (error) {
            const status = error.response?.status;
            const msg    = error.response?.data?.message || error.message;

            console.error(`[Mistral] Error (HTTP ${status || 'N/A'}):`, msg);

            if (status === 401) throw new Error('Invalid Mistral API Key. Check your MISTRAL_API_KEY in backend/.env');
            if (status === 429) throw new Error('Mistral rate limit exceeded. Wait 30 seconds and try again.');
            if (status === 413) throw new Error('Request too large for this model. Reduce prompt size.');

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Mistral request timed out. The model is taking too long — try a simpler prompt.');
            }

            throw new Error(`Mistral API error: ${msg}`);
        }
    }

    /** Alias for text generation (backward compat) */
    async generateContent(prompt) {
        return this.generate(prompt, false);
    }

    /** JSON-mode generation */
    async generateJSON(prompt) {
        return this.generate(prompt, true);
    }

    /**
     * Multi-turn chat.
     * Automatically prepends the system prompt to the conversation.
     */
    async chat(messages) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('MISTRAL_API_KEY is not configured in backend/.env');
        }

        try {
            const allMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ];

            const response = await axios.post(this.baseUrl, {
                model: this.model,
                messages: allMessages,
                temperature: 0.3  // Slightly higher for chat to allow natural language variation
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('[Mistral] Chat Error:', error.message);
            throw error;
        }
    }
}

module.exports = new MistralService();
