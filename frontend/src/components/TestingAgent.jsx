import { useState, useEffect } from 'react'
import huggingFaceService from '../services/huggingFaceService'
import { testingPrompt } from '../utils/promptTemplates'

function TestingAgent({ onClose, onComplete }) {
    const [step, setStep] = useState('loading') // loading, strategy, testcases, integration, edge, review, complete
    const [requirements, setRequirements] = useState(null)
    const [design, setDesign] = useState(null)
    const [testStrategy, setTestStrategy] = useState({})
    const [testCases, setTestCases] = useState([])
    const [integrationTests, setIntegrationTests] = useState([])
    const [edgeCases, setEdgeCases] = useState([])
    const [riskAreas, setRiskAreas] = useState([])
    const [traceabilityMatrix, setTraceabilityMatrix] = useState([])

    useEffect(() => {
        // Load previous phase data
        const savedRequirements = localStorage.getItem('sdlc_requirements')
        const savedDesign = localStorage.getItem('sdlc_design')

        if (savedRequirements) {
            const reqData = JSON.parse(savedRequirements)
            setRequirements(reqData)

            if (savedDesign) {
                const designData = JSON.parse(savedDesign)
                setDesign(designData)
            }

            generateTestingPlan(reqData)
        } else {
            // Sample data for demo
            const sampleReq = {
                functionalRequirements: [
                    { id: 'FR-001', title: 'User Authentication', description: 'Users can register and login' }
                ]
            }
            setRequirements(sampleReq)
            generateTestingPlan(sampleReq)
        }
    }, [])

    const generateTestingPlan = async (reqData) => {
        try {
            // Get design from localStorage
            const savedDesign = localStorage.getItem('sdlc_design')
            const design = savedDesign ? JSON.parse(savedDesign) : null
            
            // Generate prompt for Hugging Face
            const prompt = testingPrompt(reqData, design)
            
            // Call Hugging Face AI
            const result = await huggingFaceService.generateJSON(prompt)
            
            // Set all generated testing artifacts
            if (result.testStrategy) {
                setTestStrategy(result.testStrategy)
            }
            if (result.testCases) {
                setTestCases(result.testCases)
            }
            if (result.integrationTests) {
                setIntegrationTests(result.integrationTests)
            }
            if (result.edgeCases) {
                setEdgeCases(result.edgeCases)
            }
            if (result.riskAreas) {
                setRiskAreas(result.riskAreas)
            }
            
            // Generate traceability matrix
            generateTraceabilityMatrix(reqData)
            
            setStep('strategy')
        } catch (error) {
            console.error('Error generating testing plan:', error)
            alert('AI testing generation failed. Using fallback plan. Error: ' + error.message)
            
            // Fallback to basic testing plan on error
            generateTestStrategy()
            generateTestCases(reqData)
            generateIntegrationTests()
            generateEdgeCases()
            generateRiskAreas()
            generateTraceabilityMatrix(reqData)
            setStep('strategy')
        }
    }

    const generateTestStrategy = () => {
        setTestStrategy({
            overview: 'Comprehensive testing strategy covering unit, integration, and end-to-end testing to ensure quality and reliability.',
            testLevels: [
                {
                    level: 'Unit Testing',
                    description: 'Test individual components and functions in isolation',
                    coverage: '80%',
                    tools: ['Jest', 'React Testing Library'],
                    responsibility: 'Developers',
                    when: 'During development'
                },
                {
                    level: 'Integration Testing',
                    description: 'Test interactions between components and services',
                    coverage: '70%',
                    tools: ['Supertest', 'Jest'],
                    responsibility: 'QA Team',
                    when: 'After unit tests pass'
                },
                {
                    level: 'System Testing',
                    description: 'Test complete system functionality end-to-end',
                    coverage: '90%',
                    tools: ['Playwright', 'Cypress'],
                    responsibility: 'QA Team',
                    when: 'Before deployment'
                },
                {
                    level: 'Performance Testing',
                    description: 'Test system performance under load',
                    coverage: 'Critical paths',
                    tools: ['Artillery', 'k6'],
                    responsibility: 'DevOps Team',
                    when: 'Pre-production'
                }
            ],
            testingTypes: [
                { type: 'Functional Testing', description: 'Verify features work as specified' },
                { type: 'Security Testing', description: 'Test authentication, authorization, data protection' },
                { type: 'Usability Testing', description: 'Ensure user-friendly interface' },
                { type: 'Compatibility Testing', description: 'Test across browsers and devices' },
                { type: 'Regression Testing', description: 'Ensure new changes don\'t break existing features' }
            ]
        })
    }

    const generateTestCases = (reqData) => {
        setTestCases([
            {
                id: 'TC-001',
                requirement: 'FR-001',
                title: 'User Registration - Valid Data',
                priority: 'High',
                type: 'Functional',
                preconditions: ['User is not registered', 'Registration page is accessible'],
                steps: [
                    'Navigate to registration page',
                    'Enter valid email address',
                    'Enter strong password (min 8 chars)',
                    'Enter matching password confirmation',
                    'Enter first name and last name',
                    'Click Register button'
                ],
                expectedResult: 'User account is created successfully, user is logged in, redirected to dashboard',
                testData: {
                    email: 'testuser@example.com',
                    password: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-002',
                requirement: 'FR-001',
                title: 'User Registration - Duplicate Email',
                priority: 'High',
                type: 'Negative',
                preconditions: ['Email already exists in database'],
                steps: [
                    'Navigate to registration page',
                    'Enter existing email address',
                    'Enter valid password',
                    'Enter other required fields',
                    'Click Register button'
                ],
                expectedResult: 'Error message displayed: "Email already registered"',
                testData: {
                    email: 'existing@example.com',
                    password: 'SecurePass123!'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-003',
                requirement: 'FR-001',
                title: 'User Login - Valid Credentials',
                priority: 'High',
                type: 'Functional',
                preconditions: ['User account exists', 'User is not logged in'],
                steps: [
                    'Navigate to login page',
                    'Enter registered email',
                    'Enter correct password',
                    'Click Login button'
                ],
                expectedResult: 'User is authenticated, JWT token is generated, redirected to dashboard',
                testData: {
                    email: 'testuser@example.com',
                    password: 'SecurePass123!'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-004',
                requirement: 'FR-001',
                title: 'User Login - Invalid Password',
                priority: 'High',
                type: 'Negative',
                preconditions: ['User account exists'],
                steps: [
                    'Navigate to login page',
                    'Enter registered email',
                    'Enter incorrect password',
                    'Click Login button'
                ],
                expectedResult: 'Error message displayed: "Invalid credentials", user remains on login page',
                testData: {
                    email: 'testuser@example.com',
                    password: 'WrongPassword123'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-005',
                requirement: 'FR-002',
                title: 'Password Validation - Weak Password',
                priority: 'Medium',
                type: 'Validation',
                preconditions: ['Registration form is displayed'],
                steps: [
                    'Enter email address',
                    'Enter weak password (e.g., "123")',
                    'Attempt to submit form'
                ],
                expectedResult: 'Validation error: "Password must be at least 8 characters"',
                testData: {
                    password: '123'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-006',
                requirement: 'FR-003',
                title: 'User Profile Update - Valid Data',
                priority: 'Medium',
                type: 'Functional',
                preconditions: ['User is logged in', 'Profile page is accessible'],
                steps: [
                    'Navigate to profile page',
                    'Update first name',
                    'Update bio',
                    'Click Save button'
                ],
                expectedResult: 'Profile updated successfully, changes are persisted, success message displayed',
                testData: {
                    firstName: 'Jane',
                    bio: 'Software Developer'
                },
                status: 'Not Executed'
            },
            {
                id: 'TC-007',
                requirement: 'FR-001',
                title: 'Session Expiry - Token Validation',
                priority: 'High',
                type: 'Security',
                preconditions: ['User is logged in', 'JWT token is expired'],
                steps: [
                    'Wait for token expiration (or manually expire)',
                    'Attempt to access protected resource',
                    'Observe system behavior'
                ],
                expectedResult: '401 Unauthorized response, user redirected to login page, token removed from storage',
                testData: {},
                status: 'Not Executed'
            },
            {
                id: 'TC-008',
                requirement: 'FR-004',
                title: 'API Rate Limiting',
                priority: 'Medium',
                type: 'Performance',
                preconditions: ['API is accessible'],
                steps: [
                    'Send multiple rapid requests to login endpoint',
                    'Exceed rate limit threshold',
                    'Observe response'
                ],
                expectedResult: '429 Too Many Requests response after threshold, retry-after header present',
                testData: {
                    requests: 100,
                    timeWindow: '1 minute'
                },
                status: 'Not Executed'
            }
        ])
    }

    const generateIntegrationTests = () => {
        setIntegrationTests([
            {
                id: 'IT-001',
                title: 'Authentication Flow Integration',
                description: 'Test complete authentication flow from frontend to database',
                components: ['Frontend', 'API Gateway', 'Auth Service', 'Database'],
                steps: [
                    'User submits registration form',
                    'Frontend sends POST request to /api/auth/register',
                    'API validates input data',
                    'Auth service hashes password',
                    'User record created in database',
                    'JWT token generated and returned',
                    'Frontend stores token and redirects'
                ],
                expectedResult: 'Complete flow executes without errors, user can access protected routes',
                testData: 'Valid user registration data'
            },
            {
                id: 'IT-002',
                title: 'Database Transaction Rollback',
                description: 'Test database rollback on error during multi-step operation',
                components: ['API', 'Database', 'Transaction Manager'],
                steps: [
                    'Start database transaction',
                    'Create user record',
                    'Create profile record',
                    'Simulate error in profile creation',
                    'Verify transaction rollback'
                ],
                expectedResult: 'Both user and profile records are rolled back, database remains consistent',
                testData: 'Invalid profile data to trigger error'
            },
            {
                id: 'IT-003',
                title: 'Cache Synchronization',
                description: 'Test Redis cache updates when database changes',
                components: ['API', 'Database', 'Redis Cache'],
                steps: [
                    'Fetch user data (populates cache)',
                    'Update user data via API',
                    'Verify cache is invalidated',
                    'Fetch user data again',
                    'Verify fresh data from database'
                ],
                expectedResult: 'Cache stays synchronized with database, no stale data served',
                testData: 'User profile update data'
            },
            {
                id: 'IT-004',
                title: 'API Error Handling Chain',
                description: 'Test error propagation through service layers',
                components: ['Controller', 'Service', 'Repository', 'Database'],
                steps: [
                    'Trigger database connection error',
                    'Verify service layer catches error',
                    'Verify controller handles error',
                    'Verify appropriate HTTP response',
                    'Verify error is logged'
                ],
                expectedResult: '500 Internal Server Error response, error logged, no sensitive data exposed',
                testData: 'Simulated database failure'
            }
        ])
    }

    const generateEdgeCases = () => {
        setEdgeCases([
            {
                id: 'EC-001',
                category: 'Input Validation',
                scenario: 'Email with special characters',
                testData: 'user+test@example.com',
                expectedBehavior: 'Should accept valid email formats including + and .',
                riskLevel: 'Medium'
            },
            {
                id: 'EC-002',
                category: 'Input Validation',
                scenario: 'Very long input strings',
                testData: 'A'.repeat(1000),
                expectedBehavior: 'Should reject or truncate inputs exceeding max length, show validation error',
                riskLevel: 'High'
            },
            {
                id: 'EC-003',
                category: 'Input Validation',
                scenario: 'SQL Injection attempt',
                testData: "admin' OR '1'='1",
                expectedBehavior: 'Input should be sanitized, no SQL injection possible',
                riskLevel: 'Critical'
            },
            {
                id: 'EC-004',
                category: 'Input Validation',
                scenario: 'XSS Attack attempt',
                testData: '<script>alert("XSS")</script>',
                expectedBehavior: 'Script tags should be escaped, no code execution',
                riskLevel: 'Critical'
            },
            {
                id: 'EC-005',
                category: 'Boundary Testing',
                scenario: 'Empty string inputs',
                testData: '',
                expectedBehavior: 'Required fields should show validation error',
                riskLevel: 'Medium'
            },
            {
                id: 'EC-006',
                category: 'Boundary Testing',
                scenario: 'Null or undefined values',
                testData: null,
                expectedBehavior: 'System should handle gracefully without crashing',
                riskLevel: 'High'
            },
            {
                id: 'EC-007',
                category: 'Concurrency',
                scenario: 'Simultaneous user registrations with same email',
                testData: 'Multiple parallel requests',
                expectedBehavior: 'Only one registration succeeds, others get "email exists" error',
                riskLevel: 'High'
            },
            {
                id: 'EC-008',
                category: 'Performance',
                scenario: 'Large dataset pagination',
                testData: '10,000+ records',
                expectedBehavior: 'Pagination works efficiently, no timeout errors',
                riskLevel: 'Medium'
            },
            {
                id: 'EC-009',
                category: 'Network',
                scenario: 'API timeout',
                testData: 'Delayed response > 30 seconds',
                expectedBehavior: 'Request times out gracefully, user sees error message',
                riskLevel: 'Medium'
            },
            {
                id: 'EC-010',
                category: 'State Management',
                scenario: 'Token refresh during active session',
                testData: 'Token near expiry',
                expectedBehavior: 'Token refreshes automatically, user session continues',
                riskLevel: 'High'
            }
        ])
    }

    const generateRiskAreas = () => {
        setRiskAreas([
            {
                area: 'Authentication & Authorization',
                risk: 'High',
                description: 'Security vulnerabilities could lead to unauthorized access',
                mitigation: [
                    'Implement comprehensive security testing',
                    'Use penetration testing tools',
                    'Regular security audits',
                    'Follow OWASP guidelines'
                ],
                testCoverage: ['TC-001', 'TC-003', 'TC-004', 'TC-007', 'EC-003', 'EC-004']
            },
            {
                area: 'Data Validation',
                risk: 'High',
                description: 'Invalid data could corrupt database or cause system errors',
                mitigation: [
                    'Implement strict input validation',
                    'Use schema validation libraries',
                    'Test all edge cases',
                    'Sanitize user inputs'
                ],
                testCoverage: ['TC-002', 'TC-005', 'EC-001', 'EC-002', 'EC-005', 'EC-006']
            },
            {
                area: 'Database Operations',
                risk: 'Medium',
                description: 'Transaction failures could lead to data inconsistency',
                mitigation: [
                    'Use database transactions',
                    'Implement proper error handling',
                    'Test rollback scenarios',
                    'Monitor database performance'
                ],
                testCoverage: ['IT-002', 'EC-007']
            },
            {
                area: 'API Performance',
                risk: 'Medium',
                description: 'Slow API responses could impact user experience',
                mitigation: [
                    'Implement caching strategy',
                    'Optimize database queries',
                    'Use pagination for large datasets',
                    'Load testing before deployment'
                ],
                testCoverage: ['TC-008', 'EC-008', 'EC-009']
            },
            {
                area: 'Session Management',
                risk: 'Medium',
                description: 'Session handling issues could frustrate users',
                mitigation: [
                    'Implement token refresh mechanism',
                    'Clear session on logout',
                    'Handle expired tokens gracefully',
                    'Test session edge cases'
                ],
                testCoverage: ['TC-007', 'EC-010']
            }
        ])
    }

    const generateTraceabilityMatrix = (reqData) => {
        const matrix = []

        if (reqData.functionalRequirements) {
            reqData.functionalRequirements.forEach((req, idx) => {
                matrix.push({
                    requirementId: req.id,
                    requirementTitle: req.title,
                    testCases: [`TC-00${idx + 1}`, `TC-00${idx + 2}`],
                    coverage: '100%',
                    status: 'Mapped'
                })
            })
        }

        setTraceabilityMatrix(matrix)
    }

    const handleComplete = () => {
        const testingData = {
            requirements,
            design,
            testStrategy,
            testCases,
            integrationTests,
            edgeCases,
            riskAreas,
            traceabilityMatrix,
            generatedAt: new Date().toISOString()
        }

        localStorage.setItem('sdlc_testing', JSON.stringify(testingData))
        setStep('complete')

        if (onComplete) {
            onComplete(testingData)
        }
    }

    const exportTestPlan = () => {
        const data = {
            testStrategy,
            testCases,
            integrationTests,
            edgeCases,
            riskAreas,
            traceabilityMatrix
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'test-plan.json'
        a.click()
    }

    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="agent-header">
                    <div className="agent-title-section">
                        <div className="agent-badge">
                            <span className="agent-emoji">🧪</span>
                            <span>Testing & QA Agent</span>
                        </div>
                        <h2>Generating Test Plan...</h2>
                        <p>Creating comprehensive test cases and strategies</p>
                    </div>
                </div>
                <div className="agent-content">
                    <div className="loading-screen">
                        <div className="loading-spinner-large"></div>
                        <p>Analyzing requirements and generating test scenarios...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="agent-workspace">
            <div className="agent-header">
                <div className="agent-title-section">
                    <div className="agent-badge">
                        <span className="agent-emoji">🧪</span>
                        <span>Testing & QA Agent</span>
                    </div>
                    <h2>Testing & Quality Assurance Plan</h2>
                    <p>Comprehensive test cases and quality strategies</p>
                </div>
                <button className="close-agent" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6L18 18" />
                    </svg>
                </button>
            </div>

            <div className="agent-content">
                {/* Navigation Tabs */}
                <div className="design-tabs">
                    <button
                        className={`design-tab ${step === 'strategy' ? 'active' : ''}`}
                        onClick={() => setStep('strategy')}
                    >
                        📋 Strategy
                    </button>
                    <button
                        className={`design-tab ${step === 'testcases' ? 'active' : ''}`}
                        onClick={() => setStep('testcases')}
                    >
                        ✅ Test Cases
                    </button>
                    <button
                        className={`design-tab ${step === 'integration' ? 'active' : ''}`}
                        onClick={() => setStep('integration')}
                    >
                        🔗 Integration
                    </button>
                    <button
                        className={`design-tab ${step === 'edge' ? 'active' : ''}`}
                        onClick={() => setStep('edge')}
                    >
                        ⚠️ Edge Cases
                    </button>
                    <button
                        className={`design-tab ${step === 'review' ? 'active' : ''}`}
                        onClick={() => setStep('review')}
                    >
                        🎯 Risk Areas
                    </button>
                </div>

                {/* Test Strategy View */}
                {step === 'strategy' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Testing Strategy</h3>
                            <p>{testStrategy.overview}</p>
                        </div>

                        <div className="strategy-section">
                            <h4>Test Levels</h4>
                            <div className="test-levels-grid">
                                {testStrategy.testLevels?.map((level, idx) => (
                                    <div key={idx} className="test-level-card">
                                        <h5>{level.level}</h5>
                                        <p className="level-description">{level.description}</p>
                                        <div className="level-details">
                                            <div className="detail-item">
                                                <strong>Coverage Target:</strong> {level.coverage}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Tools:</strong> {level.tools.join(', ')}
                                            </div>
                                            <div className="detail-item">
                                                <strong>Responsibility:</strong> {level.responsibility}
                                            </div>
                                            <div className="detail-item">
                                                <strong>When:</strong> {level.when}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="strategy-section">
                            <h4>Testing Types</h4>
                            <div className="testing-types-list">
                                {testStrategy.testingTypes?.map((type, idx) => (
                                    <div key={idx} className="testing-type-item">
                                        <h6>{type.type}</h6>
                                        <p>{type.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Test Cases View */}
                {step === 'testcases' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Test Cases</h3>
                            <p>Detailed test cases covering functional and non-functional requirements</p>
                        </div>

                        <div className="test-cases-list">
                            {testCases.map((tc) => (
                                <div key={tc.id} className="test-case-card">
                                    <div className="test-case-header">
                                        <div className="tc-header-left">
                                            <span className="tc-id">{tc.id}</span>
                                            <span className={`tc-priority priority-${tc.priority.toLowerCase()}`}>
                                                {tc.priority}
                                            </span>
                                            <span className="tc-type">{tc.type}</span>
                                        </div>
                                        <span className={`tc-status status-${tc.status.toLowerCase().replace(' ', '-')}`}>
                                            {tc.status}
                                        </span>
                                    </div>

                                    <h5 className="tc-title">{tc.title}</h5>
                                    <div className="tc-requirement">
                                        <strong>Requirement:</strong> {tc.requirement}
                                    </div>

                                    <div className="tc-section">
                                        <strong>Preconditions:</strong>
                                        <ul>
                                            {tc.preconditions.map((pre, idx) => (
                                                <li key={idx}>{pre}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="tc-section">
                                        <strong>Test Steps:</strong>
                                        <ol className="tc-steps">
                                            {tc.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="tc-section">
                                        <strong>Expected Result:</strong>
                                        <p className="tc-expected">{tc.expectedResult}</p>
                                    </div>

                                    {Object.keys(tc.testData).length > 0 && (
                                        <div className="tc-section">
                                            <strong>Test Data:</strong>
                                            <pre className="tc-data">{JSON.stringify(tc.testData, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Integration Tests View */}
                {step === 'integration' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Integration Tests</h3>
                            <p>Test interactions between system components</p>
                        </div>

                        <div className="integration-tests-list">
                            {integrationTests.map((it) => (
                                <div key={it.id} className="integration-test-card">
                                    <div className="it-header">
                                        <span className="it-id">{it.id}</span>
                                        <h5>{it.title}</h5>
                                    </div>
                                    <p className="it-description">{it.description}</p>

                                    <div className="it-components">
                                        <strong>Components Involved:</strong>
                                        <div className="component-badges">
                                            {it.components.map((comp, idx) => (
                                                <span key={idx} className="component-badge">{comp}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="it-steps">
                                        <strong>Integration Flow:</strong>
                                        <ol>
                                            {it.steps.map((step, idx) => (
                                                <li key={idx}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="it-expected">
                                        <strong>Expected Result:</strong>
                                        <p>{it.expectedResult}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edge Cases View */}
                {step === 'edge' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Edge Cases & Boundary Testing</h3>
                            <p>Critical edge cases and potential failure scenarios</p>
                        </div>

                        <div className="edge-cases-grid">
                            {edgeCases.map((ec) => (
                                <div key={ec.id} className="edge-case-card">
                                    <div className="ec-header">
                                        <span className="ec-id">{ec.id}</span>
                                        <span className={`ec-risk risk-${ec.riskLevel.toLowerCase()}`}>
                                            {ec.riskLevel} Risk
                                        </span>
                                    </div>
                                    <div className="ec-category">{ec.category}</div>
                                    <h6>{ec.scenario}</h6>
                                    <div className="ec-detail">
                                        <strong>Test Data:</strong>
                                        <code>{ec.testData}</code>
                                    </div>
                                    <div className="ec-detail">
                                        <strong>Expected Behavior:</strong>
                                        <p>{ec.expectedBehavior}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risk Areas View */}
                {step === 'review' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Risk Areas & Mitigation</h3>
                            <p>High-risk areas requiring special attention</p>
                        </div>

                        <div className="risk-areas-list">
                            {riskAreas.map((risk, idx) => (
                                <div key={idx} className="risk-area-card">
                                    <div className="risk-header">
                                        <h5>{risk.area}</h5>
                                        <span className={`risk-badge risk-${risk.risk.toLowerCase()}`}>
                                            {risk.risk} Risk
                                        </span>
                                    </div>
                                    <p className="risk-description">{risk.description}</p>

                                    <div className="risk-mitigation">
                                        <strong>Mitigation Strategies:</strong>
                                        <ul>
                                            {risk.mitigation.map((mit, midx) => (
                                                <li key={midx}>{mit}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="risk-coverage">
                                        <strong>Test Coverage:</strong>
                                        <div className="coverage-badges">
                                            {risk.testCoverage.map((tc, tcidx) => (
                                                <span key={tcidx} className="coverage-badge">{tc}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Traceability Matrix */}
                        <div className="traceability-section">
                            <h4>Requirements Traceability Matrix</h4>
                            <div className="traceability-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Requirement ID</th>
                                            <th>Requirement Title</th>
                                            <th>Test Cases</th>
                                            <th>Coverage</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {traceabilityMatrix.map((item, idx) => (
                                            <tr key={idx}>
                                                <td><code>{item.requirementId}</code></td>
                                                <td>{item.requirementTitle}</td>
                                                <td>{item.testCases.join(', ')}</td>
                                                <td><span className="coverage-percent">{item.coverage}</span></td>
                                                <td><span className="status-mapped">{item.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete View */}
                {step === 'complete' && (
                    <div className="step-container completion-screen">
                        <div className="completion-icon">✅</div>
                        <h3>Testing Plan Complete!</h3>
                        <p>Your comprehensive testing and QA strategy is ready.</p>

                        <div className="completion-summary">
                            <div className="summary-stat">
                                <div className="stat-number">{testCases.length}</div>
                                <div className="stat-label">Test Cases</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{integrationTests.length}</div>
                                <div className="stat-label">Integration Tests</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{edgeCases.length}</div>
                                <div className="stat-label">Edge Cases</div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h4>🎯 What's Next?</h4>
                            <p>Your testing plan is ready! You can now proceed to the <strong>Deployment Phase</strong> where the Deployment Agent will help you set up CI/CD pipelines and deployment strategies.</p>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={exportTestPlan}>
                                📥 Export Test Plan
                            </button>
                            <button className="btn-primary-action" onClick={onClose}>
                                Close & Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {step !== 'complete' && step !== 'loading' && (
                    <div className="step-actions">
                        <button className="btn-secondary" onClick={exportTestPlan}>
                            📥 Export Plan
                        </button>
                        <button className="btn-primary-action" onClick={handleComplete}>
                            Complete & Save
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TestingAgent
