import { useState, useEffect } from 'react'

function Hero({ onOpenDashboard }) {
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <section className="hero" id="hero-section">
            <div className="stars-background"></div>

            {/* Navbar */}
            <nav className="navbar" style={{ opacity: Math.min(1, scrollY / 100) }}>
                <div className="nav-container">
                    <div className="logo">
                        <div className="logo-icon">
                            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z" stroke="url(#logo-gradient)" strokeWidth="2" fill="none" />
                                <circle cx="20" cy="20" r="6" fill="url(#logo-gradient)" />
                                <defs>
                                    <linearGradient id="logo-gradient" x1="5" y1="5" x2="35" y2="35">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#a855f7" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="logo-text">Smart SDLC</span>
                    </div>
                    <div className="nav-links">
                        <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }} className="nav-link">Features</a>
                        <a href="#agents" onClick={(e) => { e.preventDefault(); scrollToSection('agents'); }} className="nav-link">AI Agents</a>
                        <a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection('workflow'); }} className="nav-link">Workflow</a>
                        <button onClick={onOpenDashboard} className="btn-primary">Get Started</button>
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="hero-content">
                <div className="hero-badge">
                    <span className="badge-icon">✨</span>
                    <span>Powered by Agentic AI</span>
                </div>
                <h1 className="hero-title">
                    Automate Your Entire<br />
                    <span className="gradient-text">Software Development</span><br />
                    Life Cycle
                </h1>
                <p className="hero-subtitle">
                    Intelligent AI agents guide you through every phase of SDLC—from requirements to deployment.
                    Generate professional artifacts, validate quality, and ship faster.
                </p>
                <div className="hero-actions">
                    <button className="btn-hero-primary" onClick={onOpenDashboard}>
                        <span>Launch Platform</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button className="btn-hero-secondary">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 8L12 10L8 12V8Z" fill="currentColor" />
                        </svg>
                        <span>Watch Demo</span>
                    </button>
                </div>
                <div className="hero-stats">
                    <div className="stat-item">
                        <div className="stat-value">6</div>
                        <div className="stat-label">AI Agents</div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <div className="stat-value">100%</div>
                        <div className="stat-label">Automated</div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <div className="stat-value">∞</div>
                        <div className="stat-label">Possibilities</div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="scroll-indicator">
                <div className="scroll-line"></div>
                <span>Scroll to explore</span>
            </div>
        </section>
    )
}

export default Hero
