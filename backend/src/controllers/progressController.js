const Project = require('../models/Project');
const progressService = require('../services/projectProgressService');

/**
 * Controller for handling project progress and consistency validation.
 */
class ProgressController {
    /**
     * Get the full progress and consistency report for a project.
     * GET /api/projects/:id/progress
     */
    async getProgress(req, res) {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            const report = await progressService.getProjectProgressReport(project);
            res.json({ success: true, data: report });
        } catch (error) {
            console.error('[ProgressController] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Re-calculate and validate consistency manually.
     * POST /api/projects/:id/validate
     */
    async validateConsistency(req, res) {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            const report = await progressService.getProjectProgressReport(project);

            // Return health status and detailed report
            res.json({
                success: true,
                isValid: report.consistency_status === 'valid',
                health: report.health_status,
                report
            });
        } catch (error) {
            console.error('[ProgressController] Validation Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ProgressController();
