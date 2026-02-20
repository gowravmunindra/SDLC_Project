const path = require("path");

let getLlama;
let LlamaChatSession;

let model;
let context;
let llama;
let persistentSequence; // Single reusable sequence

const modelPath = path.resolve(__dirname, "../../../models/Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf");

const initializeLlama = async () => {
    try {
        if (model) return;

        console.log("Loading node-llama-cpp...");
        const llamaModule = await import("node-llama-cpp");
        getLlama = llamaModule.getLlama;
        LlamaChatSession = llamaModule.LlamaChatSession;

        console.log("Loading Qwen2.5-Coder model from:", modelPath);
        llama = await getLlama();

        // SPEED-OPTIMIZED: Aggressive settings for <10 second responses
        model = await llama.loadModel({
            modelPath: modelPath,
            gpuLayers: 40,     // Reduced from 99 to prevent VRAM crashes
            useMmap: true,     // ENABLED: Faster memory access
            useMlock: false    // Keep disabled for Windows compatibility
        });

        // STABLE: 3072 is enough for most code, reduced to prevent OOM crashes
        context = await model.createContext({
            contextSize: 3072,
            threads: 8,
            batchSize: 512,
            flashAttention: false // Disabled for better stability on Windows
        });

        // Create ONE persistent sequence - avoids sequence creation overhead
        persistentSequence = context.getSequence();

        console.log("Qwen2.5-Coder model loaded successfully (STABLE MODE)");
    } catch (error) {
        console.error("Failed to load Llama model:", error);
    }
};

// Resource Management: Sequential queue for local LLM processing
let processingQueue = Promise.resolve();

const generateContent = async (prompt) => {
    return processingQueue = processingQueue.then(async () => {
        if (!model || !context) {
            console.log("[llmService] Context missing, initializing...");
            await initializeLlama();
        }

        if (!context || !persistentSequence) {
            throw new Error("Local LLM failed to initialize context. Check model path and VRAM.");
        }

        let tempSession = null;

        try {
            console.log(`[llmService] Generating content for prompt (${prompt.length} chars)...`);
            // Reuse persistent sequence - MUCH faster than creating new ones
            tempSession = new LlamaChatSession({
                contextSequence: persistentSequence
            });

            // SPEED-OPTIMIZED: Aggressive limits
            let response = await tempSession.prompt(prompt, {
                maxTokens: 3000,       // Large limit for full file code generation
                temperature: 0.1,      // Very low for fast generation
                topP: 0.9,
                topK: 40
            });

            // 2. REFUSAL DETECTION & RECOVERY
            const isRefusal = response.toLowerCase().startsWith("i'm sorry") ||
                response.toLowerCase().includes("cannot assist") ||
                response.length < 50;

            if (isRefusal) {
                console.warn("[llmService] AI Refusal detected, attempting recovery...");
                const recoveryPrompt = `REQUEST: ${prompt.substring(0, 300)}...
OBJECTIVE: Pure technical architectural specification.
FORMAT: Valid technical code only. No conversational preamble.
Produce the requested logic immediately:`;

                response = await tempSession.prompt(recoveryPrompt, {
                    maxTokens: 3000,
                    temperature: 0.2
                });
            }

            return response;
        } catch (error) {
            console.error('[generateContent] Error:', error.message);
            throw error;
        } finally {
            // Only dispose session, keep sequence alive
            if (tempSession) {
                try {
                    await tempSession.dispose();
                } catch (e) {
                    console.warn('[generateContent] Session dispose error:', e.message);
                }
            }
        }
    });
};

const chat = async (messages) => {
    return processingQueue = processingQueue.then(async () => {
        if (!context) await initializeLlama();

        let tempSession = null;

        try {
            console.log(`[llmService] Processing chat...`);
            tempSession = new LlamaChatSession({
                contextSequence: persistentSequence
            });

            const lastMsg = messages[messages.length - 1];

            const response = await tempSession.prompt(lastMsg.parts || lastMsg.content, {
                maxTokens: 400,    // Increased from 100 for better responses
                temperature: 0.1,
                topP: 0.9,
                topK: 40
            });

            return response;
        } catch (error) {
            console.error('[chat] Error:', error.message);
            throw error;
        } finally {
            if (tempSession) {
                try {
                    await tempSession.dispose();
                } catch (e) {
                    console.warn('[chat] Session dispose error:', e.message);
                }
            }
        }
    });
};

