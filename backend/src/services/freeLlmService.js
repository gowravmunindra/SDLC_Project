const axios = require('axios');
let llmService = null;
try { llmService = require('./llmService'); } catch (e) { /* local LLM optional */ }

class FreeLlmService {
    constructor() {
        this.apiKey = process.env.LLM_API_KEY;
        this.baseUrl = "https://apifreellm.com/api/v1/chat";
        this.lastRequestTime = 0;
        this.minInterval = 31000; // 31s rate limit for external API
        this.processingQueue = Promise.resolve(); // Queue for sequential processing

        if (this.apiKey) {
            console.log(`[FreeLlmService] API Key loaded (length: ${this.apiKey.length})`);
        } else {
            console.error('[FreeLlmService] NO API KEY FOUND IN ENV!');
        }
    }

    async _waitForRateLimit() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.minInterval) {
            const wait = this.minInterval - timeSinceLast;
            console.log(`[FreeLlmService] Rate limiting active: queued request must wait ${Math.ceil(wait / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        this.lastRequestTime = Date.now();
    }

    async generate(prompt) {
        // Enforce sequential execution across all calls to this service
        return this.processingQueue = this.processingQueue.then(async () => {
            try {
                // Check if API Key is configured for development
                if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey.includes('your_actual_key')) {
                    console.warn('[FreeLlmService] No external API key found.');
                    if (llmService) {
                        console.log('[FreeLlmService] Falling back to local LLM...');
                        return await llmService.generateContent(prompt);
                    }
                    throw new Error('No LLM API key configured. Please add LLM_API_KEY to backend/.env');
                }

                await this._waitForRateLimit();

                console.log('[FreeLlmService] Making API request to:', this.baseUrl);
                const response = await axios.post(this.baseUrl, {
                    message: prompt,
                    model: "apifreellm"
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 180000 // Increased to 180 seconds for large projects
                });

                console.log('[FreeLlmService] Response status:', response.status);
                console.log('[FreeLlmService] Response data keys:', Object.keys(response.data || {}));

                // Handle different response formats
                let textContent = null;

                if (response.data) {
                    // Try different possible response formats
                    textContent = response.data.text ||
                        response.data.response ||
                        response.data.content ||
                        response.data.message ||
                        (typeof response.data === 'string' ? response.data : null);
                }

                if (!textContent) {
                    console.error('[FreeLlmService] Unexpected response format:', response.data);
                    throw new Error("Invalid response format from external LLM API");
                }

                console.log('[FreeLlmService] Successfully extracted text, length:', textContent.length);
                return textContent;
            } catch (error) {
                const statusCode = error.response?.status;
                const errorMsg = error.response?.data?.error || error.message;

                console.error('[FreeLlmService] External API failed');
                console.error('  Status:', statusCode);
                console.error('  URL:', this.baseUrl);
                console.error('  Prompt Length:', prompt.length);
                console.error('  Error:', errorMsg);

                if (statusCode === 401) {
                    throw new Error('Invalid API key. Please check your LLM_API_KEY in backend/.env');
                } else if (statusCode === 429) {
                    throw new Error('Rate limit exceeded. Please wait 30 seconds before trying again.');
                }

                if (llmService) {
                    console.log('[FreeLlmService] Falling back to local LLM...');
                    return await llmService.generateContent(prompt);
                }
                throw new Error(`External LLM API failed (${statusCode || 'network error'}): ${errorMsg}`);
            }
        });
    }

    async generateJSON(prompt) {
        try {
            console.log(`[FreeLlmService] Generating JSON content... Prompt length: ${prompt.length}`);
            const raw = await this.generate(prompt);

            if (!raw) throw new Error("Received empty response from AI");

            // Advanced Cleaning for JSON
            let clean = raw.trim();

            // 1. Remove markdown code blocks if present
            clean = clean.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

            // 2. Extract content between first { and last }
            const firstBrace = clean.indexOf('{');
            const lastBrace = clean.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
                console.error('[FreeLlmService] No JSON object found. Raw response snippet:', raw.substring(0, 150));
                throw new Error("AI responded with text but no JSON object was detected.");
            }

            clean = clean.substring(firstBrace, lastBrace + 1);

            // 3. Try parsing
            try {
                const parsed = JSON.parse(clean);
                console.log('[FreeLlmService] JSON parsed successfully');
                return parsed;
            } catch (parseError) {
                console.error('[FreeLlmService] JSON Parse failed. Cleaned text snippet:', clean.substring(0, 150));

                // Attempt recovery: replace escaped newlines and verify structure
                const semiFixed = clean
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '\"')
                    .replace(/\\t/g, '\t');

                try {
                    return JSON.parse(semiFixed);
                } catch (e) {
                    throw new Error(`AI generated malformed JSON: ${parseError.message}`);
                }
            }
        } catch (error) {
            console.error('[FreeLlmService] JSON generation failed:', error.message);

            // If it's a 401/429, don't fallback to local
            if (error.message.includes('API key') || error.message.includes('Rate limit') || error.message.includes('LLM_API_KEY')) {
                throw error;
            }

            if (llmService) {
                console.log('[FreeLlmService] Falling back to local LLM for JSON...');
                return await llmService.generateJSON(prompt);
            }
            throw error;
        }
    }
}

module.exports = new FreeLlmService();
