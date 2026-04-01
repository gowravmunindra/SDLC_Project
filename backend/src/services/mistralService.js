const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT  — injected as a "system" role message on every API call.
// This primes the model to behave as a professional senior developer.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a world-class senior software engineer and architect with 15+ years of experience building production-grade web applications.

Your core competencies:
• React 18 + Vite 5 + React Router 6 (frontend)
• Node.js 18 + Express 4 + Mongoose 8 + MongoDB (backend)
• JWT authentication, bcryptjs, helmet, cors, morgan
• Clean architecture, separation of concerns, DRY principles
• Modern ES6+ JavaScript / JSX syntax
• Professional CSS with custom properties, Flexbox, and CSS Grid

Your professional standards (non-negotiable):
1. Every function and component you write is FULLY IMPLEMENTED — no TODOs, no stubs.
2. All imports resolve to real files — you never reference a path that doesn't exist.
3. Code is syntactically valid and runs without modification.
4. You use ONLY the pinned dependency versions specified in the prompt.
5. You follow consistent naming conventions and clean code structure.
6. Your CSS creates polished, professional interfaces — never unstyled raw HTML.
7. You handle errors properly: try/catch in async functions, loading/error states in React.
8. You NEVER wrap code responses in markdown fences (\`\`\`) unless specifically asked.
9. When asked for JSON, you return only the raw JSON object — no prose, no explanation.
10. When asked for source code, you return only the source code — nothing else.

Treat every task as if a real user will download your output, run npm install, and expect it to work immediately.`;

class MistralService {
    constructor() {
        this.apiKey  = process.env.MISTRAL_API_KEY;
        this.baseUrl = 'https://api.mistral.ai/v1/chat/completions';
        this.model   = 'mistral-large-latest';
    }

    /**
     * Core generation method.
     * Always sends a system prompt + user prompt for maximum quality.
     */
    async generate(prompt, isJson = false, modelOverride = null, timeout = 900000) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('MISTRAL_API_KEY is not configured in backend/.env');
        }

        try {
            console.log(`[Mistral] Generating ${isJson ? 'JSON' : 'text'} response using ${modelOverride || this.model}...`);

            const payload = {
                model: modelOverride || this.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: prompt }
                ],
                // Consistent, deterministic, professional output
                temperature: 0.1,
                // Higher limit for large codebases (Mistral Large 2 supports 128k, but 20k is a safe large value for our API layer)
                max_tokens: 20000
            };

            if (isJson) {
                payload.response_format = { type: 'json_object' };
            }

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: timeout
            });

            const content = response.data.choices[0].message.content;

            if (isJson) {
                let parsedContent = null;
                try {
                    parsedContent = JSON.parse(content);
                } catch (parseError) {
                    console.error('[Mistral] JSON parse failed, attempting extraction/repair...');
                    
                    // 1. Attempt regex extraction for a complete JSON object
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            parsedContent = JSON.parse(jsonMatch[0]);
                        } catch (e) {
                            // 2. If regex match fails to parse (e.g. cut off), try aggressive repair
                            parsedContent = this.fixMalformedJson(jsonMatch[0]);
                        }
                    } else {
                        // 3. No braces found? Try repair on the original string
                        parsedContent = this.fixMalformedJson(content);
                    }
                }

                if (!parsedContent) {
                    console.error('[Mistral] Repair failed. Tail of broken response:', content.slice(-300));
                    throw new Error('Mistral returned malformed JSON that could not be repaired.');
                }
                console.log('[Mistral] Advanced repair successful.');
                return parsedContent;
            }

            return content;

        } catch (error) {
            const status = error.response?.status;
            const msg    = error.response?.data?.message || error.message;

            console.error(`[Mistral] Error (HTTP ${status || 'N/A'}):`, msg);

            // Handle specific status codes
            if (status === 401) throw new Error('Invalid Mistral API Key. Check your MISTRAL_API_KEY in backend/.env');
            if (status === 429) throw new Error('Mistral rate limit exceeded. Wait 30 seconds and try again.');
            if (status === 413) throw new Error('Request too large for this model. Reduce prompt size.');

            // Connection/Timeout issues
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Network Error')) {
                throw new Error('Network error or Mistral timeout. Ensure backend has internet access and try again.');
            }

            throw new Error(`AI Engine error: ${msg}`);
        }
    }

    /**
     * Robust Utility to fix common JSON errors from LLMs (unterminated strings, missing braces)
     */
    fixMalformedJson(str) {
        if (!str || typeof str !== 'string') return null;
        
        try {
            let cleaned = str.trim();
            
            // 1. Extract JSON block if surrounded by prose
            const firstBrace = cleaned.indexOf('{');
            const firstBracket = cleaned.indexOf('[');
            
            let startIndex = -1;
            if (firstBrace !== -1 && firstBracket !== -1) {
                startIndex = Math.min(firstBrace, firstBracket);
            } else {
                startIndex = firstBrace !== -1 ? firstBrace : firstBracket;
            }
            
            if (startIndex === -1) return null;
            cleaned = cleaned.slice(startIndex);
            
            // 3. Count braces/brackets and handle strings
            let stack = [];
            let inString = false;
            let escaped = false;
            let result = "";
            let bookmarks = []; // Record stack state at each potential truncation point
            
            for (let i = 0; i < cleaned.length; i++) {
                const char = cleaned[i];
                
                if (escaped) {
                    result += char;
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    result += char;
                    escaped = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    result += char;
                    continue;
                }
                
                result += char;
                
                if (!inString) {
                    if (char === '{' || char === '[') {
                        stack.push(char === '{' ? '}' : ']');
                        bookmarks.push({ pos: result.length, stack: [...stack] });
                    } else if (char === '}' || char === ']') {
                        if (stack.length > 0 && stack[stack.length - 1] === char) {
                            stack.pop();
                            bookmarks.push({ pos: result.length, stack: [...stack] });
                        }
                    } else if (char === ',') {
                        bookmarks.push({ pos: result.length, stack: [...stack] });
                    }
                }
            }
            
            // 4. If cut off mid-string, close the string
            if (inString) {
                if (result.endsWith('\\')) result = result.slice(0, -1);
                result += '"';
            }
            
            // 5. Advanced Truncation: If the JSON is invalid, backtrack to the last stable comma or brace
            try {
                // Try parsing what we have first (after closing everything)
                let tempResult = result;
                let tempStack = [...stack];
                while (tempStack.length > 0) tempResult += tempStack.pop();
                return JSON.parse(tempResult);
            } catch (e) {
                // Parsing failed, let's backtrack using our bookmarks
                console.warn('[Mistral] Standard repair failed, backtracking to last stable point...');
                for (let i = bookmarks.length - 1; i >= 0; i--) {
                    const mark = bookmarks[i];
                    let cutResult = result.slice(0, mark.pos);
                    // Remove trailing comma if it's the last char
                    if (cutResult.endsWith(',')) cutResult = cutResult.slice(0, -1);
                    
                    let cutStack = [...mark.stack];
                    // If we removed a comma, the stack state is already correct from the bookmark
                    // If we are at an opening brace, we need to backtrack even further or close it empty
                    
                    let finalTry = cutResult;
                    const reversedStack = [...cutStack].reverse();
                    reversedStack.forEach(brace => finalTry += brace);
                    
                    try {
                        const parsed = JSON.parse(finalTry);
                        console.log(`[Mistral] Backtrack success at bookmark ${i}`);
                        return parsed;
                    } catch (err) {
                        continue;
                    }
                }
            }
            
            return null;
        } catch (e) {
            console.error('[Mistral] Aggressive repair failed:', e.message);
            return null;
        }
    }

    /** Alias for text generation (backward compat) */
    async generateContent(prompt, isJson = false, timeout = 900000) {
        return this.generate(prompt, isJson, null, timeout);
    }

    /** JSON-mode generation */
    async generateJSON(prompt, modelOverride = null, timeout = 900000) {
        return this.generate(prompt, true, modelOverride, timeout);
    }

    /**
     * Multi-turn chat.
     * Automatically prepends the system prompt to the conversation.
     */
    async chat(messages) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('MISTRAL_API_KEY is not configured in backend/.env');
        }

        try {
            const allMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ];

            const response = await axios.post(this.baseUrl, {
                model: this.model,
                messages: allMessages,
                temperature: 0.3  // Slightly higher for chat to allow natural language variation
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('[Mistral] Chat Error:', error.message);
            throw error;
        }
    }

    /**
     * Specialized: Generate Requirements with reliability and validation.
     * 
     * @param {string} projectName        - Mandatory. The name of the project (e.g. "Hospital Management System")
     * @param {string} projectDescription - Optional. Additional context provided by the user.
     */
    async generateRequirements(projectName, projectDescription = '') {
        // Build a well-structured prompt that clearly separates name from description
        const descriptionBlock = projectDescription
            ? `\n        ADDITIONAL CONTEXT PROVIDED BY USER:\n        "${projectDescription}"`
            : `\n        (No additional description provided — infer requirements from the project name and domain knowledge.)`;

        const prompt = `Act as a Senior Business Analyst and Software Architect. 
        Generate a comprehensive, professional Software Requirements Specification (SRS) for the following project.

        PROJECT NAME: "${projectName}"${descriptionBlock}

        ANALYSIS INSTRUCTIONS:
        1. Target a "College Level & Professional" standard — use sophisticated, precise industry terminology.
        2. Use the project name to identify the domain (e.g. "Hospital Management System" → healthcare domain).
        3. Requirements must be project-specific — do NOT use generic titles. Use names like "Patient Admission Workflow", etc.
        4. Functional requirements must use the formal format: "The system shall..."
        5. Generate at least 8 functional requirements and 3 NFRs per category.

        OUTPUT FORMAT (strict JSON — no prose outside JSON):
        {
            "projectDescription": "A detailed 2-3 sentence overview of ${projectName} based on what it does, who uses it, and its key value proposition.",
            "functionalRequirements": [
                {
                    "id": "FR-001",
                    "title": "Specific Feature Name (related to ${projectName})",
                    "description": "The system shall... (detailed, testable requirement)",
                    "priority": "High",
                    "rationale": "Why this is essential for ${projectName}",
                    "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
                    "editable": true
                }
            ],
            "nonFunctionalRequirements": {
                "performance": [{ "id": "NFR-P1", "description": "Specific performance target for ${projectName}", "editable": true }],
                "security": [{ "id": "NFR-S1", "description": "Specific security requirement for ${projectName}", "editable": true }],
                "usability": [{ "id": "NFR-U1", "description": "Specific usability standard", "editable": true }],
                "scalability": [{ "id": "NFR-Sc1", "description": "Specific scalability target", "editable": true }],
                "reliability": [{ "id": "NFR-R1", "description": "Specific reliability/uptime requirement", "editable": true }]
            },
            "userStories": [
                { "role": "User type for ${projectName}", "action": "what they do", "benefit": "business value" }
            ],
            "stakeholders": [
                { "id": "SH-001", "name": "Stakeholder Name", "role": "Their role in ${projectName}", "editable": true }
            ],
            "assumptions": [{ "id": "A1", "description": "Realistic assumption for ${projectName}", "editable": true }],
            "constraints": [{ "id": "C1", "description": "Realistic constraint for ${projectName}", "editable": true }]
        }`;

        let attempt = 0;
        const maxAttempts = 2;

        while (attempt < maxAttempts) {
            try {
                console.log(`[Mistral] Generating requirements for project: "${projectName}"`);
                const result = await this.generateJSON(prompt);
                // Validate output has meaningful content
                if (result.functionalRequirements && result.functionalRequirements.length > 0) {
                    return result;
                }
                throw new Error('Empty or invalid requirements generated');
            } catch (error) {
                attempt++;
                console.warn(`[Mistral] Requirements attempt ${attempt} failed:`, error.message);
                if (attempt === maxAttempts) throw error;
            }
        }
    }

    /**
     * Specialized: Suggest Tech Stacks based on Requirements.
     */
    async suggestTechStacks(requirements) {
        const reqSummary = JSON.stringify(requirements).slice(0, 3000);
        const prompt = `Act as a Solution Architect. Analyze these project requirements and suggest 3 distinct, modern tech stack options.
        
        REQUIREMENTS: ${reqSummary}
        
        OUTPUT FORMAT (JSON):
        [
            {
                "name": "...",
                "description": "...",
                "frontend": "Must be a string, e.g. 'React 18, Tailwind'",
                "backend": "Must be a string",
                "database": "Must be a string",
                "rationale": "..."
            }
        ]
        
        CRITICAL: All properties MUST be strings. Nested objects are FORBIDDEN.
        Suggest stacks that specifically suit the project needs.`;

        return await this.generateJSON(prompt);
    }

    /**
     * Diagram type metadata: validation keywords + syntax guide for prompt.
     * Each type has: keywords to detect in generated code, and a concrete example.
     */
    _diagramMeta() {
        return {
            useCase: {
                label: 'Use Case',
                validate: (code) => /\bactor\b|\(.*\)/i.test(code),
                guide: `
DIAGRAM TYPE: Use Case (actors interacting with system use cases)
REQUIRED PlantUML ELEMENTS:
  - actor "ActorName" as A
  - usecase "Use Case Name" as UC1
  - A --> UC1 : optional label
  - rectangle "System" { ... } for system boundary
FORBIDDEN: class, interface, package, node, sequence arrows (->), activity start/stop
EXAMPLE:
@startuml
left to right direction
skinparam backgroundColor transparent
skinparam shadowing false
actor "Customer" as C
actor "Admin" as ADM
rectangle "Online Store" {
  usecase "Browse Products" as UC1
  usecase "Place Order" as UC2
  usecase "Manage Inventory" as UC3
  usecase "Process Payment" as UC4
}
C --> UC1
C --> UC2
C --> UC4
ADM --> UC3
UC2 .> UC4 : <<include>>
@enduml`
            },
            class: {
                label: 'Class',
                validate: (code) => /\bclass\b|\binterface\b|\benum\b/i.test(code),
                guide: `
DIAGRAM TYPE: Class Diagram (OOP structure with classes, attributes, methods, relationships)
REQUIRED PlantUML ELEMENTS:
  - class ClassName { +attribute : Type; +method() : ReturnType }
  - interface InterfaceName { +method() }
  - ClassA --|> ClassB (inheritance)
  - ClassA *-- ClassB (composition)
  - ClassA o-- ClassB (aggregation)
  - ClassA --> ClassB : uses
FORBIDDEN: actor, usecase, start, stop, participant, sequence arrows
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
class User {
  +id : String
  +name : String
  +email : String
  +register() : void
  +login() : Boolean
}
class Order {
  +orderId : String
  +status : String
  +totalAmount : Float
  +placeOrder() : void
  +cancelOrder() : void
}
class Product {
  +productId : String
  +name : String
  +price : Float
  +getDetails() : Object
}
interface IPayment {
  +processPayment(amount: Float) : Boolean
}
class PaymentService {
  +processPayment(amount: Float) : Boolean
}
User "1" --> "*" Order : places
Order "*" --> "*" Product : contains
PaymentService ..|> IPayment
Order --> IPayment : uses
@enduml`
            },
            sequence: {
                label: 'Sequence',
                validate: (code) => /\bparticipant\b|\bactor\b.*\n.*->|\b->\b/i.test(code),
                guide: `
DIAGRAM TYPE: Sequence Diagram (time-ordered messages between participants)
REQUIRED PlantUML ELEMENTS:
  - participant "Name" as P
  - actor "User" as U
  - U -> P : Message
  - P -> DB : Query
  - P --> U : Response (dashed = return)
  - alt/else/end for conditionals
  - loop for loops
FORBIDDEN: class, interface, usecase, actor without messages, package, node
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
actor "User" as U
participant "Frontend" as FE
participant "API Server" as API
participant "Database" as DB
U -> FE : Submit Login Form
FE -> API : POST /auth/login {email, password}
API -> DB : SELECT user WHERE email=?
DB --> API : User Record
alt credentials valid
  API --> FE : 200 OK { token }
  FE --> U : Redirect to Dashboard
else invalid
  API --> FE : 401 Unauthorized
  FE --> U : Show Error Message
end
@enduml`
            },
            activity: {
                label: 'Activity',
                validate: (code) => /\bstart\b|\bstop\b|\bend\b|:.*?;/i.test(code),
                guide: `
DIAGRAM TYPE: Activity Diagram (workflow/flowchart with actions and decisions)
REQUIRED PlantUML ELEMENTS:
  - start
  - :ActionName; (colon prefix, semicolon suffix)
  - if (condition?) then (yes) ... else (no) ... endif
  - fork / fork again / end fork
  - stop or end
FORBIDDEN: class, actor, usecase, participant, package, node, arrows without context
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
start
:User Opens Application;
:Enter Login Credentials;
if (Valid Credentials?) then (yes)
  :Authenticate User;
  :Generate Auth Token;
  :Load Dashboard;
else (no)
  :Show Error Message;
  :Increment Failed Attempts;
  if (Max Attempts Reached?) then (yes)
    :Lock Account;
    stop
  else (no)
    :Retry Login;
  endif
endif
:User Interacts with System;
:Perform Core Operations;
:Log Activity;
stop
@enduml`
            },
            state: {
                label: 'State Chart',
                validate: (code) => /\[?\*\]?.*-->|\bstate\b/i.test(code),
                guide: `
DIAGRAM TYPE: State Chart (state machine with states and transitions)
REQUIRED PlantUML ELEMENTS:
  - [*] --> StateName (initial transition)
  - StateName --> OtherState : Event/Trigger
  - state "State Name" as S1
  - StateName --> [*] (final state)
FORBIDDEN: class, actor, usecase, participant, start, stop (use [*] instead)
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
[*] --> Idle
Idle --> Authenticating : User submits credentials
Authenticating --> Authenticated : Credentials valid
Authenticating --> Failed : Credentials invalid
Failed --> Idle : User retries
Failed --> Locked : Max attempts exceeded
Authenticated --> Active : Dashboard loaded
Active --> Idle : User logs out
Active --> SessionExpired : Timeout
SessionExpired --> [*]
Locked --> [*]
@enduml`
            },
            component: {
                label: 'Component',
                validate: (code) => /\bcomponent\b|\bpackage\b|\binterface\b|\[.*\]/i.test(code),
                guide: `
DIAGRAM TYPE: Component Diagram (system components, interfaces, dependencies)
REQUIRED PlantUML ELEMENTS:
  - component "Name" as C1
  - [ComponentName] shorthand
  - interface "InterfaceName" as I1
  - C1 --> C2 : depends on
  - package "LayerName" { ... }
FORBIDDEN: actor, usecase, class methods, start, stop, participant
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
package "Frontend Layer" {
  component "React App" as FE
  component "State Manager" as SM
}
package "Backend Layer" {
  component "API Gateway" as APIGW
  component "Auth Service" as AUTH
  component "Business Logic" as BL
}
package "Data Layer" {
  component "MongoDB" as DB
  component "Redis Cache" as CACHE
}
interface "REST API" as RESTAPI
interface "WebSocket" as WS
FE --> RESTAPI
FE --> WS
RESTAPI --> APIGW
APIGW --> AUTH
APIGW --> BL
BL --> DB
BL --> CACHE
@enduml`
            },
            deployment: {
                label: 'Deployment',
                validate: (code) => /\bnode\b|\bcloud\b|\bserver\b|\bdevice\b/i.test(code),
                guide: `
DIAGRAM TYPE: Deployment Diagram (infrastructure, servers, nodes, deployment topology)
REQUIRED PlantUML ELEMENTS:
  - node "Server Name" as N1
  - cloud "Cloud Provider" as C1
  - database "DB Name" as DB1
  - artifact "app.jar" as A1
  - N1 --> N2 : protocol
FORBIDDEN: class, actor, usecase, participant, start, stop
EXAMPLE:
@startuml
skinparam backgroundColor transparent
skinparam shadowing false
cloud "AWS Cloud" {
  node "EC2 Web Server" as WEB {
    artifact "React Build" as REACT
    artifact "Node.js API" as API
  }
  node "EC2 App Server" as APP {
    artifact "Business Service" as BIZ
  }
  database "MongoDB Atlas" as DB
  node "Redis Cache" as CACHE
  node "S3 Bucket" as S3 {
    artifact "Static Assets"
  }
}
node "User Browser" as USER
node "CDN" as CDN
USER --> CDN : HTTPS
CDN --> WEB : Request
WEB --> APP : Internal API
APP --> DB : Mongoose
APP --> CACHE : Cache Lookup
WEB --> S3 : Static Files
@enduml`
            }
        };
    }

    /**
     * Validate that generated PlantUML code matches the requested diagram type.
     * Returns true if valid, false if wrong type detected.
     */
    _validateDiagramType(code, type) {
        const meta = this._diagramMeta();
        const typeMeta = meta[type];
        if (!typeMeta) return true; // Unknown type, skip validation
        return typeMeta.validate(code);
    }

    /**
     * Specialized: Generate Diagrams with strict PlantUML syntax.
     * 
     * @param {object|string} requirements - Project requirements data
     * @param {string} type - Diagram type key (useCase, class, sequence, activity, state, component, deployment)
     */
    async generateDiagrams(requirements, type = null) {
        const meta = this._diagramMeta();
        const typeKey = type || 'useCase';
        const typeMeta = meta[typeKey] || meta['useCase'];

        // Build concise requirements context
        let reqContext = '';
        if (typeof requirements === 'string') {
            reqContext = requirements.slice(0, 1500);
        } else if (requirements && typeof requirements === 'object') {
            const name = requirements.projectDescription || '';
            const frs = (requirements.functionalRequirements || [])
                .slice(0, 6)
                .map(r => `- ${r.title}: ${r.description || ''}`)
                .join('\n');
            const stakeholders = (requirements.stakeholders || [])
                .map(s => s.name)
                .join(', ');
            reqContext = [
                name ? `Project: ${name}` : '',
                frs ? `Key Features:\n${frs}` : '',
                stakeholders ? `Actors/Users: ${stakeholders}` : ''
            ].filter(Boolean).join('\n\n').slice(0, 1800);
        }

        const prompt = `You are a Senior Software Architect and PlantUML expert. 
        Generate a professional, college-level ${typeMeta.label} diagram for the project requirements provided below.

        DIAGRAM STYLE & COMPLEXITY:
        1. Aim for a "College Level & Professional" standard — sophisticated enough for a system design document, but not so exhaustive that it becomes unreadable.
        2. Focus on the core 8-12 most critical elements/interactions. Do not over-engineer or include every minor detail.
        3. Ensure the diagram is clean, balanced, and easy to follow at a glance.
        4. Group related elements using packages or rectangles where appropriate for better organization.

        ${typeMeta.guide}

        PROJECT REQUIREMENTS:
        ${reqContext}

        STRICT RULES:
        1. Return ONLY a JSON object: { "${typeKey}": "@startuml\\n...\\n@enduml" }
        2. The diagram MUST be a ${typeMeta.label} diagram — NO other diagram type.
        3. Use ONLY the PlantUML elements shown in the example above.
        4. ALL labels or names with spaces MUST be wrapped in double quotes (e.g. actor "Premium User").
        5. Use simple, clear arrows. Avoid overly complex routing.
        6. Do NOT include markdown fences, explanations, or comments outside @startuml/@enduml.
        7. Escape double quotes inside the JSON string as \\".
        8. The code must start with @startuml and end with @enduml.`;

        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                console.log(`[Mistral] Generating ${typeMeta.label} diagram (attempt ${attempt})...`);
                const result = await this.generateJSON(prompt, this.model, 60000);

                // Extract the code — try the type key, then any @startuml block
                let code = result[typeKey] || result[type] || Object.values(result).find(v => typeof v === 'string' && v.includes('@startuml'));

                if (!code || !code.includes('@startuml')) {
                    throw new Error(`No valid PlantUML code returned for type "${typeKey}"`);
                }

                // Validate it's the correct diagram type
                if (!this._validateDiagramType(code, typeKey)) {
                    console.warn(`[Mistral] Wrong diagram type detected for "${typeKey}" (attempt ${attempt}). Retrying with stronger correction...`);
                    if (attempt < maxAttempts) continue; // retry
                    // On last attempt, still return what we have with warning
                    console.error(`[Mistral] Could not get correct type after ${maxAttempts} attempts, returning best available`);
                }

                return { [typeKey]: code };

            } catch (error) {
                console.error(`[Mistral] Diagram attempt ${attempt} failed for "${typeKey}":`, error.message);

                if (attempt >= maxAttempts) {
                    // Final fallback: text mode extraction
                    try {
                        const textResponse = await this.generateContent(
                            `Generate a PlantUML ${typeMeta.label} diagram for: ${reqContext.slice(0, 500)}\nReturn ONLY the @startuml...@enduml block.`,
                            false,
                            45000
                        );
                        const extracted = textResponse.match(/@startuml[\s\S]*?@enduml/i);
                        if (extracted) {
                            return { [typeKey]: extracted[0] };
                        }
                    } catch (e) {
                        console.error('[Mistral] Text fallback also failed:', e.message);
                    }
                    throw error;
                }
            }
        }
    }
}

module.exports = new MistralService();
