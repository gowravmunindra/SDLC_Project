const Project = require('../models/Project');
const mistralService = require('../services/mistralService');

// ─────────────────────────────────────────────────────────────────────────────
// PINNED DEPENDENCY CATALOGUE  (verified stable as of early 2025)
// ─────────────────────────────────────────────────────────────────────────────
const PINNED_DEPS = {
    frontend: {
        deps: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.22.0",
            "axios": "^1.6.7"
        },
        devDeps: {
            "vite": "^5.1.4",
            "@vitejs/plugin-react": "^4.2.1"
        }
    },
    backend: {
        deps: {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "dotenv": "^16.4.5",
            "mongoose": "^8.2.1",
            "bcryptjs": "^2.4.3",
            "jsonwebtoken": "^9.0.2",
            "express-validator": "^7.0.1",
            "morgan": "^1.10.0",
            "helmet": "^7.1.0"
        },
        devDeps: {
            "nodemon": "^3.1.0"
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL CODE QUALITY RULES
// Injected into every single-file generation prompt.
// ─────────────────────────────────────────────────────────────────────────────
const QUALITY_RULES = `
══════════════════════ ABSOLUTE CODE QUALITY RULES ══════════════════════

RULE A — NO PLACEHOLDERS:
  FORBIDDEN in any file you generate:
  • // TODO: implement
  • // Add your code here
  • throw new Error('Not implemented')
  • Empty function bodies  →  {}  without logic inside
  • return null  as a stub for unimplemented functionality
  Every function, handler, and component must be fully implemented.

RULE B — IMPORT INTEGRITY:
  Before writing an import, check that the imported file exists in the
  project file list provided. Use ONLY relative paths at the correct depth.
  Example: from src/components/Header.jsx, import '../App.css' (not './App.css').

RULE C — OUTPUT FORMAT:
  Output ONLY the raw source code for this file.
  No markdown code fences (no \`\`\`), no explanatory text, no comments
  outside of the actual code. The output is piped directly into the file.

RULE D — DEPENDENCY LOCK:
  Frontend: react@^18.2.0, react-dom@^18.2.0, react-router-dom@^6.22.0,
            axios@^1.6.7, vite@^5.1.4, @vitejs/plugin-react@^4.2.1
  Backend:  express@^4.18.2, mongoose@^8.2.1, bcryptjs@^2.4.3,
            jsonwebtoken@^9.0.2, dotenv@^16.4.5, helmet@^7.1.0,
            morgan@^1.10.0, cors@^2.8.5, nodemon@^3.1.0 (dev only)
  No other packages. No version changes.

RULE E — WORKING CODE ONLY:
  The code you output must be syntactically valid and logically correct.
  It will be executed without any modification by the user.

═════════════════════════════════════════════════════════════════════════
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const flattenStructure = (node, basePath = '') => {
    const paths = [];
    const cur = basePath
        ? (node.name === 'root' ? '' : `${basePath}/${node.name}`)
        : (node.name === 'root' ? '' : node.name);

    if (node.type === 'file' && cur) {
        paths.push(cur);
    } else if (node.children) {
        node.children.forEach(child =>
            paths.push(...flattenStructure(child, node.name === 'root' ? '' : cur))
        );
    }
    return paths;
};

const getDiagramSummary = (diagrams) => {
    if (!diagrams) return null;
    const parts = Object.entries(diagrams)
        .map(([type, data]) => {
            const code = typeof data === 'string' ? data : (data?.code || '');
            return code.length > 10 ? `[${type}]\n${code.substring(0, 600)}` : '';
        })
        .filter(Boolean);
    return parts.length ? parts.join('\n\n') : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// FILE ROLE DETECTION  — determines which prompt template to use
// ─────────────────────────────────────────────────────────────────────────────
const detectFileRole = (filePath) => {
    const p = filePath.toLowerCase();
    if (p.endsWith('readme.md'))                               return 'readme';
    if (p.endsWith('package.json'))                            return 'package';
    if (p.endsWith('vite.config.js') || p.endsWith('vite.config.ts')) return 'vite-config';
    if (p.endsWith('index.html'))                              return 'index-html';
    if (p.includes('/main.jsx') || p.includes('/main.tsx'))    return 'react-entry';
    if (p.includes('app.jsx') || p.includes('app.tsx'))        return 'app-root';
    if (p.endsWith('app.css') || p.includes('/index.css'))     return 'global-css';
    if (p.endsWith('.css') || p.endsWith('.scss'))             return 'component-css';
    if (p.endsWith('.env.example'))                            return 'env-example';
    if (p.includes('/model') || p.endsWith('schema.js'))       return 'mongoose-model';
    if (p.includes('/route') || p.includes('/router'))         return 'express-route';
    if (p.includes('/controller'))                             return 'express-controller';
    if (p.includes('/middleware'))                             return 'middleware';
    if (p.includes('/services/') && !p.endsWith('.jsx'))       return 'service-layer';
    if (p.includes('db.js') || p.includes('database.js'))     return 'db-config';
    if (p.includes('generatetoken') || p.includes('jwthelper')) return 'jwt-util';
    if (p.endsWith('server.js') || p.endsWith('app.js'))      return 'express-server';
    if (p.endsWith('.jsx') || p.endsWith('.tsx'))              return 'react-component';
    if (p.includes('/hook') || p.startsWith('use'))            return 'custom-hook';
    if (p.endsWith('.js') && !p.includes('config'))            return 'utility';
    return 'general';
};

// ─────────────────────────────────────────────────────────────────────────────
// PER-ROLE PROMPT BUILDERS
// Each returns a focused, expert-level instruction block for the AI.
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_PROMPTS = {

    readme: (ctx) => `
Generate a PROFESSIONAL README.md for the project "${ctx.projectName}".

Description: ${ctx.projectDesc}

The README must contain ALL of the following sections in order:
1. # ${ctx.projectName}
   One-paragraph project overview (what it does, who it's for, key features).

2. ## 🚀 Tech Stack
   Table with: Component | Technology | Version
   (Frontend: React 18 + Vite 5 | Backend: Node.js + Express 4 | DB: MongoDB 7 + Mongoose 8)

3. ## 📋 Prerequisites
   - Node.js v18+ (https://nodejs.org)
   - npm v9+ (included with Node.js)
   - MongoDB Atlas (cloud) or local MongoDB installation

4. ## ⚡ Quick Start

   ### Backend Setup
   \`\`\`bash
   cd backend
   npm install
   cp .env.example .env
   # Open .env and fill in your MongoDB URI and JWT secret
   npm run dev
   # ✅ Backend running on http://localhost:5000
   \`\`\`

   ### Frontend Setup (open a NEW terminal)
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   # ✅ Frontend running on http://localhost:5173
   \`\`\`

5. ## 🔑 Environment Variables
   Table: Variable | Required | Description | Example Value
   List every variable from backend/.env.example.

6. ## 📂 Project Structure
   ASCII tree of key folders with one-line descriptions.

7. ## 🌐 API Endpoints
   Table: Method | Endpoint | Auth | Description
   List every API route in the backend.

8. ## 🐛 Troubleshooting
   At least 5 entries in this format:
   **Problem**: Error message or symptom
   **Fix**: Exact steps to resolve it

   Must include:
   - "'Module not found' errors"
   - "Cannot connect to MongoDB"
   - "Port already in use"
   - "Blank page in browser"
   - "JWT errors / 401 Unauthorized"

9. ## 📝 License
   MIT

Write in clean Markdown. Make it clear enough for a first-time developer.`,

    package: (ctx) => {
        const isFrontend = ctx.filePath.includes('frontend') || !ctx.filePath.includes('backend');
        if (isFrontend) {
            return JSON.stringify({
                name: ctx.slug,
                version: "1.0.0",
                type: "module",
                scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
                dependencies: PINNED_DEPS.frontend.deps,
                devDependencies: PINNED_DEPS.frontend.devDeps
            }, null, 2);
        }
        return JSON.stringify({
            name: `${ctx.slug}-backend`,
            version: "1.0.0",
            scripts: { start: "node server.js", dev: "nodemon server.js" },
            dependencies: PINNED_DEPS.backend.deps,
            devDependencies: PINNED_DEPS.backend.devDeps,
            engines: { node: ">=18.0.0" }
        }, null, 2);
    },

    'vite-config': (ctx) => `
Generate the complete vite.config.js file.

Requirements:
- Import: import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
- plugins: [react()]
- server.port: 5173
- server.proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
- Export: export default defineConfig({ ... })

Output only the vite.config.js file content. No markdown fences.`,

    'index-html': (ctx) => `
Generate a complete, valid index.html for a React + Vite app named "${ctx.projectName}".

Requirements:
- <!DOCTYPE html> + <html lang="en">
- <head>: charset UTF-8, viewport, title "${ctx.projectName}", optional favicon meta
- <body>: ONLY <div id="root"></div> and <script type="module" src="/src/main.jsx"></script>
- No inline styles, no external CDN scripts (Vite handles bundling)
- Clean, minimal, correct HTML5

Output only the HTML content. No markdown fences.`,

    'react-entry': (ctx) => `
Generate the React entry point file: ${ctx.filePath}

Requirements:
- Import React from 'react'
- Import ReactDOM from 'react-dom/client'
- Import App from './App'  (or './App.jsx' — use the correct relative path)
- Import the main CSS file if it exists in the project (check: ${ctx.cssFile || './App.css'})
- Use: ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
- DO NOT import BrowserRouter here — it belongs in App.jsx

Output only the JSX file content. No markdown fences.`,

    'app-root': (ctx) => `
Generate the root App.jsx component for "${ctx.projectName}".

Description: ${ctx.projectDesc}

Requirements:
- Import BrowserRouter, Routes, Route from 'react-router-dom'
- Import Navbar from './components/Navbar' (or the correct relative path)
- Import each page component and map to a Route
- Define at least 3 routes: '/', '/[feature]', '*' (404)
- Import App.css for global styles
- The component must render a real, structured layout:
  <BrowserRouter><Navbar /><main><Routes>...</Routes></main></BrowserRouter>

All file paths referenced in the project:
${ctx.allPaths.join('\n')}

Output only the JSX file content. No markdown fences.`,

    'global-css': (ctx) => `
Generate the global CSS file: ${ctx.filePath}
This is the main stylesheet for "${ctx.projectName}".

Requirements:
:root {
  /* Color palette — use a professional, modern palette (not plain red/green/blue) */
  --primary: #4F46E5;        /* Indigo */
  --primary-hover: #4338CA;
  --secondary: #06B6D4;      /* Cyan */
  --background: #0F172A;     /* Dark slate */
  --surface: #1E293B;        /* Slightly lighter */
  --surface-2: #334155;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --border: rgba(148, 163, 184, 0.15);
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.4);
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  background: var(--background);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

/* Add reusable utility classes: .container, .btn, .btn-primary, .btn-secondary,
   .card, .badge, .input, .form-group, .loading-spinner, .error-message    */

/* Add media query for mobile (max-width: 768px) */

Output only the CSS content. No markdown fences.`,

    'component-css': (ctx) => `
Generate the CSS stylesheet for the React component: ${ctx.componentName || ctx.filePath}

Context: This is part of "${ctx.projectName}" — ${ctx.projectDesc}

Requirements:
- Use CSS custom properties from :root (var(--primary), var(--surface), etc.) — do NOT redefine them
- Use Flexbox or CSS Grid for layout
- Include hover states with transitions: transition: var(--transition)
- Include responsive breakpoint at max-width: 768px
- BEM-like naming: .navbar { } .navbar__logo { } .navbar__links { } .navbar--scrolled { }
- Make it look polished and professional (spacing, colors, typography)

Output only the CSS content. No markdown fences.`,

    'react-component': (ctx) => `
Generate a COMPLETE, FULLY FUNCTIONAL React component: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Component role (infer from filename and context):
${ctx.fileDesc || 'Implement based on filename'}

Requirements:
1. Use modern React hooks where appropriate (useState, useEffect, useCallback, useMemo)
2. Import and use CSS from the corresponding .css file (same name, .css extension)
3. The component must render REAL, MEANINGFUL UI — not just a div with "Component here"
4. Include real interaction logic:
   - Buttons with onClick handlers that DO something
   - Forms with controlled inputs and onSubmit handlers
   - Conditional rendering (loading state, error state, empty state, data state)
5. Use semantic HTML: <header>, <nav>, <main>, <section>, <article>, <footer>
6. If fetching data: import api from '../services/api' (or correct path) and handle
   loading/error/data states properly
7. Export as: export default function ComponentName() { ... }

All files in this project (for import reference):
${ctx.allPaths.join('\n')}

Output only the JSX file content. No markdown fences.`,

    'custom-hook': (ctx) => `
Generate a custom React hook: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Requirements:
- Hook name must start with 'use' (from filename: ${ctx.hookName || ctx.filePath})
- Uses useState and useEffect appropriately
- Handles async data fetching if relevant (with loading, error, data state variables)
- Implements cleanup in useEffect return function to prevent memory leaks
- Returns an object with all relevant state and action functions
- Example pattern:
  export function use[Name]() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => { ... }, []);
    return { data, loading, error, refresh: fetchData };
  }

All files in project:
${ctx.allPaths.join('\n')}

Output only the JS file content. No markdown fences.`,

    'express-server': (ctx) => `
Generate the main Express server entry point: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Requirements (in exact order):
1. require('dotenv').config();                     // MUST be first line
2. const express = require('express');
3. const cors = require('cors');
4. const helmet = require('helmet');
5. const morgan = require('morgan');
6. const connectDB = require('./src/config/db');  // or correct path
7. Import all route files from ./src/routes/

8. const app = express();
9. Middleware: app.use(helmet()); app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
   app.use(morgan('dev')); app.use(express.json()); app.use(express.urlencoded({ extended: true }));
10. Mount all routes under /api/v1/: app.use('/api/v1/auth', authRoutes); etc.
11. Global 404 handler
12. Import and use errorHandler middleware
13. connectDB().then(() => { app.listen(PORT, ...) })

All files in this project:
${ctx.allPaths.join('\n')}

Output only the JS file content. No markdown fences.`,

    'db-config': () => `
Generate src/config/db.js — a production-ready Mongoose connection module.

Requirements:
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 handles connection options automatically
    });
    console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`❌ MongoDB Connection Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;

Output only the JS file content. No markdown fences.`,

    'mongoose-model': (ctx) => `
Generate a Mongoose model file: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Requirements:
1. const mongoose = require('mongoose');
2. Define a Schema with ALL fields that make sense for this model
   (infer from filename and project description)
3. Each field: correct type, required flag, trim where relevant, min/max if numeric
4. Include password field for User model (type: String, required: true, select: false)
5. timestamps: true
6. Pre-save hook for password hashing (User model only):
   schema.pre('save', async function(next) { if (!this.isModified('password')) return next();
   this.password = await bcrypt.hash(this.password, 12); next(); });
7. Instance method for User: schema.methods.matchPassword = async function(entered) {
   return await bcrypt.compare(entered, this.password); };
8. Add indexes for frequently queried fields
9. module.exports = mongoose.model('ModelName', schema);

All files in project: ${ctx.allPaths.join('\n')}

Output only the JS file content. No markdown fences.`,

    'express-route': (ctx) => `
Generate a complete Express Router: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Requirements:
1. const express = require('express');
   const router = express.Router();
2. Import the matching controller (infer path from this file's location)
3. Import auth middleware if needed (for protected routes)
4. Define ALL CRUD routes appropriate for this resource:
   - GET /          list all
   - GET /:id       get single
   - POST /         create
   - PUT /:id       update
   - DELETE /:id    delete
   Apply protect middleware to routes that require authentication.
5. module.exports = router;

All files: ${ctx.allPaths.join('\n')}

Output only the JS file content. No markdown fences.`,

    'express-controller': (ctx) => `
Generate a complete Express controller: ${ctx.filePath}

Project: "${ctx.projectName}" — ${ctx.projectDesc}

Requirements:
1. Import the corresponding Mongoose model (infer from filename)
2. Export NAMED async functions for each route action
3. Every function:
   - Wrapped in try/catch
   - Returns { success: true/false, data: ..., message: "..." }
   - Uses correct HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request),
     401 (Unauthorized), 404 (Not Found), 500 (Server Error)
4. For list endpoints: support optional pagination with page/limit query params
5. For create/update: validate required fields before DB operation
6. Meaningful console.error on catch blocks
7. NO TODO comments, NO stub implementations — every function fully implemented

All files: ${ctx.allPaths.join('\n')}

Output only the JS file content. No markdown fences.`,

    middleware: (ctx) => {
        const p = ctx.filePath.toLowerCase();
        if (p.includes('auth')) return `
Generate the JWT authentication middleware: ${ctx.filePath}

Requirements:
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // adjust path as needed

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };

Output only the JS file content. No markdown fences.`;

        if (p.includes('error')) return `
Generate a global error handler middleware: ${ctx.filePath}

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

Output only the JS file content. No markdown fences.`;

        return `Generate a complete Express middleware for: ${ctx.filePath}
Implement appropriate logic based on the filename. No TODOs, no stubs.
Output only the JS file content. No markdown fences.`;
    },

    'service-layer': (ctx) => `
Generate a service/API module: ${ctx.filePath}

${ctx.filePath.includes('api.js') && ctx.filePath.includes('frontend')
    ? `This is the frontend Axios service. Requirements:
import axios from 'axios';

const API = axios.create({
  baseURL: '/api/v1',   // Proxied by Vite to http://localhost:5000/api/v1
  timeout: 10000,
});

// Request interceptor: attach JWT token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

export default API;`
    : `Implement a service module with clean, well-organized functions.
Follow the single-responsibility principle. No TODO stubs.`}

Output only the JS/JSX file content. No markdown fences.`,

    'jwt-util': () => `
Generate a JWT utility helper: src/utils/generateToken.js

const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;

Output only the JS file content. No markdown fences.`,

    'env-example': (ctx) => `
Generate the .env.example file for the backend.

Every variable must have:
1. The variable name
2. An inline comment explaining what it is and any constraints
3. A safe placeholder value (never a real secret)

Required variables:
# Server Configuration
PORT=5000                                          # Port number the Express server listens on

# Database
MONGODB_URI=mongodb://localhost:27017/${ctx.slug}  # MongoDB connection string (local or Atlas)
# For MongoDB Atlas use: mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/${ctx.slug}

# Authentication
JWT_SECRET=replace-with-minimum-32-char-random-string  # Secret key for signing JWT tokens
JWT_EXPIRE=7d                                           # Token expiry: 7d / 24h / 30m

# Application
NODE_ENV=development                               # 'development' or 'production'
CLIENT_URL=http://localhost:5173                   # Frontend URL for CORS

Output only the .env.example file content. No markdown fences.`,

    general: (ctx) => `
Generate complete, working source code for: ${ctx.filePath}
Project: "${ctx.projectName}" — ${ctx.projectDesc}
Purpose: ${ctx.fileDesc || 'Implement based on role and filename'}

Requirements:
- Fully implemented — NO TODO, NO stubs, NO placeholders
- Follow the role implied by the filename and directory
- All imports must point to files that exist in this project:
  ${ctx.allPaths.join('\n  ')}
- Include proper error handling
- Use the project's established patterns and architecture

Output only the file content. No markdown fences.`
};

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER  — composes the final prompt for each file
// ─────────────────────────────────────────────────────────────────────────────
function buildFilePrompt(role, ctx) {
    const roleBuilder = ROLE_PROMPTS[role] || ROLE_PROMPTS.general;
    const roleInstructions = typeof roleBuilder === 'function'
        ? roleBuilder(ctx)
        : roleBuilder;

    return `You are a senior software developer generating ${ctx.qualityLevel} code for a professional project.

━━━━━━━━━━━━━━━━━━━━━━━━━
  FILE TARGET
━━━━━━━━━━━━━━━━━━━━━━━━━
File:    ${ctx.filePath}
Project: ${ctx.projectName}
SELECTED TECH STACK: ${ctx.stackDesc}
${ctx.diagramSummary ? `\nDESIGN CONTEXT (UML):\n${ctx.diagramSummary}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━
  FILE-SPECIFIC INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━
${roleInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━
  QUALITY RULES (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━
${QUALITY_RULES}

Now generate the complete content for ${ctx.filePath}:`;
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const verifyApiKey = async (req, res) => {
    try {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey || apiKey.trim() === '' || apiKey === 'your_mistral_key_here') {
            return res.status(404).json({
                success: false,
                message: 'MISTRAL_API_KEY is not configured in backend/.env. Please add your Mistral API key.'
            });
        }
        res.json({ success: true, message: 'API Key Verified.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Tech Stack Suggestions ───────────────────────────────────────────────────
const generateTechStack = async (req, res) => {
    try {
        const { projectId } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const reqList = project.requirements?.functionalRequirements?.slice(0, 8).join('; ') || 'N/A';

        const prompt = `You are a senior software architect. Recommend TWO distinct technology stacks for this project.

PROJECT: ${project.name}
DESCRIPTION: ${project.description || 'A modern web application'}
KEY REQUIREMENTS: ${reqList}

CONSTRAINTS:
- Only recommend libraries/frameworks that are well-maintained and stable as of 2024-2025.
- Recommended stack must use: React 18 + Vite 5 (frontend), Node.js + Express 4 (backend), MongoDB + Mongoose 8 (database).
- Alternative stack may vary (e.g., different database or frontend), but still modern and compatible.
- Both stacks must support JWT-based authentication.

Respond with ONLY this JSON (no markdown):
{
  "options": [
    {
      "name": "Recommended Stack",
      "type": "Full Stack",
      "frontend": "React 18 + Vite 5",
      "backend": "Node.js 18 + Express 4",
      "database": "MongoDB 7 + Mongoose 8",
      "auth": "JWT (jsonwebtoken 9) + bcryptjs 2",
      "deployment": "Vite build → Vercel | Express → Railway",
      "reasoning": "2-3 sentences explaining why this is an excellent fit for ${project.name}"
    },
    {
      "name": "Alternative Stack",
      "type": "Full Stack",
      "frontend": "...",
      "backend": "...",
      "database": "...",
      "auth": "...",
      "deployment": "...",
      "reasoning": "..."
    }
  ]
}`;

        const result = await mistralService.generateJSON(prompt);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[Dev] Tech Stack Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Folder Structure ─────────────────────────────────────────────────────────
const generateStructure = async (req, res) => {
    try {
        const { projectId, techStack, generateType, isRegenerating } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const slug = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const diagramSummary = !isRegenerating && project.design?.diagrams
            ? getDiagramSummary(project.design.diagrams)
            : null;

        const typeGuide = {
            Both: `Generate BOTH frontend/ and backend/ directories. Total: 20–28 files.`,
            Frontend: `Generate frontend/ directory ONLY. Do NOT create any backend files. Total: 10–15 files.`,
            Backend: `Generate backend/ directory ONLY. Do NOT create any frontend files. Total: 12–18 files.`
        }[generateType] || `Generate both frontend/ and backend/ directories. Total: 20–28 files.`;

        const prompt = `You are a senior software architect designing a professional project structure.

PROJECT: ${project.name}
DESCRIPTION: ${project.description || 'A modern web application'}
TECH STACK: ${techStack?.frontend || 'React 18 + Vite 5'} | ${techStack?.backend || 'Node.js + Express 4'} | ${techStack?.database || 'MongoDB + Mongoose 8'}
SCOPE: ${typeGuide}
${diagramSummary ? `\nUML DESIGN REFERENCE:\n${diagramSummary}` : ''}

STRUCTURE REQUIREMENTS:

${generateType !== 'Backend' ? `
FRONTEND (Vite + React conventions):
  frontend/
    index.html              (Vite HTML entry)
    vite.config.js          (React plugin + /api proxy)
    package.json            (pinned deps)
    .gitignore
    src/
      main.jsx              (ReactDOM entry)
      App.jsx               (Router + layout)
      App.css               (global styles)
      components/           (2-4 reusable UI components specific to ${project.name})
      pages/                (2-3 page components: Home, [Feature], NotFound)
      services/
        api.js              (Axios instance)
      hooks/                (1-2 custom hooks)
      utils/
        helpers.js` : ''}

${generateType !== 'Frontend' ? `
BACKEND (Express MVC conventions):
  backend/
    server.js               (Express entry + DB connect)
    package.json            (pinned deps)
    .env.example            (all env vars)
    .gitignore
    src/
      config/
        db.js               (Mongoose connect)
      middleware/
        auth.js             (JWT protect)
        errorHandler.js     (global error handler)
      models/
        User.js             (user schema)
        [DomainName].js     (domain-specific model for ${project.name})
      routes/
        authRoutes.js       (POST /register, POST /login)
        [domain]Routes.js   (CRUD for domain resource)
      controllers/
        authController.js   (register, login, getMe)
        [domain]Controller.js (CRUD handlers)
      utils/
        generateToken.js    (JWT sign helper)` : ''}

${generateType === 'Both' ? '\nREADME.md at root (covers both frontend and backend)' : 'README.md at root'}

RULES:
- Every file must serve a REAL purpose — no placeholder or empty filler files.
- Replace [DomainName] and [domain] with actual names relevant to "${project.name}".
- File descriptions must explain what each file does in 1 sentence.

Respond ONLY with this JSON (no markdown fences):
{
  "structure": {
    "name": "${slug}",
    "type": "folder",
    "children": [
      { "name": "README.md", "type": "file", "description": "Project setup and run guide" },
      {
        "name": "frontend",
        "type": "folder",
        "children": [
          { "name": "index.html", "type": "file", "description": "Vite HTML entry point" },
          ...
        ]
      },
      {
        "name": "backend",
        "type": "folder",
        "children": [
          { "name": "server.js", "type": "file", "description": "Express app entry point" },
          ...
        ]
      }
    ]
  }
}`;

        const result = await mistralService.generateJSON(prompt);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[Dev] Structure Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Single File Code Generation ──────────────────────────────────────────────
const generateCode = async (req, res) => {
    try {
        const {
            projectId,
            filePath,
            fileDescription,
            techStack,
            codeType,
            diagrams,
            fullStructure,
            isRegenerating
        } = req.body;

        const project = await Project.findById(projectId).lean();
        const projectName = project?.name || 'My Project';
        const projectDesc = project?.description || 'A modern web application';
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const allPaths = fullStructure ? flattenStructure(fullStructure) : [];
        const diagramSummary = !isRegenerating && diagrams
            ? getDiagramSummary(diagrams)
            : null;

        const role = detectFileRole(filePath);

        // ── Deterministic output for package.json (bypass LLM entirely) ────────
        if (role === 'package') {
            const isFrontend = filePath.includes('frontend') || !filePath.includes('backend');
            const code = isFrontend
                ? JSON.stringify({
                    name: slug,
                    version: '1.0.0',
                    type: 'module',
                    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
                    dependencies: PINNED_DEPS.frontend.deps,
                    devDependencies: PINNED_DEPS.frontend.devDeps
                }, null, 2)
                : JSON.stringify({
                    name: `${slug}-backend`,
                    version: '1.0.0',
                    scripts: { start: 'node server.js', dev: 'nodemon server.js' },
                    dependencies: PINNED_DEPS.backend.deps,
                    devDependencies: PINNED_DEPS.backend.devDeps,
                    engines: { node: '>=18.0.0' }
                }, null, 2);

            return res.json({ success: true, filePath, code });
        }

        // ── Build context object for prompt builders ───────────────────────────
        const cssFiles = allPaths.filter(p => p.endsWith('.css'));
        const correspondingCss = cssFiles.find(p =>
            p.replace('.css', '') === filePath.replace('.jsx', '').replace('.tsx', '')
        );
        const componentName = filePath.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');
        const hookName = filePath.split('/').pop().replace(/\.(js|ts)$/, '');

        const ctx = {
            filePath,
            fileDesc: fileDescription || '',
            projectName,
            projectDesc,
            slug,
            allPaths,
            diagramSummary,
            cssFile: correspondingCss || './App.css',
            componentName,
            hookName,
            stackDesc: `${techStack?.frontend || 'React 18 + Vite 5'} | ${techStack?.backend || 'Node.js + Express 4'} | ${techStack?.database || 'MongoDB + Mongoose 8'}`,
            qualityLevel: codeType === 'Production Ready'
                ? 'production-grade (full error handling, input validation, security, logging)'
                : 'clean, readable, functional starter-template'
        };

        const prompt = buildFilePrompt(role, ctx);
        let code = await mistralService.generate(prompt);

        // Strip any accidental markdown fences
        if (code.includes('```')) {
            code = code
                .replace(/^```[a-z]*\s*/im, '')
                .replace(/\n```\s*$/im, '')
                .trim();
        }

        res.json({ success: true, filePath, code });
    } catch (error) {
        console.error('[Dev] Code Generation Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Save Development Data ────────────────────────────────────────────────────
const saveDevelopment = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { techStack, structure, codeFiles, completedAt } = req.body;

        const project = await Project.findByIdAndUpdate(
            projectId,
            { $set: { development: { techStack, structure, codeFiles, completedAt } } },
            { new: true }
        );

        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.json({ success: true, message: 'Development data saved.' });
    } catch (error) {
        console.error('[Dev] Save Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    verifyApiKey,
    generateTechStack,
    generateStructure,
    generateCode,
    saveDevelopment
};
