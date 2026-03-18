const Project = require('../models/Project')
const progressService = require('../services/projectProgressService')


// @desc    Get all user projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 })
        res.json(projects)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Check if user owns this project
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to access this project' })
        }

        res.json(project)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body

        const project = await Project.create({
            userId: req.user._id,
            name,
            description,
            status: 'planning'
        })

        res.status(201).json(project)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Check if user owns this project
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this project' })
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )

        res.json(updatedProject)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Check if user owns this project
        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this project' })
        }

        await project.deleteOne()
        res.json({ message: 'Project removed' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// @desc    Save requirements
// @route   POST /api/projects/:id/requirements
// @access  Private
const saveRequirements = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    requirements: {
                        ...req.body,
                        completedAt: new Date()
                    },
                    status: 'design'
                }
            },
            { new: true, runValidators: true }
        );

        try {
            await progressService.updateProjectProgress(projectId);
        } catch (progErr) {
            console.warn('[projectController] Requirements progress update warning:', progErr.message);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('[projectController] saveRequirements failed:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Save design
// @route   POST /api/projects/:id/design
// @access  Private
const saveDesign = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Use findByIdAndUpdate to bypass some potential sequential save issues
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    design: {
                        ...req.body,
                        completedAt: new Date()
                    },
                    status: 'development'
                }
            },
            { new: true, runValidators: true }
        );

        // Update progress summary in background (or at least separately)
        try {
            await progressService.updateProjectProgress(projectId);
        } catch (progErr) {
            console.warn('[projectController] Progress update warning (ignoring):', progErr.message);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('[projectController] saveDesign CRITICAL ERROR:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Save development
// @route   POST /api/projects/:id/development
// @access  Private
const saveDevelopment = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    development: {
                        ...req.body,
                        completedAt: new Date()
                    },
                    status: 'testing'
                }
            },
            { new: true, runValidators: true }
        );

        try {
            await progressService.updateProjectProgress(projectId);
        } catch (progErr) {
            console.warn('[projectController] Development progress update warning:', progErr.message);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('[projectController] saveDevelopment failed:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Save testing
// @route   POST /api/projects/:id/testing
// @access  Private
const saveTesting = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            {
                $set: {
                    testing: {
                        ...req.body,
                        completedAt: new Date()
                    },
                    status: 'completed'
                }
            },
            { new: true, runValidators: true }
        );

        try {
            await progressService.updateProjectProgress(projectId);
        } catch (progErr) {
            console.warn('[projectController] Testing progress update warning:', progErr.message);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('[projectController] saveTesting failed:', error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    saveRequirements,
    saveDesign,
    saveDevelopment,
    saveTesting
}
