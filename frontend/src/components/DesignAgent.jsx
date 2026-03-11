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
        // SELECT CORE REQUIREMENTS (Filter out generic ones like Login/Auth)
        const coreReqs = reqs?.functionalRequirements?.filter(r => 
            !r.title.toLowerCase().includes('auth') && 
            !r.title.toLowerCase().includes('login') && 
            !r.title.toLowerCase().includes('register') &&
            !r.title.toLowerCase().includes('authentication')
        ) || [];

        // If after filtering we have enough project-specific reqs, use them. Otherwise fallback.
        const focusReqs = coreReqs.length > 0 ? coreReqs : reqs?.functionalRequirements || [];
        const functionalReqs = focusReqs.slice(0, 4).map(r => r.title).join(', ');

        const typeSpecs = {
            useCase: {
                blueprint: "left to right direction\nactor \"User\" as U\nusecase \"Core Feature\" as UC1\nU --> UC1",
                rules: "Always include 'left to right direction'. Focus on primary actors and 3-4 key use cases. Use simple arrows -->. IMPORTANT: Wrap ALL labels in double quotes."
            },
            class: {
                blueprint: "class \"CoreEntity\" {\n  +id: string\n  +update()\n}\nclass \"Service\" {\n  +execute()\n}\nCoreEntity -- Service",
                rules: "Show only 3-4 core classes. Include 2-3 essential fields/methods per class. Keep relationships simple. IMPORTANT: Wrap ALL names and types in double quotes."
            },
            sequence: {
                blueprint: "actor \"User\" as U\nparticipant \"Controller\" as C\nparticipant \"DB\" as D\nU -> C: \"Request\"\nC -> D: \"Query\"\nD --> C: \"Result\"\nC --> U: \"Response\"",
                rules: "Show 3-5 key participants. Map one primary success path. Use clean horizontal arrows. IMPORTANT: Wrap ALL messages and participant names in double quotes."
            },
            activity: {
                blueprint: "start\n:\"User Input\";\nif (\"Valid?\") then (yes)\n  :\"Process Action\";\nelse (no)\n  :\"Show Error\";\nendif\nstop",
                rules: "Show a simple flow from start to stop. Use :\"Action Name\"; syntax (always end actions with a semicolon and wrap text in quotes). Use 'if (...) then (...) ... else (...) ... endif' syntax."
            },
            state: {
                blueprint: "state \"Dashboard\" as Dashboard\n[*] --> Dashboard\nDashboard --> \"TaskList\" : \"View Tasks\"\n\"TaskList\" --> \"TaskDetail\" : \"Select Task\"",
                rules: "ALWAYS define states explicitly using 'state \"Name\" as Alias'. Use [*] -> Alias for start/end. Ensure all transition labels are in double quotes."
            },
            component: {
                blueprint: "package \"Web Browser\" {\n  [Frontend Component]\n}\nnode \"API Server\" {\n  [REST API Service]\n}\n[Frontend Component] --> [REST API Service] : \"JSON/HTTPS\"",
                rules: "High-level overview only. Show 3-4 main architectural blocks. Use [Component Name] syntax. Wrap interface labels in quotes."
            },
            deployment: {
                blueprint: "node \"User PC\" {\n  component \"Web Browser\"\n}\nnode \"AWS Cloud\" {\n  node \"App Server\" {\n     component \"REST API\"\n  }\n}\n\"Web Browser\" --> \"REST API\" : \"HTTPS\"",
                rules: "Show physical infrastructure. Use 'node', 'database', or 'cloud'. Wrap ALL device and connection names in quotes."
            }
        };

        const spec = typeSpecs[type];

        return `Act as a Senior Software Architect and PlantUML Expert. Generate a VALID, MINIMAL, PRODUCTION-READY PlantUML ${type} diagram for "${projectName}".
Objective: Visualize the core business logic: ${functionalReqs}.

IMPORTANT: DO NOT focus on generic features like Login, Registration, or Authentication unless the diagram type specifically requires it. Focus on the UNIQUE functionality of the project described.

STRICT SYNTAX & STYLE RULES:
1. NO NAKED TITLES: NEVER write the name of the diagram on a line by itself. If you want a title, use 'title "My Diagram"'.
2. NO HALLUCinations: Use ONLY valid PlantUML keywords.
3. MINIMALISM: Show ONLY the most critical 5-8 elements/steps. Avoid bloat.
4. CLEAN CODE: No unnecessary comments. Define elements directly.
5. SYNTAX: ${spec.rules}
6. LABELS: Every single label, message, or description MUST be enclosed in double quotes (e.g., :\"Action\"; or --> \"Message\").
7. LAYOUT: Ensure the diagram flows logically (Left to Right is preferred for Use Case/Component).
8. NO CONVERSATION: Return ONLY the @startuml ... @enduml block.

BLUEPRINT:
${spec.blueprint}

Generate the final PlantUML code now.`;
    }

    const normalizePlantUML = (codeRaw, type) => {
        // 1. Core structural cleaning
        let code = cleanPlantUML(codeRaw);

        // 2. Inject global styles if missing
        if (!code.toLowerCase().includes('skinparam')) {
            code = code.replace(/@startuml/i, `@startuml\n${DIAGRAM_STYLE}\n`);
        }

        // 3. Global syntax fixes
        code = code
            .replace(/\/\//g, "'") // Fix invalid C-style comments
            .replace(/-\s+>/g, '->')
            .replace(/--\s+>/g, '-->')
            .replace(/\bnodo\b/gi, 'node') // Fix common AI typo 'nodo' -> 'node'
            .replace(/\busecase\s+"([^"]+)"\s+as\s+(@\w+)/gi, 'usecase "$1" as $2') // Fix invalid @ alias
            .replace(/skinparam\s+shadowing\s+true/gi, 'skinparam shadowing false');

        // 4. Activity-specific normalization
        if (type === 'activity') {
            code = code.replace(/^:([^"].*);/gm, ':"$1";');
            if (!code.includes('start')) code = code.replace(/@startuml/i, '@startuml\nstart');
            if (!code.includes('stop') && !code.includes('end')) code = code.replace(/@enduml/i, 'stop\n@enduml');
            
            code = code.split('\n').map(line => {
                const l = line.trim();
                if (l.startsWith(':') && !l.endsWith(';') && !l.includes('|')) return line + ';';
                return line;
            }).join('\n');
            
            code = code
                .replace(/if\s+(\([^)]+\))\s+{/gi, 'if $1 then')
                .replace(/}\s*else\s*{/gi, 'else')
                .replace(/}\s*endif/gi, 'endif');
        }

        // 5. Sequence-specific fixes
        if (type === 'sequence') {
            code = code.replace(/([->]+)\s+([^"]\w[\w\s?]*)$/gm, '$1 "$2"');
        }

        // 6. UseCase layout consistency
        if (type === 'useCase' && !code.includes('left to right direction')) {
            code = code.replace(/@startuml/i, '@startuml\nleft to right direction\n');
        }

        // 7. State-specific fixes & Type Hinting
        if (type === 'state') {
            code = code.replace(/\[ \* \]/g, '[*]');
            
            // Smarter arrow labeling: Only wrap in quotes if there are spaces and not already quoted
            code = code.split('\n').map(line => {
                if (line.includes('-->')) {
                    const parts = line.split('-->');
                    if (parts.length === 2) {
                        let target = parts[1].trim();
                        // If target has spaces and no quotes/colon, and isn't [*]
                        if (target.includes(' ') && !target.includes('"') && !target.includes(':') && target !== '[*]') {
                            return `${parts[0]} --> "${target}"`;
                        }
                    }
                }
                return line;
            }).join('\n');

            // FORCE STATE TYPE HINT if missing to prevent sequence assumption
            if (!code.toLowerCase().includes('state ')) {
                code = code.replace(/@startuml/i, '@startuml\nstate " " as force_state_type <<hidden>>\nhide force_state_type\n');
            }
        }
        
        // 8. Structural Layout Type Hinting
        if (type === 'deployment' || type === 'component') {
            if (!code.toLowerCase().includes('node ') && !code.toLowerCase().includes('package ')) {
                code = code.replace(/@startuml/i, '@startuml\nnode " " as force_arch_type <<hidden>>\nhide force_arch_type\n');
            }
        }

        return code.trim();
    };

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

            // 1. Check for AI refusals or empty output
            const hasTags = codeRaw.toLowerCase().includes('@startuml') && codeRaw.toLowerCase().includes('@enduml')
            if (!hasTags && (codeRaw.length < 50 || codeRaw.toLowerCase().includes('sorry'))) {
                throw new Error("AI failed to generate a valid diagram. Please retry.");
            }

            // 2. Run consolidated normalization
            const code = normalizePlantUML(codeRaw, type);

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
            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: { ...prev[activeDiagram], status: 'loading', error: null }
            }))

            const current = diagrams[activeDiagram]
            const prompt = `You are a Senior PlantUML Architect. Modify the following code based on the user request.
            
            CURRENT CODE:
            ${current.code}
            
            USER INSTRUCTION: ${customPrompt}
            
            STRICT VALIDATION RULES:
            1. Output ONLY valid PlantUML code.
            2. FIX typos: Use 'node', NOT 'nodo'.
            3. Ensure all labels/messages are wrapped in double quotes.
            4. Use 'start' and 'stop' for activity diagrams.
            5. Return ONLY the @startuml ... @enduml block.`

            const resultRaw = await geminiService.generateContent(prompt)

            // Apply consolidated normalization
            const code = normalizePlantUML(resultRaw, activeDiagram)

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
            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: { ...prev[activeDiagram], status: 'error', error: error.message }
            }))
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
                            <div className="diagram-column editor-column">
                                <div className="column-header">
                                    <h4>Modify Diagram</h4>
                                </div>
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
