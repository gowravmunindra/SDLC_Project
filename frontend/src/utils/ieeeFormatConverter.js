/**
 * IEEE 29148-2018 Format Converter
 * Converts simple requirements to IEEE-compliant SRS format
 */

/**
 * Generate IEEE-compliant requirement ID
 * @param {string} type - FR (Functional) or NFR (Non-Functional)
 * @param {string} category - Category/subsystem
 * @param {number} index - Requirement number
 * @returns {string} - IEEE formatted ID (e.g., REQ-FR-AUTH-001)
 */
export function generateIEEERequirementId(type, category, index) {
    const paddedIndex = String(index).padStart(3, '0')
    return `REQ-${type}-${category.toUpperCase()}-${paddedIndex}`
}

/**
 * Convert simple requirements to IEEE 29148 format
 * @param {object} requirementsData - Simple requirements data
 * @returns {object} - IEEE-formatted requirements
 */
export function convertToIEEEFormat(requirementsData) {
    const {
        projectDescription,
        functionalRequirements,
        nonFunctionalRequirements,
        assumptions,
        constraints,
        stakeholders
    } = requirementsData

    // Generate metadata
    const metadata = {
        documentTitle: 'Software Requirements Specification (SRS)',
        standard: 'IEEE 29148-2018',
        version: '1.0',
        date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        status: 'Draft'
    }

    // Section 1: Introduction
    const introduction = {
        purpose: generatePurposeSection(projectDescription),
        documentConventions: generateDocumentConventions(),
        intendedAudience: generateIntendedAudience(stakeholders),
        productScope: projectDescription,
        references: generateReferences()
    }

    // Section 2: Overall Description
    const overallDescription = {
        productPerspective: generateProductPerspective(projectDescription),
        productFunctions: generateProductFunctions(functionalRequirements),
        userCharacteristics: generateUserCharacteristics(stakeholders),
        operatingEnvironment: generateOperatingEnvironment(),
        designConstraints: constraints,
        assumptions: assumptions
    }

    // Section 3: Specific Requirements
    const specificRequirements = {
        externalInterfaces: generateExternalInterfaces(functionalRequirements),
        functionalRequirements: convertFunctionalRequirements(functionalRequirements),
        nonFunctionalRequirements: convertNonFunctionalRequirements(nonFunctionalRequirements)
    }

    // Generate traceability matrix
    const traceabilityMatrix = generateTraceabilityMatrix(
        specificRequirements.functionalRequirements,
        specificRequirements.nonFunctionalRequirements
    )

    return {
        metadata,
        introduction,
        overallDescription,
        specificRequirements,
        traceabilityMatrix
    }
}

/**
 * Generate Purpose section
 */
function generatePurposeSection(projectDescription) {
    return {
        text: `This Software Requirements Specification (SRS) document provides a complete description of the requirements for the system. It is intended to be used by developers, project managers, quality assurance teams, and stakeholders to understand the functional and non-functional requirements of the system.`,
        scope: projectDescription
    }
}

/**
 * Generate Document Conventions
 */
function generateDocumentConventions() {
    return {
        text: 'This document follows IEEE 29148-2018 standard for requirements specification.',
        conventions: [
            'Requirements are uniquely identified with REQ-[TYPE]-[CATEGORY]-[NUMBER] format',
            'Priority levels: Critical, High, Medium, Low',
            'Requirements marked as [M] are mandatory, [O] are optional',
            'Each requirement includes: ID, description, rationale, priority, and dependencies'
        ]
    }
}

/**
 * Generate Intended Audience
 */
function generateIntendedAudience(stakeholders) {
    const audiences = [
        'Software Developers - Implement the requirements',
        'Project Managers - Plan and track development',
        'QA Engineers - Develop test plans and cases',
        'System Architects - Design system architecture'
    ]

    if (stakeholders && stakeholders.length > 0) {
        stakeholders.forEach(sh => {
            audiences.push(`${sh.role} - ${sh.influence || 'Stakeholder'}`)
        })
    }

    return { audiences }
}

