const express = require('express')
const router = express.Router()
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    saveRequirements,
    saveDesign,
    saveDevelopment,
    saveTesting
} = require('../controllers/projectController')
const { protect } = require('../middleware/auth')

// All routes are protected
router.use(protect)

// Project CRUD
router.route('/').get(getProjects).post(createProject)
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject)

// Phase specific routes
router.post('/:id/requirements', saveRequirements)
router.post('/:id/design', saveDesign)
router.post('/:id/development', saveDevelopment)
router.post('/:id/testing', saveTesting)

module.exports = router
