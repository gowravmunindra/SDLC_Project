import { useState, useRef, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'

function ProjectSelector({ onCreateNew }) {
    const { projects, currentProject, selectProject } = useProject()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectProject = async (projectId) => {
        await selectProject(projectId)
        setIsOpen(false)
    }

    const handleCreateNew = () => {
        setIsOpen(false)
        onCreateNew?.()
    }

    // Safety rendering
    const renderSafeValue = (val) => {
        if (!val) return 'Untitled Project';
        if (typeof val === 'string') return val;
        return String(val);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '200px',
                    justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'
                    e.currentTarget.style.borderColor = 'var(--primary-600)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, textAlign: 'left' }}>
                    <span style={{ fontSize: '16px' }}>{currentProject ? '🚀' : '📂'}</span>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            {currentProject ? 'Current Project' : 'Select Project'}
                        </div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {currentProject ? renderSafeValue(currentProject.name) : 'Choose a Project...'}
                        </div>
                    </div>
                </div>
                <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    transition: 'transform 0.3s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 5000,
                    minWidth: '280px'
                }}>
                    <div style={{ padding: '8px' }}>
                        {projects.map((project) => (
                            <button
                                key={project._id}
                                onClick={() => handleSelectProject(project._id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    background: project._id === currentProject?._id
                                        ? 'rgba(99, 102, 241, 0.1)'
                                        : 'transparent',
                                    border: '1px solid transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                    if (project._id !== currentProject?._id) {
                                        e.currentTarget.style.background = 'transparent'
                                    }
                                    e.currentTarget.style.borderColor = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>🗂️</span>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {project.name}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'capitalize'
                                    }}>
                                        {project.status || 'planning'}
                                    </div>
                                </div>
                                {project._id === currentProject?._id && (
                                    <span style={{ fontSize: '16px', color: 'var(--primary-600)' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', padding: '8px' }}>
                        <button
                            onClick={handleCreateNew}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                background: 'transparent',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: 'var(--primary-600)',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'
                                e.currentTarget.style.borderColor = 'var(--primary-600)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.borderColor = 'var(--border-color)'
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>➕</span>
                            Create New Project
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProjectSelector
