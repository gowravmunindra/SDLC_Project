import { useState, useEffect, useRef } from 'react'
import geminiService from '../services/geminiService'
import huggingFaceService from '../services/huggingFaceService'
import { designPrompt } from '../utils/promptTemplates'
import { getPlantUMLUrl, cleanPlantUML } from '../utils/plantuml'
import './DesignAgent.css'

function DesignAgent({ onClose, onComplete }) {
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

    // Load Data
    useEffect(() => {
        const savedRequirements = localStorage.getItem('sdlc_requirements')
        if (savedRequirements) {
            const reqData = JSON.parse(savedRequirements)
            setRequirements(reqData)
            analyzeAndGenerateDesign(reqData)
        } else {
            // Fallback for demo
            const sampleReq = {
                projectDescription: 'A smart home automation system that allows users to control devices remotely.',
                functionalRequirements: [
                    { title: 'Device Control', description: 'Turn lights on/off' },
                    { title: 'User Auth', description: 'Secure login' }
                ]
            }
            setRequirements(sampleReq)
            analyzeAndGenerateDesign(sampleReq)
        }
    }, [])

    // Auto-generate diagrams when architecture is ready
    useEffect(() => {
        if (step === 'architecture' && requirements) {
            generateAllDiagrams()
        }
    }, [step, requirements])

    const generateAllDiagrams = async () => {
        const types = Object.keys(diagrams).filter(t => diagrams[t].status === 'pending')

        for (const type of types) {
            await generateDiagram(type)
            // Add delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }

    // Scroll Handler for Hero
    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop
        setShowHero(scrollTop < 50)
    }

    const analyzeAndGenerateDesign = async (reqData) => {
        try {
            // Generate Architecture Text (keeping existing consistency)
            const prompt = designPrompt(reqData)
            let archData = null

            try {
                // Try HuggingFace first as per previous flow
                archData = await huggingFaceService.generateJSON(prompt)
            } catch (e) {
                console.warn('HF failed, using fallback arch', e)
                archData = generateArchitectureFallback(reqData)
            }

            if (archData && archData.architecture) {
                setArchitecture(archData.architecture)
            } else {
                setArchitecture(generateArchitectureFallback(reqData).architecture)
            }

            setStep('architecture')
        } catch (error) {
            console.error('Error generating design:', error)
            setArchitecture(generateArchitectureFallback(reqData).architecture)
            setStep('architecture')
        }
    }

    const generateArchitectureFallback = (reqData) => {
        return {
            architecture: {
                type: 'Monolithic',
                justification: 'Simplified architecture for immediate development.',
                layers: [
                    { name: 'Frontend', description: 'React-based UI', technologies: ['React', 'Vite'] },
                    { name: 'Backend', description: 'Node.js/Express API', technologies: ['Node', 'Express'] },
                    { name: 'Database', description: 'Relational Store', technologies: ['PostgreSQL'] }
                ]
            }
        }
    }

    // Core PlantUML Generation
    const generateDiagram = async (type, manualPrompt = null) => {
        setDiagrams(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'loading', error: null }
        }))

        try {
            const prompt = constructPrompt(type, requirements, manualPrompt)
            console.log(`[DesignAgent] Generating ${type} diagram...`)
            const code = await geminiService.generateContent(prompt)

            if (!code) throw new Error("Received empty response from AI")

            const cleanCode = cleanPlantUML(code)
            if (!cleanCode) throw new Error("Failed to parse valid PlantUML code")

            const url = getPlantUMLUrl(cleanCode)

            setDiagrams(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    code: cleanCode,
                    url: url,
                    status: 'done',
                    error: null
                }
            }))

        } catch (error) {
            console.error(`[DesignAgent] Error generating ${type}:`, error)
            setDiagrams(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    status: 'error',
                    error: error.message || "Unknown error occurred"
                }
            }))
        }
    }

    const constructPrompt = (type, reqs, manualInstructions) => {
        const diagramTypes = {
            useCase: "Use Case Diagram. Define actors (User, Admin, etc) and use cases. Use proper 'actor' and 'usecase' syntax. Connect with -->.",
            class: "Class Diagram. Define classes with attributes and methods. Use proper relationships (--|, *--, etc).",
            sequence: "Sequence Diagram. Show the flow of a main feature (e.g. Login or Core Action). Use -> for messages.",
            activity: "Activity Diagram. Show a workflow logic (start to end). Use :action; and if/else.",
            state: "State Chart Diagram. Show states of a core entity (e.g. Order, User). Use [*] -> State.",
            component: "Component Diagram. Show system components/modules and their interfaces/dependencies.",
            deployment: "Deployment Diagram. Show nodes (Server, Database, Client) and artifacts."
        }

        return `
        You are an expert UML architect.
        TASK: Generate a VALID PlantUML ${diagramTypes[type]}
        
        System Description: ${reqs?.projectDescription}
        Key Requirements: ${reqs?.functionalRequirements?.map(r => r.title)?.join(', ') || ''}
        
        ${manualInstructions ? `USER REQUEST: ${manualInstructions}` : ''}
        
        STRICT RULES:
        - Output ONLY the PlantUML code.
        - Start with @startuml
        - End with @enduml
        - NO markdown formatting (no \`\`\`).
        - Use standard PlantUML syntax only.
        - Keep it concise but professional.
        `
    }

    const handleModify = async () => {
        if (!customPrompt.trim()) return
        setIsModifying(true)

        const current = diagrams[activeDiagram]

        try {
            const prompt = `
            You are a PlantUML Editor.
            Update this diagram based on request: "${customPrompt}"
            
            Current PlantUML:
            ${current.code}
            
            Return ONLY the updated PlantUML code.
            Start with @startuml, end with @enduml.
            `

            const newCodeRaw = await geminiService.generateContent(prompt)
            const newCode = cleanPlantUML(newCodeRaw)
            const url = getPlantUMLUrl(newCode)

            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: {
                    ...prev[activeDiagram],
                    code: newCode,
                    url: url
                }
            }))
            setCustomPrompt('')
        } catch (e) {
            console.error("Modification failed", e)
        } finally {
            setIsModifying(false)
        }
    }

    const handleCodeEdit = (e) => {
        const newCode = e.target.value
        setDiagrams(prev => ({
            ...prev,
            [activeDiagram]: { ...prev[activeDiagram], code: newCode }
        }))
    }

    // Debounced render or manual "Update" button needed for text edits
    // We'll use a manual button to avoid flicker
    const handleManualRender = () => {
        const current = diagrams[activeDiagram]
        const url = getPlantUMLUrl(current.code)
        setDiagrams(prev => ({
            ...prev,
            [activeDiagram]: { ...current, url: url }
        }))
    }

    const handleComplete = () => {
        const designData = {
            requirements,
            architecture,
            diagrams,
            generatedAt: new Date().toISOString()
        }
        localStorage.setItem('sdlc_design', JSON.stringify(designData))
        if (onComplete) onComplete(designData)
        setStep('complete')
    }

    // Render Helpers
    const renderHero = () => (
        <div className={`agent-hero ${showHero ? 'visible' : 'hidden'}`}>
            <div className="agent-title-section">
                <div className="agent-badge">
                    <span className="agent-emoji">🎨</span>
                    <span>System Design Agent</span>
                </div>
                <h2>System Architecture & Design</h2>
                <p>Comprehensive design based on requirements</p>
            </div>
            <button className="close-agent" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6L18 18" />
                </svg>
            </button>
        </div>
    )

    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="agent-content center-content">
                    <div className="loading-spinner-large"></div>
                    <p style={{ marginTop: 20 }}>Analyzing requirements...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="agent-workspace">
            {renderHero()}

            <div
                className={`agent-content ${!showHero ? 'expanded' : ''}`}
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
                {step === 'architecture' && architecture && (
                    <div className="step-container fade-in">
                        <div className="architecture-card glass-panel">
                            <div className="arch-header">
                                <h3>{architecture.type} Architecture</h3>
                                <div className="badge-primary">{architecture.type}</div>
                            </div>
                            <p className="arch-justification">{architecture.justification}</p>
                        </div>

                        <div className="layers-grid">
                            {architecture.layers?.map((layer, idx) => (
                                <div key={idx} className="layer-card glass-panel interactive">
                                    <div className="layer-number">{idx + 1}</div>
                                    <h4>{layer.name}</h4>
                                    <p>{layer.description}</p>
                                    <div className="tech-tags">
                                        {layer.technologies?.map(t => (
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
                )}

                {/* DIAGRAMS VIEW */}
                {step === 'diagrams' && (
                    <div className="step-container fade-in">
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
                                    {data.status === 'error' && <span className="status-dot error"></span>}
                                </button>
                            ))}
                        </div>

                        <div className="diagram-workspace glass-panel">
                            {/* Editor Column */}
                            <div className="diagram-column editor-column">
                                <div className="column-header">
                                    <h4>PlantUML Code</h4>
                                    <button className="btn-xs" onClick={handleManualRender}>
                                        ⟳ Render
                                    </button>
                                </div>
                                <textarea
                                    className="code-editor-area"
                                    value={diagrams[activeDiagram].code}
                                    onChange={handleCodeEdit}
                                    spellCheck="false"
                                />
                                <div className="prompt-box">
                                    <input
                                        type="text"
                                        placeholder={`Modify ${diagrams[activeDiagram].label}... (e.g. "Add User node")`}
                                        value={customPrompt}
                                        onChange={e => setCustomPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleModify()}
                                    />
                                    <button
                                        className="btn-send"
                                        onClick={handleModify}
                                        disabled={isModifying}
                                    >
                                        {isModifying ? '...' : '➤'}
                                    </button>
                                </div>
                            </div>

                            {/* Preview Column */}
                            <div className="diagram-column preview-column">
                                {diagrams[activeDiagram].status === 'loading' ? (
                                    <div className="centered-state">
                                        <div className="loading-spinner"></div>
                                        <p>Generating Diagram...</p>
                                    </div>
                                ) : diagrams[activeDiagram].status === 'error' ? (
                                    <div className="centered-state error">
                                        <p style={{ fontWeight: 'bold' }}>⚠ Failed to generate</p>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#f87171',
                                            background: 'rgba(255,0,0,0.1)',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            maxWidth: '90%',
                                            fontFamily: 'monospace',
                                            marginBottom: '10px'
                                        }}>
                                            {diagrams[activeDiagram].error || "Unknown Error"}
                                        </div>
                                        <button className="btn-secondary" onClick={() => generateDiagram(activeDiagram)}>
                                            ⟳ Retry Generation
                                        </button>
                                    </div>
                                ) : diagrams[activeDiagram].url ? (
                                    <div className="preview-content">
                                        <img
                                            src={diagrams[activeDiagram].url}
                                            alt="Diagram"
                                        />
                                        <div className="preview-actions">
                                            <a href={diagrams[activeDiagram].url} target="_blank" rel="noreferrer" className="btn-icon">
                                                ⤢ Fullscreen
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="centered-state">
                                        <p>No diagram yet</p>
                                        <button className="btn-secondary" onClick={() => generateDiagram(activeDiagram)}>
                                            Generate
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setStep('architecture')}>← Back</button>
                            <button className="btn-primary" onClick={handleComplete}>✅ Finalize Design</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesignAgent
