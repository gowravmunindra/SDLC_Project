import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProject } from '../contexts/ProjectContext'
import ProjectSelector from './ProjectSelector'
import CreateProjectModal from './CreateProjectModal'
import ConsistencyValidator from './ConsistencyValidator'

function Dashboard({ isOpen, onClose }) {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { currentProject } = useProject()
    const [showValidator, setShowValidator] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [phases, setPhases] = useState([
        { id: 'requirements', path: '/requirements', icon: '📋', name: 'Requirements Analysis', description: 'Define what to build', status: 'ready', locked: false },
        { id: 'design', path: '/design', icon: '🎨', name: 'System Design', description: 'Plan the architecture', status: 'locked', locked: true },
        { id: 'development', path: '/development', icon: '💻', name: 'Development', description: 'Build the solution', status: 'locked', locked: true },
        { id: 'testing', path: '/testing', icon: '🧪', name: 'Testing & QA', description: 'Ensure quality', status: 'locked', locked: true },
{ id: 'deployment', path: '#', icon: '🚀', name: 'Deployment', description: 'Release to production', status: 'locked', locked: true },
        { id: 'maintenance', path: '#', icon: '🔧', name: 'Maintenance', description: 'Monitor & improve', status: 'locked', locked: true }
    ])

    // Check project data for completed phases when current project changes
    useEffect(() => {
        if (!currentProject) return

        const newPhases = [...phases]
        
        // Check which phases are completed based on project data
        if (currentProject.requirements?.completedAt) {
            newPhases[0].status = 'completed'
            newPhases[1].locked = false
            newPhases[1].status = 'ready'
        }
        if (currentProject.design?.completedAt) {
            newPhases[1].status = 'completed'
            newPhases[2].locked = false
            newPhases[2].status = 'ready'
        }
        if (currentProject.development?.completedAt) {
            newPhases[2].status = 'completed'
            newPhases[3].locked = false
            newPhases[3].status = 'ready'
        }
        if (currentProject.testing?.completedAt) {
            newPhases[3].status = 'completed'
            newPhases[4].locked = false
            newPhases[4].status = 'ready'
        }

        setPhases(newPhases)
    }, [currentProject])

    const handleStartPhase = (phase) => {
        if (phase.locked) return
        
        // Navigate to the phase page
        if (phase.path !== '#') {
            navigate(phase.path)
        }
    }

    const handleValidateConsistency = () => {
        setShowValidator(true)
    }

    const handleCloseValidator = () => {
        setShowValidator(false)
    }

    if (!isOpen) return null

    // Show Consistency Validator
    if (showValidator) {
        return <ConsistencyValidator onClose={handleCloseValidator} />
    }

    return (
        <div className="dashboard-overlay">
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="dashboard-title-section">
                        <h2>SDLC Dashboard</h2>
                        <p>Manage your software development lifecycle</p>
                    </div>
                    <div className="dashboard-header-actions">
                        {currentProject && (
                            <ProjectSelector onCreateNew={() => setShowCreateModal(true)} />
                        )}
                        <button className="btn-validate" onClick={handleValidateConsistency}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="10" cy="10" r="7" />
                                <path d="M7 10L9 12L13 8" />
                            </svg>
                            Validate Consistency
                        </button>
                        <button 
                            onClick={logout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '10px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                                e.currentTarget.style.borderColor = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Sign Out
                        </button>
                        <button className="close-dashboard" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6L18 18" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="dashboard-content">
                    {/* Workflow Info Banner */}
                    <div className="workflow-banner">
                        <div className="banner-icon">🔄</div>
                        <div className="banner-content">
                            <h4>Collaborative SDLC Workflow</h4>
                            <p>
                                Complete phases sequentially: Requirements → Design → Development → Testing.
                                Use the <strong>Validate Consistency</strong> button to check alignment between phases.
                                The AI Chatbot (💬 bottom-right) is always available for guidance!
                            </p>
                        </div>
                    </div>

                    <div className="phase-cards">
                        {phases.map((phase) => (
                            <div key={phase.id} className="phase-card" data-phase={phase.id}>
                                <div className="phase-header">
                                    <div className="phase-icon">{phase.icon}</div>
                                    <div className="phase-info">
                                        <h3>{phase.name}</h3>
                                        <p>{phase.description}</p>
                                    </div>
                                    <div className={`phase-status status-${phase.status}`}>
                                        {phase.status === 'ready' ? 'Ready' :
                                            phase.status === 'in-progress' ? 'In Progress' :
                                                phase.status === 'completed' ? 'Completed' : 'Locked'}
                                    </div>
                                </div>
                                <div className="phase-actions">
                                    <button
                                        className="btn-phase-action"
                                        disabled={phase.locked}
                                        onClick={() => handleStartPhase(phase)}
                                    >
                                        {phase.status === 'in-progress' ? 'Continue' :
                                            phase.status === 'completed' ? 'Review' : 'Start Phase'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Tips */}
                    <div className="dashboard-tips">
                        <h4>💡 Quick Tips</h4>
                        <ul>
                            <li><strong>Sequential Workflow:</strong> Complete each phase before moving to the next</li>
                            <li><strong>Validate Often:</strong> Use the Validate Consistency button to check alignment</li>
                            <li><strong>Revisit Phases:</strong> You can review completed phases anytime</li>
                            <li><strong>Export Artifacts:</strong> Download your work from each agent</li>
                            <li><strong>Get Help:</strong> Click the AI Guide chatbot for assistance</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            {/* Create Project Modal */}
            <CreateProjectModal 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => setShowCreateModal(false)}
            />
        </div>
    )
}

export default Dashboard
