import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 300000 // 5 minutes
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Handle network errors (backend down)
        if (!error.response && error.message === 'Network Error') {
            console.error('[API] Backend unreachable. Ensure server is running on port 5001.');
            throw new Error('Our backend is taking a nap or is unreachable. Please ensure the server is running.');
        }

        // Retry on 500 once if it's a transient failure, except for long-running AI calls
        if (error.response?.status === 500 && !originalRequest._retry && !originalRequest.url.includes('generate')) {
            originalRequest._retry = true;
            console.warn('[API] Transient 500 error, retrying once...');
            return api(originalRequest);
        }

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
    generateStructure: (projectId, techStack, generateType, isRegenerating = false) => {
        if (!projectId) return Promise.reject(new Error('Project ID is required'));
        return api.post('/development/generate-structure', { projectId, techStack, generateType, isRegenerating });
    },
    generateCode: (projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure, isRegenerating = false) => {
        if (!projectId) return Promise.reject(new Error('Project ID is required'));
        return api.post('/development/generate-code', { projectId, filePath, fileDescription, techStack, codeType, diagrams, fullStructure, isRegenerating });
    },

    // Testing Phase
    saveTesting: (projectId, data) => api.post(`/projects/${projectId}/testing`, data),
    getTesting: (projectId) => api.get(`/projects/${projectId}`).then(res => res.data.testing),

    // Progress Tracking & Consistency Validation
    getProjectProgress: (projectId) => api.get(`/projects/${projectId}/progress`),
    validateConsistency: (projectId) => api.post(`/projects/${projectId}/validate`),

    // Vibe Coding (Creative Generation)
    vibeGenerate: (payload) => api.post('/vibe-coding/generate-project', payload, { timeout: 900000 }), // 15 mins
    vibeUpdate: (payload) => api.post('/vibe-coding/update-project', payload, { timeout: 600000 }), // 10 mins

    // AI Utils (Mistral)
    generateRequirements: (projectName, projectDescription = '') =>
        api.post('/ai/requirements', { projectName, projectDescription }).then(res => res.data),
    suggestTechStacks: (requirements) => api.post('/ai/tech-stacks', { requirements }).then(res => res.data),
    generateDiagrams: (requirements, type = null) => api.post('/ai/diagrams', { requirements, type }).then(res => res.data),
    // Backend PlantUML rendering proxy - bypasses browser URL length limits
    // Returns a URL that points to the backend render endpoint
    getPlantUMLRenderUrl: (code) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        // We use a POST-via-fetch approach in the component, so this returns the endpoint URL
        return `${API_URL}/ai/plantuml/render`;
    },

    // AI Guide
    askGuide: (projectId, query) => api.post('/guide/ask', { projectId, query })
}

export default apiService
