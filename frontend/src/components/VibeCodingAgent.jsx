import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './VibeCodingAgent.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const FILE_ICONS = {
    js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
    css: '🎨', html: '🌐', json: '📋', md: '📝',
    env: '🔐', gitignore: '🔒', sh: '⚙️', yml: '📦',
    yaml: '📦', py: '🐍', default: '📄'
}
const LANG_MAP = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    css: 'css', html: 'html', json: 'json', md: 'markdown',
    py: 'python', sh: 'bash', env: 'bash', yml: 'yaml', yaml: 'yaml'
}

function getFileIcon(name) {
    const ext = name?.split('.').pop()?.toLowerCase()
    return FILE_ICONS[ext] || FILE_ICONS.default
}
function getLang(name) {
    const ext = name?.split('.').pop()?.toLowerCase()
    return LANG_MAP[ext] || 'text'
}
function sanitizeFiles(files) {
    if (!Array.isArray(files)) return []
    return files
        .filter(f => f && typeof f.path === 'string' && f.path.trim())
        .map(f => ({
            path: f.path.replace(/^[./\\]+/, '').replace(/\\/g, '/').trim(),
            code: typeof f.code === 'string' ? f.code : (f.code != null ? JSON.stringify(f.code, null, 2) : '')
        }))
        .filter(f => f.path.length > 0)
}

// ─── Resizable Divider ────────────────────────────────────────────────────────
function ResizeDivider({ onDrag, direction = 'vertical' }) {
    const dragging = useRef(false)
    const startPos = useRef(0)

    const onMouseDown = (e) => {
        dragging.current = true
        startPos.current = direction === 'vertical' ? e.clientX : e.clientY
        document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize'
        document.body.style.userSelect = 'none'
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }
    const onMouseMove = (e) => {
        if (!dragging.current) return
        const curr = direction === 'vertical' ? e.clientX : e.clientY
        onDrag(curr - startPos.current)
        startPos.current = curr
    }
    const onMouseUp = () => {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
    }
    return (
        <div
            className={`resize-divider ${direction}`}
            onMouseDown={onMouseDown}
            title="Drag to resize"
        >
            <div className="resize-dots">
                <span /><span /><span />
            </div>
        </div>
    )
}

