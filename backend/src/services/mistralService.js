const axios = require('axios');

class MistralService {
    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.baseUrl = "https://api.mistral.ai/v1/chat/completions";
        this.model = "mistral-large-latest"; // Using large for high-quality SDLC outputs
    }

    /**
     * Reusable function to send prompts to Mistral
     */
    async generate(prompt, isJson = false) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('MISTRAL_API_KEY is not configured in backend/.env');
        }

        try {
            console.log(`[MistralService] Generating content (Type: ${isJson ? 'JSON' : 'Text'})...`);

            const payload = {
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1 // Low temperature for consistent SDLC outputs
            };

            if (isJson) {
                payload.response_format = { type: "json_object" };
            }

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 180000 // 3 minutes timeout
            });

            const content = response.data.choices[0].message.content;

            if (isJson) {
                try {
                    return JSON.parse(content);
                } catch (parseError) {
                    console.error('[MistralService] JSON Parse Error:', parseError.message);
                    // Attempt to extract JSON if it was wrapped in markdown
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    throw new Error("Failed to parse JSON response from Mistral");
                }
            }

            return content;
        } catch (error) {
            console.error('[MistralService] Error:', error.response?.data || error.message);
            const status = error.response?.status;
            if (status === 401) throw new Error('Invalid Mistral API Key');
            if (status === 429) throw new Error('Mistral Rate limit exceeded');
            throw new Error(`Mistral API failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Alias for compatibility with existing code
     */
    async generateContent(prompt) {
        return this.generate(prompt, false);
    }

    /**
     * Specific method for JSON responses
     */
    async generateJSON(prompt) {
        return this.generate(prompt, true);
    }

    /**
     * Chat method for conversational interactions
     */
    async chat(messages) {
        if (!this.apiKey) {
            throw new Error('MISTRAL_API_KEY is not configured');
        }

        try {
            const response = await axios.post(this.baseUrl, {
                model: this.model,
                messages: messages,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('[MistralService] Chat Error:', error.message);
            throw error;
        }
    }
}

module.exports = new MistralService();
