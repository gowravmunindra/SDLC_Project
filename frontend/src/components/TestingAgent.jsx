import React, { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import huggingFaceService from '../services/huggingFaceService'
import { testingPrompt } from '../utils/promptTemplates'
import './TestingAgent.css'

/**
 * TestingAgent Component
 * Rebuilt for structured, production-ready AI test design.
 */
function TestingAgent({ onClose, onComplete }) {
    const { currentProject, updateProject } = useProject()

    // State management
    const [step, setStep] = useState('loading') // loading, strategy, testcases, edgecases, complete
    const [testData, setTestData] = useState({
        testStrategy: {
            overview: '',
            testLevels: []
        },
        testCases: [],
        edgeCases: []
    })

    const isProcessing = React.useRef(false)

    // Load data or generate on mount
    useEffect(() => {
        if (currentProject) {
            // Only trigger generation if we're in 'loading' state and have no data
            if (step === 'loading' && !currentProject.testing && currentProject.requirements && !isProcessing.current) {
                handleGenerateTesting(currentProject.requirements, currentProject.design)
            }
            // If data exists and we are in 'loading' state but NOT processing, move to strategy
            else if (step === 'loading' && currentProject.testing && !isProcessing.current) {
                setTestData(currentProject.testing)
                setStep('strategy')
            }
            // Requirements missing safety
            else if (!currentProject.requirements && step === 'loading' && !isProcessing.current) {
                setStep('strategy')
            }
        }
    }, [currentProject, step])

    /**
     * Call backend AI to generate test plan
     */
    const handleGenerateTesting = async (reqs, design) => {
        // Prevent multiple simultaneous calls
        if (isProcessing.current) return
        isProcessing.current = true

        try {
            setTestData({ testStrategy: {}, testCases: [], edgeCases: [] }) // Clear current data
            setStep('loading')
            const prompt = testingPrompt(reqs, design)

            // Add a timeout to the AI call to prevent infinite loading
            const generationPromise = huggingFaceService.generateJSON(prompt)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI Generation Timeout')), 120000)
            )

            // Backend handles AI key and JSON structure
            const result = await Promise.race([generationPromise, timeoutPromise])

            if (result) {
                setTestData({
                    testStrategy: result.testStrategy || testData.testStrategy,
                    testCases: result.testCases || [],
                    edgeCases: result.edgeCases || []
                })
            }
            setStep('strategy')
        } catch (error) {
            console.error('Testing Generation Error:', error)
            // If it's a timeout or error, still go to strategy so user can manually edit
            setStep('strategy')
            if (error.message.includes('Timeout')) {
                alert('Cloud AI generation timed out. Please check your internet connection and try again.')
            } else {
                console.warn('AI testing generation failed, proceeding with empty plan.')
            }
        } finally {
            isProcessing.current = false
        }
    }

    /**
     * Finalize and save phase
     */
    const handleSave = async () => {
        if (!currentProject) return

        try {
            const finalizedData = {
                ...testData,
                completedAt: new Date().toISOString()
            }

            await apiService.saveTesting(currentProject._id, finalizedData)
            await updateProject(currentProject._id, { status: 'completed' })

            setStep('complete')
            if (onComplete) {
                // Short delay to show the completion checkmark before navigating
                setTimeout(() => onComplete(finalizedData), 500)
            }
        } catch (error) {
            console.error('Save testing error:', error)
            alert('Failed to save testing plan.')
        }
    }

    // Render loading state
    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <h3>Analyzing Project Requirements & Design...</h3>
                    <p>Building 8-18 functional test cases and 5-6 priority edge cases based on your architecture.</p>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', opacity: 0.8 }}>
                        Analyzing: {currentProject?.requirements?.functionalRequirements?.length || 0} Req(s) |
                        {currentProject?.design?.components?.length || 0} Component(s)
                    </div>
                    <button
                        className="btn-secondary"
                        style={{ marginTop: '20px' }}
                        onClick={() => setStep('strategy')}
                    >
                        Skip AI Generation
                    </button>
                    <p className="loading-hint">Using Backend API Key for high-speed analysis...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="agent-workspace">
            {/* Header */}
            <div className="agent-header">
                <div className="agent-title-section">
                    <div className="agent-badge">🧪 Testing & QA Agent</div>
                    <h2>Testing & Quality Assurance Plan</h2>
                    <p>Requirement-aligned test artifacts generated from project architecture.</p>
                </div>
                <button className="close-agent" onClick={onClose}>✕</button>
            </div>

            <div className="agent-content">
                {/* Tabs Navigation */}
                <div className="design-tabs">
                    <button
                        className={`design-tab ${step === 'strategy' ? 'active' : ''}`}
                        onClick={() => setStep('strategy')}
                    >
                        📘 Strategy
                    </button>
                    <button
                        className={`design-tab ${step === 'testcases' ? 'active' : ''}`}
                        onClick={() => setStep('testcases')}
                    >
                        📋 Test Cases
                    </button>
                    <button
                        className={`design-tab ${step === 'edgecases' ? 'active' : ''}`}
                        onClick={() => setStep('edgecases')}
                    >
                        ⚠️ Edge Cases
                    </button>
                </div>

                {/* Strategy Tab (Educational content) */}
                {step === 'strategy' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Project Testing Strategy</h3>
                            <p>{testData?.testStrategy?.overview || 'General testing workflow for the project.'}</p>
                        </div>

                        <div className="strategy-grid">
                            {testData?.testStrategy?.testLevels?.map((level, idx) => (
                                <div key={idx} className="test-level-card">
                                    <div className="level-header">
                                        <h4>{level.level}</h4>
                                        <span className="coverage-badge">{level.coverage}</span>
                                    </div>
                                    <p>{level.description}</p>
                                    <div className="level-meta">
                                        <span><strong>Tools:</strong> {level.tools?.join(', ')}</span>
                                        <span><strong>When:</strong> {level.when}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Test Cases Tab (Functional & Integration) */}
                {step === 'testcases' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Defined Test Cases</h3>
                            <p>Derived from functional requirements and system components.</p>
                        </div>

                        <div className="test-cases-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Module</th>
                                        <th>Case Description</th>
                                        <th>Expected Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testData?.testCases?.map((tc) => (
                                        <tr key={tc.id} className="tc-row">
                                            <td className="tc-id-cell">{tc.id}</td>
                                            <td className="tc-module-cell">{tc.moduleName}</td>
                                            <td className="tc-desc-cell">
                                                <strong>{tc.description}</strong>
                                                <div className="tc-details">
                                                    <span>Pre: {tc.preconditions}</span>
                                                    <ol>
                                                        {tc.testSteps?.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ol>
                                                </div>
                                            </td>
                                            <td className="tc-result-cell">{tc.expectedResult}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Edge Cases Tab */}
                {step === 'edgecases' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>High-Priority Edge Cases</h3>
                            <p>Boundary, null, and failure handling scenarios.</p>
                        </div>

                        <div className="edge-cases-grid">
                            {testData?.edgeCases?.map((ec) => (
                                <div key={ec.id} className="edge-case-card simple">
                                    <div className="ec-badge">{ec.category}</div>
                                    <h4>{ec.scenario}</h4>
                                    <div className="ec-content">
                                        <div className="ec-data">
                                            <label>Test Data:</label>
                                            <code>{ec.testData}</code>
                                        </div>
                                        <div className="ec-behavior">
                                            <label>Expected Behavior:</label>
                                            <p>{ec.expectedBehavior}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completion Screen */}
                {step === 'complete' && (
                    <div className="step-container completion-screen">
                        <div className="completion-icon">✅</div>
                        <h3>Testing Plan Finalized</h3>
                        <p>All test artifacts have been saved to the project data.</p>
                    </div>
                )}

                {/* Footer Actions */}
                {step !== 'complete' && (
                    <div className="step-actions">
                        <button className="btn-secondary" onClick={() => handleGenerateTesting(currentProject?.requirements, currentProject?.design)}>
                            🔄 Re-generate
                        </button>
                        <button className="btn-primary-action" onClick={handleSave}>
                            Finalize Design
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TestingAgent