/**
 * Generate References
 */
function generateReferences() {
    return [
        'IEEE 29148-2018 - Systems and software engineering — Life cycle processes — Requirements engineering',
        'Project Charter and Business Case',
        'Stakeholder Requirements Documentation'
    ]
}

/**
 * Generate Product Perspective
 */
function generateProductPerspective(description) {
    return `This system is ${description.toLowerCase().includes('new') ? 'a new, self-contained product' : 'part of a larger system'}. ${description}`
}

/**
 * Generate Product Functions
 */
function generateProductFunctions(functionalRequirements) {
    if (!functionalRequirements || functionalRequirements.length === 0) {
        return ['Core functionality as defined in Section 3']
    }

    return functionalRequirements.slice(0, 5).map(fr => 
        `${fr.id}: ${fr.description.substring(0, 100)}${fr.description.length > 100 ? '...' : ''}`
    )
}

/**
 * Generate User Characteristics
 */
function generateUserCharacteristics(stakeholders) {
    const characteristics = []

    if (stakeholders && stakeholders.length > 0) {
        stakeholders.forEach(sh => {
            characteristics.push({
                userType: sh.role,
                expertise: sh.expertise || 'Medium',
                influence: sh.influence || 'Medium'
            })
        })
    } else {
        characteristics.push({
            userType: 'End Users',
            expertise: 'Varied - from novice to expert',
            influence: 'High'
        })
    }

    return characteristics
}

/**
 * Generate Operating Environment
 */
function generateOperatingEnvironment() {
    return {
        platform: 'Web-based application accessible via modern web browsers',
        hardware: 'Client devices with internet connectivity',
        software: 'Compatible with Chrome 90+, Firefox 88+, Safari 14+, Edge 90+'
    }
}

/**
 * Generate External Interfaces
 */
function generateExternalInterfaces(functionalRequirements) {
    return {
        userInterfaces: {
            description: 'Web-based user interface following modern UX principles',
            requirements: ['Responsive design', 'Accessibility compliance (WCAG 2.1)']
        },
        hardwareInterfaces: {
            description: 'Standard client hardware with network connectivity',
            requirements: []
        },
        softwareInterfaces: {
            description: 'Integration with external services as needed',
            requirements: []
        },
        communicationInterfaces: {
            description: 'HTTP/HTTPS protocols for client-server communication',
            requirements: ['RESTful API', 'WebSocket for real-time features']
        }
    }
}

/**
 * Convert Functional Requirements to IEEE format
 */
function convertFunctionalRequirements(functionalRequirements) {
    if (!functionalRequirements) return []

    return functionalRequirements.map((fr, index) => ({
        id: fr.id || generateIEEERequirementId('FR', 'SYS', index + 1),
        description: fr.description,
        rationale: fr.rationale || 'Required for system functionality',
        priority: fr.priority || 'High',
        dependencies: fr.dependencies || [],
        acceptanceCriteria: fr.acceptanceCriteria || [
            'Requirement is fully implemented',
            'All test cases pass',
            'Performance meets specified criteria'
        ],
        traceability: {
            source: 'User Requirements',
            verification: 'Testing',
            validation: 'User Acceptance'
        }
    }))
}

/**
 * Convert Non-Functional Requirements to IEEE format
 */
function convertNonFunctionalRequirements(nonFunctionalRequirements) {
    if (!nonFunctionalRequirements) return []

    const ieeeNFRs = []
    let globalIndex = 1

    Object.keys(nonFunctionalRequirements).forEach(category => {
        const nfrList = nonFunctionalRequirements[category]
        
        nfrList.forEach(nfr => {
            ieeeNFRs.push({
                id: nfr.id || generateIEEERequirementId('NFR', category.substring(0, 4), globalIndex++),
                category: category,
                description: nfr.description,
                rationale: `${category} requirement for system quality`,
                priority: 'High',
                metric: generateMetric(category, nfr.description),
                acceptanceCriteria: [
                    `Meets ${category} standards`,
                    'Verified through testing',
                    'Documented and traceable'
                ],
                traceability: {
                    source: 'System Quality Requirements',
                    verification: 'Quality Testing',
                    validation: 'System Validation'
                }
            })
        })
    })

    return ieeeNFRs
}

