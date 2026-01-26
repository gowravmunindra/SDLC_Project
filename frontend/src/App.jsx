import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import RequirementsPage from './pages/RequirementsPage'
import DesignPage from './pages/DesignPage'
import DevelopmentPage from './pages/DevelopmentPage'
import TestingPage from './pages/TestingPage'
import ChatbotAgent from './components/ChatbotAgent'

function App() {
    return (
        <Router>
            <AuthProvider>
                <ProjectProvider>
                    <div className="app">
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            
                            {/* Protected routes */}
                            <Route path="/projects" element={
                                <ProtectedRoute><ProjectsPage /></ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                                <ProtectedRoute><DashboardPage /></ProtectedRoute>
                            } />
                            <Route path="/requirements" element={
                                <ProtectedRoute><RequirementsPage /></ProtectedRoute>
                            } />
                            <Route path="/design" element={
                                <ProtectedRoute><DesignPage /></ProtectedRoute>
                            } />
                            <Route path="/development" element={
                                <ProtectedRoute><DevelopmentPage /></ProtectedRoute>
                            } />
                            <Route path="/testing" element={
                                <ProtectedRoute><TestingPage /></ProtectedRoute>
                            } />
                        </Routes>
                        
                        {/* Chatbot is always available on all pages */}
                        <ChatbotAgent />
                    </div>
                </ProjectProvider>
            </AuthProvider>
        </Router>
    )
}

export default App
