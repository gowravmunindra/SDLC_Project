import { useState } from 'react'
import RequirementsAgent from './RequirementsAgent'
import DesignAgent from './DesignAgent'
import DevelopmentAgent from './DevelopmentAgent'
import TestingAgent from './TestingAgent'
import ConsistencyValidator from './ConsistencyValidator'

function Dashboard({ isOpen, onClose }) {
    const [activeAgent, setActiveAgent] = useState(null)
    const [showValidator, setShowValidator] = useState(false)
    const [phases, setPhases] = useState([
        { id: 'requirements', icon: '📋', name: 'Requirements Analysis', description: 'Define what to build', status: 'ready', locked: false },
        { id: 'design', icon: '🎨', name: 'System Design', description: 'Plan the architecture', status: 'locked', locked: true },
        { id: 'development', icon: '💻', name: 'Development', description: 'Build the solution', status: 'locked', locked: true },
        { id: 'testing', icon: '🧪', name: 'Testing & QA', description: 'Ensure quality', status: 'locked', locked: true },
        { id: 'deployment', icon: '🚀', name: 'Deployment', description: 'Release to production', status: 'locked', locked: true },
        { id: 'maintenance', icon: '🔧', name: 'Maintenance', description: 'Monitor & improve', status: 'locked', locked: true }
    ])

    const handleStartPhase = (phaseId) => {
        const phaseIndex = phases.findIndex(p => p.id === phaseId)
        if (phaseIndex === -1 || phases[phaseIndex].locked) return

        // Open the appropriate agent
        setActiveAgent(phaseId)
    }

    const handleAgentComplete = (phaseId, data) => {
        const phaseIndex = phases.findIndex(p => p.id === phaseId)
        if (phaseIndex === -1) return

        const newPhases = [...phases]
        newPhases[phaseIndex].status = 'completed'

        // Unlock next phase
        if (phaseIndex < phases.length - 1) {
            newPhases[phaseIndex + 1].locked = false
            newPhases[phaseIndex + 1].status = 'ready'
        }

        setPhases(newPhases)
        setActiveAgent(null)
    }

    const handleCloseAgent = () => {
        setActiveAgent(null)
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

    // If an agent is active, show it instead of the dashboard
    if (activeAgent === 'requirements') {
        return <RequirementsAgent
            onClose={handleCloseAgent}
            onComplete={(data) => handleAgentComplete('requirements', data)}
        />
    }

    if (activeAgent === 'design') {
        return <DesignAgent
            onClose={handleCloseAgent}
            onComplete={(data) => handleAgentComplete('design', data)}
        />
    }

    if (activeAgent === 'development') {
        return <DevelopmentAgent
            onClose={handleCloseAgent}
            onComplete={(data) => handleAgentComplete('development', data)}
        />
    }

    if (activeAgent === 'testing') {
        return <TestingAgent
            onClose={handleCloseAgent}
            onComplete={(data) => handleAgentComplete('testing', data)}
        />
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
                        <button className="btn-validate" onClick={handleValidateConsistency}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="10" cy="10" r="7" />
                                <path d="M7 10L9 12L13 8" />
                            </svg>
                            Validate Consistency
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
                                        onClick={() => handleStartPhase(phase.id)}
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
        </div>
    )
}

export default Dashboard
