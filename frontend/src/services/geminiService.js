import axios from 'axios'

// Reuse the API URL logic from apiService or defaulting
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Helper to get token if needed (assuming public AI for now or token in localStorage)
const getHeaders = () => {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

class LocalLLMService {
    constructor() {
        this.baseUrl = `${API_URL}/ai`
    }

    /**
     * Generate content from a prompt using local model
     * @param {string} prompt 
     * @param {boolean} forceLocal
     * @returns {Promise<string>}
     */
    async generateContent(prompt, forceLocal = false) {
        try {
            console.log(`[LocalLLMService] Requesting content (prompt: ${prompt.length} chars, forceLocal: ${forceLocal})...`);
            const response = await axios.post(`${this.baseUrl}/generate`,
                { prompt, forceLocal },
                {
                    headers: getHeaders(),
                    timeout: 300000 // 5 minutes for local model processing
                }
            )
            return response.data.text
        } catch (error) {
            const serverMsg = error.response?.data?.message || '';
            if (serverMsg.includes('Rate limit')) {
                console.warn('[LocalLLMService] Server-side rate limit detected. Retrying might be handled by backend queue.');
            }
            console.error('Local LLM Error:', error)
            throw new Error(serverMsg || error.message)
        }
    }

    /**
     * Generate structured JSON content using local model
     * @param {string} prompt 
     * @param {number} maxRetries 
     * @param {boolean} forceLocal
     * @returns {Promise<object>}
     */
    async generateJSON(prompt, maxRetries = 2, forceLocal = false) {
        // The backend handles JSON parsing/cleaning now, but we can retry here if needed.
        // For now, let's trust the backend or implement simple retry.
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const response = await axios.post(`${this.baseUrl}/generate-json`,
                    { prompt, forceLocal },
                    { headers: getHeaders(), timeout: 300000 } // 5 mins for local
                )
                return response.data
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed:`, error.message)
                if (i === maxRetries) throw error
                await new Promise(r => setTimeout(r, 1000))
            }
        }
    }

    /**
     * Chat with history
     * @param {Array} messages 
     * @param {boolean} forceLocal
     * @returns {Promise<string>}
     */
    async chat(messages, forceLocal = false) {
        try {
            const response = await axios.post(`${this.baseUrl}/chat`, { messages, forceLocal }, { headers: getHeaders() })
            return response.data.text
        } catch (error) {
            console.error('Local LLM Chat Error:', error)
            throw new Error(error.response?.data?.message || error.message)
        }
    }

    /**
     * Stream content (Shim for compatibility, non-streaming)
     * @param {string} prompt 
     * @param {function} onChunk 
     * @returns {Promise<string>}
     */
    async generateContentStream(prompt, onChunk) {
        const text = await this.generateContent(prompt)
        if (onChunk) onChunk(text)
        return text
    }
}

export const geminiService = new LocalLLMService()
export default geminiService
