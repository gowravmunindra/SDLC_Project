import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

const apiService = {
    // Authentication
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),

    // Projects
    getProjects: () => api.get('/projects'),
    createProject: (data) => api.post('/projects', data),
    getProject: (id) => api.get(`/projects/${id}`),
    updateProject: (id, data) => api.put(`/projects/${id}`, data),
    deleteProject: (id) => api.delete(`/projects/${id}`),

    // Requirements Phase
    saveRequirements: (projectId, data) => api.post(`/projects/${projectId}/requirements`, data),
    getRequirements: (projectId) => api.get(`/projects/${projectId}`).then(res => res.data.requirements),

    // Design Phase
    saveDesign: (projectId, data) => api.post(`/projects/${projectId}/design`, data),
    getDesign: (projectId) => api.get(`/projects/${projectId}`).then(res => res.data.design),

    // Development Phase
    saveDevelopment: (projectId, data) => api.post(`/projects/${projectId}/development`, data),
    getDevelopment: (projectId) => api.get(`/projects/${projectId}`).then(res => res.data.development),
    verifyDevelopmentKey: () => api.get('/development/verify-key'),
    generateTechStack: (projectId) => {
        if (!projectId) return Promise.reject(new Error("Project ID is required"));
        return api.post('/development/generate-tech-stack', { projectId });
    },
    generateStructure: (projectId, techStack, generateType) => {
        if (!projectId) return Promise.reject(new Error("Project ID is required"));
        return api.post('/development/generate-structure', { projectId, techStack, generateType });
    },
    generateCode: (projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure) => {
        if (!projectId) return Promise.reject(new Error("Project ID is required"));
        return api.post('/development/generate-code', { projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure });
    },

    // Testing Phase
    saveTesting: (projectId, data) => api.post(`/projects/${projectId}/testing`, data),
    getTesting: (projectId) => api.get(`/projects/${projectId}`).then(res => res.data.testing),

    // Vibe Coding (Creative Generation)
    vibeGenerate: (payload) => api.post('/vibe-coding/generate-project', payload),
    vibeUpdate: (payload) => api.post('/vibe-coding/update-project', payload)
}

export default apiService
