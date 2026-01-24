import { useState, useEffect } from 'react'
import geminiService from '../services/geminiService'
import { developmentPrompt } from '../utils/promptTemplates'

function DevelopmentAgent({ onClose, onComplete }) {
    const [step, setStep] = useState('loading') // loading, techstack, structure, code, apis, review, complete
    const [design, setDesign] = useState(null)
    const [requirements, setRequirements] = useState(null)
    const [techStack, setTechStack] = useState({
        frontend: [],
        backend: [],
        database: [],
        devops: [],
        testing: []
    })
    const [folderStructure, setFolderStructure] = useState([])
    const [codeSnippets, setCodeSnippets] = useState([])
    const [apiContracts, setApiContracts] = useState([])
    const [bestPractices, setBestPractices] = useState([])

    useEffect(() => {
        // Load design and requirements from previous phases
        const savedDesign = localStorage.getItem('sdlc_design')
        const savedRequirements = localStorage.getItem('sdlc_requirements')

        if (savedDesign) {
            const designData = JSON.parse(savedDesign)
            setDesign(designData)

            if (savedRequirements) {
                const reqData = JSON.parse(savedRequirements)
                setRequirements(reqData)
            }

            generateDevelopmentPlan(designData)
        } else {
            // Create sample data for demo
            const sampleDesign = {
                architecture: { type: 'monolith', layers: [] }
            }
            setDesign(sampleDesign)
            generateDevelopmentPlan(sampleDesign)
        }
    }, [])

    const generateDevelopmentPlan = async (designData) => {
        try {
            // Get requirements from localStorage
            const savedRequirements = localStorage.getItem('sdlc_requirements')
            const requirements = savedRequirements ? JSON.parse(savedRequirements) : {}
            
            // Generate prompt for Gemini
            const prompt = developmentPrompt(requirements, designData)
            
            // Call Gemini AI
            const result = await geminiService.generateJSON(prompt)
            
            // Set all generated development artifacts
            if (result.techStack) {
                setTechStack(result.techStack)
            }
            if (result.folderStructure) {
                setFolderStructure(result.folderStructure)
            }
            if (result.codeSnippets) {
                setCodeSnippets(result.codeSnippets)
            }
            if (result.apiContracts) {
                setApiContracts(result.apiContracts)
            }
            if (result.bestPractices) {
                setBestPractices(result.bestPractices)
            }
            
            setStep('techstack')
        } catch (error) {
            console.error('Error generating development plan:', error)
            alert('AI development generation failed. Using fallback plan. Error: ' + error.message)
            
            // Fallback to basic design on error
            generateTechStack(designData)
            generateFolderStructure(designData)
            generateCodeSnippets(designData)
            generateAPIContracts(designData)
            generateBestPractices(designData)
            setStep('techstack')
        }
    }

    const generateTechStack = (designData) => {
        const isMicroservices = designData.architecture?.type === 'microservices'

        setTechStack({
            frontend: [
                { name: 'React 18+', purpose: 'UI library for building interactive interfaces', why: 'Component-based, large ecosystem, excellent performance' },
                { name: 'Vite', purpose: 'Build tool and dev server', why: 'Fast HMR, optimized builds, modern tooling' },
                { name: 'React Router', purpose: 'Client-side routing', why: 'Standard routing solution for React apps' },
                { name: 'Axios', purpose: 'HTTP client for API calls', why: 'Promise-based, interceptors, easy error handling' },
                { name: 'Zustand / Redux Toolkit', purpose: 'State management', why: 'Simple yet powerful state management' }
            ],
            backend: [
                { name: 'Node.js', purpose: 'JavaScript runtime', why: 'Non-blocking I/O, JavaScript everywhere, huge ecosystem' },
                { name: 'Express.js', purpose: 'Web framework', why: 'Minimalist, flexible, widely adopted' },
                { name: 'TypeScript', purpose: 'Type safety', why: 'Catch errors early, better IDE support, maintainable code' },
                { name: 'JWT', purpose: 'Authentication', why: 'Stateless, secure, industry standard' },
                { name: 'bcrypt', purpose: 'Password hashing', why: 'Secure password storage with salt' }
            ],
            database: [
                { name: 'PostgreSQL', purpose: 'Primary database', why: 'ACID compliant, powerful queries, reliable' },
                { name: 'Prisma', purpose: 'ORM', why: 'Type-safe database access, migrations, great DX' },
                { name: 'Redis', purpose: 'Caching & sessions', why: 'In-memory speed, pub/sub, session storage' }
            ],
            devops: [
                { name: 'Docker', purpose: 'Containerization', why: 'Consistent environments, easy deployment' },
                { name: 'GitHub Actions', purpose: 'CI/CD', why: 'Integrated with Git, free for public repos' },
                { name: 'Nginx', purpose: 'Reverse proxy', why: 'High performance, load balancing' },
                { name: 'PM2', purpose: 'Process manager', why: 'Keep Node.js apps running, clustering' }
            ],
            testing: [
                { name: 'Jest', purpose: 'Unit testing', why: 'Fast, snapshot testing, mocking' },
                { name: 'React Testing Library', purpose: 'Component testing', why: 'User-centric testing approach' },
                { name: 'Supertest', purpose: 'API testing', why: 'Easy HTTP assertions' },
                { name: 'Playwright', purpose: 'E2E testing', why: 'Cross-browser, reliable, fast' }
            ]
        })
    }

    const generateFolderStructure = (designData) => {
        setFolderStructure([
            {
                name: 'project-root',
                type: 'folder',
                description: 'Root directory of the project',
                children: [
                    {
                        name: 'frontend',
                        type: 'folder',
                        description: 'React frontend application',
                        children: [
                            { name: 'public', type: 'folder', description: 'Static assets' },
                            {
                                name: 'src',
                                type: 'folder',
                                description: 'Source code',
                                children: [
                                    { name: 'components', type: 'folder', description: 'Reusable UI components' },
                                    { name: 'pages', type: 'folder', description: 'Page components' },
                                    { name: 'hooks', type: 'folder', description: 'Custom React hooks' },
                                    { name: 'services', type: 'folder', description: 'API service functions' },
                                    { name: 'utils', type: 'folder', description: 'Utility functions' },
                                    { name: 'store', type: 'folder', description: 'State management' },
                                    { name: 'types', type: 'folder', description: 'TypeScript types' },
                                    { name: 'App.jsx', type: 'file', description: 'Main app component' },
                                    { name: 'main.jsx', type: 'file', description: 'Entry point' }
                                ]
                            },
                            { name: 'package.json', type: 'file', description: 'Dependencies' },
                            { name: 'vite.config.js', type: 'file', description: 'Vite configuration' }
                        ]
                    },
                    {
                        name: 'backend',
                        type: 'folder',
                        description: 'Node.js backend API',
                        children: [
                            {
                                name: 'src',
                                type: 'folder',
                                description: 'Source code',
                                children: [
                                    { name: 'controllers', type: 'folder', description: 'Request handlers' },
                                    { name: 'services', type: 'folder', description: 'Business logic' },
                                    { name: 'models', type: 'folder', description: 'Database models' },
                                    { name: 'routes', type: 'folder', description: 'API routes' },
                                    { name: 'middleware', type: 'folder', description: 'Custom middleware' },
                                    { name: 'utils', type: 'folder', description: 'Utility functions' },
                                    { name: 'config', type: 'folder', description: 'Configuration files' },
                                    { name: 'types', type: 'folder', description: 'TypeScript types' },
                                    { name: 'server.js', type: 'file', description: 'Server entry point' }
                                ]
                            },
                            { name: 'prisma', type: 'folder', description: 'Database schema & migrations' },
                            { name: 'tests', type: 'folder', description: 'Test files' },
                            { name: 'package.json', type: 'file', description: 'Dependencies' },
                            { name: '.env.example', type: 'file', description: 'Environment variables template' }
                        ]
                    },
                    { name: 'docker-compose.yml', type: 'file', description: 'Docker services configuration' },
                    { name: 'README.md', type: 'file', description: 'Project documentation' },
                    { name: '.gitignore', type: 'file', description: 'Git ignore rules' }
                ]
            }
        ])
    }

    const generateCodeSnippets = (designData) => {
        setCodeSnippets([
            {
                id: 'CS-001',
                title: 'User Model (Prisma Schema)',
                language: 'prisma',
                description: 'Database schema for User entity',
                code: `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      String   @default("user")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions  Session[]
  profile   Profile?

  @@index([email])
  @@index([role])
}`
            },
            {
                id: 'CS-002',
                title: 'Authentication Controller',
                language: 'javascript',
                description: 'Handles user registration and login',
                code: `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};`
            },
            {
                id: 'CS-003',
                title: 'Authentication Middleware',
                language: 'javascript',
                description: 'Protects routes requiring authentication',
                code: `import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
};`
            },
            {
                id: 'CS-004',
                title: 'API Service (Frontend)',
                language: 'javascript',
                description: 'Axios service for API calls',
                code: `import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

export default api;`
            },
            {
                id: 'CS-005',
                title: 'React Component Example',
                language: 'jsx',
                description: 'Login form component with validation',
                code: `import { useState } from 'react';
import { authService } from '../services/api';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData);
      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({
          ...formData, 
          email: e.target.value
        })}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({
          ...formData, 
          password: e.target.value
        })}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;`
            },
            {
                id: 'CS-006',
                title: 'Environment Configuration',
                language: 'bash',
                description: 'Environment variables template',
                code: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"`
            }
        ])
    }

    const generateAPIContracts = (designData) => {
        setApiContracts([
            {
                id: 'API-001',
                endpoint: 'POST /api/auth/register',
                description: 'Register a new user account',
                request: {
                    body: {
                        email: 'string (required, valid email)',
                        password: 'string (required, min 8 chars)',
                        firstName: 'string (required)',
                        lastName: 'string (required)'
                    }
                },
                response: {
                    success: {
                        status: 201,
                        body: {
                            message: 'User registered successfully',
                            token: 'JWT token string',
                            user: {
                                id: 'uuid',
                                email: 'string',
                                firstName: 'string',
                                lastName: 'string'
                            }
                        }
                    },
                    error: {
                        status: 400,
                        body: {
                            error: 'User already exists'
                        }
                    }
                }
            },
            {
                id: 'API-002',
                endpoint: 'POST /api/auth/login',
                description: 'Authenticate user and get token',
                request: {
                    body: {
                        email: 'string (required)',
                        password: 'string (required)'
                    }
                },
                response: {
                    success: {
                        status: 200,
                        body: {
                            message: 'Login successful',
                            token: 'JWT token string',
                            user: {
                                id: 'uuid',
                                email: 'string',
                                firstName: 'string',
                                lastName: 'string',
                                role: 'string'
                            }
                        }
                    },
                    error: {
                        status: 401,
                        body: {
                            error: 'Invalid credentials'
                        }
                    }
                }
            },
            {
                id: 'API-003',
                endpoint: 'GET /api/users/:id',
                description: 'Get user profile by ID',
                authentication: 'Required (Bearer token)',
                request: {
                    params: {
                        id: 'uuid (user ID)'
                    }
                },
                response: {
                    success: {
                        status: 200,
                        body: {
                            id: 'uuid',
                            email: 'string',
                            firstName: 'string',
                            lastName: 'string',
                            role: 'string',
                            profile: {
                                bio: 'string',
                                avatar: 'string (URL)'
                            }
                        }
                    },
                    error: {
                        status: 404,
                        body: {
                            error: 'User not found'
                        }
                    }
                }
            },
            {
                id: 'API-004',
                endpoint: 'PUT /api/users/:id',
                description: 'Update user profile',
                authentication: 'Required (Bearer token)',
                request: {
                    params: {
                        id: 'uuid (user ID)'
                    },
                    body: {
                        firstName: 'string (optional)',
                        lastName: 'string (optional)',
                        bio: 'string (optional)',
                        avatar: 'string (optional, URL)'
                    }
                },
                response: {
                    success: {
                        status: 200,
                        body: {
                            message: 'Profile updated successfully',
                            user: {
                                id: 'uuid',
                                email: 'string',
                                firstName: 'string',
                                lastName: 'string'
                            }
                        }
                    }
                }
            }
        ])
    }

    const generateBestPractices = (designData) => {
        setBestPractices([
            {
                category: 'Code Organization',
                icon: '📁',
                practices: [
                    'Follow the Single Responsibility Principle - one file, one purpose',
                    'Keep components small and focused (< 200 lines)',
                    'Use meaningful and descriptive names for files and functions',
                    'Group related files together in folders',
                    'Separate business logic from UI components'
                ]
            },
            {
                category: 'Security',
                icon: '🔒',
                practices: [
                    'Never store passwords in plain text - always hash with bcrypt',
                    'Use environment variables for sensitive data',
                    'Implement rate limiting on authentication endpoints',
                    'Validate and sanitize all user inputs',
                    'Use HTTPS in production',
                    'Implement CORS properly',
                    'Keep dependencies updated'
                ]
            },
            {
                category: 'Error Handling',
                icon: '⚠️',
                practices: [
                    'Always use try-catch blocks for async operations',
                    'Return meaningful error messages to clients',
                    'Log errors on the server for debugging',
                    'Don\'t expose sensitive information in error messages',
                    'Use HTTP status codes correctly (200, 400, 401, 404, 500)'
                ]
            },
            {
                category: 'Performance',
                icon: '⚡',
                practices: [
                    'Use database indexes on frequently queried fields',
                    'Implement caching with Redis for expensive operations',
                    'Paginate large data sets',
                    'Use lazy loading for components',
                    'Optimize images and assets',
                    'Minimize bundle size with code splitting'
                ]
            },
            {
                category: 'Testing',
                icon: '🧪',
                practices: [
                    'Write unit tests for business logic',
                    'Test API endpoints with integration tests',
                    'Aim for at least 70% code coverage',
                    'Test edge cases and error scenarios',
                    'Use meaningful test descriptions',
                    'Keep tests independent and isolated'
                ]
            },
            {
                category: 'Git & Version Control',
                icon: '🔀',
                practices: [
                    'Write clear, descriptive commit messages',
                    'Use feature branches for new development',
                    'Review code before merging to main',
                    'Keep commits small and focused',
                    'Use .gitignore to exclude sensitive files',
                    'Tag releases with semantic versioning'
                ]
            }
        ])
    }

    const handleComplete = () => {
        const developmentData = {
            design,
            requirements,
            techStack,
            folderStructure,
            codeSnippets,
            apiContracts,
            bestPractices,
            generatedAt: new Date().toISOString()
        }

        localStorage.setItem('sdlc_development', JSON.stringify(developmentData))
        setStep('complete')

        if (onComplete) {
            onComplete(developmentData)
        }
    }

    const exportDevelopmentPlan = () => {
        const data = {
            techStack,
            folderStructure,
            codeSnippets,
            apiContracts,
            bestPractices
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'development-plan.json'
        a.click()
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        alert('Code copied to clipboard!')
    }

    if (step === 'loading') {
        return (
            <div className="agent-workspace">
                <div className="agent-header">
                    <div className="agent-title-section">
                        <div className="agent-badge">
                            <span className="agent-emoji">💻</span>
                            <span>Development Agent</span>
                        </div>
                        <h2>Generating Development Plan...</h2>
                        <p>Creating code structure and best practices</p>
                    </div>
                </div>
                <div className="agent-content">
                    <div className="loading-screen">
                        <div className="loading-spinner-large"></div>
                        <p>Analyzing design and generating development artifacts...</p>
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
                        <span className="agent-emoji">💻</span>
                        <span>Development Agent</span>
                    </div>
                    <h2>Development Plan & Code Generation</h2>
                    <p>Ready-to-use code snippets and best practices</p>
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
                        className={`design-tab ${step === 'techstack' ? 'active' : ''}`}
                        onClick={() => setStep('techstack')}
                    >
                        🛠️ Tech Stack
                    </button>
                    <button
                        className={`design-tab ${step === 'structure' ? 'active' : ''}`}
                        onClick={() => setStep('structure')}
                    >
                        📁 Structure
                    </button>
                    <button
                        className={`design-tab ${step === 'code' ? 'active' : ''}`}
                        onClick={() => setStep('code')}
                    >
                        💾 Code
                    </button>
                    <button
                        className={`design-tab ${step === 'apis' ? 'active' : ''}`}
                        onClick={() => setStep('apis')}
                    >
                        🔌 APIs
                    </button>
                    <button
                        className={`design-tab ${step === 'review' ? 'active' : ''}`}
                        onClick={() => setStep('review')}
                    >
                        ✅ Best Practices
                    </button>
                </div>

                {/* Tech Stack View */}
                {step === 'techstack' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Recommended Technology Stack</h3>
                            <p>Carefully selected technologies based on your project requirements</p>
                        </div>

                        {Object.entries(techStack).map(([category, technologies]) => (
                            <div key={category} className="tech-category">
                                <h4 className="tech-category-title">
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </h4>
                                <div className="tech-grid">
                                    {technologies.map((tech, idx) => (
                                        <div key={idx} className="tech-card">
                                            <h5>{tech.name}</h5>
                                            <p className="tech-purpose"><strong>Purpose:</strong> {tech.purpose}</p>
                                            <p className="tech-why"><strong>Why:</strong> {tech.why}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Folder Structure View */}
                {step === 'structure' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Project Folder Structure</h3>
                            <p>Organized directory layout for maintainable code</p>
                        </div>

                        <div className="folder-structure">
                            {folderStructure.map((item, idx) => (
                                <FolderTree key={idx} item={item} level={0} />
                            ))}
                        </div>

                        <div className="structure-notes">
                            <h4>📝 Structure Notes:</h4>
                            <ul>
                                <li><strong>Frontend & Backend Separation:</strong> Keeps concerns separated and allows independent deployment</li>
                                <li><strong>src Folder:</strong> Contains all source code, separate from configuration files</li>
                                <li><strong>Component Organization:</strong> Group by feature or type based on project size</li>
                                <li><strong>Tests Folder:</strong> Mirror your src structure in tests for easy navigation</li>
                                <li><strong>Config Files:</strong> Keep configuration at root level for easy access</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Code Snippets View */}
                {step === 'code' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Code Snippets & Examples</h3>
                            <p>Production-ready code following best practices</p>
                        </div>

                        <div className="code-snippets-list">
                            {codeSnippets.map((snippet) => (
                                <div key={snippet.id} className="code-snippet-card">
                                    <div className="snippet-header">
                                        <div>
                                            <span className="snippet-id">{snippet.id}</span>
                                            <h5>{snippet.title}</h5>
                                        </div>
                                        <button
                                            className="btn-copy-code"
                                            onClick={() => copyCode(snippet.code)}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <p className="snippet-description">{snippet.description}</p>
                                    <div className="code-block">
                                        <div className="code-language">{snippet.language}</div>
                                        <pre><code>{snippet.code}</code></pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* API Contracts View */}
                {step === 'apis' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>API Contracts & Documentation</h3>
                            <p>Clear API specifications for frontend-backend communication</p>
                        </div>

                        <div className="api-contracts-list">
                            {apiContracts.map((api) => (
                                <div key={api.id} className="api-contract-card">
                                    <div className="api-header">
                                        <span className="api-id">{api.id}</span>
                                        <div className="api-endpoint">
                                            <span className="http-method">{api.endpoint.split(' ')[0]}</span>
                                            <span className="endpoint-path">{api.endpoint.split(' ')[1]}</span>
                                        </div>
                                    </div>
                                    <p className="api-description">{api.description}</p>

                                    {api.authentication && (
                                        <div className="api-auth">
                                            <strong>🔐 Authentication:</strong> {api.authentication}
                                        </div>
                                    )}

                                    <div className="api-details">
                                        <div className="api-section">
                                            <h6>Request</h6>
                                            <pre><code>{JSON.stringify(api.request, null, 2)}</code></pre>
                                        </div>
                                        <div className="api-section">
                                            <h6>Response</h6>
                                            <div className="response-tabs">
                                                <div className="response-success">
                                                    <strong>✅ Success ({api.response.success.status})</strong>
                                                    <pre><code>{JSON.stringify(api.response.success.body, null, 2)}</code></pre>
                                                </div>
                                                {api.response.error && (
                                                    <div className="response-error">
                                                        <strong>❌ Error ({api.response.error.status})</strong>
                                                        <pre><code>{JSON.stringify(api.response.error.body, null, 2)}</code></pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Best Practices View */}
                {step === 'review' && (
                    <div className="step-container">
                        <div className="step-header">
                            <h3>Development Best Practices</h3>
                            <p>Guidelines for writing clean, maintainable, and secure code</p>
                        </div>

                        <div className="best-practices-grid">
                            {bestPractices.map((category, idx) => (
                                <div key={idx} className="practice-category">
                                    <h4>
                                        <span className="practice-icon">{category.icon}</span>
                                        {category.category}
                                    </h4>
                                    <ul className="practices-list">
                                        {category.practices.map((practice, pIdx) => (
                                            <li key={pIdx}>{practice}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Complete View */}
                {step === 'complete' && (
                    <div className="step-container completion-screen">
                        <div className="completion-icon">✅</div>
                        <h3>Development Plan Complete!</h3>
                        <p>Your comprehensive development guide is ready.</p>

                        <div className="completion-summary">
                            <div className="summary-stat">
                                <div className="stat-number">{Object.values(techStack).flat().length}</div>
                                <div className="stat-label">Technologies</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{codeSnippets.length}</div>
                                <div className="stat-label">Code Snippets</div>
                            </div>
                            <div className="summary-stat">
                                <div className="stat-number">{apiContracts.length}</div>
                                <div className="stat-label">API Endpoints</div>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h4>🎯 What's Next?</h4>
                            <p>Your development plan is ready! You can now proceed to the <strong>Testing Phase</strong> where the Testing Agent will help you create comprehensive test cases and quality assurance strategies.</p>
                        </div>

                        <div className="step-actions">
                            <button className="btn-secondary" onClick={exportDevelopmentPlan}>
                                📥 Export Development Plan
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
                        <button className="btn-secondary" onClick={exportDevelopmentPlan}>
                            📥 Export Plan
                        </button>
                        <button className="btn-primary-action" onClick={handleComplete}>
                            Complete & Save
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

// Folder Tree Component
function FolderTree({ item, level }) {
    const [isOpen, setIsOpen] = useState(level < 2)

    return (
        <div className="folder-item" style={{ marginLeft: `${level * 20}px` }}>
            <div className="folder-header" onClick={() => item.children && setIsOpen(!isOpen)}>
                {item.children && (
                    <span className="folder-toggle">{isOpen ? '📂' : '📁'}</span>
                )}
                {!item.children && <span className="file-icon">📄</span>}
                <span className="item-name">{item.name}</span>
                <span className="item-description">{item.description}</span>
            </div>
            {isOpen && item.children && (
                <div className="folder-children">
                    {item.children.map((child, idx) => (
                        <FolderTree key={idx} item={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default DevelopmentAgent