const generateJSON = async (prompt) => {
    return processingQueue = processingQueue.then(async () => {
        if (!context) await initializeLlama();

        let tempSession = null;
        let response;

        try {
            console.log(`[llmService] Generating JSON...`);
            tempSession = new LlamaChatSession({
                contextSequence: persistentSequence
            });


            // More explicit JSON instruction
            const jsonPrompt = `${prompt}

IMPORTANT: Respond with ONLY valid JSON. No explanations, no markdown, just pure JSON.
Start with { and end with }. Ensure all strings are properly quoted and terminated.`;

            response = await tempSession.prompt(jsonPrompt, {
                maxTokens: 2500,       // Increased to allow full requirements and testing generation
                temperature: 0.1,      // Very low for consistent JSON
                topP: 0.9,
                topK: 40
            });
        } catch (error) {
            console.error('[generateJSON] Error:', error.message);
            throw error;
        } finally {
            if (tempSession) {
                try {
                    await tempSession.dispose();
                } catch (e) {
                    console.warn('[generateJSON] Session dispose error:', e.message);
                }
            }
        }

        // Advanced JSON cleaning and fixing
        let jsonText = response.trim();

        // Remove markdown code blocks
        if (jsonText.includes('```')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }

        // Remove any text before first { or [
        const firstBrace = jsonText.indexOf('{');
        const firstBracket = jsonText.indexOf('[');
        let startIndex = -1;

        if (firstBrace !== -1 && firstBracket !== -1) {
            startIndex = Math.min(firstBrace, firstBracket);
        } else if (firstBrace !== -1) {
            startIndex = firstBrace;
        } else if (firstBracket !== -1) {
            startIndex = firstBracket;
        }

        if (startIndex > 0) {
            jsonText = jsonText.substring(startIndex);
        }

        // Try parsing original
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            console.warn("JSON Parse failed, attempting to fix...", e.message);
            console.log("Problematic JSON:", jsonText.substring(0, 200));

            let fixed = jsonText;

            // Fix 1: Remove any trailing incomplete text after last } or ]
            const lastBrace = fixed.lastIndexOf('}');
            const lastBracket = fixed.lastIndexOf(']');
            const lastIndex = Math.max(lastBrace, lastBracket);

            if (lastIndex > 0 && lastIndex < fixed.length - 1) {
                fixed = fixed.substring(0, lastIndex + 1);
            }

            // Fix 2: Try to fix unterminated strings by finding and closing them
            // This is a simple heuristic - find lines with odd number of quotes
            const lines = fixed.split('\n');
            fixed = lines.map(line => {
                const quoteCount = (line.match(/"/g) || []).length;
                // If odd number of quotes, add a closing quote before any trailing comma or brace
                if (quoteCount % 2 !== 0) {
                    line = line.replace(/([^"])(\s*[,}\]])/, '$1"$2');
                }
                return line;
            }).join('\n');

            // Fix 3: Add missing closing braces/brackets
            const openBraces = (fixed.match(/{/g) || []).length;
            const closeBraces = (fixed.match(/}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;

            for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                fixed += ']';
            }
            for (let i = 0; i < (openBraces - closeBraces); i++) {
                fixed += '}';
            }

            // Try parsing fixed version
            try {
                return JSON.parse(fixed);
            } catch (finalError) {
                console.error("Failed to fix JSON", finalError);
                console.log("Final attempted JSON:", fixed.substring(0, 300));

                // Last resort: return a minimal valid structure
                console.warn("Returning fallback empty structure");
                return {
                    functionalRequirements: [],
                    nonFunctionalRequirements: {
                        performance: [],
                        security: [],
                        usability: [],
                        scalability: [],
                        reliability: []
                    },
                    stakeholders: [],
                    assumptions: [],
                    constraints: []
                };
            }
        }
    });
};

// ALIAS: Ensure compatibility with freeLlmService interface
const generate = generateContent;

module.exports = {
    initializeLlama,
    generateContent,
    generate,
    chat,
    generateJSON
};
