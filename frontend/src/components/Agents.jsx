function Agents() {
    const agents = [
        {
            number: '01',
            icon: '📋',
            name: 'Requirements Agent',
            role: 'Requirement Analysis',
            description: 'Gathers, analyzes, and documents functional and non-functional requirements. Creates user stories and acceptance criteria.',
            capabilities: ['User Stories', 'Use Cases', 'Validation']
        },
        {
            number: '02',
            icon: '🎨',
            name: 'Design Agent',
            role: 'System Architecture',
            description: 'Creates system architecture, database schemas, API designs, and UI/UX wireframes based on requirements.',
            capabilities: ['Architecture', 'Database', 'UI/UX']
        },
        {
            number: '03',
            icon: '💻',
            name: 'Development Agent',
            role: 'Code Generation',
            description: 'Generates clean, maintainable code following best practices. Implements features based on design specifications.',
            capabilities: ['Code Gen', 'Refactoring', 'Standards']
        },
        {
            number: '04',
            icon: '🧪',
            name: 'Testing Agent',
            role: 'Quality Assurance',
            description: 'Creates test plans, generates test cases, and validates code quality. Ensures comprehensive coverage.',
            capabilities: ['Test Plans', 'Automation', 'Coverage']
        },
        {
            number: '05',
            icon: '🚀',
            name: 'Deployment Agent',
            role: 'Release Management',
            description: 'Handles CI/CD pipelines, deployment strategies, and infrastructure setup. Ensures smooth releases.',
            capabilities: ['CI/CD', 'Docker', 'Cloud']
        },
        {
            number: '06',
            icon: '🔧',
            name: 'Maintenance Agent',
            role: 'Support & Evolution',
            description: 'Monitors performance, suggests optimizations, and manages technical debt. Keeps your system healthy.',
            capabilities: ['Monitoring', 'Optimization', 'Support']
        }
    ]

    return (
        <section className="agents" id="agents">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Meet Your AI Agents</h2>
                    <p className="section-subtitle">Six specialized agents working together to automate your SDLC</p>
                </div>
                <div className="agents-grid">
                    {agents.map((agent, index) => (
                        <div key={index} className="agent-card" data-agent={agent.name.toLowerCase().replace(' agent', '')}>
                            <div className="agent-number">{agent.number}</div>
                            <div className="agent-icon-wrapper">
                                <div className="agent-icon">{agent.icon}</div>
                            </div>
                            <h3 className="agent-name">{agent.name}</h3>
                            <p className="agent-role">{agent.role}</p>
                            <p className="agent-description">{agent.description}</p>
                            <div className="agent-capabilities">
                                {agent.capabilities.map((capability, idx) => (
                                    <span key={idx} className="capability-tag">{capability}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Agents
