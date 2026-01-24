import { useState, useEffect } from 'react'

function ConsistencyValidator({ onClose }) {
    const [isValidating, setIsValidating] = useState(true)
    const [validationResults, setValidationResults] = useState(null)
    const [requirements, setRequirements] = useState(null)
    const [design, setDesign] = useState(null)
    const [development, setDevelopment] = useState(null)
    const [testing, setTesting] = useState(null)

    useEffect(() => {
        loadAllPhases()
    }, [])

    const loadAllPhases = () => {
        const reqData = localStorage.getItem('sdlc_requirements')
        const designData = localStorage.getItem('sdlc_design')
        const devData = localStorage.getItem('sdlc_development')
        const testData = localStorage.getItem('sdlc_testing')

        setRequirements(reqData ? JSON.parse(reqData) : null)
        setDesign(designData ? JSON.parse(designData) : null)
        setDevelopment(devData ? JSON.parse(devData) : null)
        setTesting(testData ? JSON.parse(testData) : null)

        setTimeout(() => {
            performValidation(
                reqData ? JSON.parse(reqData) : null,
                designData ? JSON.parse(designData) : null,
                devData ? JSON.parse(devData) : null,
                testData ? JSON.parse(testData) : null
            )
        }, 2000)
    }

    const performValidation = (req, des, dev, test) => {
        const results = {
            overallScore: 0,
            totalChecks: 0,
            passedChecks: 0,
            sections: []
        }

        // Phase Completion Check
        const completionCheck = {
            title: 'Phase Completion Status',
            icon: '📊',
            status: 'info',
            checks: [
                { name: 'Requirements Phase', passed: !!req, message: req ? 'Completed ✓' : 'Not completed ✗' },
                { name: 'Design Phase', passed: !!des, message: des ? 'Completed ✓' : 'Not completed ✗' },
                { name: 'Development Phase', passed: !!dev, message: dev ? 'Completed ✓' : 'Not completed ✗' },
                { name: 'Testing Phase', passed: !!test, message: test ? 'Completed ✓' : 'Not completed ✗' }
            ]
        }
        results.sections.push(completionCheck)

        // Requirements ↔ Design Validation
        if (req && des) {
            const reqDesignCheck = validateRequirementsDesign(req, des)
            results.sections.push(reqDesignCheck)
            results.totalChecks += reqDesignCheck.checks.length
            results.passedChecks += reqDesignCheck.checks.filter(c => c.passed).length
        }

        // Design ↔ Development Validation
        if (des && dev) {
            const designDevCheck = validateDesignDevelopment(des, dev)
            results.sections.push(designDevCheck)
            results.totalChecks += designDevCheck.checks.length
            results.passedChecks += designDevCheck.checks.filter(c => c.passed).length
        }

        // Requirements ↔ Testing Validation
        if (req && test) {
            const reqTestCheck = validateRequirementsTesting(req, test)
            results.sections.push(reqTestCheck)
            results.totalChecks += reqTestCheck.checks.length
            results.passedChecks += reqTestCheck.checks.filter(c => c.passed).length
        }

        // Calculate overall score
        if (results.totalChecks > 0) {
            results.overallScore = Math.round((results.passedChecks / results.totalChecks) * 100)
        }

        // Generate improvement suggestions
        results.suggestions = generateSuggestions(results, req, des, dev, test)

        setValidationResults(results)
        setIsValidating(false)
    }

    const validateRequirementsDesign = (req, des) => {
        const checks = []

        // Check if functional requirements are addressed in components
        const frCount = req.functionalRequirements?.length || 0
        const componentCount = des.components?.length || 0

        checks.push({
            name: 'Requirements Coverage in Design',
            passed: componentCount >= Math.ceil(frCount / 2),
            message: componentCount >= Math.ceil(frCount / 2)
                ? `${componentCount} components defined for ${frCount} requirements ✓`
                : `Only ${componentCount} components for ${frCount} requirements. Consider adding more components ✗`,
            severity: componentCount >= Math.ceil(frCount / 2) ? 'success' : 'warning'
        })

        // Check if database schema exists
        const hasDatabase = des.databaseSchema?.tables?.length > 0
        checks.push({
            name: 'Database Schema Defined',
            passed: hasDatabase,
            message: hasDatabase
                ? `${des.databaseSchema.tables.length} database tables defined ✓`
                : 'No database schema found. Add database design ✗',
            severity: hasDatabase ? 'success' : 'error'
        })

        // Check if architecture is defined
        const hasArchitecture = !!des.architecture?.type
        checks.push({
            name: 'Architecture Defined',
            passed: hasArchitecture,
            message: hasArchitecture
                ? `${des.architecture.type} architecture selected ✓`
                : 'Architecture type not defined ✗',
            severity: hasArchitecture ? 'success' : 'error'
        })

        // Check if diagrams exist
        const hasDiagrams = des.diagrams?.useCase && des.diagrams?.class && des.diagrams?.sequence
        checks.push({
            name: 'UML Diagrams Present',
            passed: hasDiagrams,
            message: hasDiagrams
                ? 'All UML diagrams (Use Case, Class, Sequence) defined ✓'
                : 'Some UML diagrams missing ✗',
            severity: hasDiagrams ? 'success' : 'warning'
        })

        return {
            title: 'Requirements ↔ Design Alignment',
            icon: '🔗',
            status: checks.every(c => c.passed) ? 'success' : checks.some(c => c.severity === 'error') ? 'error' : 'warning',
            checks
        }
    }

    const validateDesignDevelopment = (des, dev) => {
        const checks = []

        // Check if tech stack is defined
        const hasTechStack = dev.techStack && Object.keys(dev.techStack).length > 0
        checks.push({
            name: 'Technology Stack Defined',
            passed: hasTechStack,
            message: hasTechStack
                ? 'Complete tech stack recommendations provided ✓'
                : 'Technology stack not defined ✗',
            severity: hasTechStack ? 'success' : 'error'
        })

        // Check if code snippets exist
        const hasCodeSnippets = dev.codeSnippets?.length > 0
        checks.push({
            name: 'Code Snippets Available',
            passed: hasCodeSnippets,
            message: hasCodeSnippets
                ? `${dev.codeSnippets.length} code snippets provided ✓`
                : 'No code snippets generated ✗',
            severity: hasCodeSnippets ? 'success' : 'warning'
        })

        // Check if API contracts exist
        const hasAPIContracts = dev.apiContracts?.length > 0
        checks.push({
            name: 'API Contracts Documented',
            passed: hasAPIContracts,
            message: hasAPIContracts
                ? `${dev.apiContracts.length} API endpoints documented ✓`
                : 'API contracts not defined ✗',
            severity: hasAPIContracts ? 'success' : 'warning'
        })

        // Check if folder structure exists
        const hasFolderStructure = dev.folderStructure?.length > 0
        checks.push({
            name: 'Project Structure Defined',
            passed: hasFolderStructure,
            message: hasFolderStructure
                ? 'Complete folder structure provided ✓'
                : 'Project structure not defined ✗',
            severity: hasFolderStructure ? 'success' : 'error'
        })

        // Check alignment with design components
        const designComponents = des.components?.length || 0
        const apiEndpoints = dev.apiContracts?.length || 0
        const hasAlignment = apiEndpoints >= Math.ceil(designComponents / 2)

        checks.push({
            name: 'Design-Development Alignment',
            passed: hasAlignment,
            message: hasAlignment
                ? `${apiEndpoints} API endpoints for ${designComponents} components ✓`
                : `Only ${apiEndpoints} endpoints for ${designComponents} components. Add more APIs ✗`,
            severity: hasAlignment ? 'success' : 'warning'
        })

        return {
            title: 'Design ↔ Development Alignment',
            icon: '🔗',
            status: checks.every(c => c.passed) ? 'success' : checks.some(c => c.severity === 'error') ? 'error' : 'warning',
            checks
        }
    }

    const validateRequirementsTesting = (req, test) => {
        const checks = []

        // Check if test cases exist
        const hasTestCases = test.testCases?.length > 0
        checks.push({
            name: 'Test Cases Generated',
            passed: hasTestCases,
            message: hasTestCases
                ? `${test.testCases.length} test cases created ✓`
                : 'No test cases found ✗',
            severity: hasTestCases ? 'success' : 'error'
        })

        // Check requirements coverage
        const frCount = req.functionalRequirements?.length || 0
        const tcCount = test.testCases?.length || 0
        const hasCoverage = tcCount >= frCount

        checks.push({
            name: 'Requirements Test Coverage',
            passed: hasCoverage,
            message: hasCoverage
                ? `${tcCount} test cases for ${frCount} requirements (${Math.round((tcCount / frCount) * 100)}% coverage) ✓`
                : `Only ${tcCount} test cases for ${frCount} requirements (${Math.round((tcCount / frCount) * 100)}% coverage). Add more tests ✗`,
            severity: hasCoverage ? 'success' : 'warning'
        })

        // Check if test strategy exists
        const hasStrategy = test.testStrategy && Object.keys(test.testStrategy).length > 0
        checks.push({
            name: 'Test Strategy Defined',
            passed: hasStrategy,
            message: hasStrategy
                ? 'Comprehensive test strategy documented ✓'
                : 'Test strategy not defined ✗',
            severity: hasStrategy ? 'success' : 'error'
        })

        // Check if edge cases are covered
        const hasEdgeCases = test.edgeCases?.length > 0
        checks.push({
            name: 'Edge Cases Identified',
            passed: hasEdgeCases,
            message: hasEdgeCases
                ? `${test.edgeCases.length} edge cases documented ✓`
                : 'No edge cases identified ✗',
            severity: hasEdgeCases ? 'success' : 'warning'
        })

        // Check if integration tests exist
        const hasIntegrationTests = test.integrationTests?.length > 0
        checks.push({
            name: 'Integration Tests Defined',
            passed: hasIntegrationTests,
            message: hasIntegrationTests
                ? `${test.integrationTests.length} integration tests planned ✓`
                : 'No integration tests defined ✗',
            severity: hasIntegrationTests ? 'success' : 'warning'
        })

        // Check traceability matrix
        const hasTraceability = test.traceabilityMatrix?.length > 0
        checks.push({
            name: 'Requirements Traceability',
            passed: hasTraceability,
            message: hasTraceability
                ? 'Requirements traceability matrix exists ✓'
                : 'Traceability matrix missing ✗',
            severity: hasTraceability ? 'success' : 'error'
        })

        return {
            title: 'Requirements ↔ Testing Alignment',
            icon: '🔗',
            status: checks.every(c => c.passed) ? 'success' : checks.some(c => c.severity === 'error') ? 'error' : 'warning',
            checks
        }
    }

    const generateSuggestions = (results, req, des, dev, test) => {
        const suggestions = []

        // Missing phases
        if (!req) suggestions.push({
            priority: 'high',
            category: 'Missing Phase',
            title: 'Complete Requirements Phase',
            description: 'Start by defining your project requirements. This is the foundation of your SDLC.',
            action: 'Go to Requirements Analysis'
        })

        if (!des && req) suggestions.push({
            priority: 'high',
            category: 'Missing Phase',
            title: 'Complete Design Phase',
            description: 'Transform your requirements into system architecture and design.',
            action: 'Go to System Design'
        })

        if (!dev && des) suggestions.push({
            priority: 'medium',
            category: 'Missing Phase',
            title: 'Complete Development Phase',
            description: 'Get development guidance, code snippets, and best practices.',
            action: 'Go to Development'
        })

        if (!test && req) suggestions.push({
            priority: 'high',
            category: 'Missing Phase',
            title: 'Complete Testing Phase',
            description: 'Create test cases to ensure quality and requirement coverage.',
            action: 'Go to Testing & QA'
        })

        // Specific improvements based on validation results
        results.sections.forEach(section => {
            section.checks?.forEach(check => {
                if (!check.passed) {
                    if (check.severity === 'error') {
                        suggestions.push({
                            priority: 'high',
                            category: section.title,
                            title: `Fix: ${check.name}`,
                            description: check.message,
                            action: 'Review and update the respective phase'
                        })
                    } else if (check.severity === 'warning') {
                        suggestions.push({
                            priority: 'medium',
                            category: section.title,
                            title: `Improve: ${check.name}`,
                            description: check.message,
                            action: 'Consider enhancing this area'
                        })
                    }
                }
            })
        })

        // General best practices
        if (results.overallScore < 70) {
            suggestions.push({
                priority: 'high',
                category: 'Quality',
                title: 'Improve Overall Consistency',
                description: `Your consistency score is ${results.overallScore}%. Aim for at least 80% for production-ready quality.`,
                action: 'Address high-priority issues first'
            })
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }

    const exportReport = () => {
        const report = {
            validationDate: new Date().toISOString(),
            overallScore: validationResults.overallScore,
            summary: {
                totalChecks: validationResults.totalChecks,
                passedChecks: validationResults.passedChecks,
                failedChecks: validationResults.totalChecks - validationResults.passedChecks
            },
            sections: validationResults.sections,
            suggestions: validationResults.suggestions
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sdlc-consistency-report.json'
        a.click()
    }

    if (isValidating) {
        return (
            <div className="validator-overlay">
                <div className="validator-container">
                    <div className="validator-loading">
                        <div className="loading-spinner-large"></div>
                        <h3>Validating SDLC Consistency...</h3>
                        <p>Analyzing alignment between all phases</p>
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
                        <p>Comprehensive analysis of phase alignment and completeness</p>
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
                                    stroke={validationResults.overallScore >= 80 ? '#22c55e' : validationResults.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="12"
                                    strokeDasharray={`${(validationResults.overallScore / 100) * 440} 440`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 80 80)"
                                />
                            </svg>
                            <div className="score-text">
                                <div className="score-number">{validationResults.overallScore}%</div>
                                <div className="score-label">Consistency Score</div>
                            </div>
                        </div>
                        <div className="score-stats">
                            <div className="stat-item">
                                <div className="stat-value">{validationResults.passedChecks}</div>
                                <div className="stat-label">Passed</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{validationResults.totalChecks - validationResults.passedChecks}</div>
                                <div className="stat-label">Failed</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{validationResults.totalChecks}</div>
                                <div className="stat-label">Total Checks</div>
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
                                        {section.status === 'success' ? '✓ Passed' :
                                            section.status === 'error' ? '✗ Failed' :
                                                section.status === 'warning' ? '⚠ Warning' : 'ℹ Info'}
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