/**
 * Generate metric for NFR
 */
function generateMetric(category, description) {
    const metrics = {
        performance: 'Response time < 2 seconds for 95% of requests',
        security: 'No critical vulnerabilities, compliance with OWASP Top 10',
        usability: 'User satisfaction score > 4.0/5.0',
        reliability: 'System uptime > 99.5%',
        maintainability: 'Code coverage > 80%, technical debt ratio < 5%',
        scalability: 'Support 10x current load with <10% performance degradation'
    }

    return metrics[category] || 'Measurable and verifiable metric to be defined'
}

/**
 * Generate Traceability Matrix
 */
function generateTraceabilityMatrix(functionalReqs, nonFunctionalReqs) {
    const matrix = []

    // FR traceability
    functionalReqs.forEach(fr => {
        matrix.push({
            requirementId: fr.id,
            type: 'Functional',
            description: fr.description.substring(0, 50) + '...',
            source: 'User Requirements',
            design: 'TBD',
            implementation: 'TBD',
            test: 'TBD',
            status: 'Defined'
        })
    })

    // NFR traceability
    nonFunctionalReqs.forEach(nfr => {
        matrix.push({
            requirementId: nfr.id,
            type: 'Non-Functional',
            description: nfr.description.substring(0, 50) + '...',
            source: 'Quality Requirements',
            design: 'TBD',
            implementation: 'TBD',
            test: 'TBD',
            status: 'Defined'
        })
    })

    return matrix
}

/**
 * Generate IEEE SRS Markdown Document
 */
