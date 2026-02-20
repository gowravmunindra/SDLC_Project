import geminiService from './geminiService'

// Since we are replacing all API code with the local model, 
// HuggingFaceService can just be an alias to the unified LocalLLMService (which we put in geminiService.js for compatibility).
// Or we can duplicate the logic. Aliasing is cleaner.

export const huggingFaceService = geminiService
export default huggingFaceService
