import { useState } from 'react'
import geminiService from '../services/geminiService'
import { requirementsPrompt } from '../utils/promptTemplates'

function RequirementsAgent({ onClose, onComplete }) {
    const [step, setStep] = useState('input') // input, analysis, review, complete
    const [projectDescription, setProjectDescription] = useState('')
    const [functionalRequirements, setFunctionalRequirements] = useState([])
    const [nonFunctionalRequirements, setNonFunctionalRequirements] = useState({
        performance: [],
        security: [],
        usability: [],
        scalability: [],
        reliability: []
    })
    const [assumptions, setAssumptions] = useState([])
    const [constraints, setConstraints] = useState([])
    const [stakeholders, setStakeholders] = useState([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleAnalyze = () => {
        if (!projectDescription.trim()) {
            alert('Please provide a project description first!')
            return
        }

        setIsAnalyzing(true)

        // Simulate AI analysis (in real implementation, this would call an AI service)
        setTimeout(() => {
            analyzeRequirements(projectDescription)
            setIsAnalyzing(false)
            setStep('review')
        }, 2000)
    }

    const analyzeRequirements = async (description) => {
        try {
            // Generate prompt for Gemini
            const prompt = requirementsPrompt(description)
            
            // Call Gemini AI
            const result = await geminiService.generateJSON(prompt)
            
            // Set the generated requirements
            setFunctionalRequirements(result.functionalRequirements || [])
            setNonFunctionalRequirements(result.nonFunctionalRequirements || {
                performance: [],
                security: [],
                usability: [],
                scalability: [],
                reliability: []
            })
            setStakeholders(result.stakeholders || [])
            setAssumptions(result.assumptions || [])
            setConstraints(result.constraints || [])
        } catch (error) {
            console.error('Error analyzing requirements:', error)
            
            // Fallback to basic requirements on error
            alert('AI analysis failed. Using fallback requirements. Error: ' + error.message)
            
            // Generate basic fallback requirements
            const frs = []
            const lowerDesc = description.toLowerCase()
            
            if (lowerDesc.includes('user') || lowerDesc.includes('login')) {
                frs.push({
                    id: 'FR-001',
                    title: 'User Authentication',
                    description: 'The system shall allow users to register and login with email and password',
                    priority: 'High',
                    editable: true
                })
            }
            if (lowerDesc.includes('data') || lowerDesc.includes('store')) {
                frs.push({
                    id: 'FR-002',
                    title: 'Data Management',
                    description: 'The system shall provide CRUD operations for managing data',
                    priority: 'High',
                    editable: true
                })
            }
            
            frs.push({
                id: `FR-00${frs.length + 1}`,
                title: 'Core Functionality',
                description: 'The system shall implement the main features as described in the project scope',
                priority: 'High',
                editable: true
            })

            setFunctionalRequirements(frs)
            
            setNonFunctionalRequirements({
                performance: [
                    { id: 'NFR-P-001', description: 'Page load time should be under 3 seconds', editable: true }
                ],
                security: [
                    { id: 'NFR-S-001', description: 'All passwords must be encrypted', editable: true }
                ],
                usability: [
                    { id: 'NFR-U-001', description: 'Interface should be intuitive', editable: true }
                ],
                scalability: [
                    { id: 'NFR-SC-001', description: 'Architecture should support scaling', editable: true }
                ],
                reliability: [
                    { id: 'NFR-R-001', description: 'System uptime should be at least 99%', editable: true }
                ]
            })

            setAssumptions([
                { id: 'A-001', description: 'Users have basic computer literacy', editable: true }
            ])

            setConstraints([
                { id: 'C-001', description: 'Project must be completed within budget', editable: true }
            ])

            setStakeholders([
                { id: 'SH-001', name: 'End Users', role: 'Primary users of the system', editable: true }
            ])
        }
    }

    const addFunctionalRequirement = () => {
        const newFR = {
            id: `FR-${String(functionalRequirements.length + 1).padStart(3, '0')}`,
            title: '',
            description: '',
            priority: 'Medium',
            editable: true
        }
        setFunctionalRequirements([...functionalRequirements, newFR])
    }

    const updateFunctionalRequirement = (index, field, value) => {
        const updated = [...functionalRequirements]
        updated[index][field] = value
        setFunctionalRequirements(updated)
    }

    const removeFunctionalRequirement = (index) => {
        setFunctionalRequirements(functionalRequirements.filter((_, i) => i !== index))
    }

    const addNFR = (category) => {
        const categoryNFRs = nonFunctionalRequirements[category]
        const newNFR = {
            id: `NFR-${category.charAt(0).toUpperCase()}-${String(categoryNFRs.length + 1).padStart(3, '0')}`,
            description: '',
            editable: true
        }
        setNonFunctionalRequirements({
            ...nonFunctionalRequirements,
            [category]: [...categoryNFRs, newNFR]
        })
    }

    const updateNFR = (category, index, value) => {
        const updated = { ...nonFunctionalRequirements }
        updated[category][index].description = value
        setNonFunctionalRequirements(updated)
    }

    const removeNFR = (category, index) => {
        const updated = { ...nonFunctionalRequirements }
        updated[category] = updated[category].filter((_, i) => i !== index)
        setNonFunctionalRequirements(updated)
    }

    const handleComplete = () => {
        const requirementsData = {
            projectDescription,
            functionalRequirements,
            nonFunctionalRequirements,
            assumptions,
            constraints,
            stakeholders,
            generatedAt: new Date().toISOString()
        }

        // Save to localStorage for now (in production, would save to backend)
        localStorage.setItem('sdlc_requirements', JSON.stringify(requirementsData))

        setStep('complete')

        // Notify parent component
        if (onComplete) {
            onComplete(requirementsData)
        }
    }

    const exportRequirements = () => {
        const requirementsData = {
            projectDescription,
            functionalRequirements,
            nonFunctionalRequirements,
            assumptions,
            constraints,
            stakeholders
        }

        const blob = new Blob([JSON.stringify(requirementsData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'requirements-specification.json'
        a.click()
    }

    return (
        <div className="agent-workspace">
            <div className="agent-header">
                <div className="agent-title-section">
                    <div className="agent-badge">
                        <span className="agent-emoji">📋</span>
                        <span>Requirements Analyst Agent</span>
                    </div>
                    <h2>Project Requirements Analysis</h2>
                    <p>Let's define what your project needs to accomplish</p>
                </div>
                <button className="close-agent" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6L18 18" />
                    </svg>
                </button>
            </div>

            <div className="agent-content">
                {/* Step 1: Project Description Input */}
                {step === 'input' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Step 1: Describe Your Project</h3>
                            <p>Tell me about your project in simple terms. What problem are you solving? Who will use it?</p>
                        </div>

                        <div className="input-section">
                            <label className="input-label">Project Description</label>
                            <textarea
                                className="project-description-input"
                                placeholder="Example: I want to build an online task management system where teams can create projects, assign tasks to members, track progress, and generate reports. Users should be able to login, collaborate in real-time, and receive notifications..."
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                rows={10}
                            />

                            <div className="helper-text">
                                <strong>💡 Tips:</strong> Include information about:
                                <ul>
                                    <li>What the system should do</li>
                                    <li>Who will use it</li>
                                    <li>Key features you envision</li>
                                    <li>Any specific constraints or requirements</li>
                                </ul>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button
                                className="btn-primary-action"
                                onClick={handleAnalyze}
                                disabled={!projectDescription.trim() || isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Analyze Requirements
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review and Edit Requirements */}
                {step === 'review' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Step 2: Review & Refine Requirements</h3>
                            <p>I've analyzed your project and generated requirements. Review, edit, add, or remove items as needed.</p>
                        </div>

                        {/* Functional Requirements */}
                        <div className="requirements-section">
                            <div className="section-title-bar">
                                <h4>📌 Functional Requirements (What the system should do)</h4>
                                <button className="btn-add" onClick={addFunctionalRequirement}>
                                    + Add Requirement
                                </button>
                            </div>

                            <div className="requirements-list">
                                {functionalRequirements.map((fr, index) => (
                                    <div key={fr.id} className="requirement-card">
                                        <div className="requirement-header">
                                            <span className="requirement-id">{fr.id}</span>
                                            <select
                                                className="priority-select"
                                                value={fr.priority}
                                                onChange={(e) => updateFunctionalRequirement(index, 'priority', e.target.value)}
                                            >
                                                <option value="High">High Priority</option>
                                                <option value="Medium">Medium Priority</option>
                                                <option value="Low">Low Priority</option>
                                            </select>
                                            <button
                                                className="btn-remove"
                                                onClick={() => removeFunctionalRequirement(index)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="requirement-title"
                                            placeholder="Requirement Title"
                                            value={fr.title}
                                            onChange={(e) => updateFunctionalRequirement(index, 'title', e.target.value)}
                                        />
                                        <textarea
                                            className="requirement-description"
                                            placeholder="Detailed description of this requirement..."
                                            value={fr.description}
                                            onChange={(e) => updateFunctionalRequirement(index, 'description', e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Non-Functional Requirements */}
                        <div className="requirements-section">
                            <div className="section-title-bar">
                                <h4>⚙️ Non-Functional Requirements (How the system should perform)</h4>
                            </div>

                            {Object.entries(nonFunctionalRequirements).map(([category, nfrs]) => (
                                <div key={category} className="nfr-category">
                                    <div className="category-header">
                                        <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                                        <button className="btn-add-small" onClick={() => addNFR(category)}>
                                            + Add
                                        </button>
                                    </div>
                                    <div className="nfr-list">
                                        {nfrs.map((nfr, index) => (
                                            <div key={nfr.id} className="nfr-item">
                                                <span className="nfr-id">{nfr.id}</span>
                                                <input
                                                    type="text"
                                                    className="nfr-input"
                                                    placeholder="Requirement description..."
                                                    value={nfr.description}
                                                    onChange={(e) => updateNFR(category, index, e.target.value)}
                                                />
                                                <button
                                                    className="btn-remove-small"
                                                    onClick={() => removeNFR(category, index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stakeholders */}
                        <div className="requirements-section">
                            <div className="section-title-bar">
                                <h4>👥 Stakeholders</h4>
                            </div>
                            <div className="stakeholder-list">
                                {stakeholders.map((sh) => (
                                    <div key={sh.id} className="stakeholder-item">
                                        <strong>{sh.name}</strong>
                                        <span>{sh.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assumptions & Constraints */}
                        <div className="two-column-section">
                            <div className="requirements-section">
                                <div className="section-title-bar">
                                    <h4>💭 Assumptions</h4>
                                </div>
                                <ul className="simple-list">
                                    {assumptions.map((a) => (
                                        <li key={a.id}>{a.description}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="requirements-section">
                                <div className="section-title-bar">
                                    <h4>⚠️ Constraints</h4>
                                </div>
                                <ul className="simple-list">
                                    {constraints.map((c) => (
                                        <li key={c.id}>{c.description}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setStep('input')}>
                                ← Back to Edit Description
                            </button>
                            <button className="btn-secondary" onClick={exportRequirements}>
                                📥 Export JSON
                            </button>
                            <button className="btn-primary-action" onClick={handleComplete}>
                                Complete & Save
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Completion */}
                {step === 'complete' && (
                    <div className="step-container completion-screen">
                        <div className="completion-icon">✅</div>
                        <h3>Requirements Analysis Complete!</h3>
                        <p>Your project requirements have been documented and saved.</p>

                        <div className="completion-summary">
                            <div className="summary-stat">
                                <div className="stat-number">{functionalRequirements.length}</div>
                                <div className="stat-label">Functional Requirements</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">
                                    {Object.values(nonFunctionalRequirements).reduce((sum, arr) => sum + arr.length, 0)}
                                </div>
                                <div className="stat-label">Non-Functional Requirements</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{stakeholders.length}</div>
                                <div className="stat-label">Stakeholders</div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h4>🎯 What's Next?</h4>
                            <p>Your requirements are ready! You can now proceed to the <strong>Design Phase</strong> where the Design Agent will create system architecture based on these requirements.</p>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={exportRequirements}>
                                📥 Export Requirements
                            </button>
                            <button className="btn-primary-action" onClick={onClose}>
                                Close & Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RequirementsAgent
