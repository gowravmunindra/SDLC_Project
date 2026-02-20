/**
 * Prompt Templates for Gemini API Integration
 * Each function returns a carefully crafted prompt for specific SDLC agents
 */

/**
 * Requirements Agent Prompt - OPTIMIZED FOR SPEED
 */
export const requirementsPrompt = (projectDescription) => {
  return `Act as a Senior Business Analyst. Analyze the following project description and generate a comprehensive Software Requirements Specification (SRS) in JSON format.

Project Name/Description: ${projectDescription}

STRICT QUALITY RULES:
1. DO NOT use generic titles like "Process" or "Task". Be specific to the project (e.g., "Automated Invoice Generation").
2. Descriptions must be detailed "The system shall..." statements.
3. Functional requirements should cover: User Management, Core Logic, Inter-module communication, and Data Persistence.

Return JSON with:
- functionalRequirements: array of {id, title, description, priority}
- nonFunctionalRequirements: {performance, security, usability, scalability, reliability} arrays
- stakeholders: array of {id, name, role}
- assumptions: array of {id, description}
- constraints: array of {id, description}

Aim for high-detail, professional-grade requirements.`
}

/**
 * Design Agent Prompt - OPTIMIZED FOR SPEED
 */
export const designPrompt = (requirements) => {
  const funcReqs = requirements?.functionalRequirements?.map(r => r.title).join(', ') || 'N/A'
  const desc = requirements?.projectDescription || ''

  return `Act as a Solution Architect. Design a high-level system architecture for a system with these requirements: ${funcReqs}
Context: ${desc}

STRICT QUALITY RULES:
1. Define a professional multi-tier or microservice architecture.
2. Layers must have specific responsibilities and technology suggestions.
3. Components should be logical units (e.g., "Auth Service", "Notification Engine", "Data Ingestion Pipeline").

Return JSON:
{
  "architecture": {"type": "type (e.g. Microservices)", "justification": "why", "layers": [{"name": "Layer Name", "description": "detailed desc", "technologies": ["tech1"], "responsibilities": ["resp1"]}]},
  "components": [{"id": "C-001", "name": "Component Name", "description": "desc", "responsibilities": [], "interfaces": [], "dependencies": []}],
  "diagrams": {
    "useCase": {"description": "desc", "actors": [{"id": "A-001", "name": "Actor Name", "description": "desc"}], "useCases": [{"id": "UC-001", "name": "Action Name", "actor": "Actor Name", "description": "desc"}]},
    "class": {"description": "desc", "classes": [{"id": "CL-001", "name": "Class Name", "attributes": [], "methods": [], "relationships": []}]},
    "sequence": {"description": "desc", "flows": [{"id": "SEQ-001", "name": "Flow Name", "description": "desc", "steps": []}]}
  },
  "databaseSchema": {"type": "relational/nosql", "justification": "reason", "tables": [{"id": "T-001", "name": "Table Name", "description": "desc", "columns": [{"name": "col", "type": "type", "constraints": "PK", "description": "desc"}], "indexes": [], "relationships": []}]}
}

Be detailed and professional.`
}

/**
 * Development Agent Prompt - OPTIMIZED FOR SPEED
 */
export const developmentPrompt = (requirements, design) => {
  const archType = design?.architecture?.type || 'web app'

  return `Generate development plan for ${archType}.

Return JSON:
{
  "techStack": {"frontend": [{"name": "React", "purpose": "UI", "why": "reason"}], "backend": [], "database": [], "devops": [], "testing": []},
  "folderStructure": [{"name": "root", "type": "folder", "description": "desc", "children": []}],
  "codeSnippets": [{"id": "CS-001", "title": "title", "language": "javascript", "description": "desc", "code": "code"}],
  "apiContracts": [{"id": "API-001", "endpoint": "POST /api/x", "description": "desc", "request": {}, "response": {"success": {}, "error": {}}}],
  "bestPractices": [{"category": "Category", "icon": "📁", "practices": []}]
}

Generate 2-3 items per category.`
}

/**
 * Testing Agent Prompt - REBUILT FOR STRUCTURED AI TEST DESIGN
 */
export const testingPrompt = (requirements, design) => {
  const funcReqs = requirements?.functionalRequirements?.map(r => `${r.id}: ${r.title} - ${r.description}`).join('\n') || 'N/A'
  const components = design?.components?.map(c => `${c.name}: ${c.description}`).join('\n') || 'N/A'
  const architecture = design?.architecture?.type || 'N/A'

  return `Act as a Senior QA Automation Engineer. Generate a professional Testing Plan for a system with these specs:

### REQUIREMENTS:
${funcReqs}

### SYSTEM DESIGN (${architecture}):
${components}

### INSTRUCTIONS:
1. **TEST STRATEGY**: Brief overview of Unit, Integration, and System testing.
2. **FUNCTIONAL TEST CASES**: Generate between **8 to 18** detailed test cases derived from requirements.
3. **EDGE CASES**: Generate exactly **5 to 6** high-priority edge cases (boundary conditions, null inputs, failure scenarios).
4. **CONCISENESS**: Keep descriptions and steps brief but clear to ensure fast processing.

### OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "testStrategy": {
    "overview": "Workflow overview...",
    "testLevels": [
      {
        "level": "Unit Testing",
        "description": "Short desc",
        "coverage": "80%",
        "tools": ["Jest"],
        "when": "Dev"
      }
    ]
  },
  "testCases": [
    {
      "id": "TC-001",
      "moduleName": "Module",
      "description": "What is tested",
      "preconditions": "Setup",
      "testSteps": ["Step 1", "Step 2"],
      "expectedResult": "Success"
    }
  ],
  "edgeCases": [
    {
      "id": "EC-001",
      "category": "Boundary",
      "scenario": "Scenario name",
      "testData": "Input data",
      "expectedBehavior": "How it handles it"
    }
  ]
}

STRICT RULE: No text outside JSON. Be concise.`
}

/**
 * Chatbot Prompt
 */
export const chatbotPrompt = (userMessage, conversationHistory = [], currentPhase = null) => {
  const historyText = conversationHistory.map(msg =>
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
  ).join('\n')

  let phaseContext = ''
  if (currentPhase) {
    phaseContext = `\nThe user is currently in the **${currentPhase} Phase** of the SDLC process.`
  }

  return `You are an AI SDLC Guide - a friendly, knowledgeable assistant helping users understand software development concepts and navigate the SDLC platform.

**Your Role**:
- Explain SDLC concepts in simple, understandable terms
- Guide users through the platform workflow
- Answer questions about requirements, design, development, testing
- Share best  practices and tips
- Be encouraging and supportive

**Conversation Context**:${phaseContext}

**Previous Conversation**:
${historyText || 'No previous conversation'}

**User Question**:
${userMessage}

**Instructions**:
1. Provide a helpful, conversational response
2. Use emojis for visual appeal (but not excessively)
3. Format with **bold** for emphasis where appropriate
4. Break complex topics into bullet points
5. Be concise but thorough
6. If you don't know something, admit it and suggest alternatives
7. Stay focused on SDLC and software development topics

**Response** (plain text, formatted with markdown):`
}

export default {
  requirementsPrompt,
  designPrompt,
  developmentPrompt,
  testingPrompt,
  chatbotPrompt
}
