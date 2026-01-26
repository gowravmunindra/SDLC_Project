import { createContext, useState, useContext, useEffect } from 'react'
import apiService from '../services/apiService'
import { useAuth } from './AuthContext'

const ProjectContext = createContext()

export const useProject = () => {
    const context = useContext(ProjectContext)
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider')
    }
    return context
}

export const ProjectProvider = ({ children }) => {
    const { isAuthenticated } = useAuth()
    const [projects, setProjects] = useState([])
    const [currentProject, setCurrentProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load projects when user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadProjects()
        } else {
            setProjects([])
            setCurrentProject(null)
            setLoading(false)
        }
    }, [isAuthenticated])

    // Load all user projects
    const loadProjects = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await apiService.getProjects()
            setProjects(response.data)
            
            // Auto-select first project if no current project
            if (!currentProject && response.data.length > 0) {
                setCurrentProject(response.data[0])
                localStorage.setItem('currentProjectId', response.data[0]._id)
            }
            
            setLoading(false)
        } catch (error) {
            console.error('Error loading projects:', error)
            setError(error.response?.data?.message || 'Failed to load projects')
            setLoading(false)
        }
    }

    // Create new project
    const createProject = async (projectData) => {
        try {
            setError(null)
            const response = await apiService.createProject(projectData)
            const newProject = response.data
            
            setProjects(prev => [newProject, ...prev])
            setCurrentProject(newProject)
            localStorage.setItem('currentProjectId', newProject._id)
            
            return { success: true, project: newProject }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create project'
            setError(message)
            return { success: false, error: message }
        }
    }

    // Select a project
    const selectProject = async (projectId) => {
        try {
            setError(null)
            const response = await apiService.getProject(projectId)
            const project = response.data
            
            setCurrentProject(project)
            localStorage.setItem('currentProjectId', project._id)
            
            return { success: true, project }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to load project'
            setError(message)
            return { success: false, error: message }
        }
    }

    // Update current project
    const updateProject = async (projectId, updates) => {
        try {
            setError(null)
            const response = await apiService.updateProject(projectId, updates)
            const updatedProject = response.data
            
            // Update in projects list
            setProjects(prev => prev.map(p => 
                p._id === projectId ? updatedProject : p
            ))
            
            // Update current project if it's the one being updated
            if (currentProject?._id === projectId) {
                setCurrentProject(updatedProject)
            }
            
            return { success: true, project: updatedProject }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update project'
            setError(message)
            return { success: false, error: message }
        }
    }

    // Delete a project
    const deleteProject = async (projectId) => {
        try {
            setError(null)
            await apiService.deleteProject(projectId)
            
            // Remove from projects list
            setProjects(prev => prev.filter(p => p._id !== projectId))
            
            // If deleting current project, select another one
            if (currentProject?._id === projectId) {
                const remainingProjects = projects.filter(p => p._id !== projectId)
                if (remainingProjects.length > 0) {
                    setCurrentProject(remainingProjects[0])
                    localStorage.setItem('currentProjectId', remainingProjects[0]._id)
                } else {
                    setCurrentProject(null)
                    localStorage.removeItem('currentProjectId')
                }
            }
            
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete project'
            setError(message)
            return { success: false, error: message }
        }
    }

    // Refresh current project data
    const refreshCurrentProject = async () => {
        if (currentProject) {
            await selectProject(currentProject._id)
        }
    }

    const value = {
        projects,
        currentProject,
        loading,
        error,
        createProject,
        selectProject,
        updateProject,
        deleteProject,
        refreshCurrentProject,
        loadProjects,
        hasProjects: projects.length > 0
    }

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
