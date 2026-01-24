import { useState } from 'react'
import Hero from './components/Hero'
import Features from './components/Features'
import Agents from './components/Agents'
import Workflow from './components/Workflow'
import CTA from './components/CTA'
import Dashboard from './components/Dashboard'
import ChatbotAgent from './components/ChatbotAgent'

function App() {
    const [isDashboardOpen, setIsDashboardOpen] = useState(false)

    const openDashboard = () => setIsDashboardOpen(true)
    const closeDashboard = () => setIsDashboardOpen(false)

    return (
        <div className="app">
            <Hero onOpenDashboard={openDashboard} />
            <Features />
            <Agents />
            <Workflow />
            <CTA onOpenDashboard={openDashboard} />
            <Dashboard isOpen={isDashboardOpen} onClose={closeDashboard} />
            <ChatbotAgent />
        </div>
    )
}

export default App

