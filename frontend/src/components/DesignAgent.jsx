import { useState, useEffect, useRef, useCallback } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import { getPlantUMLUrl, cleanPlantUML } from '../utils/plantuml'
import './DesignAgent.css'

const DIAGRAM_STYLE = `skinparam backgroundColor transparent\nskinparam shadowing false`;

function DesignAgent({ onClose, onComplete }) {
    const { currentProject, updateProject, refreshCurrentProject } = useProject()
    const [step, setStep] = useState('loading') // loading, techStack, diagrams, complete
    const [requirements, setRequirements] = useState(null)
    const [techStacks, setTechStacks] = useState([
        {
            name: "MERN Stack (Scalable JavaScript)",
            description: "Industry-standard full-stack JavaScript environment.",
            frontend: "React 18, Vite, Tailwind CSS",
            backend: "Node.js, Express",
            database: "MongoDB (Mongoose)",
            rationale: "Best for rapid development and handling unstructured data with ease."
        },
        {
            name: "Python Full Stack (AI & Data Ready)",
            description: "Modern stack for high-performance APIs and data tasks.",
            frontend: "React 18 + Tailwind",
            backend: "Python (FastAPI / Django)",
            database: "PostgreSQL / MongoDB",
            rationale: "Best for projects requiring AI integration, complex calculations, or heavy data processing."
        },
        {
            name: "Next.js Fullstack (Performance)",
            description: "Performance-first architecture with server-side capabilities.",
            frontend: "Next.js 14, Lucide React",
            backend: "Next.js API Routes",
            database: "Supabase / PostgreSQL",
            rationale: "Highly optimized for SEO, speed, and modern developer experience."
        }
    ])
    const [selectedStack, setSelectedStack] = useState(null)
    const [isGeneratingStacks, setIsGeneratingStacks] = useState(false)

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

        const savedDesign = currentProject.design || {};
        
        // 1. Tech Stack Loading
        if (savedDesign.techStacks?.length > 0) {
            setTechStacks(savedDesign.techStacks);
        }
        
        if (savedDesign.selectedStack) {
            setSelectedStack(savedDesign.selectedStack);
        }

        // 2. Diagrams Loading
        if (savedDesign.diagrams) {
            setDiagrams(prev => {
                const updated = { ...prev };
                Object.entries(savedDesign.diagrams).forEach(([key, val]) => {
                    if (updated[key]) {
                        // Support both legacy objects and current string-only formats
                        const codeString = typeof val === 'string' ? val : (val?.code || '');
                        if (codeString) {
                            updated[key] = {
                                ...updated[key],
                                code: codeString,
                                url: getPlantUMLUrl(codeString),
                                status: 'done'
                            };
                        }
                    }
                });
                return updated;
            });
        }

        // 3. Determine Navigation State / Step
        const hasSelected = !!savedDesign.selectedStack;
        const hasGeneratedDiagrams = Object.values(savedDesign.diagrams || {}).some(d => (typeof d === 'string' ? d.length > 5 : d?.code?.length > 5));

        if (hasSelected && hasGeneratedDiagrams) {
            setStep('complete');
        } else if (hasSelected) {
            setStep('diagrams');
        } else {
            setStep('techStack');
        }

        // 4. Background AI Refinement (Only if we don't have enough options yet)
        const isOnlyDefaults = (savedDesign.techStacks?.length || 0) < 4;
        if (currentProject.requirements && !hasSelected && isOnlyDefaults) {
            setTimeout(() => {
                generateTechStacksInBackground(currentProject.requirements)
            }, 800)
        }
    }, [currentProject?._id]) // Only re-run when project identity changes

    // Live re-render: when user manually edits code in textarea, debounce-render after 1.5s
    const renderTimerRef = useRef(null);
    const prevCodeRef = useRef('');
    useEffect(() => {
        const currentCode = diagrams[activeDiagram]?.code || '';
        // Only trigger if code actually changed and diagram was previously done (not still generating)
        if (
            currentCode &&
            currentCode !== prevCodeRef.current &&
            diagrams[activeDiagram]?.status === 'done'
        ) {
            prevCodeRef.current = currentCode;
            // Debounce: wait 1.5s after last keystroke before rendering
            clearTimeout(renderTimerRef.current);
            renderTimerRef.current = setTimeout(() => {
                renderDiagramCode(activeDiagram, currentCode);
            }, 1500);
        }
        return () => clearTimeout(renderTimerRef.current);
    }, [diagrams[activeDiagram]?.code, activeDiagram]);

    // Safety timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'loading' && currentProject) {
                setStep('techStack')
            }
        }, 3000)
        return () => clearTimeout(timeout)
    }, [step, currentProject?._id])

    const generateTechStacksInBackground = async (reqData) => {
        setIsGeneratingStacks(true)
        try {
            const result = await apiService.suggestTechStacks(reqData)
            if (Array.isArray(result) && result.length > 0) {
                // Prepend AI suggestions to ensure they appear first
                setTechStacks(prev => {
                    const existingNames = new Set(result.map(s => s.name.toLowerCase()));
                    const filteredPrev = prev.filter(s => !existingNames.has(s.name.toLowerCase()));
                    return [...result, ...filteredPrev];
                });
            }
        } catch (error) {
            console.error('[DesignAgent] Tech Stack generation failed:', error)
        } finally {
            setIsGeneratingStacks(false)
        }
    }

    /**
     * Render PlantUML code via backend proxy and update the diagram's url + status.
     * Used both after AI generation and after manual edits (debounced).
     */
    const renderDiagramCode = useCallback(async (type, code) => {
        if (!code || !code.includes('@startuml')) return;
        try {
            setDiagrams(prev => ({ ...prev, [type]: { ...prev[type], status: 'rendering' } }));
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const renderResp = await fetch(`${API_URL}/ai/plantuml/render`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify({ code }),
                signal: AbortSignal.timeout(30000)
            });
            if (!renderResp.ok) throw new Error(`Render HTTP ${renderResp.status}`);
            const svgText = await renderResp.text();
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const blobUrl = URL.createObjectURL(blob);
            setDiagrams(prev => ({
                ...prev,
                [type]: { ...prev[type], url: blobUrl, status: 'done', error: null }
            }));
        } catch (err) {
            console.warn(`[DesignAgent] renderDiagramCode fallback for ${type}:`, err.message);
            // Fallback: direct plantuml.com URL
            const fallbackUrl = getPlantUMLUrl(code);
            setDiagrams(prev => ({
                ...prev,
                [type]: { ...prev[type], url: fallbackUrl, status: 'done', error: null }
            }));
        }
    }, []);

    // Local normalization for refining AI output (lean, non-destructive)
    const normalizePlantUML = (codeRaw, type) => {
        // 1. Core structural cleaning (lean version - does NOT strip valid lines)
        let code = cleanPlantUML(codeRaw);

        // 2. Inject global styles if missing
        if (!code.toLowerCase().includes('skinparam')) {
            code = code.replace(/@startuml/i, `@startuml\n${DIAGRAM_STYLE}\n`);
        }

        // 3. Global syntax fixes (safe, non-destructive)
        code = code
            .replace(/\bnodo\b/gi, 'node')  // Common AI typo
            .replace(/skinparam\s+shadowing\s+true/gi, 'skinparam shadowing false');

        // 4. Activity-specific: inject start/stop if missing
        if (type === 'activity') {
            if (!code.includes('start')) code = code.replace(/@startuml[^\n]*/i, '@startuml\nstart');
            if (!code.includes('stop') && !code.includes('@enduml')) code = code.replace(/@enduml/i, 'stop\n@enduml');
        }

        // 5. Sequence: fix Mermaid arrow leaks
        if (type === 'sequence') {
            code = code.replace(/->>|=>>|-->>>/g, '->');
        }

        // 6. UseCase: ensure left-to-right for better readability
        if (type === 'useCase' && !code.includes('left to right direction')) {
            code = code.replace(/@startuml/i, '@startuml\nleft to right direction\n');
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
            // Step 1: Generate the PlantUML code via Mistral AI
            const result = await apiService.generateDiagrams(requirements, type);

            const hasDiagram = result && result[type];

            if (!hasDiagram) {
                setDiagrams(prev => ({
                    ...prev,
                    [type]: { ...prev[type], status: 'error', error: 'AI returned empty diagram. Click "Regenerate" to try again.' }
                }));
                return;
            }

            const code = normalizePlantUML(result[type], type);

            // Step 2: Store the code immediately so editor shows it
            setDiagrams(prev => ({
                ...prev,
                [type]: { ...prev[type], code, status: 'rendering' }
            }));

            // Step 3: Render via backend proxy
            await renderDiagramCode(type, code);

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
            const diagramLabel = current.label || activeDiagram;

            // Build the AI modification prompt — sent to backend Mistral (not gemini)
            const reqs = requirements?.functionalRequirements?.map(r => r.description).join('; ') || '';
            const modifyPayload = {
                prompt: `You are a PlantUML expert. Modify the following ${diagramLabel} diagram code based on the user instruction.

PROJECT CONTEXT:
${requirements?.description || 'N/A'}
REQUIREMENTS: ${reqs}

CURRENT CODE:
${current.code}

USER INSTRUCTION: ${customPrompt}

STRICT RULES:
1. Return ONLY the modified PlantUML code — no explanation, no markdown fences.
2. Preserve the diagram type (${diagramLabel}) — do NOT change it to another type.
3. Keep all existing elements unless the user explicitly asks to remove them.
4. Ensure the code starts with @startuml and ends with @enduml.
5. Fix any syntax errors in the process.
6. Maintain skinparam backgroundColor transparent and skinparam shadowing false.`
            };

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const resp = await fetch(`${API_URL}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
                },
                body: JSON.stringify(modifyPayload),
                signal: AbortSignal.timeout(60000)
            });

            if (!resp.ok) throw new Error(`AI modify failed: ${resp.status}`);
            const { text: resultRaw } = await resp.json();

            const code = normalizePlantUML(resultRaw, activeDiagram);

            if (code && code.includes('@startuml')) {
                // Store code then render
                setDiagrams(prev => ({
                    ...prev,
                    [activeDiagram]: { ...prev[activeDiagram], code, status: 'rendering' }
                }));
                await renderDiagramCode(activeDiagram, code);
                setCustomPrompt('')
            }
        } catch (error) {
            console.error('Modify failed:', error)
            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: { ...prev[activeDiagram], status: 'error', error: `Modification failed: ${error.message}` }
            }))
        } finally {
            setIsModifying(false)
        }
    }

    const handleComplete = async () => {
        const hasAllDiagrams = Object.values(diagrams).every(d => d.status === 'done' || d.code)
        if (!hasAllDiagrams) {
            if (!window.confirm('Some diagrams are not yet generated. Complete anyway?')) return
        }

        const designData = {
            techStacks: techStacks,
            selectedStack: selectedStack,
            diagrams: Object.entries(diagrams).reduce((acc, [key, val]) => {
                acc[key] = val.code;
                return acc;
            }, {})
        }
        designData.completedAt = new Date().toISOString()

        try {
            // saveDesign now automatically updates status to 'development' on the backend
            await apiService.saveDesign(currentProject?._id, designData)
            
            // Refresh to sync the state (including status)
            await refreshCurrentProject()
            onComplete(designData)
        } catch (error) {
            console.error('[DesignAgent] Save failed:', error)
            const errorMsg = error.response?.data?.message || error.message
            alert(`Failed to save design: ${errorMsg}`)
        }
    }

    // Safety helper to prevent "Objects are not valid as a React child"
    const renderSafeValue = (val) => {
        if (!val) return 'Not Specified';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            // If it's the tech stack detail object we saw in the console
            return Object.entries(val)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join(', ');
        }
        return String(val);
    };

    const handleScroll = (e) => {        setShowHero(e.target.scrollTop < 50)
    }

    const renderHero = () => (
        <div className={`agent-hero ${showHero ? 'visible' : 'hidden'}`}>
            <div className="agent-title-section">
                <div className="agent-badge">
                    <span className="agent-emoji">🎨</span>
                    <span>System Design Agent</span>
                </div>
                <h2>System Architecture & Design</h2>
                <p>Blueprint for {currentProject?.name || 'Loading...'}</p>
            </div>
            <button className="close-agent" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6L18 18" />
                </svg>
            </button>
        </div>
    )

    if (!currentProject) {
        return (
            <div className="agent-workspace centered-state">
                <div className="loading-spinner"></div>
                <p>Loading project data...</p>
                <button className="btn-secondary" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
            </div>
        )
    }

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
                        className={`step-tab ${step === 'techStack' ? 'active' : ''}`}
                        onClick={() => setStep('techStack')}
                    >
                        🏗️ Tech Stack
                    </button>
                    <button
                        className={`step-tab ${step === 'diagrams' ? 'active' : ''}`}
                        onClick={() => setStep('diagrams')}
                    >
                        📊 Diagrams
                    </button>
                </div>
                {/* TECH STACK SELECTION VIEW */}
                {step === 'techStack' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Select Your Technical Stack</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <p style={{ margin: 0 }}>Choose the foundation for your project. This will drive the code generation in the next phase.</p>
                                {isGeneratingStacks && (
                                    <div className="ai-status-tag">
                                        <div className="small-spinner"></div>
                                        <span>AI is tailoring more options...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="tech-stack-grid">
                                {techStacks.map((stack, idx) => (
                                    <div
                                        key={idx}
                                        className={`stack-option-card ${selectedStack?.name === stack.name ? 'selected' : ''}`}
                                        onClick={() => setSelectedStack(stack)}
                                    >
                                        <div className="stack-selection-indicator">
                                            {selectedStack?.name === stack.name ? '✓' : ''}
                                        </div>
                                        <h4>{renderSafeValue(stack.name)}</h4>
                                        <p className="stack-desc">{renderSafeValue(stack.description)}</p>

                                        <div className="stack-details">
                                            <div className="stack-detail-item">
                                                <span className="detail-label">Frontend:</span>
                                                <span className="detail-value">{renderSafeValue(stack.frontend)}</span>
                                            </div>
                                            <div className="stack-detail-item">
                                                <span className="detail-label">Backend:</span>
                                                <span className="detail-value">{renderSafeValue(stack.backend)}</span>
                                            </div>
                                            <div className="stack-detail-item">
                                                <span className="detail-label">Database:</span>
                                                <span className="detail-value">{renderSafeValue(stack.database)}</span>
                                            </div>
                                        </div>

                                        <div className="stack-rationale">
                                            <strong>Why this?</strong>
                                            <p>{stack.rationale}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="step-actions">
                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        setStep('diagrams');
                                        // Auto-save selection so it persists if they revisit the phase
                                        try {
                                            const currentDesign = currentProject?.design || {};
                                            await apiService.saveDesign(currentProject?._id, {
                                                ...currentDesign,
                                                techStacks: techStacks,
                                                selectedStack: selectedStack
                                            });
                                            await refreshCurrentProject();
                                        } catch (e) {
                                            console.warn('[DesignAgent] Auto-save selection failed:', e);
                                        }
                                    }}
                                    disabled={!selectedStack}
                                >
                                    Proceed to Diagrams →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DIAGRAMS VIEW */}
                {step === 'diagrams' && (
                    <div className="step-container diagrams-step">
                        <div className="diagram-workspace">
                            {/* Left Sidebar: Diagram Selector */}
                            <div className="diagram-sidebar">
                                <div className="sidebar-header">
                                    <span>DIAGRAMS</span>
                                </div>
                                <div className="diagram-pills-list">
                                    {Object.entries(diagrams).map(([key, data]) => (
                                        <button
                                            key={key}
                                            className={`diagram-sidebar-pill ${activeDiagram === key ? 'active' : ''}`}
                                            onClick={() => setActiveDiagram(key)}
                                        >
                                            <span className="pill-label">{data.label}</span>
                                            {data.status === 'done' && <span className="pill-status success">✓</span>}
                                            {(data.status === 'loading' || data.status === 'rendering') && <span className="pill-status loading">...</span>}
                                            {data.status === 'error' && <span className="pill-status error">!</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="sidebar-footer">
                                     <button className="btn-secondary-small" onClick={() => setStep('techStack')}>← Stack</button>
                                </div>
                            </div>

                            {/* Editor Column (MIDDLE) */}
                            <div className="diagram-column editor-column">
                                <div className="column-header">
                                    <h4>{diagrams[activeDiagram].label} Script</h4>
                                    <div className="status-indicator">
                                        {diagrams[activeDiagram].status === 'loading' && <span className="small-spinner"></span>}
                                    </div>
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
                                    placeholder="PlantUML code will appear here..."
                                />
                                <div className="prompt-box">
                                    <div className="prompt-label">
                                        ✨ AI Diagram Assistant
                                    </div>
                                    <div className="prompt-input-wrapper">
                                        <textarea
                                            className="prompt-textarea"
                                            placeholder="Ask AI to modify this diagram (e.g., 'Add a login step', 'Remove the Admin actor')..."
                                            value={customPrompt}
                                            onChange={e => setCustomPrompt(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey && !isModifying) {
                                                    e.preventDefault();
                                                    handleModify();
                                                }
                                            }}
                                            disabled={isModifying}
                                            rows={2}
                                        />
                                        <button 
                                            className="btn-send-magic" 
                                            onClick={handleModify} 
                                            disabled={isModifying || !customPrompt.trim()}
                                            title="Modify Diagram with AI"
                                        >
                                            {isModifying ? <div className="small-spinner"></div> : '🪄'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Column (RIGHT) */}
                            <div className="diagram-column preview-column">
                                <div className="column-header">
                                    <h4>Live Preview</h4>
                                    <div className="preview-toolbar">
                                        <button className="toolbar-btn" onClick={() => generateDiagram(activeDiagram)} disabled={diagrams[activeDiagram].status === 'loading'}>
                                            ⟳ Regenerate
                                        </button>
                                    </div>
                                </div>
                                <div className="preview-container">
                                    {(diagrams[activeDiagram].status === 'loading' || diagrams[activeDiagram].status === 'rendering') ? (
                                        <div className="centered-state">
                                            <div className="loading-spinner-large"></div>
                                            <p>
                                                {diagrams[activeDiagram].status === 'rendering'
                                                    ? `Rendering ${diagrams[activeDiagram].label}...`
                                                    : `Generating ${diagrams[activeDiagram].label}...`
                                                }
                                            </p>
                                        </div>
                                    ) : diagrams[activeDiagram].status === 'error' ? (
                                        <div className="centered-state">
                                            <div className="empty-preview-icon">⚠️</div>
                                            <p className="error-text">Generation Failed</p>
                                            <p>{diagrams[activeDiagram].error || 'Possible syntax error or API timeout.'}</p>
                                            <button className="btn-primary" onClick={() => generateDiagram(activeDiagram)}>
                                                Try Again
                                            </button>
                                        </div>
                                    ) : diagrams[activeDiagram].url ? (
                                        <div className="preview-content">
                                            <img
                                                src={diagrams[activeDiagram].url}
                                                alt={`${diagrams[activeDiagram].label} Diagram`}
                                                onClick={() => setLightbox({ isOpen: true, url: diagrams[activeDiagram].url })}
                                                onError={(e) => {
                                                    // If the PlantUML server returns an error image or broken URL,
                                                    // fall back to showing the error state so user can retry
                                                    e.target.style.display = 'none';
                                                    setDiagrams(prev => ({
                                                        ...prev,
                                                        [activeDiagram]: {
                                                            ...prev[activeDiagram],
                                                            status: 'error',
                                                            error: 'Diagram rendering failed. The PlantUML code may contain syntax errors. Try regenerating or editing the code manually.'
                                                        }
                                                    }));
                                                }}
                                                onLoad={(e) => { e.target.style.display = ''; }}
                                            />
                                            <div className="floating-actions">
                                                <button onClick={() => setLightbox({ isOpen: true, url: diagrams[activeDiagram].url })}>🔍 Zoom</button>
                                                <button onClick={() => window.open(diagrams[activeDiagram].url.replace('/svg/', '/png/'), '_blank')}>🖼️ PNG</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="centered-state">
                                            <div className="empty-preview-icon">📊</div>
                                            <p>No diagram generated yet.</p>
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
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setStep('techStack')}>← Tech Stack</button>
                            <button className="btn-primary" onClick={handleComplete}>
                                Complete Design Phase & Move to Development →
                            </button>
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
