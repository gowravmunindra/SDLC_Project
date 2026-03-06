import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './VibeCodingAgent.css'

// ─── File type icon map ───────────────────────────────────────────────────────
const FILE_ICONS = {
    js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
    css: '🎨', html: '🌐', json: '📋',
    md: '📝', default: '📄'
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    return FILE_ICONS[ext] || FILE_ICONS.default
}

function getLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    const map = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        css: 'css', html: 'html', json: 'json', md: 'markdown'
    }
    return map[ext] || 'text'
}

function CodeWithLineNumbers({ code, language }) {
    if (!code) return <div className="no-code">No content</div>
    const lines = code.split('\n')
    return (
        <div className="code-with-lines">
            <div className="line-numbers">
                {lines.map((_, i) => <span key={i} className="line-num">{i + 1}</span>)}
            </div>
            <pre className={`code-content lang-${language}`}><code>{code}</code></pre>
        </div>
    )
}

function TreeNode({ node, path, expandedFolders, onToggle, onSelectFile, selectedFilePath, files }) {
    // Fix: handle the root properly
    const isRoot = path === '' && node.name === 'root'
    const currentPath = isRoot ? '' : (path ? `${path}/${node.name}` : node.name)
    const isExpanded = isRoot || expandedFolders.has(currentPath)

    if (node.type === 'folder') {
        return (
            <div className="tree-node">
                {!isRoot && (
                    <div className="tree-folder" onClick={() => onToggle(currentPath)}>
                        <span className="tree-arrow">{isExpanded ? '▾' : '▸'}</span>
                        <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
                        <span className="folder-name">{node.name}</span>
                    </div>
                )}
                {isExpanded && node.children && (
                    <div className={isRoot ? 'tree-root-children' : 'tree-children'}>
                        {node.children.map((child, i) => (
                            <TreeNode
                                key={`${currentPath}-${child.name}-${i}`}
                                node={child}
                                path={currentPath}
                                expandedFolders={expandedFolders}
                                onToggle={onToggle}
                                onSelectFile={onSelectFile}
                                selectedFilePath={selectedFilePath}
                                files={files}
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
        >
            <span className="file-type-icon">{getFileIcon(node.name)}</span>
            <span className="file-name">{node.name}</span>
        </div>
    )
}

function VibeCodingAgent({ onClose, onComplete }) {
    const { currentProject, refreshCurrentProject } = useProject()
    const [structure, setStructure] = useState(null)
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState(null)
    const [openTabs, setOpenTabs] = useState([])
    const [userPrompt, setUserPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [expandedFolders, setExpandedFolders] = useState(new Set(['root']))
    const [chatMessages, setChatMessages] = useState([
        { type: 'bot', text: '👋 Describe the project you want to build!' }
    ])
    const [countdown, setCountdown] = useState(0)
    const chatEndRef = useRef(null)

    // Load existing project data on mount or when currentProject changes
    useEffect(() => {
        if (currentProject?.development) {
            if (currentProject.development.structure) {
                setStructure(currentProject.development.structure);
            }
            if (currentProject.development.codeFiles) {
                setFiles(currentProject.development.codeFiles);

                // Auto-open first file if none selected
                if (currentProject.development.codeFiles.length > 0 && !selectedFile) {
                    const firstFile = currentProject.development.codeFiles[0];
                    setSelectedFile(firstFile);
                    setOpenTabs([firstFile]);
                }
            }
        }
    }, [currentProject])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages, isGenerating])

    useEffect(() => {
        if (countdown <= 0) return
        const timer = setInterval(() => setCountdown(c => c - 1), 1000)
        return () => clearInterval(timer)
    }, [countdown])

    const toggleFolder = useCallback((path) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            next.has(path) ? next.delete(path) : next.add(path)
            return next
        })
    }, [])

    const handleDownloadZip = async () => {
        if (files.length === 0) return
        const zip = new JSZip()
        files.forEach(file => {
            zip.file(file.path, file.code)
        })
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${currentProject?.name || 'project'}-vibe-code.zip`)
    }

    // ─── Dynamic Predefined Prompts ──────────────────────────────────────────────
    const PREDEFINED_PROMPTS = useMemo(() => {
        const title = currentProject?.name || 'My Project';
        const rawDesc = currentProject?.description || 'a professional application';
        const descSnippet = rawDesc.length > 80 ? rawDesc.substring(0, 77) + '...' : rawDesc;

        return [
            {
                icon: '🚀',
                label: 'Full Project Logic',
                prompt: `Generate the full functional logic for "${title}" as described: ${rawDesc}. Ensure professional clean code.`
            },
            {
                icon: '💎',
                label: 'Professional UI/UX',
                prompt: `Focus on the UI components and modern styling for "${title}". Visual vision: ${descSnippet}`
            },
            {
                icon: '🛠️',
                label: 'Modular MVP',
                prompt: `Build a modular MVP for "${title}" with essential features: ${descSnippet}. Keep it clean and scalable.`
            },
            {
                icon: '📝',
                label: 'Complete Repository',
                prompt: `Initialize "${title}" as a professional GitHub repository with a detailed README.md, .env, and structure.`
            }
        ];
    }, [currentProject]);

    const handleGenerate = async (quickPrompt = null) => {
        const prompt = (quickPrompt || userPrompt).trim()
        if (!prompt || isGenerating) return

        if (!quickPrompt) setUserPrompt('')

        // FORCE FRESH BUILD for predefined prompts or if no files yet
        const isFreshBuild = quickPrompt !== null || files.length === 0;

        if (isFreshBuild) {
            setFiles([]);
            setStructure(null);
            setSelectedFile(null);
            setOpenTabs([]);
            setChatMessages([{ type: 'user', text: quickPrompt ? `🚀 New Full-Stack Build: ${quickPrompt}` : prompt }]);
        } else {
            setChatMessages(prev => [...prev, { type: 'user', text: prompt }]);
        }

        setIsGenerating(true)
        setCountdown(45)

        try {
            const payload = {
                projectId: currentProject?._id || 'standalone',
                userPrompt: prompt,
                currentFiles: isFreshBuild ? [] : files
            }

            const res = isFreshBuild
                ? await apiService.vibeGenerate(payload)
                : await apiService.vibeUpdate(payload);

            if (res.data.success) {
                setStructure(res.data.structure)
                setFiles(res.data.files)

                if (res.data.files.length > 0) {
                    const readme = res.data.files.find(f => f.path.toLowerCase().includes('readme.md'));
                    const defaultFile = readme || res.data.files[0];
                    setSelectedFile(defaultFile)
                    setOpenTabs([defaultFile])
                }

                setChatMessages(prev => [...prev, { type: 'bot', text: res.data.summary }])
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { type: 'bot', text: `❌ Error: ${err.message}` }])
        } finally {
            setIsGenerating(false)
            setCountdown(0)
        }
    }

    const handleFinalize = async () => {
        if (!window.confirm("Finalize Development Phase?\n\nThis will mark the phase as complete and move you directly to the Testing Phase.")) return;

        setIsGenerating(true);
        try {
            // Minimal payload: skip codeFiles as per user request
            const payload = {
                techStack: currentProject.development?.techStack || {},
                structure: structure,
                codeFiles: [], // Clean out internal code storage as per user request
                completedAt: new Date().toISOString()
            };

            // Use apiService instead of raw axios to ensure Bearer token is attached (fixes 401 error)
            await apiService.saveDevelopment(currentProject._id, payload);
            await refreshCurrentProject(); // Sync global state

            window.alert("✅ Phase finalized! Navigating to Testing...");

            if (onComplete) {
                onComplete();
            } else {
                onClose();
            }
        } catch (err) {
            window.alert("❌ Failed to finalize: " + (err.response?.data?.message || err.message));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="vibe-root">
            <div className="vibe-titlebar">
                <div className="titlebar-left">
                    <span className="vibe-logo">⚡</span>
                    <span className="vibe-app-name">Vibe Coding</span>
                    <span className="vibe-project-badge">{currentProject?.name || 'New Project'}</span>
                </div>
                <div className="titlebar-right">
                    <button
                        className="finalize-btn"
                        onClick={handleFinalize}
                        disabled={isGenerating || files.length === 0}
                        style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: (isGenerating || files.length === 0) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginRight: '8px',
                            opacity: (isGenerating || files.length === 0) ? 0.6 : 1
                        }}
                    >
                        <span>🚀 Finalize Phase</span>
                    </button>
                    <button className="download-btn" onClick={handleDownloadZip} disabled={files.length === 0}>
                        📥 Download ZIP
                    </button>
                    <button className="titlebar-close" onClick={onClose}>✕</button>
                </div>
            </div>

            <div className="vibe-body">
                <div className="activity-bar">
                    <div className="activity-icon active" title="Explorer">📂</div>
                </div>

                {structure && (
                    <div className="explorer-panel">
                        <div className="explorer-header">EXPLORER</div>
                        <div className="file-tree">
                            <TreeNode
                                node={structure}
                                path=""
                                expandedFolders={expandedFolders}
                                onToggle={toggleFolder}
                                onSelectFile={(f) => {
                                    setSelectedFile(f)
                                    if (!openTabs.find(t => t.path === f.path)) setOpenTabs([...openTabs, f])
                                }}
                                selectedFilePath={selectedFile?.path}
                                files={files}
                            />
                        </div>
                    </div>
                )}

                <div className="editor-area">
                    {openTabs.length > 0 && (
                        <>
                            <div className="tab-bar">
                                {openTabs.map(tab => (
                                    <div
                                        key={tab.path}
                                        className={`editor-tab ${selectedFile?.path === tab.path ? 'active' : ''}`}
                                        onClick={() => setSelectedFile(tab)}
                                    >
                                        <span className="tab-icon">{getFileIcon(tab.path.split('/').pop())}</span>
                                        <span className="tab-name">{tab.path.split('/').pop()}</span>
                                        <button className="tab-close" onClick={(e) => {
                                            e.stopPropagation()
                                            const next = openTabs.filter(t => t.path !== tab.path)
                                            setOpenTabs(next)
                                            if (selectedFile?.path === tab.path) setSelectedFile(next[next.length - 1])
                                        }}>×</button>
                                    </div>
                                ))}
                            </div>
                            {selectedFile && (
                                <div className="breadcrumb">
                                    <span className="bc-folder">project</span>
                                    <span className="bc-sep">/</span>
                                    <span className="bc-file">{selectedFile.path}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="editor-content">
                        {selectedFile ? (
                            <div className="code-viewer">
                                <CodeWithLineNumbers code={selectedFile.code} language={getLanguage(selectedFile.path)} />
                            </div>
                        ) : (
                            <div className="editor-welcome">
                                <span className="welcome-logo">⚡</span>
                                <h2>Vibe Coding Tool</h2>
                                <p>Generate a complete professional project in seconds.</p>

                                <div className="welcome-examples" style={{ marginTop: 40, width: '100%', maxWidth: 500 }}>
                                    <div className="examples-label">✨ Single-Click Generation:</div>
                                    <div className="quick-prompt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {PREDEFINED_PROMPTS.map(p => (
                                            <button
                                                key={p.label}
                                                className="example-prompt"
                                                onClick={() => handleGenerate(p.prompt)}
                                                disabled={isGenerating}
                                            >
                                                <span style={{ fontSize: 18 }}>{p.icon}</span>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: 600, color: 'white' }}>{p.label}</div>
                                                    <div style={{ fontSize: 10, opacity: 0.6 }}>Create from template</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ai-panel">
                    <div className="ai-panel-header">
                        <span className="ai-header-icon">🤖</span>
                        AI ASSISTANT
                    </div>
                    <div className="ai-chat-area">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.type}`}>
                                <div className="bubble-text">{msg.text}</div>
                                {i === 0 && msg.type === 'bot' && files.length === 0 && (
                                    <div className="mini-prompt-list" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {PREDEFINED_PROMPTS.map(p => (
                                            <button
                                                key={p.label}
                                                className="mini-prompt-btn"
                                                onClick={() => handleGenerate(p.prompt)}
                                                disabled={isGenerating}
                                                style={{
                                                    background: 'rgba(0, 122, 204, 0.15)',
                                                    border: '1px solid rgba(0, 122, 204, 0.3)',
                                                    color: '#9cdcfe',
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    textAlign: 'left',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {p.icon} {p.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="chat-bubble bot">
                                <div className="bubble-text">
                                    <div className="coding-animation">
                                        <span>Designing project architecture...</span>
                                        <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="ai-input-area">
                        <div className={`ai-input-wrapper ${isGenerating ? 'disabled' : ''}`}>
                            <textarea
                                className="ai-textarea"
                                placeholder="Describe changes or click a template above..."
                                value={userPrompt}
                                onChange={e => setUserPrompt(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                                disabled={isGenerating}
                            />
                            <div className="ai-input-footer">
                                <div className="input-hint">Shift + Enter for new line</div>
                                <button
                                    className="send-button"
                                    onClick={() => handleGenerate()}
                                    disabled={isGenerating || !userPrompt.trim()}
                                >
                                    {isGenerating ? <div className="btn-spinner"></div> : 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <div className="status-left">
                    <span className="status-item">Ready</span>
                    <span className="status-sep">|</span>
                    <span className="status-item">{files.length} files</span>
                </div>
                <div className="status-right">
                    {isGenerating && (
                        <div className="status-item generating">
                            <div className="status-spinner"></div>
                            <span>AI is coding...</span>
                        </div>
                    )}
                    <span className="status-sep">|</span>
                    <span className="status-item">UTF-8</span>
                    <span className="status-item">JavaScript</span>
                </div>
            </div>
        </div>
    )
}

export default VibeCodingAgent