export function generateIEEEDocument(ieeeData) {
    const { metadata, introduction, overallDescription, specificRequirements, traceabilityMatrix } = ieeeData

    let markdown = `# ${metadata.documentTitle}\n\n`
    markdown += `**Standard:** ${metadata.standard}  \n`
    markdown += `**Version:** ${metadata.version}  \n`
    markdown += `**Date:** ${metadata.date}  \n`
    markdown += `**Status:** ${metadata.status}\n\n`
    markdown += `---\n\n`

    // Table of Contents
    markdown += `## Table of Contents\n\n`
    markdown += `1. [Introduction](#1-introduction)\n`
    markdown += `2. [Overall Description](#2-overall-description)\n`
    markdown += `3. [Specific Requirements](#3-specific-requirements)\n`
    markdown += `4. [Traceability Matrix](#4-traceability-matrix)\n\n`
    markdown += `---\n\n`

    // Section 1: Introduction
    markdown += `## 1. Introduction\n\n`
    markdown += `### 1.1 Purpose\n\n${introduction.purpose.text}\n\n`
    markdown += `**Scope:** ${introduction.purpose.scope}\n\n`
    markdown += `### 1.2 Document Conventions\n\n${introduction.documentConventions.text}\n\n`
    introduction.documentConventions.conventions.forEach(conv => {
        markdown += `- ${conv}\n`
    })
    markdown += `\n### 1.3 Intended Audience\n\n`
    introduction.intendedAudience.audiences.forEach(aud => {
        markdown += `- ${aud}\n`
    })
    markdown += `\n### 1.4 Product Scope\n\n${introduction.productScope}\n\n`
    markdown += `### 1.5 References\n\n`
    introduction.references.forEach((ref, i) => {
        markdown += `${i + 1}. ${ref}\n`
    })
    markdown += `\n---\n\n`

    // Section 2: Overall Description
    markdown += `## 2. Overall Description\n\n`
    markdown += `### 2.1 Product Perspective\n\n${overallDescription.productPerspective}\n\n`
    markdown += `### 2.2 Product Functions\n\n`
    overallDescription.productFunctions.forEach(fn => {
        markdown += `- ${fn}\n`
    })
    markdown += `\n### 2.3 User Characteristics\n\n`
    markdown += `| User Type | Expertise Level | Influence |\n`
    markdown += `|-----------|-----------------|----------|\n`
    overallDescription.userCharacteristics.forEach(uc => {
        markdown += `| ${uc.userType} | ${uc.expertise} | ${uc.influence} |\n`
    })
    markdown += `\n### 2.4 Operating Environment\n\n`
    markdown += `- **Platform:** ${overallDescription.operatingEnvironment.platform}\n`
    markdown += `- **Hardware:** ${overallDescription.operatingEnvironment.hardware}\n`
    markdown += `- **Software:** ${overallDescription.operatingEnvironment.software}\n\n`
    markdown += `### 2.5 Design and Implementation Constraints\n\n`
    if (overallDescription.designConstraints && overallDescription.designConstraints.length > 0) {
        overallDescription.designConstraints.forEach(constraint => {
            markdown += `- ${constraint.description || constraint}\n`
        })
    } else {
        markdown += `- To be determined during design phase\n`
    }
    markdown += `\n### 2.6 Assumptions and Dependencies\n\n`
    if (overallDescription.assumptions && overallDescription.assumptions.length > 0) {
        overallDescription.assumptions.forEach(assumption => {
            markdown += `- ${assumption.description || assumption}\n`
        })
    } else {
        markdown += `- Standard development environment available\n`
    }
    markdown += `\n---\n\n`

    // Section 3: Specific Requirements
    markdown += `## 3. Specific Requirements\n\n`
    markdown += `### 3.1 External Interface Requirements\n\n`
    markdown += `#### 3.1.1 User Interfaces\n\n${specificRequirements.externalInterfaces.userInterfaces.description}\n\n`
    specificRequirements.externalInterfaces.userInterfaces.requirements.forEach(req => {
        markdown += `- ${req}\n`
    })
    markdown += `\n#### 3.1.2 Communication Interfaces\n\n${specificRequirements.externalInterfaces.communicationInterfaces.description}\n\n`
    specificRequirements.externalInterfaces.communicationInterfaces.requirements.forEach(req => {
        markdown += `- ${req}\n`
    })
    markdown += `\n### 3.2 Functional Requirements\n\n`
    
    specificRequirements.functionalRequirements.forEach(fr => {
        markdown += `#### ${fr.id}\n\n`
        markdown += `**Description:** ${fr.description}\n\n`
        markdown += `**Rationale:** ${fr.rationale}\n\n`
        markdown += `**Priority:** ${fr.priority}\n\n`
        markdown += `**Acceptance Criteria:**\n`
        fr.acceptanceCriteria.forEach(ac => {
            markdown += `- ${ac}\n`
        })
        markdown += `\n`
    })

    markdown += `### 3.3 Non-Functional Requirements\n\n`
    
    specificRequirements.nonFunctionalRequirements.forEach(nfr => {
        markdown += `#### ${nfr.id} - ${nfr.category}\n\n`
        markdown += `**Description:** ${nfr.description}\n\n`
        markdown += `**Metric:** ${nfr.metric}\n\n`
        markdown += `**Priority:** ${nfr.priority}\n\n`
        markdown += `**Acceptance Criteria:**\n`
        nfr.acceptanceCriteria.forEach(ac => {
            markdown += `- ${ac}\n`
        })
        markdown += `\n`
    })

    markdown += `---\n\n`

    // Section 4: Traceability Matrix
    markdown += `## 4. Traceability Matrix\n\n`
    markdown += `| Requirement ID | Type | Description | Source | Design | Implementation | Test | Status |\n`
    markdown += `|----------------|------|-------------|--------|--------|----------------|------|--------|\n`
    traceabilityMatrix.forEach(tm => {
        markdown += `| ${tm.requirementId} | ${tm.type} | ${tm.description} | ${tm.source} | ${tm.design} | ${tm.implementation} | ${tm.test} | ${tm.status} |\n`
    })

    markdown += `\n---\n\n**End of Document**`

    return markdown
}
