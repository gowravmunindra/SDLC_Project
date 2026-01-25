import { HfInference } from '@huggingface/inference'

// Initialize Hugging Face API
const API_KEY = import.meta.env.VITE_HF_API_KEY
const hf = new HfInference(API_KEY)

/**
 * Hugging Face Service - AI service using free HF models
 * Supports: Mixtral, Llama, Qwen, and other open models
 */
class HuggingFaceService {
    constructor() {
        // Using Qwen2.5-72B-Instruct - excellent free model for generation
        // Alternatives: 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'meta-llama/Meta-Llama-3.1-8B-Instruct'
        this.model = 'Qwen/Qwen2.5-72B-Instruct'
        this.maxTokens = 4096
    }

    /**
     * Generate content from a prompt
     * @param {string} prompt - The prompt to send to HF
     * @returns {Promise<string>} - The generated text response
     */
    async generateContent(prompt) {
        try {
            if (!API_KEY || API_KEY === 'your_hf_api_key_here' || API_KEY === '') {
                throw new Error('Hugging Face API key not configured. Please add your API key to the .env file.')
            }

            let fullResponse = ''
            
            const stream = await hf.chatCompletionStream({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: 0.7,
                top_p: 0.95,
            })

            for await (const chunk of stream) {
                if (chunk.choices && chunk.choices.length > 0) {
                    const content = chunk.choices[0].delta.content
                    if (content) {
                        fullResponse += content
                    }
                }
            }

            return fullResponse
        } catch (error) {
            console.error('Hugging Face API Error:', error)
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
                
                // Extract JSON from response
                let jsonText = text.trim()
                
                // Remove markdown code blocks if present
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim()
                } else if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```\n?/g, '').trim()
                }
                
                // Find JSON object in response (in case there's extra text)
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    jsonText = jsonMatch[0]
                }
                
                // Try to parse the JSON
                try {
                    const jsonData = JSON.parse(jsonText)
                    return jsonData
                } catch (parseError) {
                    console.warn(`JSON parse attempt ${attempt + 1} failed, trying to fix...`)
                    
                    // Try to fix incomplete JSON
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
                        await new Promise(resolve => setTimeout(resolve, 1000))
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
     * Chat with conversation history
     * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
     * @returns {Promise<string>} - The response text
     */
    async chat(messages) {
        try {
            if (!API_KEY || API_KEY === 'your_hf_api_key_here' || API_KEY === '') {
                throw new Error('Hugging Face API key not configured.')
            }

            let fullResponse = ''
            
            const stream = await hf.chatCompletionStream({
                model: this.model,
                messages: messages,
                max_tokens: this.maxTokens,
                temperature: 0.7,
                top_p: 0.95,
            })

            for await (const chunk of stream) {
                if (chunk.choices && chunk.choices.length > 0) {
                    const content = chunk.choices[0].delta.content
                    if (content) {
                        fullResponse += content
                    }
                }
            }

            return fullResponse
        } catch (error) {
            console.error('Hugging Face Chat Error:', error)
            throw new Error(`Failed to chat: ${error.message}`)
        }
    }
}

// Export singleton instance
export const huggingFaceService = new HuggingFaceService()
export default huggingFaceService
