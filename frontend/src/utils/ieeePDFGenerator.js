import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Set up fonts - handle Vite bundling
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs
} else if (pdfFonts) {
    pdfMake.vfs = pdfFonts
}

/**
 * Get color for priority level
 * @param {string} priority - Priority level (Critical, High, Medium, Low)
 * @returns {string} - Hex color code
 */
function getPriorityColor(priority) {
    const priorityLower = (priority || '').toLowerCase()
    if (priorityLower.includes('critical')) return '#D32F2F' // Dark Red
    if (priorityLower.includes('high')) return '#F57C00' // Dark Orange
    if (priorityLower.includes('medium')) return '#F9A825' // Dark Yellow/Amber
    if (priorityLower.includes('low')) return '#388E3C' // Dark Green
    return '#000000' // Default black
}

/**
 * Generate IEEE 29148-2018 compliant SRS as PDF
 * @param {object} ieeeData - IEEE formatted data
 * @returns {void} - Triggers PDF download
 */
export function generateIEEEPDF(ieeeData) {
    const { metadata, introduction, overallDescription, specificRequirements, traceabilityMatrix } = ieeeData

    const docDefinition = {
        info: {
            title: metadata.documentTitle,
            author: 'SDLC Platform',
            subject: 'Software Requirements Specification',
            keywords: 'IEEE 29148-2018, SRS, Requirements'
        },
        
        pageSize: 'A4',
        pageMargins: [60, 60, 60, 60],
        
        header: function(currentPage, pageCount) {
            if (currentPage === 1) return null
            return {
                columns: [
                    { text: metadata.documentTitle, fontSize: 9, color: '#666', margin: [60, 20, 0, 0] },
                    { text: `Page ${currentPage}`, alignment: 'right', fontSize: 9, color: '#666', margin: [0, 20, 60, 0] }
                ]
            }
        },
        
        content: [
            // Title Page - No page break before
            {
                text: metadata.documentTitle,
                style: 'title',
                margin: [0, 150, 0, 30]
            },
            {
                text: 'Based on IEEE 29148-2018 Standard',
                style: 'subtitle',
                margin: [0, 0, 0, 40]
            },
            {
                table: {
                    widths: [120, '*'],
                    body: [
                        [{ text: 'Version:', bold: true }, metadata.version],
                        [{ text: 'Date:', bold: true }, metadata.date],
                        [{ text: 'Status:', bold: true }, metadata.status],
                        [{ text: 'Standard:', bold: true }, metadata.standard]
                    ]
                },
                layout: 'noBorders',
                margin: [80, 0, 80, 0]
            },

            // Table of Contents - New page
            { text: '', pageBreak: 'after' },
            { text: 'Table of Contents', style: 'tocHeader', margin: [0, 0, 0, 20] },
            {
                table: {
                    widths: ['*', 40],
                    body: [
                        [{ text: '1. Introduction', style: 'tocItem' }, { text: '3', alignment: 'right', style: 'tocItem' }],
                        [{ text: '1.1 Purpose', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '3', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '1.2 Document Conventions', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '3', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '1.3 Intended Audience', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '4', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '1.4 Product Scope', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '4', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '1.5 References', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '4', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2. Overall Description', style: 'tocItem', margin: [0, 5, 0, 0] }, { text: '5', alignment: 'right', style: 'tocItem', margin: [0, 5, 0, 0] }],
                        [{ text: '2.1 Product Perspective', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '5', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2.2 Product Functions', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '5', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2.3 User Characteristics', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '6', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2.4 Operating Environment', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '6', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2.5 Design Constraints', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '6', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '2.6 Assumptions and Dependencies', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '7', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '3. Specific Requirements', style: 'tocItem', margin: [0, 5, 0, 0] }, { text: '8', alignment: 'right', style: 'tocItem', margin: [0, 5, 0, 0] }],
                        [{ text: '3.1 External Interfaces', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '8', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '3.2 Functional Requirements', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '9', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '3.3 Non-Functional Requirements', style: 'tocSubItem', margin: [20, 0, 0, 0] }, { text: '10', alignment: 'right', style: 'tocSubItem' }],
                        [{ text: '4. Traceability Matrix', style: 'tocItem', margin: [0, 5, 0, 0] }, { text: '12', alignment: 'right', style: 'tocItem', margin: [0, 5, 0, 0] }]
                    ]
                },
                layout: 'noBorders'
            },

            // Section 1: Introduction
            { text: '', pageBreak: 'after' },
            { text: '1. Introduction', style: 'sectionHeader', margin: [0, 0, 0, 15] },
            
            { text: '1.1 Purpose', style: 'subHeader', margin: [0, 10, 0, 8] },
            { text: introduction.purpose.text, style: 'bodyText', margin: [0, 0, 0, 10] },
            { text: [{ text: 'Scope: ', bold: true }, introduction.purpose.scope], style: 'bodyText', margin: [0, 0, 0, 15] },
            
            { text: '1.2 Document Conventions', style: 'subHeader', margin: [0, 10, 0, 8] },
            { text: introduction.documentConventions.text, style: 'bodyText', margin: [0, 0, 0, 8] },
            { ul: introduction.documentConventions.conventions, margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '1.3 Intended Audience', style: 'subHeader', margin: [0, 10, 0, 8] },
            { ul: introduction.intendedAudience.audiences, margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '1.4 Product Scope', style: 'subHeader', margin: [0, 10, 0, 8] },
            { text: introduction.productScope, style: 'bodyText', margin: [0, 0, 0, 15] },
            
            { text: '1.5 References', style: 'subHeader', margin: [0, 10, 0, 8] },
            { ol: introduction.references, margin: [20, 0, 0, 15], style: 'bodyText' },

            // Section 2: Overall Description
            { text: '2. Overall Description', style: 'sectionHeader', pageBreak: 'before', margin: [0, 0, 0, 15] },
            
            { text: '2.1 Product Perspective', style: 'subHeader', margin: [0, 10, 0, 8] },
            { text: overallDescription.productPerspective, style: 'bodyText', margin: [0, 0, 0, 15] },
            
            { text: '2.2 Product Functions', style: 'subHeader', margin: [0, 10, 0, 8] },
            { ul: overallDescription.productFunctions, margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '2.3 User Characteristics', style: 'subHeader', margin: [0, 10, 0, 8] },
            {
                style: 'tableStyle',
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: 'User Type', style: 'tableHeader' },
                            { text: 'Expertise Level', style: 'tableHeader' },
                            { text: 'Influence', style: 'tableHeader' }
                        ],
                        ...overallDescription.userCharacteristics.map(uc => [
                            { text: uc.userType, style: 'tableCell' },
                            { text: uc.expertise, style: 'tableCell' },
                            { text: uc.influence, style: 'tableCell' }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#CCCCCC',
                    vLineColor: () => '#CCCCCC',
                    paddingLeft: () => 8,
                    paddingRight: () => 8,
                    paddingTop: () => 6,
                    paddingBottom: () => 6
                },
                margin: [0, 0, 0, 15]
            },
            
            { text: '2.4 Operating Environment', style: 'subHeader', margin: [0, 10, 0, 8] },
            { ul: [
                `Platform: ${overallDescription.operatingEnvironment.platform}`,
                `Hardware: ${overallDescription.operatingEnvironment.hardware}`,
                `Software: ${overallDescription.operatingEnvironment.software}`
            ], margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '2.5 Design and Implementation Constraints', style: 'subHeader', margin: [0, 10, 0, 8] },
            { 
                ul: overallDescription.designConstraints && overallDescription.designConstraints.length > 0 
                    ? overallDescription.designConstraints.map(c => c.description || c)
                    : ['To be determined during design phase'],
                margin: [20, 0, 0, 15],
                style: 'bodyText'
            },
            
            { text: '2.6 Assumptions and Dependencies', style: 'subHeader', margin: [0, 10, 0, 8] },
            { 
                ul: overallDescription.assumptions && overallDescription.assumptions.length > 0 
                    ? overallDescription.assumptions.map(a => a.description || a)
                    : ['Standard development environment available'],
                margin: [20, 0, 0, 15],
                style: 'bodyText'
            },

            // Section 3: Specific Requirements
            { text: '3. Specific Requirements', style: 'sectionHeader', pageBreak: 'before', margin: [0, 0, 0, 15] },
            
            { text: '3.1 External Interface Requirements', style: 'subHeader', margin: [0, 10, 0, 8] },
            
            { text: '3.1.1 User Interfaces', style: 'subSubHeader', margin: [0, 8, 0, 5] },
            { text: specificRequirements.externalInterfaces.userInterfaces.description, style: 'bodyText', margin: [0, 0, 0, 5] },
            { ul: specificRequirements.externalInterfaces.userInterfaces.requirements, margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '3.1.2 Communication Interfaces', style: 'subSubHeader', margin: [0, 8, 0, 5] },
            { text: specificRequirements.externalInterfaces.communicationInterfaces.description, style: 'bodyText', margin: [0, 0, 0, 5] },
            { ul: specificRequirements.externalInterfaces.communicationInterfaces.requirements, margin: [20, 0, 0, 15], style: 'bodyText' },
            
            { text: '3.2 Functional Requirements', style: 'subHeader', margin: [0, 15, 0, 10] },
            
            // Functional Requirements (individual blocks)
            ...specificRequirements.functionalRequirements.flatMap(fr => [
                { text: fr.id, style: 'requirementHeader', margin: [0, 10, 0, 5] },
                { text: `Description: ${fr.description}`, style: 'bodyText', margin: [0, 0, 0, 5] },
                { text: `Rationale: ${fr.rationale}`, style: 'bodyText', margin: [0, 0, 0, 5] },
                { text: `Priority: ${fr.priority}`, style: 'boldText', margin: [0, 0, 0, 5] },
                { text: 'Acceptance Criteria:', style: 'boldText', margin: [0, 3, 0, 3] },
                { ul: fr.acceptanceCriteria, margin: [20, 0, 0, 15], style: 'bodyText' }
            ]),
            
            { text: '3.3 Non-Functional Requirements', style: 'subHeader', margin: [0, 15, 0, 10] },
            
            // Non-Functional Requirements (individual blocks)
            ...specificRequirements.nonFunctionalRequirements.flatMap(nfr => [
                { text: `${nfr.id} - ${nfr.category}`, style: 'requirementHeader', margin: [0, 10, 0, 5] },
                { text: `Description: ${nfr.description}`, style: 'bodyText', margin: [0, 0, 0, 5] },
                { text: `Metric: ${nfr.metric}`, style: 'bodyText', margin: [0, 0, 0, 5] },
                { text: `Priority: ${nfr.priority}`, style: 'boldText', margin: [0, 0, 0, 5] },
                { text: 'Acceptance Criteria:', style: 'boldText', margin: [0, 3, 0, 3] },
                { ul: nfr.acceptanceCriteria, margin: [20, 0, 0, 15], style: 'bodyText' }
            ]),

            // Section 4: Traceability Matrix
            { text: '4. Traceability Matrix', style: 'sectionHeader', pageBreak: 'before', margin: [0, 0, 0, 15] },
            {
                style: 'tableStyle',
                table: {
                    headerRows: 1,
                    widths: [55, 35, '*', 45, 35, 35, 35, 40],
                    body: [
                        [
                            { text: 'Req ID', style: 'tableHeader' },
                            { text: 'Type', style: 'tableHeader' },
                            { text: 'Description', style: 'tableHeader' },
                            { text: 'Source', style: 'tableHeader' },
                            { text: 'Design', style: 'tableHeader' },
                            { text: 'Impl', style: 'tableHeader' },
                            { text: 'Test', style: 'tableHeader' },
                            { text: 'Status', style: 'tableHeader' }
                        ],
                        ...traceabilityMatrix.map(tm => [
                            { text: tm.requirementId, style: 'tableCell', fontSize: 7 },
                            { text: tm.type, style: 'tableCell', fontSize: 7 },
                            { text: tm.description, style: 'tableCell', fontSize: 7 },
                            { text: tm.source, style: 'tableCell', fontSize: 7 },
                            { text: tm.design, style: 'tableCell', fontSize: 7 },
                            { text: tm.implementation, style: 'tableCell', fontSize: 7 },
                            { text: tm.test, style: 'tableCell', fontSize: 7 },
                            { text: tm.status, style: 'tableCell', fontSize: 7 }
                        ])
                    ]
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#CCCCCC',
                    vLineColor: () => '#CCCCCC',
                    paddingLeft: () => 6,
                    paddingRight: () => 6,
                    paddingTop: () => 5,
                    paddingBottom: () => 5
                },
                margin: [0, 0, 0, 20]
            },

            { text: '_______________', alignment: 'center', margin: [0, 30, 0, 10] },
            { text: 'End of Document', style: 'centered', margin: [0, 0, 0, 0] }
        ],
        
        styles: {
            title: {
                fontSize: 22,
                bold: true,
                alignment: 'center',
                color: '#1a1a1a'
            },
            subtitle: {
                fontSize: 11,
                alignment: 'center',
                color: '#666',
                italics: true
            },
            tocHeader: {
                fontSize: 16,
                bold: true,
                color: '#000000'
            },
            tocItem: {
                fontSize: 11,
                margin: [0, 2, 0, 2],
                color: '#000000'
            },
            tocSubItem: {
                fontSize: 10,
                margin: [0, 1, 0, 1],
                color: '#000000'
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                color: '#000000'
            },
            subHeader: {
                fontSize: 12,
                bold: true,
                color: '#000000'
            },
            subSubHeader: {
                fontSize: 11,
                bold: true,
                color: '#000000'
            },
            requirementHeader: {
                fontSize: 10,
                bold: true,
                color: '#000000'
            },
            bodyText: {
                fontSize: 10,
                alignment: 'justify',
                lineHeight: 1.3,
                color: '#000000'
            },
            boldText: {
                fontSize: 10,
                bold: true,
                color: '#000000'
            },
            tableHeader: {
                bold: true,
                fontSize: 9,
                color: '#FFFFFF',
                fillColor: '#4472C4',
                alignment: 'center'
            },
            tableCell: {
                fontSize: 9,
                lineHeight: 1.2
            },
            tableStyle: {
                margin: [0, 5, 0, 15]
            },
            centered: {
                alignment: 'center',
                fontSize: 10,
                color: '#888',
                italics: true
            }
        },
        
        defaultStyle: {
            fontSize: 10,
            lineHeight: 1.3
        }
    }

    // Generate and download PDF
    pdfMake.createPdf(docDefinition).download('IEEE-29148-SRS.pdf')
}
