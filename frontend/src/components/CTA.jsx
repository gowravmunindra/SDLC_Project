function CTA({ onOpenDashboard }) {
    return (
        <section className="cta">
            <div className="container">
                <div className="cta-content">
                    <h2 className="cta-title">Ready to Transform Your Development Process?</h2>
                    <p className="cta-subtitle">Join the future of software development with AI-powered automation</p>
                    <button className="btn-cta" onClick={onOpenDashboard}>
                        <span>Start Building Now</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    )
}

export default CTA
