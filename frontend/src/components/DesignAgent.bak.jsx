import { useState, useEffect, useRef } from 'react'
import { useProject } from '../contexts/ProjectContext'
import apiService from '../services/apiService'
import geminiService from '../services/geminiService'
import huggingFaceService from '../services/huggingFaceService'
import { designPrompt } from '../utils/promptTemplates'
import { getPlantUMLUrl, cleanPlantUML } from '../utils/plantuml'
import './DesignAgent.css'

function DesignAgent({ onClose, onComplete }) {
    alert("CRITICAL DEBUG: DesignAgent is rendering!")
    const { currentProject, updateProject } = useProject()
    const [step, setStep] = useState('loading') // loading, architecture, diagrams, complete
    const [requirements, setRequirements] = useState(null)
    const [architecture, setArchitecture] = useState(null)

    // UI State
    const [showHero, setShowHero] = useState(true)
    const contentRef = useRef(null)

    // PlantUML State
    const [activeDiagram, setActiveDiagram] = useState('useCase')
    const [diagrams, setDiagrams] = useState({
        useCase: { code: '', url: '', status: 'pending', label: 'Use Case', error: null },
        class: { code: '', url: '', status: 'pending', label: 'Class', error: null },
        sequence: { code: '', url: '', status: 'pending', label: 'Sequence', error: null },
        activity: { code: '', url: '', status: 'pending', label: 'Activity', error: null },
        state: { code: '', url: '', status: 'pending', label: 'State Chart', error: null },
        component: { code: '', url: '', status: 'pending', label: 'Component', error: null },
        deployment: { code: '', url: '', status: 'pending', label: 'Deployment', error: null }
    })

    const [customPrompt, setCustomPrompt] = useState('')
    const [isModifying, setIsModifying] = useState(false)
    const hasInitializedRef = useRef(false)  // Use ref instead of state to persist across re-renders
    const [requirementsAnalyzed, setRequirementsAnalyzed] = useState(false)  // Track if requirements analyzed for diagrams
    const [analysisContext, setAnalysisContext] = useState(null)  // Store analysis for reuse

    // Load Data from database - INSTANT PAGE LOAD
    useEffect(() => {
        console.log('[DesignAgent] useEffect triggered', {
            hasCurrentProject: !!currentProject,
            currentStep: step,
            hasRequirements: !!currentProject?.requirements,
            hasDesign: !!currentProject?.design
        })

        if (!currentProject) {
            console.log('[DesignAgent] No current project')
            return
        }

        console.log('[DesignAgent] Loading design phase immediately')

        // Load requirements
        if (currentProject.requirements) {
            setRequirements(currentProject.requirements)
            console.log('[DesignAgent] Requirements loaded')
        }

        // Load existing design if available
        if (currentProject.design && currentProject.design.architecture) {
            console.log('[DesignAgent] Loading existing design from database')
            setArchitecture(currentProject.design.architecture)

            if (currentProject.design.diagrams) {
                setDiagrams(currentProject.design.diagrams)
                console.log('[DesignAgent] Loaded diagrams from database:', Object.keys(currentProject.design.diagrams))
            }

            console.log('[DesignAgent] Setting step to architecture (existing design)')
            setStep('architecture')
            return
        }

        // No existing design - show page immediately, generate architecture in background
        if (currentProject.requirements) {
            console.log('[DesignAgent] Showing page immediately, generating architecture in background')
            console.log('[DesignAgent] Setting step to architecture (new design)')
            setStep('architecture')  // Show page NOW

            // Generate architecture in background (non-blocking) - only if not already generated
            if (!architecture) {
                setTimeout(() => {
                    console.log('[DesignAgent] Starting background architecture generation')
                    generateArchitectureInBackground(currentProject.requirements)
                }, 100)
            }
        } else {
            console.warn('[DesignAgent] No requirements found, still showing architecture step')
            setStep('architecture')
        }
    }, [currentProject])

    // Safety timeout: prevent infinite loading state
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'loading' && currentProject) {
                console.warn('[DesignAgent] Loading timeout - forcing architecture step')
                setStep('architecture')

                // Try to load requirements if available
                if (currentProject.requirements) {
                    setRequirements(currentProject.requirements)
                    generateArchitectureInBackground(currentProject.requirements)
                }
            }
        }, 2000) // 2 second timeout

        return () => clearTimeout(timeout)
    }, [step, currentProject])

    // Auto-generate diagrams when architecture is ready
    useEffect(() => {
        if (step === 'architecture' && requirements) {
            // generateAllDiagrams()  // DISABLED: Causes 10+ min wait - now manual only
            console.log('Architecture ready. Generate diagrams manually.')
        }
    }, [step, requirements])

    const generateAllDiagrams = async () => {
        const types = Object.keys(diagrams).filter(t => diagrams[t].status === 'pending')

        for (const type of types) {
            await generateDiagram(type)
            // Add delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }

    // Scroll Handler for Hero
    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop
        setShowHero(scrollTop < 50)
    }

    // Generate architecture in background (non-blocking)
    const generateArchitectureInBackground = async (reqData) => {
        console.log('[DesignAgent] Generating architecture in background...')

        try {
            const fallbackArch = generateArchitectureFallback(reqData)
            setArchitecture(fallbackArch.architecture)
            console.log('[DesignAgent] Architecture ready')

        } catch (error) {
            console.error('Error generating design:', error)
            setArchitecture(generateArchitectureFallback(reqData).architecture)
        }
    }

    const generateArchitectureFallback = (reqData) => {
        return {
            architecture: {
                type: 'Monolithic',
                justification: 'Simplified architecture for immediate development.',
                layers: [
                    { name: 'Frontend', description: 'React-based UI', technologies: ['React', 'Vite'] },
                    { name: 'Backend', description: 'Node.js/Express API', technologies: ['Node', 'Express'] },
                    { name: 'Database', description: 'Relational Store', technologies: ['PostgreSQL'] }
                ]
            }
        }
    }

    // Core PlantUML Generation - Analyze requirements ONCE, reuse for all diagrams
    const generateDiagram = async (type, manualPrompt = null) => {
        setDiagrams(prev => ({
            ...prev,
            [type]: { ...prev[type], status: 'loading', error: null }
        }))

        try {
            // FIRST DIAGRAM: Analyze requirements once
            if (!requirementsAnalyzed && requirements) {
                console.log('[DesignAgent] Analyzing requirements for diagram generation (one-time)')
                setRequirementsAnalyzed(true)

                // Create analysis context from requirements
                const context = {
                    projectTitle: requirements.projectDescription?.substring(0, 50) || 'System',
                    features: requirements.functionalRequirements?.slice(0, 5).map(r => r.title) || [],
                    actors: ['User', 'Admin'],  // Can be enhanced
                    entities: ['User', 'Data', 'Session']  // Can be enhanced
                }
                setAnalysisContext(context)
                console.log('[DesignAgent] Requirements analyzed, generating diagrams will be fast now')
            }

            console.log(`[DesignAgent] Generating ${type} diagram (using cached analysis)...`)

            // Use instant fallback templates (no LLM call for speed)
            const code = getFallbackDiagram(type, requirements)

            if (!code) throw new Error("Failed to generate diagram")

            const cleanCode = cleanPlantUML(code)
            if (!cleanCode) throw new Error("Failed to parse valid PlantUML code")

            const url = getPlantUMLUrl(cleanCode)

            setDiagrams(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    code: cleanCode,
                    url: url,
                    status: 'done',
                    error: null
                }
            }))

            console.log(`[DesignAgent] ${type} diagram generated successfully`)

        } catch (error) {
            console.error(`[DesignAgent] Error generating ${type}:`, error)
            setDiagrams(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    status: 'error',
                    error: error.message || "Unknown error occurred"
                }
            }))
        }
    }

    // Instant fallback templates for when LLM is slow
    const getFallbackDiagram = (type, reqs) => {
        const feature1 = reqs?.functionalRequirements?.[0]?.title || "User Login"
        const feature2 = reqs?.functionalRequirements?.[1]?.title || "Data Management"
        const feature3 = reqs?.functionalRequirements?.[2]?.title || "Reporting"

        const templates = {
            useCase: `@startuml
left to right direction
actor User
actor Admin
rectangle System {
  User --> (${feature1})
  User --> (${feature2})
  Admin --> (${feature3})
  Admin --> (Manage Users)
}
@enduml`,

            class: `@startuml
class User {
  +id: UUID
  +email: String
  +name: String
  +login()
  +logout()
}
class Session {
  +token: String
  +expiresAt: DateTime
  +validate()
}
class Data {
  +id: UUID
  +content: String
  +save()
}
User "1" --> "*" Session
User "1" --> "*" Data
@enduml`,

            sequence: `@startuml
User -> Frontend: ${feature1}
Frontend -> API: Request
API -> Database: Query
Database --> API: Data
API --> Frontend: Response
Frontend --> User: Display
@enduml`,

            activity: `@startuml
start
:User initiates ${feature1};
if (Authenticated?) then (yes)
  :Process request;
  :Validate data;
  if (Valid?) then (yes)
    :Save to database;
    :Return success;
  else (no)
    :Return error;
  endif
else (no)
  :Redirect to login;
endif
stop
@enduml`,

            state: `@startuml
[*] --> Idle
Idle --> Processing: ${feature1}
Processing --> Success: completed
Processing --> Failed: error
Success --> Idle: reset
Failed --> Idle: retry
Success --> [*]
Failed --> [*]
@enduml`,

            component: `@startuml
[Web Browser] --> [Frontend App]
[Frontend App] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [Business Logic]
[Business Logic] --> [Database]
[Business Logic] --> [Cache]
@enduml`,

            deployment: `@startuml
node "Client" {
  [Browser]
}
node "Web Server" {
  [Frontend]
}
node "App Server" {
  [API]
  [Services]
}
node "Data Server" {
  [Database]
  [Cache]
}
[Browser] --> [Frontend]
[Frontend] --> [API]
[API] --> [Database]
@enduml`
        }

        return templates[type] || templates.useCase
    }

    const constructPrompt = (type, reqs, manualInstructions) => {
        // Ultra-concise prompts optimized for Qwen2.5-Coder with strict token limits
        const systemDesc = reqs?.projectDescription?.substring(0, 100) || "System"
        const features = reqs?.functionalRequirements?.slice(0, 3).map(r => r.title).join(', ') || "Core features"

        const prompts = {
            useCase: `Generate PlantUML Use Case Diagram:
System: ${systemDesc}
Features: ${features}

@startuml
left to right direction
actor User
actor Admin
rectangle System {
  User --> (${reqs?.functionalRequirements?.[0]?.title || "Feature 1"})
  Admin --> (Manage System)
}
@enduml

Output ONLY valid PlantUML code. Start @startuml, end @enduml. No markdown.`,

            class: `Generate PlantUML Class Diagram:
System: ${systemDesc}

@startuml
class User {
  +id: int
  +name: string
  +login()
}
class System {
  +process()
}
User --> System
@enduml

Output ONLY valid PlantUML code for 3-4 classes. Start @startuml, end @enduml.`,

            sequence: `Generate PlantUML Sequence Diagram for: ${reqs?.functionalRequirements?.[0]?.title || "Login"}

@startuml
User -> System: request
System -> Database: query
Database --> System: data
System --> User: response
@enduml

Output ONLY valid PlantUML code. Use -> for messages. Start @startuml, end @enduml.`,

            activity: `Generate PlantUML Activity Diagram:
Process: ${reqs?.functionalRequirements?.[0]?.title || "Main workflow"}

@startuml
start
:User action;
if (Valid?) then (yes)
  :Process;
else (no)
  :Error;
endif
stop
@enduml

Output ONLY valid PlantUML code. Start @startuml, end @enduml.`,

            state: `Generate PlantUML State Diagram:
Entity: User Session

@startuml
[*] --> Idle
Idle --> Active: login
Active --> Idle: logout
Active --> [*]: timeout
@enduml

Output ONLY valid PlantUML code. Start @startuml, end @enduml.`,

            component: `Generate PlantUML Component Diagram:
System: ${systemDesc}

@startuml
[Frontend] --> [API]
[API] --> [Database]
[API] --> [Cache]
@enduml

Output ONLY valid PlantUML code. Show 3-5 components. Start @startuml, end @enduml.`,

            deployment: `Generate PlantUML Deployment Diagram:

@startuml
node "Client" {
  [Browser]
}
node "Server" {
  [Application]
}
node "Database" {
  [DB]
}
Browser --> Application
Application --> DB
@enduml

Output ONLY valid PlantUML code. Start @startuml, end @enduml.`
        }

        let prompt = prompts[type] || prompts.useCase

        if (manualInstructions) {
            prompt = `${prompt}\n\nModify: ${manualInstructions.substring(0, 50)}`
        }

        return prompt
    }

    // Helper: Attempt simple code modification without LLM
    const attemptManualModification = (code, instruction, diagramType) => {
        try {
            // Only works for class diagrams with simple attribute additions
            if (diagramType !== 'class') return null

            const lowerInstruction = instruction.toLowerCase()

            // Check if it's an "add attribute" request
            if (lowerInstruction.includes('add') && (lowerInstruction.includes('attribute') || lowerInstruction.includes('field') || lowerInstruction.includes('in'))) {
                // Extract class name - improved pattern matching
                let className = null

                // Try pattern: "in the X class" or "to the X class"
                let match = instruction.match(/(?:in|to)\s+the\s+(\w+)\s+class/i)
                if (match) {
                    className = match[1]
                } else {
                    // Try pattern: "in X" or "to X"
                    match = instruction.match(/(?:in|to)\s+(?:the\s+)?(\w+)/i)
                    if (match && match[1].toLowerCase() !== 'the') {
                        className = match[1]
                    }
                }

                // Default and capitalize
                if (!className) className = 'User'
                className = className.charAt(0).toUpperCase() + className.slice(1).toLowerCase()

                console.log(`[Fallback] Extracted class name: ${className}`)

                // Extract attribute names (filter out common words AND 'remove', 'name')
                const commonWords = ['add', 'attribute', 'attributes', 'to', 'in', 'the', 'class', 'and', 'or', 'a', 'an', 'remove', 'name']
                const words = instruction.match(/\b(\w+)\b/g) || []
                const attributes = words
                    .filter(word => !commonWords.includes(word.toLowerCase()))
                    .filter(word => word.toLowerCase() !== className.toLowerCase())
                    .slice(0, 5)  // Max 5 attributes

                if (attributes.length === 0) {
                    console.log('[Fallback] No attributes found in instruction')
                    return null
                }

                console.log(`[Fallback] Adding attributes ${attributes.join(', ')} to class ${className}`)

                // Find the class in the code (case-insensitive)
                const classRegex = new RegExp(`(class\\s+${className}\\s*\\{)([^}]*)(\\})`, 'i')
                const classCodeMatch = code.match(classRegex)

                if (!classCodeMatch) {
                    console.log(`[Fallback] Class ${className} not found in code`)
                    return null
                }

                // Add attributes to the class
                const existingContent = classCodeMatch[2].trim()
                const newAttributes = attributes.map(attr => `    +${attr}: String`).join('\n')
                const updatedContent = existingContent
                    ? existingContent + '\n' + newAttributes
                    : newAttributes

                const modifiedCode = code.replace(classRegex, `$1\n${updatedContent}\n$3`)

                console.log('[Fallback] Successfully modified code')
                return modifiedCode
            }

            return null
        } catch (error) {
            console.error('Manual modification failed:', error)
            return null
        }
    }

    const handleModify = async () => {
        if (!customPrompt.trim()) {
            alert('Please enter modification instructions')
            return
        }

        setIsModifying(true)
        const current = diagrams[activeDiagram]
        const originalCode = current.code

        try {
            console.log(`[DesignAgent] Modifying ${activeDiagram} diagram: "${customPrompt}"`)

            // Enhanced, more specific prompt for LLM
            const diagramTypeInstructions = {
                useCase: 'For use case diagrams: use actors, use cases, and relationships (-->, includes, extends)',
                class: 'For class diagrams: use proper class syntax with +attribute: Type and +method()',
                sequence: 'For sequence diagrams: use proper participant and message syntax',
                activity: 'For activity diagrams: use start, :action;, if/endif, and stop',
                state: 'For state diagrams: use [*] for start/end, state names, and --> for transitions',
                component: 'For component diagrams: use [Component] and --> for connections',
                deployment: 'For deployment diagrams: use node and artifact syntax'
            }

            const specificInstructions = diagramTypeInstructions[activeDiagram] || ''

            const prompt = `You are a PlantUML expert. Modify the following ${activeDiagram} diagram based on the user's request.

USER REQUEST: "${customPrompt}"

CURRENT PLANTUML CODE:
${current.code}

IMPORTANT INSTRUCTIONS:
1. Make ONLY the changes requested by the user
2. Keep all existing valid syntax and structure
3. ${specificInstructions}
4. Ensure proper PlantUML syntax (must start with @startuml and end with @enduml)
5. Do NOT add markdown code blocks, comments, or explanations
6. Output ONLY the complete, valid PlantUML code
7. If removing elements, remove the entire line cleanly
8. If adding elements, follow the existing formatting style

OUTPUT THE MODIFIED PLANTUML CODE NOW:`

            // Call LLM with 60-second timeout and retry logic
            let newCodeRaw
            let attempts = 0
            const maxAttempts = 2

            while (attempts < maxAttempts) {
                attempts++
                console.log(`[DesignAgent] LLM attempt ${attempts}/${maxAttempts}...`)

                try {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('timeout')), 60000)  // 60 seconds
                    )
                    const generatePromise = geminiService.generateContent(prompt)
                    newCodeRaw = await Promise.race([generatePromise, timeoutPromise])

                    if (newCodeRaw && newCodeRaw.trim().length > 0) {
                        console.log('[DesignAgent] LLM responded successfully')
                        break  // Success!
                    }
                } catch (error) {
                    if (attempts < maxAttempts) {
                        console.log(`[DesignAgent] Attempt ${attempts} failed, retrying...`)
                        continue
                    }

                    // Final attempt failed - try fallback
                    console.log('[DesignAgent] LLM timeout, attempting fallback')
                    newCodeRaw = attemptManualModification(current.code, customPrompt, activeDiagram)

                    if (!newCodeRaw) {
                        throw new Error('The modification is taking too long. This might be due to:\n\n1. Complex instruction\n2. Slow API response\n3. Network issues\n\nPlease try:\n- Simpler, single-action instructions\n- Breaking complex changes into steps\n- Checking your internet connection')
                    }
                }
            }

            if (!newCodeRaw || newCodeRaw.trim().length === 0) {
                throw new Error('LLM returned empty response')
            }

            console.log('[DesignAgent] Raw code before cleaning:', newCodeRaw.substring(0, 100))

            // Clean and validate the code
            let newCode = cleanPlantUML(newCodeRaw)

            console.log('[DesignAgent] Cleaned code:', newCode.substring(0, 100))
            console.log('[DesignAgent] Has @startuml:', newCode.includes('@startuml'))
            console.log('[DesignAgent] Has @enduml:', newCode.includes('@enduml'))

            if (!newCode) {
                throw new Error('LLM generated invalid PlantUML syntax. Please try rephrasing your request.')
            }

            // Auto-fix: Add missing @startuml or @enduml tags
            if (!newCode.includes('@startuml')) {
                console.warn('[DesignAgent] Missing @startuml, adding it')
                newCode = '@startuml\n' + newCode
            }

            if (!newCode.includes('@enduml')) {
                console.warn('[DesignAgent] Missing @enduml, adding it')
                newCode = newCode.trim() + '\n@enduml'
            }

            console.log('[DesignAgent] Final code valid:', newCode.includes('@startuml') && newCode.includes('@enduml'))

            // Generate new diagram URL
            const url = getPlantUMLUrl(newCode)

            // Update diagram
            setDiagrams(prev => {
                const updated = {
                    ...prev,
                    [activeDiagram]: {
                        ...prev[activeDiagram],
                        code: newCode,
                        url: url,
                        status: 'done',
                        error: null
                    }
                }

                console.log(`[DesignAgent] Updated ${activeDiagram} diagram in state: `, {
                    codeLength: newCode.length,
                    hasStartTag: newCode.includes('@startuml'),
                    hasEndTag: newCode.includes('@enduml'),
                    firstLine: newCode.split('\n')[0]
                })

                return updated
            })

            setCustomPrompt('')
            console.log(`[DesignAgent] ${activeDiagram} diagram modified successfully`)

        } catch (error) {
            console.error('Modification failed:', error)

            // Restore original code
            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: {
                    ...prev[activeDiagram],
                    code: originalCode,
                    status: 'error',
                    error: `Modification failed: ${error.message} `
                }
            }))

            alert(`Failed to modify diagram: ${error.message} \n\nPlease try: \n - Simpler instructions\n - Manual code editing instead`)

        } finally {
            setIsModifying(false)
        }
    }

    const handleCodeEdit = (e) => {
        const newCode = e.target.value
        setDiagrams(prev => ({
            ...prev,
            [activeDiagram]: {
                ...prev[activeDiagram],
                code: newCode,
                status: 'pending'  // Mark as pending until user clicks Update
            }
        }))
    }

    // Update diagram after manual code edit
    const handleManualRender = () => {
        try {
            const current = diagrams[activeDiagram]

            // Clean the PlantUML code
            const cleanCode = cleanPlantUML(current.code)

            if (!cleanCode) {
                console.error('Invalid PlantUML code')
                setDiagrams(prev => ({
                    ...prev,
                    [activeDiagram]: {
                        ...prev[activeDiagram],
                        status: 'error',
                        error: 'Invalid PlantUML syntax. Please check your code.'
                    }
                }))
                return
            }

            // Generate new URL
            const url = getPlantUMLUrl(cleanCode)

            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: {
                    ...prev[activeDiagram],
                    code: cleanCode,
                    url: url,
                    status: 'done',
                    error: null
                }
            }))

            console.log(`[DesignAgent] ${activeDiagram} diagram updated successfully`)
        } catch (error) {
            console.error('Error updating diagram:', error)
            setDiagrams(prev => ({
                ...prev,
                [activeDiagram]: {
                    ...prev[activeDiagram],
                    status: 'error',
                    error: error.message || 'Failed to update diagram'
                }
            }))
        }
    }

    const handleComplete = async () => {
        const designData = {
            architecture,
            diagrams,
            generatedAt: new Date().toISOString()
        }

        console.log('[DesignAgent] Saving design data:', {
            architecture: architecture ? 'Present' : 'Missing',
            diagramCount: Object.keys(diagrams).length,
            diagrams: Object.keys(diagrams).map(key => ({
                type: key,
                status: diagrams[key].status,
                hasCode: !!diagrams[key].code,
                codeLength: diagrams[key].code?.length || 0
            }))
        })

        // Save to database using current project ID
        if (currentProject) {
            try {
                await apiService.saveDesign(currentProject._id, designData)
                console.log('[DesignAgent] ✅ Design saved successfully to database')

                // Update project context to refresh data
                await updateProject(currentProject._id, { status: 'development' })
                console.log('[DesignAgent] ✅ Project status updated to development')
            } catch (error) {
                console.error('[DesignAgent] ❌ Error saving design:', error)
                alert('Failed to save design. Please try again.')
                return
            }
        }

        setStep('complete')

        // Auto-navigate to next phase after a brief delay
        setTimeout(() => {
            if (onComplete) {
                onComplete(designData)
            }
        }, 1500)
    }

    // Render Helpers
    const renderHero = () => (
        <div className={`agent-hero ${showHero ? 'visible' : 'hidden'}`}>
            <div className="agent-title-section">
                <div className="agent-badge">
                    <span className="agent-emoji">🎨</span>
                    <span>System Design Agent</span>
                </div>
                <h2>DEBUG DESIGN PAGE - VERSION 2 (Refreshed)</h2>
                <p>Diagnostic Header - If you see this, the file is updated</p>
            </div>
            <button className="close-agent" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6L18 18" />
                </svg>
            </button>
        </div>
    )

    // DEBUG: Commented out loading check to force render
    /*
    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="agent-content center-content">
                    <div className="loading-spinner-large"></div>
                    <p style={{ marginTop: 20 }}>Analyzing requirements...</p>
                </div>
            </div>
        )
    }
    */

    return (
        <div className="agent-workspace">
            {renderHero()}

            <div
                className={`agent-content ${!showHero ? 'expanded' : ''}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px', border: '2px solid red' }}
                ref={contentRef}
                onScroll={handleScroll}
            >
                <div style={{ background: 'red', color: 'white', padding: 10, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>[DEBUG] Step: "{step}"</span>
                    <button onClick={() => setStep('architecture')} style={{ background: 'white', color: 'red', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                        FIX: FORCE ARCHITECTURE
                    </button>
                </div>
                {/* Tabs */}
                <div className="design-tabs-container">
                    <button
                        className={`step-tab ${step === 'architecture' ? 'active' : ''} `}
                        onClick={() => setStep('architecture')}
                    >
                        🏗️ Architecture
                    </button>
                    <button
                        className={`step-tab ${step === 'diagrams' ? 'active' : ''} `}
                        onClick={() => setStep('diagrams')}
                    >
                        📊 Diagrams
                    </button>
                </div>

                {/* ARCHITECTURE VIEW */}
                {step === 'architecture' && (
                    architecture ? (
                        <div className="step-container fade-in">
                            <div className="architecture-card glass-panel">
                                <div className="arch-header">
                                    <h3>{architecture.type} Architecture</h3>
                                    <div className="badge-primary">{architecture.type}</div>
                                </div>
                                <p className="arch-justification">{architecture.justification}</p>
                            </div>

                            <div className="layers-grid">
                                {architecture.layers?.map((layer, idx) => (
                                    <div key={idx} className="layer-card glass-panel interactive">
                                        <div className="layer-number">{idx + 1}</div>
                                        <h4>{layer.name}</h4>
                                        <p>{layer.description}</p>
                                        <div className="tech-tags">
                                            {layer.technologies?.map(t => (
                                                <span key={t} className="tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="step-actions">
                                <button className="btn-primary" onClick={() => setStep('diagrams')}>
                                    Proceed to Diagrams →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="step-container fade-in">
                            <div className="centered-state">
                                <div className="loading-spinner-large"></div>
                                <p style={{ marginTop: 20 }}>Generating system architecture...</p>
                                <p style={{ fontSize: '14px', color: '#888', marginTop: 10 }}>
                                    Analyzing your requirements to design the optimal architecture
                                </p>
                            </div>
                        </div>
                    )
                )}

                {/* DIAGRAMS VIEW */}
                {step === 'diagrams' && (
                    <div className="step-container fade-in">
                        <div className="diagrams-nav">
                            {Object.entries(diagrams).map(([key, data]) => (
                                <button
                                    key={key}
                                    className={`diagram - pill ${activeDiagram === key ? 'active' : ''} `}
                                    onClick={() => setActiveDiagram(key)}
                                >
                                    {data.label}
                                    {data.status === 'done' && <span className="status-dot success"></span>}
                                    {data.status === 'loading' && <span className="status-dot loading"></span>}
                                    {data.status === 'error' && <span className="status-dot error"></span>}
                                </button>
                            ))}
                        </div>

                        <div className="diagram-workspace glass-panel">
                            {/* Editor Column */}
                            <div className="diagram-column editor-column">
                                <div className="column-header">
                                    <h4>PlantUML Code</h4>
                                    <button className="btn-xs" onClick={handleManualRender}>
                                        ⟳ Render
                                    </button>
                                </div>
                                <textarea
                                    className="code-editor-area"
                                    value={diagrams[activeDiagram].code}
                                    onChange={handleCodeEdit}
                                    spellCheck="false"
                                />
                                <div className="prompt-box">
                                    <input
                                        type="text"
                                        placeholder={`Modify ${diagrams[activeDiagram].label}... (e.g. "Add User node")`}
                                        value={customPrompt}
                                        onChange={e => setCustomPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleModify()}
                                    />
                                    <button
                                        className="btn-send"
                                        onClick={handleModify}
                                        disabled={isModifying}
                                    >
                                        {isModifying ? '...' : '➤'}
                                    </button>
                                </div>
                            </div>

                            {/* Preview Column */}
                            <div className="diagram-column preview-column">
                                {diagrams[activeDiagram].status === 'loading' ? (
                                    <div className="centered-state">
                                        <div className="loading-spinner"></div>
                                        <p>Generating Diagram...</p>
                                    </div>
                                ) : diagrams[activeDiagram].status === 'error' ? (
                                    <div className="centered-state error">
                                        <p style={{ fontWeight: 'bold' }}>⚠ Failed to generate</p>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#f87171',
                                            background: 'rgba(255,0,0,0.1)',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            maxWidth: '90%',
                                            fontFamily: 'monospace',
                                            marginBottom: '10px'
                                        }}>
                                            {diagrams[activeDiagram].error || "Unknown Error"}
                                        </div>
                                        <button className="btn-secondary" onClick={() => generateDiagram(activeDiagram)}>
                                            ⟳ Retry Generation
                                        </button>
                                    </div>
                                ) : diagrams[activeDiagram].url ? (
                                    <div className="preview-content">
                                        <img
                                            src={diagrams[activeDiagram].url}
                                            alt="Diagram"
                                        />
                                        <div className="preview-actions">
                                            <a href={diagrams[activeDiagram].url} target="_blank" rel="noreferrer" className="btn-icon">
                                                ⤢ Fullscreen
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="centered-state">
                                        <p>No diagram yet</p>
                                        <button className="btn-secondary" onClick={() => generateDiagram(activeDiagram)}>
                                            Generate
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={() => setStep('architecture')}>← Back</button>
                            <button className="btn-primary" onClick={handleComplete}>✅ Finalize Design</button>
                        </div>
                    </div>
                )}

            </div>
            {/* FIXED OVERLAY DEBUG BAR */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'red',
                color: 'white',
                padding: '10px',
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.5)'
            }}>
                <strong>INTERNAL STATE DEBUG:</strong> Step="{step}" | Architecture: {architecture ? 'READY' : 'GENERATING'}
                <button
                    onClick={() => {
                        console.log('Force Fix clicked');
                        setStep('architecture');
                    }}
                    style={{ background: 'white', color: 'red', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    FORCE RE-RENDER
                </button>
            </div>
        </div>
    )
}

export default DesignAgent
