import { useState } from 'react'
import { useProject } from '../contexts/ProjectContext'

function CreateProjectModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState('')
    
    const { createProject } = useProject()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Project name is required')
            return
        }

        setIsCreating(true)

        const result = await createProject({
            name: name.trim(),
            description: description.trim()
        })

        if (result.success) {
            setName('')
            setDescription('')
            onSuccess?.(result.project)
            onClose()
        } else {
            setError(result.error)
        }

        setIsCreating(false)
    }

    const handleClose = () => {
        if (!isCreating) {
            setName('')
            setDescription('')
            setError('')
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                margin: '20px',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '24px',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                        Create New Project
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            cursor: isCreating ? 'not-allowed' : 'pointer',
                            opacity: isCreating ? 0.5 : 1,
                            fontSize: '20px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => !isCreating && (e.target.style.borderColor = 'var(--primary-600)')}
                        onMouseLeave={(e) => !isCreating && (e.target.style.borderColor = 'var(--border-color)')}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            marginBottom: '20px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E-Commerce Platform"
                            required
                            disabled={isCreating}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'var(--bg-dark)',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '15px',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-600)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A full-stack e-commerce web application with user authentication, product catalog, shopping cart, and payment integration..."
                            disabled={isCreating}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'var(--bg-dark)',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '15px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-600)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="btn-secondary"
                            style={{ padding: '12px 24px' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="btn-primary-action"
                            style={{ padding: '12px 24px' }}
                        >
                            {isCreating ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                '✨ Create Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateProjectModal
