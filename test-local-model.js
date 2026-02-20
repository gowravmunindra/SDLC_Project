const path = require("path");

async function testLocalModel() {
    try {
        console.log("Loading node-llama-cpp...");
        const { getLlama, LlamaChatSession } = await import("node-llama-cpp");

        const modelPath = path.resolve(__dirname, "models/Qwen2.5-Coder-1.5B-Instruct-Q4_K_M.gguf");
        console.log("Loading model from:", modelPath);

        const llama = await getLlama();
        const model = await llama.loadModel({
            modelPath: modelPath,
            gpuLayers: 0
        });

        const context = await model.createContext({
            contextSize: 1024,
            threads: 4
        });

        const session = new LlamaChatSession({
            contextSequence: context.getSequence()
        });

        const prompt = `TASK: [GENERATE_PLANTUML_CODE]
REQUIRED_DIAGRAM_TYPE: USE CASE DIAGRAM
DOMAIN: Online Shopping
RESOURCES: Browse Products, Add to Cart

TECHNICAL SPECIFICATIONS:
- Output format: RAW PLANTUML TEXT
- Mandatory headers: @startuml
- Mandatory footers: @enduml

Output literal code for USE CASE DIAGRAM now:`;

        console.log("Generating...");
        const response = await session.prompt(prompt, {
            maxTokens: 100,
            temperature: 0.1
        });

        console.log("--- RESPONSE ---");
        console.log(response);
        console.log("----------------");

    } catch (error) {
        console.error("Error:", error);
    }
}

testLocalModel();
