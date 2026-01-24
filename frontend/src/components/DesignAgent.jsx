import { useState, useEffect } from 'react'

function DesignAgent({ onClose, onComplete }) {
    const [step, setStep] = useState('loading') // loading, architecture, components, diagrams, database, review, complete
    const [requirements, setRequirements] = useState(null)
    const [architecture, setArchitecture] = useState({
        type: 'monolith',
        justification: '',
        layers: []
    })
    const [components, setComponents] = useState([])
    const [diagrams, setDiagrams] = useState({
        useCase: { description: '', actors: [], useCases: [] },
        class: { description: '', classes: [] },
        sequence: { description: '', flows: [] }
    })
    const [databaseSchema, setDatabaseSchema] = useState({
        type: 'relational',
        tables: []
    })
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    useEffect(() => {
        // Load requirements from previous phase
        const savedRequirements = localStorage.getItem('sdlc_requirements')
        if (savedRequirements) {
            const reqData = JSON.parse(savedRequirements)
            setRequirements(reqData)
            analyzeAndGenerateDesign(reqData)
        } else {
            // No requirements found - create sample data
            const sampleReq = {
                projectDescription: 'Sample project for design demonstration',
                functionalRequirements: [
                    { id: 'FR-001', title: 'User Authentication', description: 'Users can register and login' }
                ]
            }
            setRequirements(sampleReq)
            analyzeAndGenerateDesign(sampleReq)
        }
    }, [])

    const analyzeAndGenerateDesign = (reqData) => {
        setIsAnalyzing(true)

        // Simulate AI analysis
        setTimeout(() => {
            generateArchitecture(reqData)
            generateComponents(reqData)
            generateDiagrams(reqData)
            generateDatabaseSchema(reqData)
            setIsAnalyzing(false)
            setStep('architecture')
        }, 2000)
    }

    const generateArchitecture = (reqData) => {
        const desc = reqData.projectDescription?.toLowerCase() || ''
        const numRequirements = reqData.functionalRequirements?.length || 0

        // Decide architecture based on complexity
        const isMicroservices = desc.includes('microservice') ||
            desc.includes('scalable') ||
            numRequirements > 10

        setArchitecture({
            type: isMicroservices ? 'microservices' : 'monolith',
            justification: isMicroservices
                ? 'Based on the project requirements, a microservices architecture is recommended for better scalability, independent deployment, and team autonomy. This allows different services to be developed and scaled independently.'
                : 'A monolithic architecture is recommended for this project as it provides simplicity, easier development and deployment, and is suitable for the current scale. It can be migrated to microservices later if needed.',
            layers: [
                {
                    name: 'Presentation Layer',
                    description: 'User interface and user experience components. Handles all user interactions and displays data.',
                    technologies: ['React', 'HTML5', 'CSS3', 'JavaScript'],
                    responsibilities: ['UI Components', 'State Management', 'User Input Validation', 'Routing']
                },
                {
                    name: 'Application Layer',
                    description: 'Business logic and application services. Orchestrates the flow of data and enforces business rules.',
                    technologies: ['Node.js', 'Express.js', 'REST API'],
                    responsibilities: ['Business Logic', 'API Endpoints', 'Request Validation', 'Authentication & Authorization']
                },
                {
                    name: 'Data Layer',
                    description: 'Data persistence and retrieval. Manages all database operations and data integrity.',
                    technologies: ['PostgreSQL', 'MongoDB', 'Redis (Cache)'],
                    responsibilities: ['Data Storage', 'CRUD Operations', 'Data Validation', 'Caching']
                }
            ]
        })
    }

    const generateComponents = (reqData) => {
        const comps = [
            {
                id: 'C-001',
                name: 'Authentication Service',
                description: 'Handles user registration, login, logout, and session management',
                responsibilities: ['User registration', 'Login/Logout', 'Password encryption', 'JWT token generation', 'Session management'],
                interfaces: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/verify'],
                dependencies: ['User Database', 'Email Service']
            },
            {
                id: 'C-002',
                name: 'User Management Service',
                description: 'Manages user profiles, permissions, and user-related operations',
                responsibilities: ['Profile management', 'User CRUD operations', 'Role assignment', 'Permission management'],
                interfaces: ['GET /api/users/:id', 'PUT /api/users/:id', 'DELETE /api/users/:id', 'GET /api/users'],
                dependencies: ['User Database', 'Authentication Service']
            },
            {
                id: 'C-003',
                name: 'Core Business Logic',
                description: 'Implements the main business functionality based on requirements',
                responsibilities: ['Business rule enforcement', 'Data processing', 'Workflow management', 'Validation'],
                interfaces: ['Various REST endpoints based on features'],
                dependencies: ['Database', 'External APIs']
            },
            {
                id: 'C-004',
                name: 'Data Access Layer',
                description: 'Provides abstraction for database operations',
                responsibilities: ['Database queries', 'ORM management', 'Connection pooling', 'Transaction management'],
                interfaces: ['Repository pattern interfaces'],
                dependencies: ['Database']
            },
            {
                id: 'C-005',
                name: 'API Gateway',
                description: 'Single entry point for all client requests',
                responsibilities: ['Request routing', 'Load balancing', 'Rate limiting', 'API versioning'],
                interfaces: ['All public API endpoints'],
                dependencies: ['All backend services']
            }
        ]

        setComponents(comps)
    }

    const generateDiagrams = (reqData) => {
        // Use Case Diagram
        const useCaseDiagram = {
            description: 'The Use Case Diagram shows the interactions between users (actors) and the system. It illustrates what the system does from a user\'s perspective.',
            actors: [
                { id: 'A-001', name: 'End User', description: 'Primary user of the system' },
                { id: 'A-002', name: 'Administrator', description: 'System administrator with elevated privileges' },
                { id: 'A-003', name: 'Guest User', description: 'Unauthenticated visitor' }
            ],
            useCases: [
                { id: 'UC-001', name: 'Register Account', actor: 'Guest User', description: 'User creates a new account' },
                { id: 'UC-002', name: 'Login', actor: 'End User', description: 'User authenticates to access the system' },
                { id: 'UC-003', name: 'Manage Profile', actor: 'End User', description: 'User updates their profile information' },
                { id: 'UC-004', name: 'Perform Core Operations', actor: 'End User', description: 'User performs main business functions' },
                { id: 'UC-005', name: 'Manage Users', actor: 'Administrator', description: 'Admin manages user accounts' },
                { id: 'UC-006', name: 'View Reports', actor: 'Administrator', description: 'Admin views system reports and analytics' }
            ]
        }

        // Class Diagram
        const classDiagram = {
            description: 'The Class Diagram shows the structure of the system by displaying classes, their attributes, methods, and relationships. This represents the object-oriented design of the application.',
            classes: [
                {
                    id: 'CL-001',
                    name: 'User',
                    attributes: ['id: UUID', 'email: String', 'password: String (hashed)', 'firstName: String', 'lastName: String', 'role: String', 'createdAt: DateTime', 'updatedAt: DateTime'],
                    methods: ['register()', 'login()', 'updateProfile()', 'changePassword()', 'validateCredentials()'],
                    relationships: ['Has many: Sessions', 'Has one: Profile']
                },
                {
                    id: 'CL-002',
                    name: 'Session',
                    attributes: ['id: UUID', 'userId: UUID', 'token: String', 'expiresAt: DateTime', 'createdAt: DateTime'],
                    methods: ['create()', 'validate()', 'revoke()', 'refresh()'],
                    relationships: ['Belongs to: User']
                },
                {
                    id: 'CL-003',
                    name: 'Profile',
                    attributes: ['id: UUID', 'userId: UUID', 'bio: Text', 'avatar: String', 'preferences: JSON'],
                    methods: ['update()', 'getPublicInfo()'],
                    relationships: ['Belongs to: User']
                },
                {
                    id: 'CL-004',
                    name: 'Role',
                    attributes: ['id: UUID', 'name: String', 'permissions: Array<String>'],
                    methods: ['hasPermission()', 'grantPermission()', 'revokePermission()'],
                    relationships: ['Has many: Users']
                }
            ]
        }

        // Sequence Diagram
        const sequenceDiagram = {
            description: 'Sequence Diagrams show how objects interact over time. They illustrate the flow of messages between components for specific scenarios.',
            flows: [
                {
                    id: 'SEQ-001',
                    name: 'User Login Flow',
                    description: 'Step-by-step process when a user logs into the system',
                    steps: [
                        '1. User enters email and password in the login form',
                        '2. Frontend validates input and sends POST request to /api/auth/login',
                        '3. API Gateway receives request and routes to Authentication Service',
                        '4. Authentication Service queries User Database for user record',
                        '5. Database returns user data (if exists)',
                        '6. Authentication Service verifies password hash',
                        '7. If valid, Authentication Service generates JWT token',
                        '8. Session is created and stored in database',
                        '9. JWT token is returned to Frontend',
                        '10. Frontend stores token and redirects user to dashboard'
                    ]
                },
                {
                    id: 'SEQ-002',
                    name: 'Data Retrieval Flow',
                    description: 'How data is fetched and displayed to the user',
                    steps: [
                        '1. User navigates to a page requiring data',
                        '2. Frontend sends GET request with authentication token',
                        '3. API Gateway validates token',
                        '4. Request is routed to appropriate service',
                        '5. Service validates user permissions',
                        '6. Service queries Data Access Layer',
                        '7. Data Access Layer executes database query',
                        '8. Database returns results',
                        '9. Service formats and filters data',
                        '10. Response is sent back to Frontend',
                        '11. Frontend renders data in UI'
                    ]
                },
                {
                    id: 'SEQ-003',
                    name: 'User Registration Flow',
                    description: 'Complete flow for new user registration',
                    steps: [
                        '1. Guest user fills registration form',
                        '2. Frontend validates input (email format, password strength)',
                        '3. POST request sent to /api/auth/register',
                        '4. Authentication Service checks if email already exists',
                        '5. If unique, password is hashed using bcrypt',
                        '6. New user record is created in database',
                        '7. Welcome email is queued (Email Service)',
                        '8. Success response with user ID is returned',
                        '9. User is automatically logged in',
                        '10. Frontend redirects to onboarding/dashboard'
                    ]
                }
            ]
        }

        setDiagrams({
            useCase: useCaseDiagram,
            class: classDiagram,
            sequence: sequenceDiagram
        })
    }

    const generateDatabaseSchema = (reqData) => {
        setDatabaseSchema({
            type: 'relational',
            justification: 'A relational database (PostgreSQL) is recommended for its ACID compliance, data integrity, and support for complex queries. It\'s ideal for structured data with clear relationships.',
            tables: [
                {
                    id: 'T-001',
                    name: 'users',
                    description: 'Stores user account information',
                    columns: [
                        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique user identifier' },
                        { name: 'email', type: 'VARCHAR(255)', constraints: 'UNIQUE NOT NULL', description: 'User email address' },
                        { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Bcrypt hashed password' },
                        { name: 'first_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'User first name' },
                        { name: 'last_name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'User last name' },
                        { name: 'role', type: 'VARCHAR(50)', constraints: 'DEFAULT \'user\'', description: 'User role (user, admin, etc.)' },
                        { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT true', description: 'Account active status' },
                        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Account creation timestamp' },
                        { name: 'updated_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Last update timestamp' }
                    ],
                    indexes: ['email', 'role', 'created_at'],
                    relationships: ['One-to-Many with sessions', 'One-to-One with profiles']
                },
                {
                    id: 'T-002',
                    name: 'sessions',
                    description: 'Manages user authentication sessions',
                    columns: [
                        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique session identifier' },
                        { name: 'user_id', type: 'UUID', constraints: 'FOREIGN KEY REFERENCES users(id)', description: 'Reference to user' },
                        { name: 'token', type: 'TEXT', constraints: 'NOT NULL', description: 'JWT token' },
                        { name: 'expires_at', type: 'TIMESTAMP', constraints: 'NOT NULL', description: 'Session expiration time' },
                        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Session creation time' }
                    ],
                    indexes: ['user_id', 'token', 'expires_at'],
                    relationships: ['Many-to-One with users']
                },
                {
                    id: 'T-003',
                    name: 'profiles',
                    description: 'Extended user profile information',
                    columns: [
                        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique profile identifier' },
                        { name: 'user_id', type: 'UUID', constraints: 'FOREIGN KEY REFERENCES users(id) UNIQUE', description: 'Reference to user' },
                        { name: 'bio', type: 'TEXT', constraints: 'NULL', description: 'User biography' },
                        { name: 'avatar_url', type: 'VARCHAR(500)', constraints: 'NULL', description: 'Profile picture URL' },
                        { name: 'preferences', type: 'JSONB', constraints: 'DEFAULT \'{}\'', description: 'User preferences as JSON' },
                        { name: 'updated_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Last update timestamp' }
                    ],
                    indexes: ['user_id'],
                    relationships: ['One-to-One with users']
                },
                {
                    id: 'T-004',
                    name: 'roles',
                    description: 'Role-based access control',
                    columns: [
                        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique role identifier' },
                        { name: 'name', type: 'VARCHAR(50)', constraints: 'UNIQUE NOT NULL', description: 'Role name' },
                        { name: 'permissions', type: 'JSONB', constraints: 'DEFAULT \'[]\'', description: 'Array of permissions' },
                        { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()', description: 'Role creation time' }
                    ],
                    indexes: ['name'],
                    relationships: ['Referenced by users table']
                }
            ]
        })
    }

    const handleComplete = () => {
        const designData = {
            requirements,
            architecture,
            components,
            diagrams,
            databaseSchema,
            generatedAt: new Date().toISOString()
        }

        // Save to localStorage
        localStorage.setItem('sdlc_design', JSON.stringify(designData))

        setStep('complete')

        if (onComplete) {
            onComplete(designData)
        }
    }

    const exportDesign = () => {
        const designData = {
            architecture,
            components,
            diagrams,
            databaseSchema
        }

        const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'system-design-specification.json'
        a.click()
    }

    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="agent-header">
                    <div className="agent-title-section">
                        <div className="agent-badge">
                            <span className="agent-emoji">🎨</span>
                            <span>System Design Agent</span>
                        </div>
                        <h2>Analyzing Requirements...</h2>
                        <p>Generating system architecture and design</p>
                    </div>
                </div>
                <div className="agent-content">
                    <div className="loading-screen">
                        <div className="loading-spinner-large"></div>
                        <p>Analyzing your requirements and creating system design...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="agent-workspace">
            <div className="agent-header">
                <div className="agent-title-section">
                    <div className="agent-badge">
                        <span className="agent-emoji">🎨</span>
                        <span>System Design Agent</span>
                    </div>
                    <h2>System Architecture & Design</h2>
                    <p>Comprehensive design based on your requirements</p>
                </div>
                <button className="close-agent" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6L18 18" />
                    </svg>
                </button>
            </div>

            <div className="agent-content">
                {/* Navigation Tabs */}
                <div className="design-tabs">
                    <button
                        className={`design-tab ${step === 'architecture' ? 'active' : ''}`}
                        onClick={() => setStep('architecture')}
                    >
                        🏗️ Architecture
                    </button>
                    <button
                        className={`design-tab ${step === 'components' ? 'active' : ''}`}
                        onClick={() => setStep('components')}
                    >
                        🧩 Components
                    </button>
                    <button
                        className={`design-tab ${step === 'diagrams' ? 'active' : ''}`}
                        onClick={() => setStep('diagrams')}
                    >
                        📊 Diagrams
                    </button>
                    <button
                        className={`design-tab ${step === 'database' ? 'active' : ''}`}
                        onClick={() => setStep('database')}
                    >
                        🗄️ Database
                    </button>
                </div>

                {/* Architecture View */}
                {step === 'architecture' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>System Architecture</h3>
                            <p>High-level architecture design and technology stack</p>
                        </div>

                        <div className="architecture-card">
                            <div className="architecture-type">
                                <h4>Recommended Architecture</h4>
                                <div className="architecture-badge">
                                    {architecture.type === 'microservices' ? '🔷 Microservices' : '🔶 Monolithic'}
                                </div>
                            </div>
                            <p className="architecture-justification">{architecture.justification}</p>
                        </div>

                        <div className="layers-section">
                            <h4>System Layers</h4>
                            {architecture.layers.map((layer, index) => (
                                <div key={index} className="layer-card">
                                    <div className="layer-header">
                                        <h5>{layer.name}</h5>
                                        <div className="layer-number">{index + 1}</div>
                                    </div>
                                    <p className="layer-description">{layer.description}</p>
                                    <div className="layer-tech">
                                        <strong>Technologies:</strong>
                                        <div className="tech-tags">
                                            {layer.technologies.map((tech, idx) => (
                                                <span key={idx} className="tech-tag">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="layer-responsibilities">
                                        <strong>Responsibilities:</strong>
                                        <ul>
                                            {layer.responsibilities.map((resp, idx) => (
                                                <li key={idx}>{resp}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Components View */}
                {step === 'components' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>System Components</h3>
                            <p>Detailed breakdown of system components and their interactions</p>
                        </div>

                        <div className="components-grid">
                            {components.map((component) => (
                                <div key={component.id} className="component-card">
                                    <div className="component-header">
                                        <span className="component-id">{component.id}</span>
                                        <h5>{component.name}</h5>
                                    </div>
                                    <p className="component-description">{component.description}</p>

                                    <div className="component-section">
                                        <strong>📋 Responsibilities:</strong>
                                        <ul>
                                            {component.responsibilities.map((resp, idx) => (
                                                <li key={idx}>{resp}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="component-section">
                                        <strong>🔌 Interfaces:</strong>
                                        <div className="interface-list">
                                            {component.interfaces.map((iface, idx) => (
                                                <code key={idx} className="interface-code">{iface}</code>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="component-section">
                                        <strong>🔗 Dependencies:</strong>
                                        <div className="dependency-tags">
                                            {component.dependencies.map((dep, idx) => (
                                                <span key={idx} className="dependency-tag">{dep}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Diagrams View */}
                {step === 'diagrams' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>UML Diagrams</h3>
                            <p>Visual representations of system structure and behavior</p>
                        </div>

                        {/* Use Case Diagram */}
                        <div className="diagram-section">
                            <h4>📌 Use Case Diagram</h4>
                            <p className="diagram-description">{diagrams.useCase.description}</p>

                            <div className="diagram-content">
                                <div className="actors-section">
                                    <h5>Actors (Users)</h5>
                                    {diagrams.useCase.actors.map((actor) => (
                                        <div key={actor.id} className="actor-item">
                                            <span className="actor-id">{actor.id}</span>
                                            <div>
                                                <strong>{actor.name}</strong>
                                                <p>{actor.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="usecases-section">
                                    <h5>Use Cases</h5>
                                    {diagrams.useCase.useCases.map((uc) => (
                                        <div key={uc.id} className="usecase-item">
                                            <span className="usecase-id">{uc.id}</span>
                                            <div>
                                                <strong>{uc.name}</strong>
                                                <p><em>Actor:</em> {uc.actor}</p>
                                                <p>{uc.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Class Diagram */}
                        <div className="diagram-section">
                            <h4>🏛️ Class Diagram</h4>
                            <p className="diagram-description">{diagrams.class.description}</p>

                            <div className="classes-grid">
                                {diagrams.class.classes.map((cls) => (
                                    <div key={cls.id} className="class-card">
                                        <div className="class-header">
                                            <span className="class-id">{cls.id}</span>
                                            <h5>{cls.name}</h5>
                                        </div>

                                        <div className="class-section">
                                            <strong>Attributes:</strong>
                                            <ul className="class-list">
                                                {cls.attributes.map((attr, idx) => (
                                                    <li key={idx}><code>{attr}</code></li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="class-section">
                                            <strong>Methods:</strong>
                                            <ul className="class-list">
                                                {cls.methods.map((method, idx) => (
                                                    <li key={idx}><code>{method}</code></li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="class-section">
                                            <strong>Relationships:</strong>
                                            <ul className="class-list">
                                                {cls.relationships.map((rel, idx) => (
                                                    <li key={idx}>{rel}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sequence Diagram */}
                        <div className="diagram-section">
                            <h4>🔄 Sequence Diagrams</h4>
                            <p className="diagram-description">{diagrams.sequence.description}</p>

                            {diagrams.sequence.flows.map((flow) => (
                                <div key={flow.id} className="sequence-card">
                                    <div className="sequence-header">
                                        <span className="sequence-id">{flow.id}</span>
                                        <h5>{flow.name}</h5>
                                    </div>
                                    <p className="sequence-description">{flow.description}</p>
                                    <div className="sequence-steps">
                                        {flow.steps.map((step, idx) => (
                                            <div key={idx} className="sequence-step">
                                                <div className="step-number">{idx + 1}</div>
                                                <div className="step-text">{step.replace(/^\d+\.\s*/, '')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Database View */}
                {step === 'database' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Database Schema</h3>
                            <p>Detailed database structure and relationships</p>
                        </div>

                        <div className="database-info">
                            <h4>Database Type: {databaseSchema.type === 'relational' ? 'Relational (SQL)' : 'NoSQL'}</h4>
                            <p className="db-justification">{databaseSchema.justification}</p>
                        </div>

                        <div className="tables-section">
                            {databaseSchema.tables.map((table) => (
                                <div key={table.id} className="table-card">
                                    <div className="table-header">
                                        <span className="table-id">{table.id}</span>
                                        <h5>{table.name}</h5>
                                    </div>
                                    <p className="table-description">{table.description}</p>

                                    <div className="columns-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Column Name</th>
                                                    <th>Data Type</th>
                                                    <th>Constraints</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.columns.map((col, idx) => (
                                                    <tr key={idx}>
                                                        <td><code>{col.name}</code></td>
                                                        <td><code>{col.type}</code></td>
                                                        <td><span className="constraint-badge">{col.constraints}</span></td>
                                                        <td>{col.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="table-meta">
                                        <div>
                                            <strong>Indexes:</strong> {table.indexes.join(', ')}
                                        </div>
                                        <div>
                                            <strong>Relationships:</strong>
                                            <ul>
                                                {table.relationships.map((rel, idx) => (
                                                    <li key={idx}>{rel}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Complete View */}
                {step === 'complete' && (
                    <div className="step-container completion-screen">
                        <div className="completion-icon">✅</div>
                        <h3>System Design Complete!</h3>
                        <p>Your comprehensive system design has been generated and saved.</p>

                        <div className="completion-summary">
                            <div className="summary-stat">
                                <div className="stat-number">{architecture.layers.length}</div>
                                <div className="stat-label">System Layers</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{components.length}</div>
                                <div className="stat-label">Components</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{databaseSchema.tables.length}</div>
                                <div className="stat-label">Database Tables</div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h4>🎯 What's Next?</h4>
                            <p>Your system design is ready! You can now proceed to the <strong>Development Phase</strong> where the Development Agent will generate code based on this design.</p>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={exportDesign}>
                                📥 Export Design
                            </button>
                            <button className="btn-primary-action" onClick={onClose}>
                                Close & Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {step !== 'complete' && step !== 'loading' && (
                    <div className="step-actions">
                        <button className="btn-secondary" onClick={exportDesign}>
                            📥 Export Design
                        </button>
                        <button className="btn-primary-action" onClick={handleComplete}>
                            Complete & Save Design
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesignAgent
