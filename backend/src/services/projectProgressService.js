const Project = require('../models/Project');
const mistralService = require('./mistralService');


/**
 * Service for tracking project progress and validating consistency across SDLC phases.
 */
class ProjectProgressService {
    /**
     * Update and persist project progress summary.
     */
    async updateProjectProgress(projectId) {
        const project = await Project.findById(projectId);
        if (!project) return null;

        const report = await this.getProjectProgressReport(project);

        project.progress = {
            overall_completion: parseInt(report.overall_completion),
            phase_status: report.phase_progress,
            health_status: report.health_status,
            last_validated: new Date()
        };

        await project.save();
        return report;
    }

    /**
     * Calculate progress and validate consistency for a project.
     * @param {Object} project - The project document from MongoDB.
     * @returns {Promise<Object>} - The progress and consistency report.
     */
    async getProjectProgressReport(project) {
        if (!project) throw new Error('Project not found');

        const modules = this._trackModules(project);
        const phases = this._calculatePhaseStatus(modules);
        const overallProgress = this._calculateOverallProgress(phases);
        const consistency = this._performInternalConsistencyCheck(project, phases, modules);

        // Optional AI validation if API key is present
        let aiSuggestions = [];
        const hasMistralKey = process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 10;

        if (hasMistralKey && project.requirements) {
            try {
                aiSuggestions = await this._performAIValidation(project, phases, modules);
            } catch (error) {
                console.warn('[ProgressService] AI Validation skipped/failed:', error.message);
            }
        }

        return {
            project_id: project._id,
            project_name: project.name,
            overall_completion: `${overallProgress}%`,
            phase_progress: phases,
            module_progress: modules,
            consistency_status: consistency.status,
            suggestions: [...consistency.suggestions, ...aiSuggestions],
            health_status: consistency.status === 'valid' ? 'Healthy' : 'Needs Attention',
            last_updated: project.updatedAt
        };
    }

    /**
     * Track individual modules within phases.
     */
    _trackModules(project) {
        // Map project data to requested module names
        return {
            // Requirements Phase
            requirements_document: project.requirements?.projectDescription ? 'generated' : 'pending',
            user_stories: (project.requirements?.functionalRequirements?.length > 0) ? 'generated' : 'pending',
            functional_requirements: (project.requirements?.functionalRequirements?.length > 0) ? 'generated' : 'pending',

            // Design Phase
            architecture_design: (project.design?.diagrams?.component || project.design?.diagrams?.deployment || project.design?.selectedStack) ? 'generated' : 'pending',
            database_schema: (project.design?.diagrams?.class || project.design?.diagrams?.database || project.design?.completedAt) ? 'generated' : 'pending',
            api_design: (project.design?.diagrams?.sequence || project.design?.diagrams?.useCase || project.design?.completedAt) ? 'generated' : 'pending',

            // Development Phase
            source_code_generation: (project.development?.structure || (project.development?.codeFiles && project.development?.codeFiles.length > 0)) ? 'generated' : 'pending',
            module_implementation: (project.development?.completedAt || project.status === 'testing' || project.status === 'completed') ? 'generated' : 'pending',

            // Testing Phase
            unit_tests: (project.testing?.testCases?.length > 0) ? 'generated' : 'pending',
            integration_tests: (project.testing?.testCases?.length > 5) ? 'generated' : 'pending',
            test_cases: (project.testing?.testCases || project.testing?.completedAt) ? 'generated' : 'pending'
        };

    }

    /**
     * Determine phase status based on modules.
     */
    _calculatePhaseStatus(modules) {
        const checkPhase = (mods) => {
            const allGenerated = mods.every(m => modules[m] === 'generated');
            const someGenerated = mods.some(m => modules[m] === 'generated');
            if (allGenerated) return 'completed';
            if (someGenerated) return 'in_progress';
            return 'not_started';
        };

        return {
            requirements: checkPhase(['requirements_document', 'functional_requirements']),
            design: checkPhase(['architecture_design', 'database_schema', 'api_design']),
            development: checkPhase(['source_code_generation', 'module_implementation']),
            testing: checkPhase(['test_cases'])
        };
    }

    /**
     * Calculate overall completion percentage.
     */
    _calculateOverallProgress(phases) {
        const completedPhases = Object.values(phases).filter(p => p === 'completed').length;
        const totalPhases = 4;
        return (completedPhases / totalPhases) * 100;
    }

    /**
     * Logical SDLC consistency checks.
     */
    _performInternalConsistencyCheck(project, phases, modules) {
        const suggestions = [];
        let status = 'valid';

        // 1. Design before Requirements
        if (phases.design !== 'not_started' && phases.requirements !== 'completed') {
            status = 'inconsistent';
            suggestions.push('Complete the Requirements phase before finalizing System Design.');
        }

        // 2. Development without Design
        if (phases.development !== 'not_started' && phases.design !== 'completed') {
            status = 'inconsistent';
            suggestions.push('Ensure System Design is fully completed before starting Development.');
        }

        // 3. Testing without Development
        if (phases.testing !== 'not_started' && phases.development !== 'completed') {
            status = 'inconsistent';
            suggestions.push('Development and Source Code generation should be complete before Testing.');
        }

        // 4. Missing outputs check
        if (phases.requirements === 'completed' && modules.requirements_document === 'pending') {
            suggestions.push('Review requirements: Project Description seems missing.');
        }

        if (phases.design !== 'not_started' && modules.architecture_design === 'pending') {
            suggestions.push('Design phase lacks an architecture definition.');
        }

        if (status === 'valid' && (Object.values(phases).some(p => p !== 'completed'))) {
            if (phases.requirements !== 'completed') suggestions.push('Finish defining functional requirements.');
            else if (phases.design !== 'completed') suggestions.push('Complete the design diagrams and database schema.');
            else if (phases.development !== 'completed') suggestions.push('Proceed with code generation for all modules.');
            else if (phases.testing !== 'completed') suggestions.push('Generate and run full test suites.');
        }

        return { status, suggestions };
    }

    /**
     * Advanced AI validation using Mistral.
     */
    async _performAIValidation(project, phases, modules) {
        const summary = {
            name: project.name,
            requirementsCount: project.requirements?.functionalRequirements?.length || 0,
            diagrams: Object.keys(project.design?.diagrams || {}),
            fileCount: project.development?.codeFiles?.length || 0
        };

        const prompt = `Act as an Expert SDLC Auditor. Review project: "${project.name}"
        
        State:
        - Requirements: ${phases.requirements}
        - Design: ${phases.design} (Diagrams: ${summary.diagrams.join(', ') || 'none'})
        - Development: ${phases.development} (${summary.fileCount} files)
        - Testing: ${phases.testing}
        
        Modules Status: ${JSON.stringify(modules)}
        
        Identify 2-3 specific, high-level logical improvements or consistency warnings. 
        Example: "Tech stack chosen in Design doesn't match Requirements constraint X."
        
        Return ONLY a JSON array of string suggestions. Max 3.`;

        const response = await mistralService.generateJSON(prompt);
        return Array.isArray(response) ? response : [];
    }
}

module.exports = new ProjectProgressService();