// ─── File Tree Node ───────────────────────────────────────────────────────────
function TreeNode({ node, path, expandedFolders, onToggle, onSelectFile, selectedFilePath, files, depth = 0 }) {
    const isRoot = path === '' && node.name === 'root'
    const currentPath = isRoot ? '' : (path ? `${path}/${node.name}` : node.name)
    const isExpanded = isRoot || expandedFolders.has(currentPath)

    if (node.type === 'folder') {
        return (
            <div className="tree-node">
                {!isRoot && (
                    <div className="tree-folder" onClick={() => onToggle(currentPath)} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
                        <span className="tree-arrow">{isExpanded ? '▾' : '▸'}</span>
                        <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
                        <span className="folder-name">{node.name}</span>
                    </div>
                )}
                {isExpanded && node.children && (
                    <div>
                        {node.children.map((child, i) => (
                            <TreeNode
                                key={`${currentPath}-${child.name}-${i}`}
                                node={child} path={currentPath}
                                expandedFolders={expandedFolders} onToggle={onToggle}
                                onSelectFile={onSelectFile} selectedFilePath={selectedFilePath}
                                files={files} depth={isRoot ? 0 : depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const fileObj = files.find(f => f.path === currentPath)
    return (
        <div
            className={`tree-file ${selectedFilePath === currentPath ? 'selected' : ''}`}
            onClick={() => fileObj && onSelectFile(fileObj)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            title={currentPath}
        >
            <span className="file-type-icon">{getFileIcon(node.name)}</span>
            <span className="file-name">{node.name}</span>
        </div>
    )
}

// ─── Code Viewer ──────────────────────────────────────────────────────────────
function CodeViewer({ file, onCopy }) {
    if (!file) return null
    const lines = (file.code || '').split('\n')
    return (
        <div className="code-with-lines">
            <div className="line-numbers">
                {lines.map((_, i) => <span key={i} className="line-num">{i + 1}</span>)}
            </div>
            <pre className={`code-content lang-${getLang(file.path)}`}>
                <code>{file.code || '// Empty file'}</code>
            </pre>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
function VibeCodingAgent({ onClose, onComplete }) {
    const { currentProject, refreshCurrentProject } = useProject()

    // Content state
    const [structure, setStructure] = useState(null)
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [openTabs, setOpenTabs] = useState([])
    const [expandedFolders, setExpandedFolders] = useState(new Set(['root']))

    // Derive design-phase context once
    const designStack = currentProject?.design?.selectedStack || null
    const stackLabel = designStack
        ? `${designStack.name || 'Custom'}: ${designStack.frontend}, ${designStack.backend}, ${designStack.database}`
        : null

    // Build requirements summary for prompt context
    const reqSummary = useMemo(() => {
        const frs = currentProject?.requirements?.functionalRequirements || []
        if (!frs.length) return ''
        return frs.slice(0, 8).map(r => `- ${r.title}: ${r.description}`).join('\n')
    }, [currentProject])

    // Chat state
    const [userPrompt, setUserPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [totalGenTime, setTotalGenTime] = useState(120)
    const [chatMessages, setChatMessages] = useState(() => {
        const stackMsg = designStack
            ? `\n\n🔧 **Stack detected from Design Phase:** ${stackLabel}\nAll generated code will use this stack.`
            : `\n\n⚠️ No tech stack selected in the Design Phase yet. The tool will use React + Node.js defaults. You can still generate — or go to Design Phase to pick a stack first.`
        return [{ type: 'bot', text: `👋 Welcome to Vibe Coding! Describe what you want to build or click a template below.${stackMsg}` }]
    })
    const chatEndRef = useRef(null)

    // Panel size state (in pixels)
    const [explorerWidth, setExplorerWidth] = useState(240)
    const [aiPanelWidth, setAiPanelWidth] = useState(320)

    // Panel visibility
    const [showExplorer, setShowExplorer] = useState(true)
    const [showAI, setShowAI] = useState(true)

    // Copy feedback
    const [copyFeedback, setCopyFeedback] = useState(false)

    // Generation steps
    const GEN_STEPS = [
        'Analyzing project requirements...',
        'Designing architecture...',
        'Scaffolding folder structure...',
        'Writing frontend components...',
        'Building backend API...',
        'Generating README & config files...',
        'Finalizing project bundle...'
    ]
    const UPDATE_STEPS = [
        'Analyzing requested changes...',
        'Scanning existing codebase...',
        'Modifying requested files...',
        'Applying UI updates...',
        'Ensuring consistency...',
        'Finalizing modifications...'
    ]
    const [genStep, setGenStep] = useState(0)
    const [isUpdating, setIsUpdating] = useState(false)
    const stepTimerRef = useRef(null)

    // ── Load persisted data ───────────────────────────────────────────────────
    useEffect(() => {
        if (currentProject?.development) {
            const dev = currentProject.development
            if (dev.structure) setStructure(dev.structure)
            if (dev.codeFiles?.length > 0) {
                const clean = sanitizeFiles(dev.codeFiles)
                setFiles(clean)
                if (!selectedFile && clean.length > 0) {
                    const readme = clean.find(f => f.path.toLowerCase().includes('readme'))
                    const first = readme || clean[0]
                    setSelectedFile(first)
                    setOpenTabs([first])
                }
            }
        }
    }, [currentProject])

    // ── Auto-scroll chat ──────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages, isGenerating])

    // ── Countdown timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
        return () => clearInterval(t)
    }, [countdown])

    // ── Generation step cycle ─────────────────────────────────────────────────
    useEffect(() => {
        if (isGenerating) {
            setGenStep(0)
            stepTimerRef.current = setInterval(() => {
                const stepsArray = isUpdating ? UPDATE_STEPS : GEN_STEPS
                setGenStep(s => (s + 1) % stepsArray.length)
            }, 3500)
        } else {
            clearInterval(stepTimerRef.current)
        }
        return () => clearInterval(stepTimerRef.current)
    }, [isGenerating, isUpdating])

    // ── Resize handlers ───────────────────────────────────────────────────────
    const handleExplorerResize = useCallback((delta) => {
        setExplorerWidth(w => Math.max(160, Math.min(500, w + delta)))
    }, [])
    const handleAiResize = useCallback((delta) => {
        setAiPanelWidth(w => Math.max(240, Math.min(560, w - delta)))
    }, [])

    // ── Folder toggle ─────────────────────────────────────────────────────────
    const toggleFolder = useCallback((path) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            next.has(path) ? next.delete(path) : next.add(path)
            return next
        })
    }, [])

    // ── Open file in tabs ─────────────────────────────────────────────────────
    const openFile = useCallback((f) => {
        setSelectedFile(f)
        setOpenTabs(prev => prev.find(t => t.path === f.path) ? prev : [...prev, f])
    }, [])

    // ── Close tab ─────────────────────────────────────────────────────────────
    const closeTab = useCallback((tab, e) => {
        e.stopPropagation()
        setOpenTabs(prev => {
            const next = prev.filter(t => t.path !== tab.path)
            if (selectedFile?.path === tab.path) {
                setSelectedFile(next[next.length - 1] || null)
            }
            return next
        })
    }, [selectedFile])

    // ── Copy to clipboard ─────────────────────────────────────────────────────
    const handleCopy = () => {
        if (!selectedFile?.code) return
        navigator.clipboard.writeText(selectedFile.code).then(() => {
            setCopyFeedback(true)
            setTimeout(() => setCopyFeedback(false), 2000)
        })
    }

    // ── Download ZIP ──────────────────────────────────────────────────────────
    const handleDownloadZip = async () => {
        if (!files?.length) { alert('Generate a project first!'); return }
        try {
            const zip = new JSZip()
            let added = 0
            files.forEach(f => {
                if (f?.path) {
                    zip.file(f.path.replace(/^[./\\]+/, ''), typeof f.code === 'string' ? f.code : '')
                    added++
                }
            })
            if (!added) throw new Error('No valid files to zip.')
            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
            const name = `${currentProject?.name?.toLowerCase().replace(/[^a-z0-9]/gi, '-') || 'project'}-vibe-code.zip`
            try { saveAs(blob, name) } catch {
                const url = URL.createObjectURL(blob)
                Object.assign(document.createElement('a'), { href: url, download: name }).click()
                setTimeout(() => URL.revokeObjectURL(url), 100)
            }
        } catch (e) { alert('ZIP error: ' + e.message) }
    }

    // ── Generate project ──────────────────────────────────────────────────────
    const PREDEFINED_PROMPTS = useMemo(() => {
        const title = currentProject?.name || 'My Project'
        const desc = currentProject?.description || 'a professional web application'
        const stack = currentProject?.design?.selectedStack

        // Build a rich context block injected into every predefined prompt
        const stackCtx = stack
            ? `\n\nSELECTED TECH STACK (MANDATORY — use only this):\n  Name: ${stack.name}\n  Frontend: ${stack.frontend}\n  Backend: ${stack.backend}\n  Database: ${stack.database}`
            : ''

        const reqCtx = reqSummary
            ? `\n\nFUNCTIONAL REQUIREMENTS:\n${reqSummary}`
            : ''

        const baseCtx = `\n\nPROJECT: "${title}"\nDESCRIPTION: ${desc}${stackCtx}${reqCtx}`

        return [
            {
                icon: '🚀', label: 'Full-Stack App', color: '#6366f1',
                hint: 'Frontend + Backend + DB · README · Runnable',
                prompt: `Generate a complete, production-ready full-stack web application.${baseCtx}\n\nInclude a full frontend folder with UI components, routing, and API integration. Include a full backend with REST API routes, database models, JWT auth, .env.example, and a comprehensive README covering setup for both frontend and backend. Use EXACTLY the tech stack specified above.`
            },
            {
                icon: '🎨', label: 'Frontend Only', color: '#06b6d4',
                hint: 'UI · Components · Routing · Modern Styling',
                prompt: `Generate a complete frontend only project (no backend).${baseCtx}\n\nDO NOT generate any server-side files. Include: entry point, root component with router (min 3 routes), at least 4 styled components with real interaction logic, global CSS, an HTTP client service file, and README (install → dev → localhost). Use EXACTLY the frontend technology specified in the stack above.`
            },
            {
                icon: '⚙️', label: 'Backend API', color: '#10b981',
                hint: 'REST API · Auth · DB Models · .env',
                prompt: `Generate a complete REST API backend only (no frontend HTML/CSS/JSX).${baseCtx}\n\nDO NOT generate any frontend files. Include: app entry point, database connection, JWT auth middleware, global error handler, at least 3 route files with matching controllers, at least 2 DB models, .env.example, .gitignore, and README with curl examples. Use EXACTLY the backend and database specified in the stack above.`
            },
            {
                icon: '⚡', label: 'Quick MVP', color: '#f59e0b',
                hint: 'Minimal · Core features · Fast to run',
                prompt: `Generate a minimal but complete full-stack MVP.${baseCtx}\n\nFocus on core functionality only — keep it simple but runnable. Include a styled landing/feature page (frontend) and 2-3 essential API endpoints (backend). Every file must be complete — no TODOs, no placeholders. Include README with run instructions for both frontend and backend. Use EXACTLY the tech stack specified above.`
            }
        ]
    }, [currentProject, reqSummary])

    const handleGenerate = async (quickPrompt = null) => {
        const prompt = (quickPrompt || userPrompt).trim()
        if (!prompt || isGenerating) return
        if (!quickPrompt) setUserPrompt('')

        const isFresh = quickPrompt !== null || files.length === 0
        if (isFresh) {
            setFiles([]); setStructure(null); setSelectedFile(null); setOpenTabs([])
            setChatMessages([{ type: 'user', text: prompt }])
        } else {
            setChatMessages(prev => [...prev, { type: 'user', text: prompt }])
        }

        setIsGenerating(true)
        setIsUpdating(!isFresh)

        // Dynamic time estimation
        let estimatedTime = 120
        if (!isFresh) {
            const p = prompt.toLowerCase()
            const isSmallUpdate = prompt.length < 150 && (p.includes('color') || p.includes('text') || p.includes('ui') || p.includes('button') || p.includes('style') || p.includes('margin') || p.includes('padding') || p.includes('change'))
            estimatedTime = isSmallUpdate ? 15 : 45
        }
        setTotalGenTime(estimatedTime)
        setCountdown(estimatedTime)

        try {
            const payload = {
                projectId: currentProject?._id || 'standalone',
                userPrompt: prompt,
                currentFiles: isFresh ? [] : files
            }
            const res = isFresh
                ? await apiService.vibeGenerate(payload)
                : await apiService.vibeUpdate(payload)

            if (res.data.success) {
                const clean = sanitizeFiles(res.data.files || [])
                setStructure(res.data.structure)
                setFiles(clean)
                if (clean.length > 0) {
                    const readme = clean.find(f => f.path.toLowerCase().includes('readme'))
                    const def = readme || clean[0]
                    setSelectedFile(def); setOpenTabs([def])
                }
                const stackNote = designStack ? `\n🔧 Stack used: **${stackLabel}**` : ''
                setChatMessages(prev => [...prev, {
                    type: 'bot',
                    text: `✅ ${res.data.summary || 'Project generated!'}${stackNote}\n\n📁 **${clean.length} files** ready. Click **📥 Download ZIP** to export your project.`
                }])
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message
            setChatMessages(prev => [...prev, { type: 'bot', text: `❌ Generation failed: ${msg}\n\nPlease try again with a more specific prompt.` }])
        } finally {
            setIsGenerating(false); setCountdown(0)
        }
    }

    const handleFinalize = async () => {
        if (!window.confirm('Finalize Development Phase?\n\nThis marks the phase complete and moves to Testing.')) return
        setIsGenerating(true)
        try {
            await apiService.saveDevelopment(currentProject._id, {
                techStack: currentProject.development?.techStack || {},
                structure, codeFiles: files, completedAt: new Date().toISOString()
            })
            await refreshCurrentProject()
            window.alert('✅ Phase finalized! Moving to Testing...')
            onComplete ? onComplete() : onClose()
        } catch (err) {
            window.alert('❌ Failed to finalize: ' + (err.response?.data?.message || err.message))
        } finally { setIsGenerating(false) }
    }

    if (!currentProject) {
        return (
            <div className="vc-root centered-state">
                <div className="vc-spinner"></div>
                <p>Loading project data...</p>
                <button className="vc-btn vc-btn-finalize" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="vc-root">

            {/* ── Title Bar ── */}
            <div className="vc-titlebar">
                <div className="vc-titlebar-left">
                    <div className="vc-logo-wrap">
                        <span className="vc-logo-icon">⚡</span>
                    </div>
                    <span className="vc-app-name">Vibe Coding</span>
                    <div className="vc-project-chip">
                        <span className="vc-project-dot" />
                        {currentProject?.name || 'New Project'}
                    </div>
                    {files.length > 0 && (
                        <div className="vc-file-count-badge">{files.length} files</div>
                    )}
                    {currentProject?.design?.selectedStack && (
                        <div
                            className="vc-project-chip vc-stack-chip"
                            style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
                            title={`${currentProject.design.selectedStack.name}: ${currentProject.design.selectedStack.frontend}, ${currentProject.design.selectedStack.backend}, ${currentProject.design.selectedStack.database}`}
                        >
                            <span className="vc-project-dot" style={{ background: '#818cf8' }} />
                            {currentProject.design.selectedStack.name}: {currentProject.design.selectedStack.frontend}, {currentProject.design.selectedStack.backend}, {currentProject.design.selectedStack.database}
                        </div>
                    )}
                </div>

                <div className="vc-titlebar-center">
                    {isGenerating && (
                        <div className="vc-gen-indicator">
                            <div className="vc-gen-pulse" />
                            <span>{isUpdating ? UPDATE_STEPS[genStep] : GEN_STEPS[genStep]}</span>
                            {countdown > 0 && <span className="vc-countdown">~{countdown}s</span>}
                        </div>
                    )}
                </div>

                <div className="vc-titlebar-right">
                    {/* Panel toggles */}
                    <button className={`vc-panel-toggle ${showExplorer ? 'active' : ''}`} onClick={() => setShowExplorer(v => !v)} title="Toggle File Explorer">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v1H1V2zm0 4h9v1H1V6zm0 4h14v1H1v-1zm0 4h9v1H1v-1z" /></svg>
                        Explorer
                    </button>
                    <button className={`vc-panel-toggle ${showAI ? 'active' : ''}`} onClick={() => setShowAI(v => !v)} title="Toggle AI Assistant">
                        🤖 AI
                    </button>

                    <div className="vc-divider-v" />

                    <button
                        className="vc-btn vc-btn-download"
                        onClick={handleDownloadZip}
                        disabled={files.length === 0}
                        title={files.length === 0 ? 'Generate a project first' : `Download ${files.length} files as ZIP`}
                    >
                        <span>📥</span> Download ZIP
                    </button>
                    <button
                        className="vc-btn vc-btn-finalize"
                        onClick={handleFinalize}
                        disabled={isGenerating || files.length === 0}
                    >
                        <span>🚀</span> Finalize
                    </button>
                    <button className="vc-close-btn" onClick={onClose} title="Close">✕</button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="vc-body">

                {/* ── File Explorer Panel ── */}
                {showExplorer && (
                    <>
                        <div className="vc-explorer" style={{ width: explorerWidth, minWidth: explorerWidth }}>
                            <div className="vc-panel-header">
                                <span className="vc-panel-title">EXPLORER</span>
                                {files.length > 0 && <span className="vc-badge">{files.length}</span>}
                            </div>
                            <div className="vc-file-tree">
                                {structure ? (
                                    <TreeNode
                                        node={structure} path=""
                                        expandedFolders={expandedFolders}
                                        onToggle={toggleFolder}
                                        onSelectFile={openFile}
                                        selectedFilePath={selectedFile?.path}
                                        files={files}
                                    />
                                ) : (
                                    <div className="vc-empty-tree">
                                        <span>📂</span>
                                        <p>No project yet.<br />Generate one →</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <ResizeDivider onDrag={handleExplorerResize} direction="vertical" />
                    </>
                )}

                {/* ── Editor ── */}
                <div className="vc-editor">
                    {/* Tab Bar */}
                    <div className="vc-tab-bar">
                        {openTabs.map(tab => (
                            <div
                                key={tab.path}
                                className={`vc-tab ${selectedFile?.path === tab.path ? 'active' : ''}`}
                                onClick={() => setSelectedFile(tab)}
                            >
                                <span className="vc-tab-icon">{getFileIcon(tab.path.split('/').pop())}</span>
                                <span className="vc-tab-label">{tab.path.split('/').pop()}</span>
                                <button className="vc-tab-close" onClick={(e) => closeTab(tab, e)}>×</button>
                            </div>
                        ))}
                        {openTabs.length === 0 && <div className="vc-tab-empty">No files open</div>}
                    </div>

                    {/* Breadcrumb + Actions */}
                    {selectedFile && (
                        <div className="vc-breadcrumb">
                            <div className="vc-breadcrumb-path">
                                {selectedFile.path.split('/').map((p, i, arr) => (
                                    <span key={i}>
                                        <span className={i === arr.length - 1 ? 'bc-file' : 'bc-folder'}>{p}</span>
                                        {i < arr.length - 1 && <span className="bc-sep"> / </span>}
                                    </span>
                                ))}
                            </div>
                            <div className="vc-breadcrumb-actions">
                                <span className="vc-lang-badge">{getLang(selectedFile.path)}</span>
                                <button className="vc-copy-btn" onClick={handleCopy}>
                                    {copyFeedback ? '✅ Copied!' : '📋 Copy'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Code Area */}
                    <div className="vc-code-area">
                        {selectedFile ? (
                            <CodeViewer file={selectedFile} />
                        ) : (
                            <div className="vc-welcome">
                                <div className="vc-welcome-glow" />
                                <div className="vc-welcome-icon">⚡</div>
                                <h2 className="vc-welcome-title">Development Studio</h2>
                                <p className="vc-welcome-sub">Generate production-ready, runnable projects in seconds using AI.</p>

                                {/* Stack Banner */}
                                {stackLabel ? (
                                    <div className="vc-stack-banner">
                                        <span className="vc-stack-banner-icon">🔧</span>
                                        <div>
                                            <div className="vc-stack-banner-title">Design Phase Stack Detected</div>
                                            <div className="vc-stack-banner-value">{stackLabel}</div>
                                        </div>
                                        <span className="vc-stack-banner-badge">Enforced</span>
                                    </div>
                                ) : (
                                    <div className="vc-stack-banner vc-stack-banner--warn">
                                        <span className="vc-stack-banner-icon">⚠️</span>
                                        <div>
                                            <div className="vc-stack-banner-title">No Stack Selected</div>
                                            <div className="vc-stack-banner-value">Will use React + Node.js + MongoDB defaults. Visit the Design Phase to pick a custom stack.</div>
                                        </div>
                                    </div>
                                )}

                                <div className="vc-template-grid">
                                    {PREDEFINED_PROMPTS.map(p => (
                                        <button
                                            key={p.label}
                                            className="vc-template-card"
                                            style={{ '--card-color': p.color }}
                                            onClick={() => handleGenerate(p.prompt)}
                                            disabled={isGenerating}
                                        >
                                            <span className="vc-tcard-icon">{p.icon}</span>
                                            <div className="vc-tcard-body">
                                                <div className="vc-tcard-label">{p.label}</div>
                                                <div className="vc-tcard-hint">{p.hint}</div>
                                            </div>
                                            <span className="vc-tcard-arrow">→</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="vc-welcome-or">or describe your project in the AI panel →</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── AI Panel ── */}
                {showAI && (
                    <>
                        <ResizeDivider onDrag={handleAiResize} direction="vertical" />
                        <div className="vc-ai-panel" style={{ width: aiPanelWidth, minWidth: aiPanelWidth }}>
                            <div className="vc-panel-header">
                                <span className="vc-panel-title">🤖 AI ASSISTANT</span>
                                {isGenerating && <div className="vc-ai-gen-dot" />}
                            </div>

                            {/* Messages */}
                            <div className="vc-chat">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`vc-bubble vc-bubble-${msg.type}`}>
                                        {msg.type === 'bot' && <div className="vc-bubble-avatar">⚡</div>}
                                        <div className="vc-bubble-body">
                                            <div className="vc-bubble-text">{msg.text}</div>
                                            {i === 0 && msg.type === 'bot' && files.length === 0 && (
                                                <div className="vc-mini-prompts">
                                                    {PREDEFINED_PROMPTS.map(p => (
                                                        <button
                                                            key={p.label}
                                                            className="vc-mini-prompt-btn"
                                                            style={{ '--btn-color': p.color }}
                                                            onClick={() => handleGenerate(p.prompt)}
                                                            disabled={isGenerating}
                                                        >
                                                            {p.icon} {p.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isGenerating && (
                                    <div className="vc-bubble vc-bubble-bot">
                                        <div className="vc-bubble-avatar">⚡</div>
                                        <div className="vc-bubble-body">
                                            <div className="vc-generating-card">
                                                <div className="vc-gen-bars">
                                                    <span /><span /><span /><span /><span />
                                                </div>
                                                <div className="vc-gen-step">{isUpdating ? UPDATE_STEPS[genStep] : GEN_STEPS[genStep]}</div>
                                                {countdown > 0 && (
                                                    <div className="vc-gen-progress">
                                                        <div
                                                            className="vc-gen-progress-bar"
                                                            style={{ width: `${((totalGenTime - countdown) / totalGenTime) * 100}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="vc-input-area">
                                <textarea
                                    className="vc-textarea"
                                    placeholder="Describe your project, request changes, or ask questions..."
                                    value={userPrompt}
                                    onChange={e => setUserPrompt(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault(); handleGenerate()
                                        }
                                    }}
                                    disabled={isGenerating}
                                    rows={3}
                                />
                                <div className="vc-input-footer">
                                    <span className="vc-input-hint">⏎ Send · ⇧⏎ New line</span>
                                    <button
                                        className="vc-send-btn"
                                        onClick={() => handleGenerate()}
                                        disabled={isGenerating || !userPrompt.trim()}
                                    >
                                        {isGenerating
                                            ? <><div className="vc-spinner" /> Generating</>
                                            : <><span>✨</span> Generate</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Status Bar ── */}
            <div className="vc-statusbar">
                <div className="vc-status-left">
                    <span className="vc-status-item">
                        <span className={`vc-status-dot ${isGenerating ? 'generating' : files.length > 0 ? 'ready' : 'idle'}`} />
                        {isGenerating ? 'Generating...' : files.length > 0 ? 'Ready' : 'Idle'}
                    </span>
                    {files.length > 0 && <>
                        <span className="vc-status-sep">│</span>
                        <span className="vc-status-item">📁 {files.length} files</span>
                    </>}
                    {selectedFile && <>
                        <span className="vc-status-sep">│</span>
                        <span className="vc-status-item">{selectedFile.path.split('/').pop()}</span>
                        <span className="vc-status-sep">│</span>
                        <span className="vc-status-item">{(selectedFile.code || '').split('\n').length} lines</span>
                    </>}
                </div>
                <div className="vc-status-right">
                    {currentProject?.name && <span className="vc-status-item">🎯 {currentProject.name}</span>}
                    <span className="vc-status-sep">│</span>
                    <span className="vc-status-item">UTF-8</span>
                    {selectedFile && <>
                        <span className="vc-status-sep">│</span>
                        <span className="vc-status-item">{getLang(selectedFile.path)}</span>
                    </>}
                </div>
            </div>
        </div>
    )
}

export default VibeCodingAgent
