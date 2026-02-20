function Features() {
    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                </svg>
            ),
            color: '#6366f1',
            title: 'Multi-Agent System',
            description: 'Specialized AI agents for each SDLC phase work together seamlessly to deliver comprehensive automation.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3V21" />
                    <path d="M3 9H21" />
                </svg>
            ),
            color: '#8b5cf6',
            title: 'Professional Artifacts',
            description: 'Auto-generate requirements docs, design specs, and test plans with industry standards.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C14.76 2 17.24 3.04 19.07 4.76" />
                    <path d="M22 4L12 14.01L9 11.01" />
                </svg>
            ),
            color: '#ec4899',
            title: 'Quality Validation',
            description: 'Built-in validation ensures consistency, completeness, and adherence to best practices across all phases.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6V12L16 14" />
                </svg>
            ),
            color: '#14b8a6',
            title: 'Real-Time Collaboration',
            description: 'Agents communicate and share context to maintain consistency and suggest improvements across phases.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                </svg>
            ),
            color: '#f59e0b',
            title: 'Intelligent Suggestions',
            description: 'Get smart recommendations for improvements, optimizations, and best practices at every step.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" />
                    <path d="M12 6V12L16 14" />
                </svg>
            ),
            color: '#06b6d4',
            title: 'Beginner Friendly',
            description: 'Simple explanations and step-by-step guidance make professional software development accessible to everyone.'
        }
    ]

    return (
        <section className="features" id="features">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Why Smart SDLC?</h2>
                    <p className="section-subtitle">Everything you need to build software smarter, faster, and better</p>
                </div>
                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon" style={{ '--icon-color': feature.color }}>
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Features
