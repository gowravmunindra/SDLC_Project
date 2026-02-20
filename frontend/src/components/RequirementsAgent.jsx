import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import huggingFaceService from '../services/huggingFaceService'
import { requirementsPrompt } from '../utils/promptTemplates'
import { convertToIEEEFormat } from '../utils/ieeeFormatConverter'
import { generateIEEEPDF } from '../utils/ieeePDFGenerator'
import { parseIEEEPDF, validateParsedData } from '../utils/pdfParser'

function RequirementsAgent({ onClose, onComplete }) {
    const { currentProject, updateProject, refreshCurrentProject } = useProject()
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
    const [isImporting, setIsImporting] = useState(false)

    // Load existing requirements data when component mounts or project changes
    useEffect(() => {
        if (currentProject && currentProject.requirements) {
            const req = currentProject.requirements

            // Load all existing data
            if (req.projectDescription) {
                setProjectDescription(req.projectDescription)
            }

            if (req.functionalRequirements && req.functionalRequirements.length > 0) {
                setFunctionalRequirements(req.functionalRequirements)
            }

            if (req.nonFunctionalRequirements) {
                setNonFunctionalRequirements({
                    performance: req.nonFunctionalRequirements.performance || [],
                    security: req.nonFunctionalRequirements.security || [],
                    usability: req.nonFunctionalRequirements.usability || [],
                    scalability: req.nonFunctionalRequirements.scalability || [],
                    reliability: req.nonFunctionalRequirements.reliability || []
                })
            }

            if (req.assumptions && req.assumptions.length > 0) {
                setAssumptions(req.assumptions)
            }

            if (req.constraints && req.constraints.length > 0) {
                setConstraints(req.constraints)
            }

            if (req.stakeholders && req.stakeholders.length > 0) {
                setStakeholders(req.stakeholders)
            }

            // If we have requirements data, go directly to review step
            if (req.functionalRequirements && req.functionalRequirements.length > 0) {
                setStep('review')
            }
        }
    }, [currentProject])

    const handleAnalyze = async () => {
        if (!projectDescription.trim()) {
            alert('Please provide a project description first!')
            return
        }

        setIsAnalyzing(true)

        try {
            // Wait for AI analysis to complete
            await analyzeRequirements(projectDescription)

            // Only move to review after we have data
            setIsAnalyzing(false)
            setStep('review')
        } catch (error) {
            console.error('Analysis failed:', error)
            setIsAnalyzing(false)
            alert('Failed to analyze requirements. Please try again.')
        }
    }

    const analyzeRequirements = async (description) => {
        try {
            // Generate prompt for Gemini
            const prompt = requirementsPrompt(description)

            // Call Hugging Face AI
            const result = await huggingFaceService.generateJSON(prompt, 2, true)

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

    const handleImportPDF = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file')
            return
        }

        setIsImporting(true)

        try {
            // Parse PDF using AI
            const parsedData = await parseIEEEPDF(file, true) // Pass true if parseIEEEPDF supports it, but usually it calls geminiService internally

            // Validate and clean data
            const validatedData = validateParsedData(parsedData)

            // Populate all fields
            setProjectDescription(validatedData.projectDescription)
            setFunctionalRequirements(validatedData.functionalRequirements)
            setNonFunctionalRequirements(validatedData.nonFunctionalRequirements)
            setStakeholders(validatedData.stakeholders)
            setAssumptions(validatedData.assumptions)
            setConstraints(validatedData.constraints)

            setIsImporting(false)
            setStep('review')

            alert('✅ IEEE SRS PDF imported successfully! Review and edit the requirements below.')

        } catch (error) {
            console.error('PDF import failed:', error)
            setIsImporting(false)
            alert('Failed to import PDF. Please ensure it\'s a valid IEEE SRS format or try manual entry.')
        }
    }

    const handleComplete = async () => {
        const requirementsData = {
            projectDescription,
            functionalRequirements,
            nonFunctionalRequirements,
            assumptions,
            constraints,
            stakeholders,
            completedAt: new Date().toISOString()
        }

        // Save to database using current project ID
        if (currentProject) {
            try {
                await apiService.saveRequirements(currentProject._id, requirementsData)

                // Update project status
                await updateProject(currentProject._id, { status: 'design' })

                // Refresh the entire project to get updated requirements
                await refreshCurrentProject()

                console.log('[RequirementsAgent] Requirements saved and project refreshed')
            } catch (error) {
                console.error('Error saving requirements:', error)
                alert('Failed to save requirements. Please try again.')
                return
            }
        }

        setStep('complete')

        // Auto-navigate to next phase after a brief delay
        setTimeout(() => {
            if (onComplete) {
                onComplete(requirementsData)
            }
        }, 1500)
    }

    const handleProceedToDesign = () => {
        if (onComplete) {
            const requirementsData = {
                projectDescription,
                functionalRequirements,
                nonFunctionalRequirements,
                assumptions,
                constraints,
                stakeholders,
                completedAt: new Date().toISOString()
            }
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

    const exportIEEEFormat = () => {
        const requirementsData = {
            projectDescription,
            functionalRequirements,
            nonFunctionalRequirements,
            assumptions,
            constraints,
            stakeholders
        }

        // Convert to IEEE format
        const ieeeData = convertToIEEEFormat(requirementsData)

        // Generate and download IEEE PDF
        generateIEEEPDF(ieeeData)
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
                            <p>Tell me about your project in simple terms, or import an existing IEEE SRS PDF.</p>
                        </div>

                        <div className="import-section" style={{ marginBottom: '20px' }}>
                            <div style={{ padding: '20px', background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label" style={{ marginBottom: '5px', display: 'block' }}>📤 Import Existing IEEE SRS PDF</label>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Upload your IEEE-formatted PDF to automatically extract all requirements</p>
                                    </div>
                                    <label htmlFor="pdf-upload" className="btn-secondary" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                                        {isImporting ? (
                                            <>
                                                <span className="spinner"></span>
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                📄 Choose PDF
                                            </>
                                        )}
                                    </label>
                                    <input
                                        id="pdf-upload"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleImportPDF}
                                        style={{ display: 'none' }}
                                        disabled={isImporting}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', margin: '20px 0', color: '#999', fontSize: '14px', position: 'relative' }}>
                            <hr style={{ border: 'none', borderTop: '1px solid #d4d9f5' }} />
                            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '0 15px' }}>OR ENTER MANUALLY</span>
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
                                        {(Array.isArray(nfrs) ? nfrs : []).map((nfr, index) => (
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
                            <button className="btn-secondary" onClick={exportIEEEFormat}>
                                📄 Export IEEE PDF
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
                                📥 Export JSON
                            </button>
                            <button className="btn-secondary" onClick={exportIEEEFormat}>
                                📄 Export IEEE Format
                            </button>
                            <button className="btn-secondary" onClick={onClose}>
                                ← Return to Dashboard
                            </button>
                            <button className="btn-primary-action" onClick={handleProceedToDesign}>
                                Proceed to Design Phase
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RequirementsAgent
