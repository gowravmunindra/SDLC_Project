import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import CreateProjectModal from '../components/CreateProjectModal'

function ProjectsPage() {
    const navigate = useNavigate()
    const { projects, selectProject, loading, deleteProject } = useProject()
    const { user, logout } = useAuth()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [deletingId, setDeletingId] = useState(null)

    const handleSelectProject = async (project) => {
        await selectProject(project._id)
        navigate('/dashboard')
    }

    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation() // Prevent card click
        if (window.confirm('Are you sure you want to delete this project?')) {
            setDeletingId(projectId)
            await deleteProject(projectId)
            setDeletingId(null)
        }
    }

    const handleCreateSuccess = async () => {
        setShowCreateModal(false)
        // After creating, navigate to dashboard with the new project
        navigate('/dashboard')
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-dark)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px', borderWidth: '4px' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-dark)',
            padding: '24px'
        }}>
            {/* Header */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
                        Your Projects
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                        Select a project to continue or create a new one
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        👤 {user?.name || user?.email}
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Projects Grid */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {projects.length === 0 ? (
                    /* No Projects - Welcome Card */
                    <div style={{
                        maxWidth: '600px',
                        margin: '80px auto',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚀</div>
                        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
                            Create Your First Project
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
                            Get started by creating a project. Each project goes through the complete SDLC workflow.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary-action"
                            style={{ padding: '16px 32px', fontSize: '16px', justifyContent: 'center' }}
                        >
                            <span style={{ fontSize: '20px' }}>➕</span>
                            Create New Project
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Create New Project Card */}
                        <div
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                background: 'var(--bg-card)',
                                border: '2px dashed var(--border-color)',
                                borderRadius: '16px',
                                padding: '48px 24px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '240px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-600)'
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)'
                                e.currentTarget.style.background = 'var(--bg-card)'
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                fontSize: '32px'
                            }}>
                                ➕
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-600)' }}>
                                Create New Project
                            </h3>
                        </div>

                        {/* Existing Projects */}
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                onClick={() => handleSelectProject(project)}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    minHeight: '240px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--primary-600)'
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                {/* Project Icon */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                    fontSize: '24px'
                                }}>
                                    🗂️
                                </div>

                                {/* Project Name */}
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    marginBottom: '8px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {project.name}
                                </h3>

                                {/* Project Description */}
                                {project.description && (
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        marginBottom: '16px',
                                        flex: 1,
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {project.description}
                                    </p>
                                )}

                                {/* Status Badge */}
                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        color: 'var(--primary-600)',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'capitalize'
                                    }}>
                                        {project.status || 'Planning'}
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDeleteProject(e, project._id)}
                                    disabled={deletingId === project._id}
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        cursor: deletingId === project._id ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        opacity: deletingId === project._id ? 0.5 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (deletingId !== project._id) {
                                            e.stopPropagation()
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (deletingId !== project._id) {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                        }
                                    }}
                                >
                                    {deletingId === project._id ? '...' : '🗑️'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}

export default ProjectsPage
