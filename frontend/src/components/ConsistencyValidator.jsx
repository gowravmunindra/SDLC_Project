import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'

function ConsistencyValidator({ onClose }) {
    const { currentProject } = useProject()
    const [isValidating, setIsValidating] = useState(true)
    const [validationResults, setValidationResults] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (currentProject?._id) {
            performBackendValidation()
        }
    }, [currentProject])

    const performBackendValidation = async () => {
        setIsValidating(true)
        setError(null)
        try {
            const response = await apiService.validateConsistency(currentProject._id)
            if (response.data && response.data.success) {
                const report = response.data.report

                // Map backend report to the expected UI results structure
                const results = {
                    overallScore: parseInt(report.overall_completion) || 0,
                    totalChecks: Object.keys(report.module_progress).length,
                    passedChecks: Object.values(report.module_progress).filter(v => v === 'generated').length,
                    sections: [],
                    suggestions: report.suggestions.map(s => ({
                        priority: 'medium',
                        category: 'SDLC Recommendation',
                        title: s,
                        description: 'Consistency check based on actual project artifacts.',
                        action: 'Update phase outputs'
                    }))
                }

                // Construct Phase Completion Section
                results.sections.push({
                    title: 'Phase Completion Status',
                    icon: '📊',
                    status: report.consistency_status === 'valid' ? 'success' : 'warning',
                    checks: [
                        { name: 'Requirements Phase', passed: report.phase_progress.requirements === 'completed', message: report.phase_progress.requirements.split('_').join(' ') },
                        { name: 'Design Phase', passed: report.phase_progress.design === 'completed', message: report.phase_progress.design.split('_').join(' ') },
                        { name: 'Development Phase', passed: report.phase_progress.development === 'completed', message: report.phase_progress.development.split('_').join(' ') },
                        { name: 'Testing Phase', passed: report.phase_progress.testing === 'completed', message: report.phase_progress.testing.split('_').join(' ') }
                    ]
                })

                // Construct Module Alignment Section
                results.sections.push({
                    title: 'Component Alignment',
                    icon: '🔗',
                    status: report.consistency_status === 'valid' ? 'success' : 'warning',
                    checks: Object.entries(report.module_progress).map(([key, value]) => ({
                        name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        passed: value === 'generated',
                        message: value === 'generated' ? 'Artifact Validated ✓' : 'Artifact Missing ✗',
                        severity: value === 'generated' ? 'success' : 'warning'
                    }))
                })

                setValidationResults(results)
            } else {
                throw new Error('Failed to validate project consistency')
            }
        } catch (err) {
            console.error('Validation failed:', err)
            setError(err.message)
        } finally {
            setIsValidating(false)
        }
    }

    const exportReport = () => {
        if (!validationResults) return
        const blob = new Blob([JSON.stringify(validationResults, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `consistency-report-${currentProject?.name || 'project'}.json`
        a.click()
    }

    if (isValidating) {
        return (
            <div className="validator-overlay">
                <div className="validator-container">
                    <div className="validator-loading">
                        <div className="loading-spinner-large"></div>
                        <h3>Validating SDLC Consistency...</h3>
                        <p>Scanning all phase outputs for project alignment</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="validator-overlay">
                <div className="validator-container">
                    <div className="validator-header">
                        <h2>Validation Error</h2>
                        <button className="close-validator" onClick={onClose}>×</button>
                    </div>
                    <div className="validator-content centered-state">
                        <p className="error-message">{error}</p>
                        <button className="btn-primary" onClick={performBackendValidation}>Retry Validation</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="validator-overlay">
            <div className="validator-container">
                <div className="validator-header">
                    <div>
                        <h2>🔍 SDLC Consistency Validation Report</h2>
                        <p>Comprehensive analysis for <strong>{currentProject?.name}</strong></p>
                    </div>
                    <button className="close-validator" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6L18 18" />
                        </svg>
                    </button>
                </div>

                <div className="validator-content">
                    {/* Overall Score */}
                    <div className="validation-score">
                        <div className="score-circle">
                            <svg width="160" height="160" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke={validationResults.overallScore >= 80 ? '#22c55e' : validationResults.overallScore >= 50 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="12"
                                    strokeDasharray={`${(validationResults.overallScore / 100) * 440} 440`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 80 80)"
                                />
                            </svg>
                            <div className="score-text">
                                <div className="score-number">{validationResults.overallScore}%</div>
                                <div className="score-label">Project Progress</div>
                            </div>
                        </div>
                        <div className="score-stats">
                            <div className="stat-item">
                                <div className="stat-value">{validationResults.passedChecks}</div>
                                <div className="stat-label">Modules Ready</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{validationResults.totalChecks - validationResults.passedChecks}</div>
                                <div className="stat-label">Pending Items</div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Sections */}
                    <div className="validation-sections">
                        {validationResults.sections.map((section, idx) => (
                            <div key={idx} className={`validation-section section-${section.status}`}>
                                <div className="section-header">
                                    <span className="section-icon">{section.icon}</span>
                                    <h4>{section.title}</h4>
                                    <span className={`section-badge badge-${section.status}`}>
                                        {section.status === 'success' ? '✓ Valid' : '⚠ Action Required'}
                                    </span>
                                </div>
                                <div className="section-checks">
                                    {section.checks.map((check, cidx) => (
                                        <div key={cidx} className={`check-item check-${check.passed ? 'passed' : 'failed'}`}>
                                            <div className="check-icon">
                                                {check.passed ? '✓' : '✗'}
                                            </div>
                                            <div className="check-content">
                                                <div className="check-name">{check.name}</div>
                                                <div className="check-message">{check.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Suggestions */}
                    {validationResults.suggestions.length > 0 && (
                        <div className="suggestions-section">
                            <h3>💡 Improvement Suggestions</h3>
                            <div className="suggestions-list">
                                {validationResults.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className={`suggestion-card priority-${suggestion.priority}`}>
                                        <div className="suggestion-header">
                                            <span className={`priority-badge priority-${suggestion.priority}`}>
                                                {suggestion.priority.toUpperCase()}
                                            </span>
                                            <span className="suggestion-category">{suggestion.category}</span>
                                        </div>
                                        <h5>{suggestion.title}</h5>
                                        <p>{suggestion.description}</p>
                                        <div className="suggestion-action">
                                            <strong>Action:</strong> {suggestion.action}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="validator-actions">
                        <button className="btn-secondary" onClick={exportReport}>
                            📥 Export Report
                        </button>
                        <button className="btn-primary-action" onClick={onClose}>
                            Close Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConsistencyValidator
