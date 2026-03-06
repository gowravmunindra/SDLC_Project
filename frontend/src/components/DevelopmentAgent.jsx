import { useState, useEffect, useCallback } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import './DevelopmentAgent.css'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

function DevelopmentAgent({ onClose, onComplete }) {
    const { currentProject, updateProject, refreshCurrentProject } = useProject()

    // Phase Tracking
    const [step, setStep] = useState('validation') // validation, techstack, structure, code, complete
    const [apiKeyStatus, setApiKeyStatus] = useState({ checked: false, valid: true, message: 'Local LLM Active' })

    // Data State
    const [diagramsCheck, setDiagramsCheck] = useState({})
    const [techStackOptions, setTechStackOptions] = useState([])
    const [selectedStack, setSelectedStack] = useState(null)
    const [isStackConfirmed, setIsStackConfirmed] = useState(false)

    const [structure, setStructure] = useState(null)
    const [isStructureConfirmed, setIsStructureConfirmed] = useState(false)
    const [generateType, setGenerateType] = useState('Both') // Frontend, Backend, Both
    const [isRegenerating, setIsRegenerating] = useState(false)

    const [selectedNode, setSelectedNode] = useState(null)
    const [codeFiles, setCodeFiles] = useState([]) // [{ path, desc, code, status: 'pending'|'generating'|'done' }]
    const [selectedFileIndex, setSelectedFileIndex] = useState(0)
    const [selectedCodeType, setSelectedCodeType] = useState('Starter Template')
    const [isCodeGenerating, setIsCodeGenerating] = useState(false)
    const [isTabSwitching, setIsTabSwitching] = useState(false)
    const [countdown, setCountdown] = useState(0)

    // UI Loading State
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('')

    // 1. Initial Key Verification & Diagram Check & Persistent Data Load
    useEffect(() => {
        const verify = async () => {
            try {
                const res = await apiService.verifyDevelopmentKey()
                setApiKeyStatus({ checked: true, valid: true, message: 'API Key Verified' })
            } catch (err) {
                const msg = err.response?.data?.message || 'Invalid API key.'
                setApiKeyStatus({ checked: true, valid: false, message: msg })
            }
        }
        verify()

        if (currentProject?.design?.diagrams) {
            const required = ['useCase', 'class', 'sequence', 'activity', 'state', 'component', 'deployment']
            const status = {}
            required.forEach(key => {
                const diag = currentProject.design.diagrams[key]
                status[key] = diag && (diag.status === 'done' || diag.code?.length > 10)
            })
            setDiagramsCheck(status)
        }

        // LOAD PERSISTED DATA
        if (currentProject?.development) {
            const dev = currentProject.development
            if (dev.techStack) {
                setSelectedStack(dev.techStack)
                setIsStackConfirmed(true)
            }
            if (dev.structure) {
                setStructure(dev.structure)
                setIsStructureConfirmed(true)
            }
            if (dev.codeFiles && dev.codeFiles.length > 0) {
                setCodeFiles(dev.codeFiles.map(f => ({
                    path: f.path,
                    code: f.code,
                    desc: f.path.split('/').pop(),
                    status: 'done'
                })))
                setStep('code')
            } else if (dev.structure) {
                setStep('structure')
            } else if (dev.techStack) {
                setStep('techstack')
            }
        }
    }, [currentProject])

    // Delay Timer Effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Helpers
    const isAllDiagramsReady = () => {
        const required = ['useCase', 'class', 'sequence', 'activity', 'state', 'component', 'deployment']
        return required.every(key => diagramsCheck[key])
    }

    const startTechStackPhase = (forceFresh = false) => {
        if (!forceFresh && !isAllDiagramsReady()) return
        if (forceFresh || window.confirm("Confirm that all design diagrams are finalized and approved?")) {
            if (forceFresh) setIsRegenerating(true)
            setStep('techstack')
            generateTechStack()
        }
    }

    const generateTechStack = async () => {
        setLoading(true)
        setLoadingMessage('Generating Tech Stack Options...')
        try {
            const res = await apiService.generateTechStack(currentProject._id)
            if (res.data.success) {
                setTechStackOptions(res.data.data.options)
            }
        } catch (err) {
            alert(err.message || 'Failed to generate tech stack')
        } finally {
            setLoading(false)
        }
    }

    const confirmTechStack = () => {
        if (!selectedStack) return
        if (window.confirm("Confirm selected tech stack?")) {
            setIsStackConfirmed(true)
            setStep('structure')
        }
    }

    const generateStructure = async () => {
        setLoading(true)
        setLoadingMessage(`Generating ${generateType} Structure...`)
        try {
            const res = await apiService.generateStructure(currentProject._id, selectedStack, generateType, isRegenerating)
            if (res.data.success) {
                setStructure(res.data.data.structure)
            }
        } catch (err) {
            alert(err.message || 'Failed to generate structure')
        } finally {
            setLoading(false)
        }
    }

    const confirmStructure = async (silent = false) => {
        if (!structure) return
        if (!silent && !window.confirm("Finalize and sync folder structure with code generator?")) return;

        setIsTabSwitching(true)
        setIsStructureConfirmed(true)

        // Flatten structure to list of files for generation
        const files = []
        const traverse = (node, path = '') => {
            const currentPath = path ? (path === node.name ? path : `${path}/${node.name}`) : node.name
            if (node.type === 'file') {
                files.push({ path: currentPath, desc: node.description || node.name, code: '', status: 'pending' })
            } else if (node.children) {
                // Sort children so folders appear first, then files
                const sortedChildren = [...node.children].sort((a, b) => (a.type === 'folder' ? -1 : 1))
                sortedChildren.forEach(child => traverse(child, currentPath))
            }
        }
        traverse(structure)

        // Match existing code/status for files that haven't changed path
        // IF REGENERATING: Ignore old code to force fresh generation
        const mergedFiles = files.map(newF => {
            if (isRegenerating) return newF;
            const existing = codeFiles.find(oldF => oldF.path === newF.path)
            return existing ? { ...newF, code: existing.code, status: existing.status } : newF
        })

        setCodeFiles(mergedFiles)

        // AUTO-SAVE to DB
        try {
            const devData = {
                techStack: selectedStack,
                structure: structure,
                codeFiles: mergedFiles.map(f => ({ path: f.path, code: f.code })),
                completedAt: null
            }
            await apiService.saveDevelopment(currentProject._id, devData)
        } catch (err) {
            console.error("Auto-sync failed", err)
        }

        if (!silent) {
            setTimeout(() => {
                setStep('code')
                setIsTabSwitching(false)
            }, 600)
        } else {
            setIsTabSwitching(false)
        }
    }

    const handleAddNode = (type) => {
        if (isStructureConfirmed) {
            alert("Structure is finalized and locked. No more modifications allowed.")
            return
        }
        if (!selectedNode) {
            alert("Please select a folder first")
            return
        }
        if (selectedNode.type !== 'folder') {
            alert("Cannot add items to a file. Please select a folder.")
            return
        }
        const name = window.prompt(`Enter ${type} name:`)
        if (!name) return

        const newNode = { name, type, children: type === 'folder' ? [] : undefined, description: name }

        const updateTree = (node) => {
            if (node === selectedNode) {
                return { ...node, children: [...(node.children || []), newNode] }
            }
            if (node.children) {
                return { ...node, children: node.children.map(updateTree) }
            }
            return node
        }
        const newStructure = updateTree(structure)
        setStructure(newStructure)
        // Note: Do NOT auto-set isStructureConfirmed here anymore, let user confirm explicitly
    }

    const handleDeleteNode = () => {
        if (isStructureConfirmed) return
        if (!selectedNode || selectedNode.name === 'root') return
        if (!window.confirm(`Delete ${selectedNode.name} and all its contents?`)) return

        const deleteFromTree = (node) => {
            if (node.children) {
                const filtered = node.children.filter(c => c !== selectedNode)
                if (filtered.length !== node.children.length) {
                    return { ...node, children: filtered }
                }
                return { ...node, children: node.children.map(deleteFromTree) }
            }
            return node
        }
        setStructure(deleteFromTree(structure))
        setSelectedNode(null)
    }

    const handleRenameNode = () => {
        if (isStructureConfirmed) return
        if (!selectedNode) return
        const newName = window.prompt("Enter new name:", selectedNode.name)
        if (!newName) return

        const renameInTree = (node) => {
            if (node === selectedNode) {
                return { ...node, name: newName }
            }
            if (node.children) {
                return { ...node, children: node.children.map(renameInTree) }
            }
            return node
        }
        setStructure(renameInTree(structure))
    }

    const startCodeGeneration = async () => {
        setIsCodeGenerating(true)
        const updatedFiles = [...codeFiles]

        for (let i = 0; i < updatedFiles.length; i++) {
            const file = updatedFiles[i]
            if (file.status === 'done') continue

            // Clear error status if retrying
            if (file.status === 'error') {
                file.status = 'pending'
            }

            // PACING: 26s delay required for external free API rate limits
            // Only delay if we are actually starting a generation (not skipping done)
            if (i > 0 && updatedFiles[i - 1].status === 'done') {
                setCountdown(26)
                await new Promise(r => setTimeout(r, 26000))
                setCountdown(0)
            }

            file.status = 'generating'
            setSelectedFileIndex(i)
            setCodeFiles([...updatedFiles])

            try {
                const res = await apiService.generateCode(
                    currentProject._id,
                    file.path,
                    file.desc,
                    selectedStack,
                    selectedCodeType,
                    currentProject.design.diagrams,
                    structure, // Pass the confirmed structure here
                    isRegenerating // REGENERATION FLAG
                )

                if (res.data.success) {
                    let cleanCode = res.data.code;
                    // Remove markdown blocks if AI included them
                    if (cleanCode.includes('```')) {
                        cleanCode = cleanCode.replace(/```[a-z]*\n?/gi, '').replace(/```\n?/gi, '').trim();
                    }
                    file.code = cleanCode;
                    file.status = 'done';
                } else {
                    file.status = 'error'
                }
            } catch (err) {
                console.error(err)
                file.status = 'error'
                // Handle 429 specifically (though rare on local)
                if (err.response?.status === 429) {
                    setCountdown(5)
                    await new Promise(r => setTimeout(r, 5000))
                    i-- // Retry this file
                    continue
                }
            }
            setCodeFiles([...updatedFiles])
        }
        setIsCodeGenerating(false)
    }

    const handleDownloadZip = async () => {
        const completedFiles = codeFiles.filter(f => f.code && f.code.length > 0);
        if (completedFiles.length === 0) {
            alert("No source code generated yet. Please generate files before downloading.");
            return;
        }

        const zip = new JSZip();
        completedFiles.forEach(file => {
            zip.file(file.path, file.code);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${currentProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-repository.zip`);
    }

    const finalizeDevelopment = async (shouldComplete = true) => {
        if (shouldComplete && !window.confirm("Finalize Development Phase?")) return;

        setLoading(true)
        setLoadingMessage('Saving development progress...')
        try {
            const devData = {
                techStack: selectedStack,
                structure: structure,
                codeFiles: codeFiles.map(f => ({ path: f.path, code: f.code })),
                completedAt: shouldComplete ? new Date().toISOString() : null
            }
            await apiService.saveDevelopment(currentProject._id, devData)

            if (shouldComplete) {
                await updateProject(currentProject._id, { status: 'testing' })
                await refreshCurrentProject()
                setStep('complete')
                setTimeout(() => onComplete(devData), 2000)
            } else {
                alert('Progress synced successfully!')
            }
        } catch (err) {
            alert('Failed to save development data')
        } finally {
            setLoading(false)
        }
    }

    // Render Components
    const renderValidation = () => (
        <div className="validation-card">
            <h3>Diagram Validation</h3>
            <p>Ensure all required design diagrams are generated before starting development.</p>

            <div className="checklist">
                {['useCase', 'class', 'sequence', 'activity', 'state', 'component', 'deployment'].map(key => (
                    <div key={key} className="checklist-item">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')} Diagram</span>
                        <span className={`status-badge ${diagramsCheck[key] ? 'generated' : 'missing'}`}>
                            {diagramsCheck[key] ? '✓ Generated' : '✗ Missing'}
                        </span>
                    </div>
                ))}
            </div>

            {!apiKeyStatus.valid && apiKeyStatus.checked && (
                <div className="error-box" style={{ marginTop: 20, color: '#ff453a', background: 'rgba(255,69,58,0.1)', padding: 15, borderRadius: 8 }}>
                    <strong>Error:</strong> {apiKeyStatus.message}
                </div>
            )}

            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <button className="dev-btn dev-btn-secondary" onClick={onClose}>Go Back to Design</button>
                    <button
                        className="dev-btn dev-btn-primary"
                        disabled={!isAllDiagramsReady() || !apiKeyStatus.valid}
                        onClick={() => startTechStackPhase(false)}
                    >
                        Yes, Proceed to Development
                    </button>
                </div>

                {!isAllDiagramsReady() && apiKeyStatus.valid && (
                    <button
                        className="dev-btn dev-btn-secondary"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--dev-primary)', border: '1px dashed var(--dev-primary)' }}
                        onClick={() => startTechStackPhase(true)}
                    >
                        ⚡ Interpret from Project Title & Description (No Design Data)
                    </button>
                )}
            </div>

            {!isAllDiagramsReady() && (
                <p style={{ color: 'var(--dev-text-dim)', fontSize: 13, marginTop: 12 }}>
                    * Suggestion: If diagrams are missing, you can use the <strong>Interpret</strong> option above to generate a professional project based purely on your initial vision.
                </p>
            )}
        </div>
    )

    const renderTechStack = () => (
        <div className="step-content">
            <div className="step-header">
                <h3>Select Technology Stack</h3>
                <p>{isRegenerating ? "Regenerating fresh stack for new implementation..." : "Choose the foundation for your application generation."}</p>
            </div>

            {techStackOptions.length === 0 ? (
                <div className="centered-state">
                    <button className="dev-btn dev-btn-primary" onClick={generateTechStack}>Generate Tech Stack Options</button>
                </div>
            ) : (
                <>
                    <div className="tech-options-grid">
                        {techStackOptions.map((opt, idx) => (
                            <div
                                key={idx}
                                className={`tech-card ${selectedStack?.name === opt.name ? 'selected' : ''}`}
                                onClick={() => setSelectedStack(opt)}
                            >
                                <h3>{opt.name}</h3>
                                <div className="tech-detail"><span className="tech-label">Frontend:</span> <span>{opt.frontend}</span></div>
                                <div className="tech-detail"><span className="tech-label">Backend:</span> <span>{opt.backend}</span></div>
                                <div className="tech-detail"><span className="tech-label">Database:</span> <span>{opt.database}</span></div>
                                <div className="tech-detail"><span className="tech-label">Auth:</span> <span>{opt.auth}</span></div>
                                <div className="tech-detail"><span className="tech-label">Deployment:</span> <span>{opt.deployment}</span></div>
                            </div>
                        ))}
                    </div>

                    <div className="step-actions" style={{ marginTop: 32, display: 'flex', gap: 16 }}>
                        <button className="dev-btn dev-btn-secondary" onClick={() => generateTechStack()}>Regenerate Options</button>
                        <button className="dev-btn dev-btn-primary" disabled={!selectedStack} onClick={confirmTechStack}>Confirm & Proceed</button>
                    </div>
                </>
            )}
        </div>
    )

    const renderStructure = () => (
        <div className="step-content">
            <div className="step-header">
                <h3>Project Structure</h3>
                <p>{isRegenerating ? "Generating fresh independently-reasoned structure..." : "Define the folder and file hierarchy for the codebase."}</p>
            </div>

            {!structure ? (
                <div className="config-box glass-panel" style={{ padding: 24, borderRadius: 16, maxWidth: 500, margin: '0 auto' }}>
                    <h4 style={{ marginBottom: 16 }}>What do you want to generate?</h4>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        {['Frontend', 'Backend', 'Both'].map(t => (
                            <button
                                key={t}
                                className={`dev-btn ${generateType === t ? 'dev-btn-primary' : 'dev-btn-secondary'}`}
                                onClick={() => setGenerateType(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button className="dev-btn dev-btn-primary" style={{ width: '100%' }} onClick={generateStructure}>Generate Structure</button>
                </div>
            ) : (
                <div className="structure-container">
                    <div className="structure-tree gradient-border">
                        <div className="tree-header" style={{ marginBottom: 12, fontSize: 13, color: '#00f2ff', fontWeight: 700 }}>📁 {project.name?.toUpperCase()}</div>
                        {renderTree(structure)}
                    </div>
                    <div className="structure-actions glass-panel" style={{ padding: 24, borderRadius: 12 }}>
                        <h4>Modify {isRegenerating ? "Regenerated" : ""} Structure</h4>
                        <p style={{ fontSize: 13, color: 'var(--dev-text-dim)' }}>
                            {isStructureConfirmed ? "✓ Structure Locked & Finalized" : "You can add, delete or rename folders and files."}
                        </p>

                        {!isStructureConfirmed && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                                <button className="dev-btn dev-btn-secondary" style={{ fontSize: 13 }} onClick={() => handleAddNode('folder')}>Add Folder</button>
                                <button className="dev-btn dev-btn-secondary" style={{ fontSize: 13 }} onClick={() => handleAddNode('file')}>Add File</button>
                                <button className="dev-btn dev-btn-secondary" style={{ fontSize: 13 }} onClick={handleRenameNode}>Rename</button>
                                <button className="dev-btn dev-btn-secondary" style={{ fontSize: 13, color: '#ff453a' }} onClick={handleDeleteNode}>Delete</button>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {!isStructureConfirmed && <button className="dev-btn dev-btn-secondary" onClick={() => setStructure(null)}>Modify Settings</button>}
                                <button className="dev-btn dev-btn-primary" onClick={() => confirmStructure()}>
                                    {isStructureConfirmed ? "Sync with Code Tab" : "Confirm & Proceed"}
                                </button>
                            </div>

                            <button
                                className="dev-btn"
                                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--dev-text-dim)', fontSize: 12, padding: '8px' }}
                                onClick={() => {
                                    if (window.confirm("Danger: This will wipe your current structure and start a fresh independent generation. Continue?")) {
                                        setStructure(null);
                                        setIsRegenerating(true);
                                    }
                                }}
                            >
                                ↺ Reset to Fresh Structure
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    const renderTree = (node, depth = 0) => {
        const isSelected = selectedNode === node
        return (
            <div key={node.name} style={{ marginLeft: depth * 20 }}>
                <div
                    className={`tree-item clickable ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(node)}
                >
                    <span>{node.type === 'folder' ? '📁' : '📄'}</span>
                    <span>{node.name}</span>
                </div>
                {node.children && node.children.map(child => renderTree(child, depth + 1))}
            </div>
        )
    }

    const renderCode = () => (
        <div className="step-content">
            <div className="step-header">
                <h3>Code Generation</h3>
                <p>{isRegenerating ? "⚡ Independently interpreting project logic..." : "Generate production-ready code based on your design and requirements."}</p>
            </div>

            <div className="code-container" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: 600 }}>
                <div className="file-list glass-panel" style={{ overflowY: 'auto', padding: 0 }}>
                    <div style={{ padding: '16px 0' }}>
                        <h4 style={{ fontSize: 13, marginBottom: 12, padding: '0 16px', color: 'var(--dev-text-dim)' }}>FILES TO GENERATE</h4>
                        {codeFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className={`tree-item clickable ${file.status === 'generating' ? 'active' : ''} ${selectedFileIndex === idx ? 'selected' : ''}`}
                                onClick={() => setSelectedFileIndex(idx)}
                            >
                                <div className={`file-status-icon ${file.status}`}>
                                    {file.status === 'done' ? '✅' : (file.status === 'generating' ? '⏳' : '📄')}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ fontSize: 10, color: 'var(--dev-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {file.path.split('/').length > 2
                                            ? '.../' + file.path.split('/').slice(-2, -1)
                                            : file.path.split('/').slice(0, -1).join('/')}
                                    </span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                        {file.path.split('/').pop()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="code-display">
                    {!isCodeGenerating && codeFiles.every(f => f.status === 'pending') ? (
                        <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
                            <h4>Ready for Generation</h4>
                            <p style={{ marginBottom: 24 }}>Select code style and start generation.</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                                {['Starter Template', 'Production Ready'].map(t => (
                                    <button
                                        key={t}
                                        className={`dev-btn ${selectedCodeType === t ? 'dev-btn-primary' : 'dev-btn-secondary'}`}
                                        onClick={() => setSelectedCodeType(t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <button className="dev-btn dev-btn-primary" style={{ margin: '0 auto' }} onClick={startCodeGeneration}>Start Generation</button>
                        </div>
                    ) : (
                        <div className="code-viewer">
                            <div className="code-header">
                                <span className="code-path">
                                    {codeFiles[selectedFileIndex]?.path || 'Select a file...'}
                                </span>
                                {isCodeGenerating && codeFiles[selectedFileIndex]?.status === 'generating' && (
                                    <span className="status-tag pulse">Writing...</span>
                                )}
                                {countdown > 0 && isCodeGenerating && <span className="countdown">Cooldown: {countdown}s</span>}
                            </div>
                            <div className="code-content" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, lineHeight: '1.6', overflow: 'auto' }}>
                                {codeFiles[selectedFileIndex]?.code || (codeFiles[selectedFileIndex]?.status === 'generating' ? '// AI is thinking...' : '// No code generated yet')}
                            </div>
                        </div>
                    )}

                    {codeFiles.every(f => f.status === 'done') && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <button className="dev-btn dev-btn-primary" onClick={handleDownloadZip}>
                                📦 Download Professional Template
                            </button>
                            <button className="dev-btn dev-btn-secondary" onClick={() => {
                                const reset = codeFiles.map(f => ({ ...f, status: 'pending', code: '' }))
                                setCodeFiles(reset)
                            }}>Regenerate Entire Code</button>
                            <button className="dev-btn dev-btn-secondary" onClick={() => finalizeDevelopment(false)}>Sync Progress</button>
                            <button className="dev-btn dev-btn-primary" style={{ background: 'var(--success-shade, #10b981)', color: 'white' }} onClick={() => finalizeDevelopment(true)}>Finalize Development Phase</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )



    return (
        <div className="dev-agent-container">
            <div className="dev-header">
                <div className="dev-title-section">
                    <div className="dev-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,242,255,0.1)', padding: '4px 12px', borderRadius: 20, marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>💻</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#00f2ff', textTransform: 'uppercase' }}>Development Agent</span>
                    </div>
                    <h2>Phase 3: Development</h2>
                    <p>Building the foundation for {currentProject?.name}</p>
                </div>
                <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6L18 18" /></svg>
                </button>
            </div>

            <div className="dev-tabs">
                <div
                    className={`dev-tab ${step === 'validation' ? 'active' : ''}`}
                    onClick={() => {
                        setIsTabSwitching(true)
                        setStep('validation')
                        setTimeout(() => setIsTabSwitching(false), 300)
                    }}
                >🛡️ Validation</div>
                <div
                    className={`dev-tab ${step === 'techstack' ? 'active' : ''}`}
                    onClick={() => {
                        setIsTabSwitching(true)
                        setStep('techstack')
                        setTimeout(() => setIsTabSwitching(false), 300)
                    }}
                >🛠️ Tech Stack</div>
                <div
                    className={`dev-tab ${step === 'structure' ? 'active' : ''}`}
                    onClick={() => {
                        if (isStackConfirmed) {
                            setIsTabSwitching(true)
                            setStep('structure')
                            setTimeout(() => setIsTabSwitching(false), 300)
                        }
                    }}
                >📁 Structure</div>
                <div
                    className={`dev-tab ${step === 'code' ? 'active' : ''} ${!isStructureConfirmed ? 'disabled' : ''}`}
                    style={{ opacity: !isStructureConfirmed ? 0.5 : 1, cursor: !isStructureConfirmed ? 'not-allowed' : 'pointer' }}
                    onClick={async () => {
                        if (isStructureConfirmed) {
                            setIsTabSwitching(true)
                            await confirmStructure(true)
                            setStep('code')
                            setTimeout(() => setIsTabSwitching(false), 300)
                        } else {
                            alert("Please confirm your project structure first")
                        }
                    }}
                >💾 Code</div>
            </div>

            <div className="dev-content" style={{ position: 'relative' }}>
                {(loading || isTabSwitching) ? (
                    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: 24, fontSize: 18, color: 'var(--dev-primary)', fontWeight: 600 }}>
                            {loading ? loadingMessage : `Loading ${step} phase...`}
                        </p>
                    </div>
                ) : (
                    <>
                        {step === 'validation' && renderValidation()}
                        {step === 'techstack' && renderTechStack()}
                        {step === 'structure' && renderStructure()}
                        {step === 'code' && renderCode()}
                    </>
                )}

                {step === 'complete' && (
                    <div className="validation-card" style={{ maxWidth: 700, textAlign: 'center' }}>
                        <div className="success-icon" style={{ fontSize: 64, marginBottom: 24, animation: 'pulse 2s infinite' }}>📦</div>
                        <h2 style={{ color: 'var(--dev-primary)', marginBottom: 16 }}>Project Template Generated!</h2>
                        <p style={{ fontSize: 18, marginBottom: 32 }}>
                            Your professional, production-ready project for <strong>{currentProject?.name}</strong> is now ready for local deployment.
                        </p>

                        <div className="glass-panel" style={{ padding: 24, marginBottom: 32, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <h4 style={{ color: 'var(--dev-primary)', marginBottom: 12 }}>📦 What's included in your bundle:</h4>
                            <ul style={{ paddingLeft: 20, color: 'var(--dev-text-dim)', fontSize: 14, lineHeight: '2' }}>
                                <li><strong>Professional Structure:</strong> Clean src/ folder organization.</li>
                                <li><strong>Mandatory Docs:</strong> Detailed README.md, .env.example, .gitignore.</li>
                                <li><strong>Config Files:</strong> package.json with dependency definitions.</li>
                                <li><strong>Clean Code:</strong> Fully implemented, scalable source files.</li>
                            </ul>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                            <button
                                className="dev-btn dev-btn-primary"
                                style={{ padding: '16px 40px', fontSize: 18, width: '100%', justifyContent: 'center' }}
                                onClick={handleDownloadZip}
                            >
                                📥 Download Professional Repository (ZIP)
                            </button>
                            <p style={{ color: 'var(--dev-text-dim)', fontSize: 13 }}>
                                Save this ZIP, run <code>npm install</code>, and follow the instructions in the <strong>README.md</strong>.
                            </p>
                        </div>

                        <div style={{ marginTop: 40, borderTop: '1px solid var(--dev-border)', paddingTop: 24 }}>
                            <p>Proceeding to <strong>Phase 4: Testing</strong> in a few seconds...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delay Indicator Overlay */}
            {countdown > 0 && (
                <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'rgba(5, 10, 21, 0.9)', border: '1px solid var(--dev-primary)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 1000, boxShadow: '0 0 20px rgba(0, 242, 255, 0.2)' }}>
                    <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Rate limiter active: {countdown}s</span>
                </div>
            )}
        </div>
    )
}

export default DevelopmentAgent
