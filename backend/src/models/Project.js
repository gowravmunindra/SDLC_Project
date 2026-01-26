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
        architectureType: String,
        components: mongoose.Schema.Types.Mixed,
        useCases: mongoose.Schema.Types.Mixed,
        erDiagrams: mongoose.Schema.Types.Mixed,
        completedAt: Date
    },
    
    // Development Phase
    development: {
        framework: String,
        codeFiles: mongoose.Schema.Types.Mixed,
        dependencies: [String],
        completedAt: Date
    },
    
    // Testing Phase
    testing: {
        testCases: mongoose.Schema.Types.Mixed,
        testResults: mongoose.Schema.Types.Mixed,
        coverageReport: mongoose.Schema.Types.Mixed,
        completedAt: Date
    }
}, {
    timestamps: true
})

// Index for faster queries
projectSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Project', projectSchema)
