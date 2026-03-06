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

    const [lightbox, setLightbox] = useState({ isOpen: false, url: '' });

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
        const functionalReqs = reqs?.functionalRequirements?.slice(0, 3).map(r => r.title).join(', ') || 'Core workflows';

        const typeSpecs = {
            useCase: {
                blueprint: "left to right direction\nactor \"User\" as U\nusecase \"Core Feature\" as UC1\nU --> UC1",
                rules: "Always include 'left to right direction'. Focus on primary actors and 3-4 key use cases. Use simple arrows -->."
            },
            class: {
                blueprint: "class \"CoreEntity\" {\n  +id: string\n  +update()\n}\nclass \"Service\" {\n  +execute()\n}\nCoreEntity -- Service",
                rules: "Show only 3-4 core classes. Include 2-3 essential fields/methods per class. Keep relationships simple."
            },
            sequence: {
                blueprint: "actor \"User\" as U\nparticipant \"Controller\" as C\nparticipant \"DB\" as D\nU -> C: Request\nC -> D: Query\nD --> C: Result\nC --> U: Response",
                rules: "Show 3-5 key participants. Map one primary success path. Use clean horizontal arrows."
            },
            activity: {
                blueprint: "start\n:User Input;\nif (Valid?) then (yes)\n  :Process Action;\nelse (no)\n  :Show Error;\nendif\nstop",
                rules: "Show a simple flow from start to stop. Use :Action; syntax (always end actions with a semicolon). Avoid external entity definitions."
            },
            state: {
                blueprint: "[*] --> Idle\nIdle --> Active : Start\nActive --> [*] : End",
                rules: "Show 3-4 essential states. Use clear transition labels."
            },
            component: {
                blueprint: "[Frontend] ..> [API] : JSON\n[API] ..> [DB] : SQL",
                rules: "High-level overview only. Show 3-4 main architectural blocks. Use [Component] syntax."
            },
            deployment: {
                blueprint: "node \"Server Cluster\" {\n  [App Instance]\n}\ndatabase \"Database Cluster\" {\n  [Data Store]\n}\n[App Instance] --> [Data Store] : JDBC",
                rules: "Show physical infrastructure. Use 'node', 'database', or 'cloud'. IMPORTANT: NEVER use 'nodo', it is not a keyword."
            }
        };

        const spec = typeSpecs[type];

        return `Act as a Senior Software Architect and PlantUML Expert. Generate a VALID, MINIMAL, PRODUCTION-READY PlantUML ${type} diagram for "${projectName}".
Objective: Visualize ${functionalReqs}.

STRICT SYNTAX & STYLE RULES:
1. NO HALLUCinations: Use ONLY valid PlantUML keywords. (e.g., 'node', NOT 'nodo').
2. MINIMALISM: Show ONLY the most critical 5-8 elements/steps. Avoid bloat.
3. CLEAN CODE: No unnecessary comments. Define elements directly.
4. SYNTAX: ${spec.rules}
5. LAYOUT: Ensure the diagram flows logically (Left to Right is preferred for Use Case/Component).
6. NO CONVERSATION: Return ONLY the @startuml ... @enduml block.

BLUEPRINT:
${spec.blueprint}

Generate the final PlantUML code now.`;
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

            // 2. Check for AI refusals or empty output
            const hasTags = code.toLowerCase().includes('@startuml') && code.toLowerCase().includes('@enduml')
            if (!hasTags && (codeRaw.length < 50 || codeRaw.toLowerCase().includes('sorry'))) {
                throw new Error("AI failed to generate a valid diagram. Please retry.");
            }

            // 3. Fallback: if no tags but it looks like code, try to wrap it
            if (!hasTags && codeRaw.length > 20) {
                code = '@startuml\n' + codeRaw.replace(/```[a-z]*\s*/g, '').replace(/```\s*/g, '') + '\n@enduml'
                code = cleanPlantUML(code)
            }

            // 4. Force tags if still missing
            if (!code.toLowerCase().includes('@startuml')) code = '@startuml\n' + code
            if (!code.toLowerCase().includes('@enduml')) code = code + '\n@enduml'

            // 5. Inject styles
            if (!code.toLowerCase().includes('skinparam')) {
                code = code.replace(/@startuml/i, `@startuml\n${DIAGRAM_STYLE}\n`);
            }

            // 6. TYPE-SPECIFIC SYNTAX FIXES & SANITIZATION
            code = code
                .replace(/\/\//g, "'") // Fix invalid C-style comments
                .replace(/-\s+>/g, '->')
                .replace(/--\s+>/g, '-->')
                .replace(/\bnodo\b/gi, 'node') // Fix common AI typo 'nodo' -> 'node'
                .replace(/\busecase\s+"([^"]+)"\s+as\s+(@\w+)/gi, 'usecase "$1" as $2') // Fix invalid @ alias
                .replace(/skinparam\s+shadowing\s+true/gi, 'skinparam shadowing false');

            if (type === 'activity') {
                if (!code.includes('start')) code = code.replace(/@startuml/i, '@startuml\nstart');
                if (!code.includes('stop') && !code.includes('end')) code = code.replace(/@enduml/i, 'stop\n@enduml');

                // Fix missing semicolons in activity blocks
                code = code.split('\n').map(line => {
                    const l = line.trim();
                    if (l.startsWith(':') && !l.endsWith(';') && !l.includes('|')) return line + ';';
                    return line;
                }).join('\n');
            }

            if (type === 'useCase' && !code.includes('left to right direction')) {
                code = code.replace(/@startuml/i, '@startuml\nleft to right direction\n');
            }

            if (type === 'state') {
                code = code.replace(/\[ \* \]/g, '[*]');
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
            const prompt = `You are a Senior PlantUML Architect. Modify the following code based on the user request.
            
            CURRENT CODE:
            ${current.code}
            
            USER INSTRUCTION: ${customPrompt}
            
            STRICT VALIDATION RULES:
            1. Output ONLY valid PlantUML code.
            2. FIX typos: Use 'node', NOT 'nodo'.
            3. Ensure all actions in activity diagrams end with a semicolon ';'.
            4. Use 'left to right direction' for diagrams that look clipped or squeezed.
            5. Return ONLY the code block.`

            const result = await geminiService.generateContent(prompt)

            // Apply refined cleaning logic
            let code = cleanPlantUML(result)

            // Basic syntax fixes
            code = code
                .replace(/@startuml+/gi, '@startuml')
                .replace(/@enduml+/gi, '@enduml')
                .replace(/-\s+>/g, '->')
                .replace(/--\s+>/g, '-->')
                .replace(/\bnodo\b/gi, 'node')
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
                            <div className="diagram-column preview-column">
                                {diagrams[activeDiagram].status === 'loading' ? (
                                    <div className="centered-state">
                                        <div className="loading-spinner"></div>
                                        <p>Generating...</p>
                                    </div>
                                ) : diagrams[activeDiagram].url ? (
                                    <div className="preview-content">
                                        <img
                                            src={diagrams[activeDiagram].url}
                                            alt="Diagram"
                                        />
                                        <div className="preview-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => setLightbox({ isOpen: true, url: diagrams[activeDiagram].url })}
                                            >
                                                🔍 Full View (SVG)
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => setLightbox({ isOpen: true, url: diagrams[activeDiagram].url.replace('/svg/', '/png/') })}
                                            >
                                                🖼️ Full View (PNG)
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => generateDiagram(activeDiagram)}
                                                disabled={diagrams[activeDiagram].status === 'loading'}
                                            >
                                                ⟳ Retry
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
                            <button className="btn-secondary" onClick={() => setStep('architecture')}>← Back to Architecture</button>
                            <button className="btn-primary" onClick={handleComplete}>Complete Design Phase →</button>
                        </div>
                    </div>
                )}
            </div>

            {lightbox.isOpen && (
                <DiagramLightbox
                    url={lightbox.url}
                    onClose={() => setLightbox({ isOpen: false, url: '' })}
                />
            )}

            {/* Status Overlay */}
            <div style={{ position: 'fixed', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', zIndex: 10000, pointerEvents: 'none' }}>
                System Status: {step.toUpperCase()} | Arch: {architecture ? 'OK' : 'WAIT'}
            </div>
        </div>
    )
}

// PREMIUM LIGHTBOX COMPONENT
const DiagramLightbox = ({ url, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.2, Math.min(5, scale + delta));
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div className="diagram-lightbox" onWheel={handleWheel}>
            <div className="lightbox-overlay" onClick={onClose}></div>
            <div className="lightbox-hint">Scroll to Zoom • Drag to Pan</div>
            <div
                className="lightbox-content"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    src={url}
                    alt="Full View"
                    draggable="false"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                />
            </div>
            <div className="lightbox-controls">
                <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))}>−</button>
                <span className="zoom-level">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(5, s + 0.2))}>+</button>
                <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}>↺</button>
                <button className="btn-close-large" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

export default DesignAgent
