const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['planning', 'design', 'development', 'testing', 'completed'],
        default: 'planning'
    },

    // Requirements Phase
    requirements: {
        projectDescription: String,
        functionalRequirements: [{
            id: String,
            title: String,
            description: String,
            priority: String,
            rationale: String,
            acceptanceCriteria: [String],
            editable: Boolean
        }],
        nonFunctionalRequirements: {
            performance: [{ id: String, description: String, editable: Boolean }],
            security: [{ id: String, description: String, editable: Boolean }],
            usability: [{ id: String, description: String, editable: Boolean }],
            scalability: [{ id: String, description: String, editable: Boolean }],
            reliability: [{ id: String, description: String, editable: Boolean }]
        },
        assumptions: [{ id: String, description: String, editable: Boolean }],
        constraints: [{ id: String, description: String, editable: Boolean }],
        stakeholders: [{
            id: String,
            name: String,
            role: String,
            influence: String,
            editable: Boolean
        }],
        ieeeFormat: mongoose.Schema.Types.Mixed,
        completedAt: Date
    },

    // Design Phase
    design: {
        architecture: mongoose.Schema.Types.Mixed,
        diagrams: mongoose.Schema.Types.Mixed,
        techStacks: mongoose.Schema.Types.Mixed,
        selectedStack: mongoose.Schema.Types.Mixed,
        completedAt: Date
    },

    // Development Phase
    development: {
        techStack: mongoose.Schema.Types.Mixed,
        structure: mongoose.Schema.Types.Mixed,
        codeFiles: mongoose.Schema.Types.Mixed,
        fileCount: { type: Number, default: 0 },
        completedAt: Date
    },


    // Testing Phase
    testing: {
        testStrategy: mongoose.Schema.Types.Mixed,
        testCases: mongoose.Schema.Types.Mixed,
        edgeCases: mongoose.Schema.Types.Mixed,
        testResults: mongoose.Schema.Types.Mixed,
        coverageReport: mongoose.Schema.Types.Mixed,
        completedAt: Date
    },

    // Vector Search Support (Semantic RAG)
    vectorEmbeddings: {
        requirements: { type: [Number], default: [] },
        design: { type: [Number], default: [] }
    },

    // Progress Tracking Summary
    progress: {
        overall_completion: { type: Number, default: 0 },
        phase_status: {
            requirements: { type: String, default: 'not_started' },
            design: { type: String, default: 'not_started' },
            development: { type: String, default: 'not_started' },
            testing: { type: String, default: 'not_started' }
        },
        health_status: { type: String, default: 'Healthy' },
        last_validated: Date
    }
}, {

    timestamps: true
})

// Index for faster queries
projectSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Project', projectSchema)
