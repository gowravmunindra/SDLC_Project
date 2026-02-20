import * as pdfjsLib from 'pdfjs-dist'
import huggingFaceService from '../services/huggingFaceService'

// Set up PDF.js worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * Extract text from PDF file
 * @param {File} file - PDF file from file input
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Parse IEEE SRS PDF and extract structured requirements
 * @param {File} pdfFile - IEEE formatted SRS PDF file
 * @returns {Promise<object>} - Structured requirements data
 */
export async function parseIEEEPDF(pdfFile, forceLocal = false) {
  try {
    // Extract text from PDF
    const pdfText = await extractTextFromPDF(pdfFile)

    // Create prompt for AI to parse the IEEE document
    const parsePrompt = `You are an expert at parsing IEEE 29148-2018 Software Requirements Specification (SRS) documents.

I will provide you with the extracted text from an IEEE SRS PDF. Please analyze it and extract the following information in JSON format:

1. Project Description/Product Scope
2. Functional Requirements (with IDs, descriptions, priorities, rationale)
3. Non-Functional Requirements (categorized by: performance, security, usability, scalability, reliability)
4. Stakeholders
5. Assumptions
6. Constraints

Here is the PDF text:

---
${pdfText.substring(0, 15000)}  
---

Please extract and structure this data in the following JSON format:

{
  "projectDescription": "string - overall project description from Product Scope or Introduction",
  "functionalRequirements": [
    {
      "id": "string - requirement ID like REQ-FR-001 or FR-001",
      "title": "string - brief title",
      "description": "string - full requirement description",
      "priority": "string - Critical/High/Medium/Low",
      "rationale": "string - why this requirement exists",
      "editable": true
    }
  ],
  "nonFunctionalRequirements": {
    "performance": [
      {"id": "string", "description": "string", "editable": true}
    ],
    "security": [
      {"id": "string", "description": "string", "editable": true}
    ],
    "usability": [
      {"id": "string", "description": "string", "editable": true}
    ],
    "scalability": [
      {"id": "string", "description": "string", "editable": true}
    ],
    "reliability": [
      {"id": "string", "description": "string", "editable": true}
    ]
  },
  "stakeholders": [
    {
      "id": "string",
      "name": "string - stakeholder name/role",
      "role": "string - their role in the project",
      "influence": "string - High/Medium/Low",
      "editable": true
    }
  ],
  "assumptions": [
    {
      "id": "string",
      "description": "string - assumption description",
      "editable": true
    }
  ],
  "constraints": [
    {
      "id": "string",
      "description": "string - constraint description",
      "editable": true
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No additional text or explanation. If you cannot find certain sections, return empty arrays for those fields.`

    // Use AI to parse the text
    const parsedData = await huggingFaceService.generateJSON(parsePrompt, 2, forceLocal)

    return parsedData

  } catch (error) {
    console.error('Error parsing IEEE PDF:', error)
    throw error
  }
}

/**
 * Validate parsed requirements data
 * @param {object} data - Parsed requirements data
 * @returns {object} - Validated and cleaned data
 */
export function validateParsedData(data) {
  return {
    projectDescription: data.projectDescription || '',
    functionalRequirements: Array.isArray(data.functionalRequirements)
      ? data.functionalRequirements.map((fr, idx) => ({
        id: fr.id || `FR-${String(idx + 1).padStart(3, '0')}`,
        title: fr.title || fr.description?.substring(0, 50) || 'Untitled Requirement',
        description: fr.description || '',
        priority: fr.priority || 'Medium',
        rationale: fr.rationale || 'Extracted from IEEE SRS',
        editable: true
      }))
      : [],
    nonFunctionalRequirements: {
      performance: Array.isArray(data.nonFunctionalRequirements?.performance)
        ? data.nonFunctionalRequirements.performance
        : [],
      security: Array.isArray(data.nonFunctionalRequirements?.security)
        ? data.nonFunctionalRequirements.security
        : [],
      usability: Array.isArray(data.nonFunctionalRequirements?.usability)
        ? data.nonFunctionalRequirements.usability
        : [],
      scalability: Array.isArray(data.nonFunctionalRequirements?.scalability)
        ? data.nonFunctionalRequirements.scalability
        : [],
      reliability: Array.isArray(data.nonFunctionalRequirements?.reliability)
        ? data.nonFunctionalRequirements.reliability
        : []
    },
    stakeholders: Array.isArray(data.stakeholders)
      ? data.stakeholders.map((sh, idx) => ({
        id: sh.id || `SH-${String(idx + 1).padStart(3, '0')}`,
        name: sh.name || 'Unknown Stakeholder',
        role: sh.role || 'Stakeholder',
        influence: sh.influence || 'Medium',
        editable: true
      }))
      : [],
    assumptions: Array.isArray(data.assumptions)
      ? data.assumptions
      : [],
    constraints: Array.isArray(data.constraints)
      ? data.constraints
      : []
  }
}
