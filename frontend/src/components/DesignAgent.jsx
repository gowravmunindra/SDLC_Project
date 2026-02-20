import { useState, useEffect, useRef } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import geminiService from '../services/geminiService'
import { getPlantUMLUrl, cleanPlantUML } from '../utils/plantuml'
import './DesignAgent.css'

const DIAGRAM_STYLE = `skinparam backgroundColor transparent\nskinparam shadowing false`;

function DesignAgent({ onClose, onComplete }) {
    const { currentProject, updateProject, refreshCurrentProject } = useProject()
    const [step, setStep] = useState('loading') // loading, architecture, diagrams, complete
    const [requirements, setRequirements] = useState(null)
    const [architecture, setArchitecture] = useState(null)

    // UI State
    const [showHero, setShowHero] = useState(true)
    const contentRef = useRef(null)

    // PlantUML State
    const [activeDiagram, setActiveDiagram] = useState('useCase')
    const [diagrams, setDiagrams] = useState({
        useCase: { code: '', url: '', status: 'pending', label: 'Use Case', error: null },
        class: { code: '', url: '', status: 'pending', label: 'Class', error: null },
        sequence: { code: '', url: '', status: 'pending', label: 'Sequence', error: null },
        activity: { code: '', url: '', status: 'pending', label: 'Activity', error: null },
        state: { code: '', url: '', status: 'pending', label: 'State Chart', error: null },
        component: { code: '', url: '', status: 'pending', label: 'Component', error: null },
        deployment: { code: '', url: '', status: 'pending', label: 'Deployment', error: null }
    })

    const [customPrompt, setCustomPrompt] = useState('')
    const [isModifying, setIsModifying] = useState(false)

    // Load Data - Robust Initialization
    useEffect(() => {
        if (!currentProject) return

        if (currentProject.requirements) {
            setRequirements(currentProject.requirements)
        }

        if (currentProject.design && currentProject.design.architecture) {
            setArchitecture(currentProject.design.architecture)

            if (currentProject.design.diagrams) {
                setDiagrams(prev => {
                    const newDiagrams = { ...prev }
                    Object.keys(currentProject.design.diagrams).forEach(key => {
                        if (newDiagrams[key]) {
                            newDiagrams[key] = {
                                ...newDiagrams[key],
                                ...currentProject.design.diagrams[key],
                                // Ensure URL is present if code exists
                                url: currentProject.design.diagrams[key].url || (currentProject.design.diagrams[key].code ? getPlantUMLUrl(currentProject.design.diagrams[key].code) : '')
                            }
                        }
                    })
                    return newDiagrams
                })
            }
            setStep('architecture')
            return
        }

        if (currentProject.requirements) {
            setStep('architecture')
            if (!architecture) {
                setTimeout(() => {
                    generateArchitectureInBackground(currentProject.requirements)
                }, 500)
            }
        } else {
            setStep('architecture')
        }
    }, [currentProject])

    // SYNC: Update URLs whenever code changes (handles manual edits too)
    useEffect(() => {
        const activeCode = diagrams[activeDiagram]?.code;
        if (activeCode) {
            const newUrl = getPlantUMLUrl(activeCode);
            if (newUrl !== diagrams[activeDiagram].url) {
                setDiagrams(prev => ({
                    ...prev,
                    [activeDiagram]: { ...prev[activeDiagram], url: newUrl }
                }));
            }
        }
    }, [diagrams[activeDiagram]?.code, activeDiagram]);

    // Safety timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'loading' && currentProject) {
                setStep('architecture')
            }
        }, 3000)
        return () => clearTimeout(timeout)
    }, [step, currentProject])

    const generateArchitectureInBackground = async (reqData) => {
        try {
            // First show fallback so user isn't staring at a blank screen
            const fallback = generateArchitectureFallback(reqData)
            setArchitecture(fallback.architecture)

            // Then try to generate a real one with AI
            const prompt = `Act as a Senior Solution Architect. Design a detailed system architecture for this project:
Project: ${currentProject.name}
Description: ${reqData.projectDescription}
Requirements: ${reqData.functionalRequirements.slice(0, 5).map(r => r.title).join(', ')}

Return ONLY a JSON object with this structure:
{
  "architecture": {
    "type": "e.g., Microservices / Event-Driven / Serverless",
    "justification": "why this choice fits the requirements",
    "layers": [
      { "name": "Layer Name", "tech": ["Tech 1", "Tech 2"], "description": "Specific responsibility" }
    ]
  }
}
Keep it professional and specific to the project.`;

            const response = await geminiService.generateJSON(prompt, 2, true);
            if (response && response.architecture) {
                setArchitecture(response.architecture);
            }
        } catch (error) {
            console.error('[DesignAgent] Architecture AI generation failed:', error)
            // Fallback is already set
        }
    }

    const generateArchitectureFallback = (reqs) => {
        const techStack = reqs?.technicalRequirements?.stack || ['MERN Stack', 'Node.js', 'React']
        return {
            architecture: {
                type: 'N-Tier Web Architecture',
                justification: 'To ensure clear separation of concerns and scalable performance for a web-based management system.',
                layers: [
                    { name: 'Frontend', tech: ['React', 'CSS3', 'Vite'], description: 'Responsive SPA providing the user interface and state management.' },
                    { name: 'API Services', tech: ['Node.js', 'Express', 'JWT'], description: 'Secure RESTful endpoints handling business logic and auth.' },
                    { name: 'Persistence', tech: ['MongoDB', 'Mongoose'], description: 'Document-based storage for flexible requirement data.' }
                ]
            }
        }
    }

    const constructDiagramPrompt = (type, projectName, reqs, arch) => {
        const functionalReqs = reqs?.functionalRequirements?.slice(0, 4).map(r => r.title).join(', ') || 'Core features';

        const typeSpecs = {
            useCase: {
                blueprint: "actor \"User\" as U\nusecase \"Login System\" as UC1\nU -> UC1",
                rules: "Use ONLY 'actor' and 'usecase' (oval). Connect with simple arrows. NO classes, NO boxes."
            },
            class: {
                blueprint: "class \"UserEntity\" as UE {\n  +id: string\n  +login()\n}\nclass \"Database\" as DB\nUE -> DB : persists",
                rules: "Use 'class' blocks with { fields }. Use relationships like '->', '--*', or '<|--'. NO actors, NO clouds."
            },
            sequence: {
                blueprint: "actor \"Client\" as C\nparticipant \"Server\" as S\nC -> S : GET /data\nS -> C : 200 OK",
                rules: "Use 'actor' and 'participant'. Use horizontal arrows only. NO boxes, NO inheritance."
            },
            activity: {
                blueprint: "start\n:Initialize;\nif (Valid?) then (yes)\n  :Process;\nelse (no)\n  :Error;\nendif\nstop",
                rules: "Use 'start', 'stop', 'if/then/else', and ':Action;'. NO actors, NO classes."
            },
            state: {
                blueprint: "[*] -> Idle\nIdle -> Processing : start\nProcessing -> Idle : finish\nProcessing -> [*]",
                rules: "Use '[*]' for entry/exit. Use 'State -> State : Event'. NO participants."
            },
            component: {
                blueprint: "[API Gate] as API\n[Auth Service] as Auth\nAPI ..> Auth : uses",
                rules: "Use '[Component Name]' notation. Use dashed arrows '..>' for dependencies. NO actors."
            },
            deployment: {
                blueprint: "node \"AWS Cloud\" as Cloud {\n  node \"Web Server\" as Web\n  database \"PostgreSQL\" as DB\n}\nWeb -> DB",
                rules: "Use 'node', 'database', or 'cloud'. Show physical nesting with { }. NO 'usecase' or 'actor'."
            }
        };

        const spec = typeSpecs[type];

        return `Act as a Senior Software Architect. Generate a syntactically PERFECT PlantUML ${type} diagram for "${projectName}".
Features to include: ${functionalReqs}

STRICT ARCHITECTURAL RULES for ${type.toUpperCase()}:
1. TYPE-STRICT SYNTAX: ${spec.rules}
2. ALIASES: Define everything with an alias: [Type] "Display Name" as ALIAS.
3. CONNECTIVITY: Connect everything via ALIASES only (ALIAS1 -> ALIAS2).
4. QUOTES: Always wrap display names in "double quotes".

EXAMPLE BLUEPRINT:
${spec.blueprint}

Essential Output Rules:
- Start with @startuml and end with @enduml.
- Output ONLY valid PlantUML code. No chat, no intro.
- Keep output concise (max 5-6 total elements).
- Ensure professional, technical naming.`;
    }

    const generateDiagram = async (type) => {
        console.log(`[DesignAgent] Targeted Generation: ${type}`)
        setDiagrams(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'loading', error: null, code: '', url: '' }
        }))

        try {
            const prompt = constructDiagramPrompt(type, currentProject.name, requirements, architecture)
            const codeRaw = await geminiService.generateContent(prompt, true)
            console.log(`[DesignAgent] Raw AI Response for ${type}:`, codeRaw)

            // 1. Clean and Sanitize
            let code = cleanPlantUML(codeRaw)

            // 2. Check for AI refusals
            const hasTags = code.toLowerCase().includes('@startuml') && code.toLowerCase().includes('@enduml')
            const isRefusal = codeRaw.toLowerCase().includes('sorry') ||
                (codeRaw.toLowerCase().includes('assist') && !hasTags) ||
                (codeRaw.toLowerCase().includes('cannot') && !hasTags && codeRaw.length < 100);

            if (!hasTags && isRefusal) {
                console.warn(`[DesignAgent] AI Refusal Detected for ${type}. Using fallback template.`)

                // Fallback Logic: Provide a basic template so the user isn't stuck
                const fallbackTemplates = {
                    useCase: `@startuml\nactor User\nUser -> (Use Case 1)\n@enduml`,
                    class: `@startuml\nclass CoreEntity {\n  +id: string\n}\n@enduml`,
                    sequence: `@startuml\nactor User\nparticipant System\nUser -> System: Action\nSystem -> User: Result\n@enduml`,
                    activity: `@startuml\nstart\n:Initialize;\n:Process Task;\nstop\n@enduml`,
                    state: `@startuml\n[*] --> Idle\nIdle --> Processing : Start\nProcessing --> [*]\n@enduml`,
                    component: `@startuml\n[Component A] -> [Component B]\n@enduml`,
                    deployment: `@startuml\nnode Server {\n  [Application]\n}\n@enduml`
                };
                code = fallbackTemplates[type] || fallbackTemplates.useCase;
            }

            // 3. Fallback: if no tags but it looks like code, try to wrap it
            if (!hasTags && codeRaw.length > 20 && !isRefusal) {
                code = '@startuml\n' + codeRaw.replace(/```[a-z]*\s*/g, '').replace(/```\s*/g, '') + '\n@enduml'
                code = cleanPlantUML(code) // Re-clean to be safe
            }

            // 4. Force tags if still missing
            if (!code.toLowerCase().includes('@startuml')) code = '@startuml\n' + code
            if (!code.toLowerCase().includes('@enduml')) code = code + '\n@enduml'

            // 5. Inject styles and fix syntax
            if (!code.toLowerCase().includes('skinparam')) {
                code = code.replace(/@startuml/i, `@startuml\n${DIAGRAM_STYLE}\n`);
            }

            code = code
                .replace(/\/\//g, "'") // Fix invalid C-style comments
                .replace(/-\s+>/g, '->')
                .replace(/--\s+>/g, '-->');

            code = code.trim();

            // TYPE-SPECIFIC FIXES
            if (type === 'activity') {
                // Ensure activity diagrams have start/stop if missing
                if (!code.includes('start')) code = code.replace('@startuml', '@startuml\nstart');
                if (!code.includes('stop') && !code.includes('end')) code = code.replace('@enduml', 'stop\n@enduml');
                // Common mistake: using sequence arrows in activity diagrams
                // But only if it's clearly an activity diagram (has : or ;)
                if (code.includes(':') || code.includes(';')) {
                    code = code.replace(/(\w+)\s*->\s*(\w+)/g, ':$1;\n:$2;');
                }
            }

            code = code.trim();

            setDiagrams(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    code,
                    url: getPlantUMLUrl(code),
                    status: 'done'
                }
            }))
        } catch (error) {
            console.error(`[DesignAgent] Generation Error [${type}]:`, error)
            setDiagrams(prev => ({
                ...prev,
                [type]: { ...prev[type], status: 'error', error: error.message }
            }))
        }
    }

    const handleModify = async () => {
        if (!customPrompt) return
        setIsModifying(true)
        try {
            const current = diagrams[activeDiagram]
            const prompt = `You are a PlantUML expert. Modify the following code according to the user request.
            
            CURRENT CODE:
            ${current.code}
            
            USER INSTRUCTION: ${customPrompt}
            
            STRICT RULES:
            1. Output ONLY valid PlantUML code.
            2. Start with @startuml and end with @enduml.
            3. Apply the changes requested by the user.
            4. Do not include any explanation or markdown tags.`

            const result = await geminiService.generateContent(prompt)

            // Apply refined cleaning logic
            let code = cleanPlantUML(result)

            // Basic syntax fixes
            code = code
                .replace(/@startuml+/gi, '@startuml')
                .replace(/@enduml+/gi, '@enduml')
                .replace(/-\s+>/g, '->')
                .replace(/--\s+>/g, '-->')
                .replace(/\n\s*(class|node|actor|participant|component|state|usecase|package|artifact|container)\s*@enduml$/i, '\n@enduml')
                .trim();

            if (code) {
                setDiagrams(prev => ({
                    ...prev,
                    [activeDiagram]: {
                        ...prev[activeDiagram],
                        code,
                        url: getPlantUMLUrl(code),
                        status: 'done'
                    }
                }))
                setCustomPrompt('')
            }
        } catch (error) {
            console.error('Modify failed:', error)
        } finally {
            setIsModifying(false)
        }
    }

    const handleComplete = async () => {
        const designData = {
            architecture,
            diagrams,
            completedAt: new Date().toISOString()
        }

        try {
            await apiService.saveDesign(currentProject._id, designData)
            await updateProject(currentProject._id, { status: 'development' })
            await refreshCurrentProject()
            onComplete(designData)
        } catch (error) {
            console.error('Save failed:', error)
            alert('Failed to save design')
        }
    }

    const handleScroll = (e) => {
        setShowHero(e.target.scrollTop < 50)
    }

    const renderHero = () => (
        <div className={`agent-hero ${showHero ? 'visible' : 'hidden'}`}>
            <div className="agent-title-section">
                <div className="agent-badge">
                    <span className="agent-emoji">🎨</span>
                    <span>System Design Agent</span>
                </div>
                <h2>System Architecture & Design</h2>
                <p>Blueprint for {currentProject?.name}</p>
            </div>
            <button className="close-agent" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6L18 18" />
                </svg>
            </button>
        </div>
    )

    return (
        <div className="agent-workspace">
            {renderHero()}

            <div
                className={`agent-content ${!showHero ? 'expanded' : ''}`}
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '500px' }}
                ref={contentRef}
                onScroll={handleScroll}
            >
                {/* Tabs */}
                <div className="design-tabs-container">
                    <button
                        className={`step-tab ${step === 'architecture' ? 'active' : ''}`}
                        onClick={() => setStep('architecture')}
                    >
                        🏗️ Architecture
                    </button>
                    <button
                        className={`step-tab ${step === 'diagrams' ? 'active' : ''}`}
                        onClick={() => setStep('diagrams')}
                    >
                        📊 Diagrams
                    </button>
                </div>

                {/* ARCHITECTURE VIEW */}
                {step === 'architecture' && (
                    <div className="step-container">
                        {architecture ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="architecture-card glass-panel">
                                    <div className="arch-header">
                                        <h3>{architecture.type} Architecture</h3>
                                        <div className="badge-primary">{architecture.type}</div>
                                    </div>
                                    <p className="arch-justification">{architecture.justification}</p>
                                </div>

                                <div className="layers-grid">
                                    {(architecture.layers || []).map((layer, idx) => (
                                        <div key={idx} className="layer-card glass-panel">
                                            <div className="layer-number">{idx + 1}</div>
                                            <h4>{layer.name}</h4>
                                            <p>{layer.description}</p>
                                            <div className="tech-tags">
                                                {(layer.tech || []).map(t => (
                                                    <span key={t} className="tag">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="step-actions">
                                    <button className="btn-primary" onClick={() => setStep('diagrams')}>
                                        Proceed to Diagrams →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="centered-state">
                                <div className="loading-spinner-large"></div>
                                <p style={{ marginTop: 20 }}>Generating system architecture...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* DIAGRAMS VIEW */}
                {step === 'diagrams' && (
                    <div className="step-container">
                        <div className="diagrams-nav">
                            {Object.entries(diagrams).map(([key, data]) => (
                                <button
                                    key={key}
                                    className={`diagram-pill ${activeDiagram === key ? 'active' : ''}`}
                                    onClick={() => setActiveDiagram(key)}
                                >
                                    {data.label}
                                    {data.status === 'done' && <span className="status-dot success"></span>}
                                    {data.status === 'loading' && <span className="status-dot loading"></span>}
                                </button>
                            ))}
                        </div>

                        <div className="diagram-workspace glass-panel">
                            {/* Editor Column (LEFT) */}
                            <div className="diagram-column editor-column" style={{ padding: '20px', borderRight: '1px solid var(--border-color)', flex: '1' }}>
                                <h4>Modify Diagram</h4>
                                <textarea
                                    className="code-editor-area"
                                    value={diagrams[activeDiagram].code}
                                    onChange={(e) => {
                                        const code = e.target.value
                                        setDiagrams(prev => ({
                                            ...prev,
                                            [activeDiagram]: { ...prev[activeDiagram], code }
                                        }))
                                    }}
                                    style={{ height: '350px', marginBottom: '10px', width: '100%', background: '#000', color: '#0f0', fontFamily: 'monospace', padding: '10px' }}
                                />
                                <div className="prompt-box">
                                    <input
                                        type="text"
                                        placeholder="Instructions..."
                                        value={customPrompt}
                                        onChange={e => setCustomPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleModify()}
                                    />
                                    <button className="btn-send" onClick={handleModify} disabled={isModifying}>➤</button>
                                </div>
                            </div>

                            {/* Preview Column (RIGHT) */}
                            <div className="diagram-column preview-column" style={{ padding: '20px', flex: '1.5' }}>
                                {diagrams[activeDiagram].status === 'loading' ? (
                                    <div className="centered-state">
                                        <div className="loading-spinner"></div>
                                        <p>Generating...</p>
                                    </div>
                                ) : diagrams[activeDiagram].url ? (
                                    <div className="preview-content">
                                        <img src={diagrams[activeDiagram].url} alt="Diagram" style={{ maxWidth: '100%', height: 'auto' }} />
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                            <a href={diagrams[activeDiagram].url} target="_blank" rel="noreferrer" className="btn-icon">Full View</a>
                                            <button
                                                className="btn-icon"
                                                onClick={() => generateDiagram(activeDiagram)}
                                                disabled={diagrams[activeDiagram].status === 'loading'}
                                            >
                                                {diagrams[activeDiagram].status === 'loading' ? 'Processing...' : '⟳ Retry'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="centered-state">
                                        <button
                                            className="btn-primary"
                                            onClick={() => generateDiagram(activeDiagram)}
                                            disabled={diagrams[activeDiagram].status === 'loading'}
                                        >
                                            {diagrams[activeDiagram].status === 'loading' ? 'AI is thinking...' : `Generate ${diagrams[activeDiagram].label}`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setStep('architecture')}>← Back</button>
                            <button className="btn-primary" onClick={handleComplete}>✅ Finalize & Review</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Overlay */}
            <div style={{ position: 'fixed', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', zIndex: 10000, pointerEvents: 'none' }}>
                System Status: {step.toUpperCase()} | Arch: {architecture ? 'OK' : 'WAIT'}
            </div>
        </div>
    )
}

export default DesignAgent
