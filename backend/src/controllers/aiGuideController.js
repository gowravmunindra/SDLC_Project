const aiGuideService = require('../services/aiGuideService');

/**
 * Handle AI Guide queries
 */
exports.askGuide = async (req, res) => {
    try {
        const { projectId, query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a question for the AI Guide.'
            });
        }

        const response = await aiGuideService.getGuideResponse(projectId, query);

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('[AIGuideController] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error in AI Guide.'
        });
    }
};
