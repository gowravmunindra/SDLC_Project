import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

/**
 * Gemini Service - Centralized service for all Gemini API interactions
 */
class GeminiService {
    constructor() {
        // Using gemini-2.5-flash - current fast model (2026)
        // This is the latest Gemini model optimized for speed and efficiency
        this.model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 16384, // Increased for complex JSON responses
            }
        })
    }

    /**
     * Generate content from a prompt
     * @param {string} prompt - The prompt to send to Gemini
     * @returns {Promise<string>} - The generated text response
     */
    async generateContent(prompt) {
        try {
            if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY === '') {
                throw new Error('Gemini API key not configured. Please add your API key to the .env file.')
            }

            const result = await this.model.generateContent(prompt)
            const response = await result.response
            const text = response.text()
            return text
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error(`Failed to generate content: ${error.message}`)
        }
    }

    /**
     * Generate structured JSON content
     * @param {string} prompt - The prompt requesting JSON output
     * @param {number} maxRetries - Number of retry attempts
     * @returns {Promise<object>} - Parsed JSON response
     */
    async generateJSON(prompt, maxRetries = 2) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const text = await this.generateContent(prompt)
                
                // Extract JSON from response (handle cases where AI wraps JSON in markdown)
                let jsonText = text.trim()
                
                // Remove markdown code blocks if present
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim()
                } else if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```\n?/g, '').trim()
                }
                
                // Try to parse the JSON
                try {
                    const jsonData = JSON.parse(jsonText)
                    return jsonData
                } catch (parseError) {
                    // If JSON is incomplete, try to fix common issues
                    console.warn(`JSON parse attempt ${attempt + 1} failed, trying to fix...`)
                    
                    // Try to fix incomplete JSON by adding closing braces
                    let fixed = jsonText
                    const openBraces = (fixed.match(/{/g) || []).length
                    const closeBraces = (fixed.match(/}/g) || []).length
                    const openBrackets = (fixed.match(/\[/g) || []).length
                    const closeBrackets = (fixed.match(/\]/g) || []).length
                    
                    // Add missing closing braces/brackets
                    for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                        fixed += ']'
                    }
                    for (let i = 0; i < (openBraces - closeBraces); i++) {
                        fixed += '}'
                    }
                    
                    try {
                        const jsonData = JSON.parse(fixed)
                        console.log('✅ Successfully fixed incomplete JSON')
                        return jsonData
                    } catch (fixError) {
                        if (attempt === maxRetries) {
                            throw new Error(`Failed to parse JSON after ${maxRetries + 1} attempts: ${parseError.message}`)
                        }
                        console.log(`Retry attempt ${attempt + 1}/${maxRetries}...`)
                        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
                    }
                }
            } catch (error) {
                if (attempt === maxRetries) {
                    console.error('JSON generation error:', error)
                    throw new Error(`Failed to generate/parse JSON response: ${error.message}`)
                }
                console.log(`Retry attempt ${attempt + 1}/${maxRetries} due to error...`)
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
    }

    /**
     * Generate content with streaming (for real-time updates)
     * @param {string} prompt - The prompt to send
     * @param {function} onChunk - Callback for each chunk of text
     * @returns {Promise<string>} - Complete generated text
     */
    async generateContentStream(prompt, onChunk) {
        try {
            if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY === '') {
                throw new Error('Gemini API key not configured. Please add your API key to the .env file.')
            }

            const result = await this.model.generateContentStream(prompt)
            let fullText = ''

            for await (const chunk of result.stream) {
                const chunkText = chunk.text()
                fullText += chunkText
                if (onChunk) {
                    onChunk(chunkText)
                }
            }

            return fullText
        } catch (error) {
            console.error('Gemini Streaming Error:', error)
            throw new Error(`Failed to stream content: ${error.message}`)
        }
    }

    /**
     * Chat with conversation history
     * @param {Array} messages - Array of {role: 'user'|'model', parts: string}
     * @returns {Promise<string>} - The response text
     */
    async chat(messages) {
        try {
            if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY === '') {
                throw new Error('Gemini API key not configured. Please add your API key to the .env file.')
            }

            const chat = this.model.startChat({
                history: messages.slice(0, -1), // All messages except the last
                generationConfig: {
                    maxOutputTokens: 2048,
                },
            })

            const lastMessage = messages[messages.length - 1]
            const result = await chat.sendMessage(lastMessage.parts)
            const response = await result.response
            return response.text()
        } catch (error) {
            console.error('Gemini Chat Error:', error)
            throw new Error(`Failed to chat: ${error.message}`)
        }
    }
}

// Export singleton instance
export const geminiService = new GeminiService()
export default geminiService
