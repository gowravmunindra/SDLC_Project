const Project = require('../models/Project');
const mistralService = require('./mistralService');
const progressService = require('./projectProgressService');

/**
 * Service for the AI Guide - an intelligent in-app assistant.
 */
class AIGuideService {
    /**
     * Get a contextual response from the AI Guide.
     */
    async getGuideResponse(projectId, userQuery) {
        let project = null;
        let progressReport = null;

        if (projectId && projectId !== 'null' && projectId !== 'undefined') {
            project = await Project.findById(projectId);
            if (project) {
                progressReport = await progressService.getProjectProgressReport(project);
            }
        }

        const hasMistralKey = process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 10;

        if (hasMistralKey) {
            return await this._getAIResponse(userQuery, progressReport, project);
        } else {
            return this._getFallbackResponse(userQuery, progressReport);
        }
    }

    /**
     * Generate intelligent response using Mistral.
     */
    async _getAIResponse(userQuery, report, project) {
        let relevantCodeContext = "";
        try {
            if (project && project.development && project.development.codeFiles) {
                const hasEmbeddings = project.development.codeFiles.some(f => f.embedding && f.embedding.length > 0);
                if (hasEmbeddings) {
                    const vectorSearch = require('../utils/vectorSearch');
                    console.log('[AIGuide RAG] Performing semantic chatbot search...');
                    const [queryEmbedding] = await mistralService.generateEmbeddings([userQuery]);
                    const topFiles = vectorSearch.searchSimilar(queryEmbedding, project.development.codeFiles, 3);
                    if (topFiles.length > 0) {
                        relevantCodeContext = "\n\nRELEVANT CODE SNIPPETS (Semantic RAG Match):\n" + topFiles.map(f => `--- ${f.path} ---\n${(f.code || '').slice(0, 800)}`).join('\n\n');
                    }
                }
            }
        } catch (e) {
            console.warn('[AIGuide RAG] Search failed:', e.message);
        }

        const systemPrompt = `You are the "AI Guide", a friendly, supportive, and brilliant software development mentor.
Your goal is to guide the user through the SDLC process with encouragement and technical expertise.

PROJECT CONTEXT:
${report ? `
- Project: **${report.project_name}**
- Progress: \`${report.overall_completion}\`
- Health: ${report.health_status === 'Healthy' ? '✅ Healthy' : '⚠️ Needs Attention'}
- Status: ${JSON.stringify(report.phase_progress)}
` : "No project is currently active."}${relevantCodeContext}

CORE BEHAVIOR:
1. **Friendly & Mentor-like**: Start with a warm greeting if it's the start of a conversation. Use a supportive tone.
2. **Clear Formatting**: Use Markdown lists (- or 1.), bold text (**), and code blocks (\`) to make your answers scannable.
3. **Action-Oriented**: Always suggest what the user should click or do next.
4. **Concise but Complete**: Don't ramble, but ensure the user understands the "Why" behind a suggestion.
5. **Emojis**: Use relevant emojis to make the interface feel alive (e.g., 🚀, 🏗️, 🎨, 🧪).

User Question: "${userQuery}"`;

        try {
            const messages = [
                { role: "system", content: "You are a friendly SDLC Mentor. Use Markdown for formatting. Be concise but helpful." },
                { role: "user", content: systemPrompt }
            ];
            const response = await mistralService.chat(messages);
            return response;
        } catch (error) {
            console.error('[AIGuideService] AI Error:', error.message);
            return this._getFallbackResponse(userQuery, report);
        }
    }

    /**
     * Fallback logic when API key is missing.
     */
    _getFallbackResponse(query, report) {
        const q = query.toLowerCase();

        // 1. Tool-specific questions
        if (q.includes('what is') || q.includes('how to use') || q.includes('feature')) {
            if (q.includes('requirements')) return "The Requirements phase helps you define what to build through descriptions and functional lists.";
            if (q.includes('design')) return "In the Design phase, I generate architectural layers and various UML diagrams like Class and Sequence.";
            if (q.includes('development') || q.includes('vibe')) return "Development uses 'Vibe Coding' to generate code and file structures from your natural language prompts.";
            if (q.includes('testing')) return "Testing generates relevant test cases based on your requirements and code to ensure quality.";
        }

        // 2. Project-state questions
        if (report) {
            if (q.includes('next') || q.includes('should i do')) {
                const phases = report.phase_progress;
                if (phases.requirements !== 'completed') return "You should finish the Requirements Phase next to set a solid foundation.";
                if (phases.design !== 'completed') return "Since requirements are set, proceed to the Design Phase to plan your architecture.";
                if (phases.development !== 'completed') return "Your design is ready. Start Vibe Coding in the Development Phase to build the solution.";
                if (phases.testing !== 'completed') return "Code is generated! Move to the Testing Phase to verify your work.";
                return "Your project is complete! You can download the ZIP or run a final Consistency Check.";
            }

            if (q.includes('ready') || q.includes('status')) {
                return `Your project "${report.project_name}" is currently at ${report.overall_completion} progress. ${report.health_status === 'Healthy' ? 'Everything looks good!' : 'I suggest reviewing the consistency report.'}`;
            }
        }

        // 3. Generic helper
        return "I'm your AI Guide. I can help with tool features, project status, and SDLC mentor ship. What specifically would you like to know?";
    }
}

module.exports = new AIGuideService();
