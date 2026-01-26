import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Hero from '../components/Hero'
import Features from '../components/Features'
import Agents from '../components/Agents'
import Workflow from '../components/Workflow'
import CTA from '../components/CTA'

function HomePage() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    // Auto-redirect to projects if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/projects')
        }
    }, [isAuthenticated, navigate])

    const openDashboard = () => {
        navigate('/projects')
    }

    return (
        <div className="home-page">
            <Hero onOpenDashboard={openDashboard} />
            <Features />
            <Agents />
            <Workflow />
            <CTA onOpenDashboard={openDashboard} />
        </div>
    )
}

export default HomePage
