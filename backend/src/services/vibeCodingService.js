const mistralService = require('./mistralService');

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT PINNED DEPENDENCIES  (fallback when no design-phase stack is set)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PINNED = {
    frontend: {
        dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.22.0",
            "axios": "^1.6.7"
        },
        devDependencies: {
            "vite": "^5.1.4",
            "@vitejs/plugin-react": "^4.2.1"
        },
        scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" }
    },
    backend: {
        dependencies: {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "dotenv": "^16.4.5",
            "mongoose": "^8.2.1",
            "bcryptjs": "^2.4.3",
            "jsonwebtoken": "^9.0.2",
            "helmet": "^7.1.0",
            "morgan": "^1.10.0",
            "express-validator": "^7.0.1"
        },
        devDependencies: { "nodemon": "^3.1.0" },
        scripts: { "start": "node server.js", "dev": "nodemon server.js" }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// TECH STACK NORMALIZER
// Maps common names from the Design Phase to concrete dependency blocks.
// ─────────────────────────────────────────────────────────────────────────────
function resolveStackDependencies(selectedStack) {
    if (!selectedStack) return null;

    const fe = (selectedStack.frontend || '').toLowerCase();
    const be = (selectedStack.backend || '').toLowerCase();
    const db = (selectedStack.database || '').toLowerCase();

    const frontendDeps = {};
    const frontendDevDeps = {};
    const backendDeps = {};
    const backendDevDeps = { "nodemon": "^3.1.0" };

    // ── Frontend deps ────────────────────────────────────────────────────────
    if (fe.includes('react') || fe.includes('vite')) {
        frontendDeps["react"] = "^18.2.0";
        frontendDeps["react-dom"] = "^18.2.0";
        frontendDeps["react-router-dom"] = "^6.22.0";
        frontendDeps["axios"] = "^1.6.7";
        frontendDevDeps["vite"] = "^5.1.4";
        frontendDevDeps["@vitejs/plugin-react"] = "^4.2.1";
    } else if (fe.includes('next')) {
        frontendDeps["next"] = "^14.1.0";
        frontendDeps["react"] = "^18.2.0";
        frontendDeps["react-dom"] = "^18.2.0";
        frontendDeps["axios"] = "^1.6.7";
    } else if (fe.includes('vue')) {
        frontendDeps["vue"] = "^3.4.0";
        frontendDeps["vue-router"] = "^4.2.5";
        frontendDeps["axios"] = "^1.6.7";
        frontendDevDeps["vite"] = "^5.1.4";
        frontendDevDeps["@vitejs/plugin-vue"] = "^5.0.4";
    } else if (fe.includes('angular')) {
        frontendDeps["@angular/core"] = "^17.0.0";
        frontendDeps["@angular/router"] = "^17.0.0";
        frontendDeps["@angular/common"] = "^17.0.0";
        frontendDeps["rxjs"] = "^7.8.0";
    } else if (fe.includes('svelte')) {
        frontendDevDeps["svelte"] = "^4.2.0";
        frontendDevDeps["@sveltejs/vite-plugin-svelte"] = "^3.0.0";
        frontendDevDeps["vite"] = "^5.1.4";
    } else {
        // Generic HTML/CSS/JS — no framework
        frontendDeps["axios"] = "^1.6.7";
    }

    // ── Backend deps ─────────────────────────────────────────────────────────
    if (be.includes('express') || be.includes('node')) {
        backendDeps["express"] = "^4.18.2";
        backendDeps["cors"] = "^2.8.5";
        backendDeps["dotenv"] = "^16.4.5";
        backendDeps["bcryptjs"] = "^2.4.3";
        backendDeps["jsonwebtoken"] = "^9.0.2";
        backendDeps["helmet"] = "^7.1.0";
        backendDeps["morgan"] = "^1.10.0";
        backendDeps["express-validator"] = "^7.0.1";
    } else if (be.includes('fastify')) {
        backendDeps["fastify"] = "^4.26.0";
        backendDeps["@fastify/cors"] = "^9.0.0";
        backendDeps["@fastify/jwt"] = "^8.0.0";
        backendDeps["dotenv"] = "^16.4.5";
    } else if (be.includes('django') || be.includes('python')) {
        // Python stack — indicate to AI
        backendDeps["django"] = "4.2";
        backendDeps["djangorestframework"] = "3.15";
    } else {
        // Default to Express
        backendDeps["express"] = "^4.18.2";
        backendDeps["cors"] = "^2.8.5";
        backendDeps["dotenv"] = "^16.4.5";
        backendDeps["bcryptjs"] = "^2.4.3";
        backendDeps["jsonwebtoken"] = "^9.0.2";
        backendDeps["helmet"] = "^7.1.0";
        backendDeps["morgan"] = "^1.10.0";
    }

    // ── Database deps ────────────────────────────────────────────────────────
    if (db.includes('mongo')) {
        backendDeps["mongoose"] = "^8.2.1";
    } else if (db.includes('postgres') || db.includes('psql')) {
        backendDeps["pg"] = "^8.11.3";
        backendDeps["sequelize"] = "^6.37.1";
    } else if (db.includes('mysql') || db.includes('maria')) {
        backendDeps["mysql2"] = "^3.9.1";
        backendDeps["sequelize"] = "^6.37.1";
    } else if (db.includes('sqlite')) {
        backendDeps["better-sqlite3"] = "^9.4.3";
    } else if (db.includes('redis')) {
        backendDeps["ioredis"] = "^5.3.2";
    } else if (db.includes('firebase')) {
        backendDeps["firebase-admin"] = "^12.0.0";
    } else {
        // Default to MongoDB
        backendDeps["mongoose"] = "^8.2.1";
    }

    return {
        frontend: {
            dependencies: frontendDeps,
            devDependencies: frontendDevDeps,
            scripts: fe.includes('next')
                ? { "dev": "next dev", "build": "next build", "start": "next start" }
                : { "dev": "vite", "build": "vite build", "preview": "vite preview" }
        },
        backend: {
            dependencies: backendDeps,
            devDependencies: backendDevDeps,
            scripts: { "start": "node server.js", "dev": "nodemon server.js" }
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD TECH STACK MANDATE BLOCK (injected into EVERY prompt)
// ─────────────────────────────────────────────────────────────────────────────
function buildStackMandate(selectedStack, resolvedDeps) {
    if (!selectedStack) {
        return `\nUSING DEFAULT STACK: React 18 + Vite (frontend), Node.js + Express 4 (backend), MongoDB + Mongoose 8.\n`;
    }

    const fe = selectedStack.frontend || 'React + Vite';
    const be = selectedStack.backend || 'Node.js + Express';
    const db = selectedStack.database || 'MongoDB';

    const feDeps = resolvedDeps?.frontend?.dependencies || {};
    const feDevDeps = resolvedDeps?.frontend?.devDependencies || {};
    const beDeps = resolvedDeps?.backend?.dependencies || {};
    const beDevDeps = resolvedDeps?.backend?.devDependencies || {};

    return `
1. Every package.json MUST use EXACTLY the packages and versions listed above.
2. You MUST NOT introduce any package not listed in the mandate.
3. The generated code syntax must match the chosen framework 
   (e.g., if Vue: use <template>, <script setup>; if Angular: use @Component decorator etc.)
4. Database connection code must exclusively target: ${db}
5. If the stack is different from React + Node.js defaults, adjust ALL code patterns accordingly.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM-LEVEL CODE GENERATION STANDARDS
// ─────────────────────────────────────────────────────────────────────────────
const GENERATION_STANDARDS = `
╔══════════════════════════════════════════════════════════════════════╗
║           PROFESSIONAL CODE GENERATION STANDARDS                     ║
║     Treat every generated project as a real client deliverable       ║
╚══════════════════════════════════════════════════════════════════════╝

STANDARD 1 — DEPENDENCY LOCK:
  Use ONLY packages from the "SELECTED TECH STACK MANDATE" above.
  If no mandate is given, use the safe defaults listed there.

STANDARD 2 — ZERO TOLERANCE FOR PLACEHOLDERS:
  STRICTLY FORBIDDEN in any generated file:
  ✗ // TODO: implement this
  ✗ // Add your logic here
  ✗ console.log('placeholder')
  ✗ return null  (as a stub)
  ✗ throw new Error('Not implemented')
  Every function body MUST contain real, working logic.

STANDARD 3 — IMPORT INTEGRITY:
  Every import path must reference a file that EXISTS in the file list.
  Use correct relative paths based on folder depth.

STANDARD 4 — ARCHITECTURE DISCIPLINE:
  - React components: only UI + local state
  - services/api.js: all HTTP calls
  - Backend controllers: business logic only
  - Backend routes: routing + middleware only
  - Backend models: schema + static methods only

STANDARD 5 — PRODUCTION ENTRY POINTS:
  frontend/index.html      → <div id="root"> + <script type="module" src="/src/main.jsx">
  frontend/src/main.jsx    → ReactDOM.createRoot + <React.StrictMode><App /></React.StrictMode>
  frontend/vite.config.js  → plugin + proxy /api → http://localhost:5000
  backend/server.js        → dotenv.config() FIRST, then express/app setup, then DB connect

STANDARD 6 — PROFESSIONAL UI QUALITY:
  Every React/Vue/Angular component must:
  - Have styled, meaningful UI (not a blank div with text)
  - Use CSS classes (defined in matching .css files)
  - Handle loading and error states
  - Be interactive (forms submit, buttons do things)

STANDARD 7 — README EXCELLENCE:
  README.md must include:
  1. Project name + description
  2. Prerequisites (runtime versions, database)
  3. Quick Start: numbered bash commands for backend + frontend
  4. Environment variables table (Name | Required | Description | Example)
  5. Available API endpoints (for full-stack/backend)
  6. Project folder structure
  7. Common Issues & Solutions (at least 3 entries)
  8. Tech stack used

STANDARD 8 — STRUCTURED ERROR HANDLING:
  Backend: try/catch in every route, returns { "success": true/false, "data": ..., "message": "..." }
  Frontend: axios calls wrapped with try/catch, errors shown in UI

STANDARD 9 — SECURITY:
  Backend must include: helmet(), cors(), JWT auth middleware, bcryptjs for passwords,
  input validation on auth routes.

STANDARD 10 — OUTPUT FORMAT:
  Respond ONLY with the raw JSON object. No prose, no markdown fences.

STANDARD 11 — HYPER-PREMIUM DESIGN & THEMATIC AESTHETICS (MANDATORY):
  Every UI must be visually STUNNING and themed based on the project's core idea.
  - Project-Based Theme: Adapt the 6-layer color palette to match the project's domain (e.g., Earthy greens for Nature, Neon/Dark for Gaming, Trust-Blue for Finance, Vibrant for Creative).
  - Hero Sections: Implement a massive, themed hero with a mesh-gradient and glowing CTAs.
  - Bento Grid: Use a "Bento Grid" layout for features (Apple/Stripe style).
  - Glassmorphism & Motion: Backdrop-filters, neon glows, and GSAP 'power4.out' gliding animations are required.
  - Palette Depth: [Main, Secondary, Accent, Surface, Muted, Border] — never use browser default colors.

STANDARD 12 — INTEGRATION & ENV PERFECTION (NON-NEGOTIABLE):
  - Full Route Mapping: Every feature must have its routes established in BOTH the Frontend Router and the Backend API.
  - Perfect API Calls: The frontend service layer (api.js) must correctly call the backend endpoints with real error handling.
  - Standardized .env: All backend secrets (DB_URL, JWT_SECRET, PORT) must be in .env with placeholders (e.g., MONGODB_URI=your_mongodb_url).
  - Direct Variable Reference: The backend MUST use process.env.VARIABLE_NAME directly to ensure immediate configuration after unzip.
`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function detectMode(userPrompt) {
    const p = userPrompt.toLowerCase();
    const fe = ['frontend only', 'react + vite frontend only', 'frontend project',
        'no backend', 'just frontend', 'only frontend', 'react only',
        'generate a complete react + vite frontend only', 'frontend only project'];
    const be = ['backend only', 'rest api backend only', 'api only', 'server only',
        'no frontend', 'just backend', 'only backend', 'generate a complete rest api backend only',
        'backend api', 'backend only project'];
    const mvp = ['quick mvp', 'mvp', 'minimal', 'simple version', 'quick prototype'];

    if (fe.some(k => p.includes(k))) return 'frontend';
    if (be.some(k => p.includes(k))) return 'backend';
    if (mvp.some(k => p.includes(k))) return 'mvp';
    return 'fullstack';
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE-SPECIFIC PROMPT CONFIGURATION (stack-aware)
// ─────────────────────────────────────────────────────────────────────────────
function getModePromptConfig(mode, projectName, projectDesc, selectedStack, resolvedDeps) {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fe = selectedStack?.frontend || 'React + Vite';
    const be = selectedStack?.backend || 'Node.js + Express';
    const db = selectedStack?.database || 'MongoDB';

    if (mode === 'frontend') {
        return {
            systemContext: `You are a world-renowned UI/UX Architect specializing in modern, high-end SAAS platforms.
PROJECT MISSION: Create a "Wowed-at-first-glance" ${fe} application for "${projectName}".
VISUAL IDENTITY: Dark-mode by default, sophisticated glassmorphism, glowing micro-interactions, and GSAP-style smooth transitions.
TECH STACK: ${fe}
DO NOT generate any backend files. NO server.js, NO express, NO Node.js server code.`,

            blueprint: `
REQUIRED FILE STRUCTURE (frontend-only using ${fe}):
  README.md
  package.json                       ← Exact packages from TECH STACK MANDATE
  vite.config.js (or similar)        ← Standard config
  index.html
  src/
    main.[ext]                       ← Framework entry point
    App.[ext]                        ← Router or Root component
    App.css                          ← Global styles & Design System tokens
    components/
      [Component].[ext]              ← Functional, styled component
      [Component].css                ← Component-specific styles
    pages/
      HomePage.[ext]                 ← Main landing page
      [Feature]Page.[ext]            ← Secondary page
    services/
      api.js                         ← Mock/Static data service or external API`,

            checklist: `
VERIFICATION CHECKLIST:
□ package.json: uses ONLY packages from the TECH STACK MANDATE
□ index.html: correct entry point for ${fe}
□ Root component: uses framework Router with at least 3 route definitions
□ At least 3 styled components with real interaction logic
□ Global CSS file defines CSS custom properties in :root
□ src/services/api.js: HTTP client instance (axios or fetch wrapper)
□ At least 1 custom hook/composable with state management
□ Every CSS file imported in its corresponding component
□ All imports use correct relative paths
□ NO server-side files (no server.js, no express, no backend code)
□ README: install → dev → localhost URL`,
            fileCount: '12–18 files'
        };
    }

    if (mode === 'backend') {
        return {
            systemContext: `You are a senior ${be} developer building a PRODUCTION-READY REST API for "${projectName}".
Tech Stack: ${be} with ${db}
DO NOT generate any frontend files. No HTML, no CSS, no JSX, no client-side code.`,

            blueprint: `
REQUIRED FILE STRUCTURE (backend-only using ${be} + ${db}):
  README.md                          ← API documentation with curl examples
  package.json                       ← Exact packages from TECH STACK MANDATE
  .env.example                       ← PORT, DB connection, JWT_SECRET documented
  .gitignore                         ← Excludes node_modules, .env
  server.js                          ← App entry point
  src/
    config/
      db.js                          ← ${db} connection with retry logic
    middleware/
      auth.js                        ← JWT Bearer token verification
      errorHandler.js                ← Global error handler
      validate.js                    ← Input validation error formatter
    models/
      User.js                        ← User model for ${db}
      [Domain].js                    ← Domain-specific model
    routes/
      authRoutes.js                  ← POST /register, POST /login
      [domain]Routes.js              ← CRUD routes
    controllers/
      authController.js              ← register + login handlers
      [domain]Controller.js          ← CRUD handlers
    utils/
      generateToken.js               ← Auth token helper`,

            checklist: `
VERIFICATION CHECKLIST:
□ package.json: uses ONLY packages from the TECH STACK MANDATE
□ package.json scripts: "start": "node server.js", "dev": "nodemon server.js"
□ server.js: loads env config FIRST, then sets up middleware, routes, DB connect
□ Database config: uses ${db} connection with error handling
□ Auth middleware: verifies JWT from "Authorization: Bearer <token>" header
□ authController: register hashes password, login returns token
□ Every controller: async, try/catch, returns { success, data, message }
□ .env.example: PORT, DB connection string, JWT_SECRET with descriptions
□ README: install → copy .env.example → fill values → dev server → curl examples
□ NO frontend files (no React, no Vite, no HTML, no CSS, no JSX)`,
            fileCount: '14–18 files'
        };
    }

    if (mode === 'mvp') {
        return {
            systemContext: `You are a senior full-stack developer building a visually BREATH-TAKING MVP for "${projectName}".
Tech Stack: ${fe} (frontend), ${be} (backend), ${db} (database)
VISUAL MISSION: Use the "Hyper-Premium SAAS Design" standard. Implement a 'Bento Grid' layout, neon-glow accents, and a 6-layer color palette to make this MVP feel like a $1M product.`,

            blueprint: `
REQUIRED FILE STRUCTURE (minimal full-stack MVP):
  README.md                          ← Setup guide covering both frontend + backend
  frontend/
    package.json                     ← Exact frontend packages from TECH STACK MANDATE
    vite.config.js (or similar)      ← With /api proxy → http://localhost:5000
    index.html
    src/
      main.[ext]                     ← Entry point
      App.[ext]                      ← Root component
      App.css                        ← Basic styles
      pages/
        HomePage.[ext]               ← Main page with core feature
      services/
        api.js                       ← HTTP client
  backend/
    package.json                     ← Exact backend packages from TECH STACK MANDATE
    .env.example                     ← Required env vars
    .gitignore
    server.js                        ← Entry point
    src/
      config/db.js                   ← ${db} connection
      models/[Domain].js             ← Core model
      routes/[domain]Routes.js       ← 2-3 essential routes
      controllers/[domain]Controller.js ← Core logic`,

            checklist: `
VERIFICATION CHECKLIST (MVP):
□ Both frontend/ and backend/ folders exist and are complete
□ package.json files use ONLY packages from TECH STACK MANDATE
□ Frontend proxies /api calls to the backend port
□ Backend has at least 2 working API endpoints
□ Database model defined and connected
□ Core user-facing feature is functional end-to-end
□ .env.example documents all required env vars
□ README covers BOTH frontend and backend run instructions
□ No TODO stubs — every function has real working code`,
            fileCount: '10–16 files'
        };
    }

    // fullstack
    return {
        systemContext: `You are a world-class Full-Stack UI/UX Architect crafting a MASTERPIECE for "${projectName}".
Tech Stack: ${fe} (frontend), ${be} (backend), ${db} (database)
MISSION: Perfect the connection. Establish ALL routes, ensure api.js calls the backend perfectly, and use process.env with placeholders in .env.
AESTHETIC: Use the "Hyper-Premium Design & Theme" standard. Match colors to the project's domain (${projectDesc.slice(0, 100)}...).`,

        blueprint: `
REQUIRED FILE STRUCTURE (full-stack using ${fe} + ${be} + ${db}):
  README.md                             ← Covers BOTH frontend + backend setup
  frontend/
    package.json                        ← Exact frontend packages from TECH STACK MANDATE
    vite.config.js (or framework cfg)   ← /api proxy → http://localhost:5000
    index.html                          ← HTML entry
    src/
      main.[ext]                        ← Entry point
      App.[ext]                         ← Router + route definitions (min 3 routes)
      App.css                           ← Global CSS variables + resets
      components/
        Navbar.[ext] + Navbar.css       ← Navigation
        [Feature].[ext] + [Feature].css ← Domain component
        Footer.[ext]                    ← Footer
      pages/
        HomePage.[ext]                  ← Landing page
        [Feature]Page.[ext]             ← Main feature page
        NotFoundPage.[ext]              ← 404
      services/
        api.js                          ← HTTP client with auth token interceptor
      hooks/
        use[Feature].js                 ← Data hook/composable
  backend/
    package.json                        ← Exact backend packages from TECH STACK MANDATE
    .env.example                        ← PORT, DB_URI, JWT_SECRET
    .gitignore                          ← node_modules, .env
    server.js                           ← Express/Fastify entry point
    src/
      config/db.js                      ← ${db} connection
      middleware/auth.js                ← JWT verification
      middleware/errorHandler.js        ← Global error handler
      models/User.js                    ← User model for ${db}
      models/[Domain].js                ← Domain model
      routes/authRoutes.js              ← Auth endpoints
      routes/[domain]Routes.js          ← Domain CRUD endpoints
      controllers/authController.js     ← Login/register logic
      controllers/[domain]Controller.js ← CRUD logic
      utils/generateToken.js            ← Auth token helper`,

        checklist: `
VERIFICATION CHECKLIST (full-stack):
□ frontend/package.json: uses ONLY packages from TECH STACK MANDATE
□ backend/package.json: uses ONLY packages from TECH STACK MANDATE
□ Frontend config: /api proxy points to backend port (5000)
□ Frontend entry point: correct for ${fe}
□ Root component: Router with at least 3 routes
□ services/api.js: HTTP client with auth token header injection
□ Backend server.js: env config loaded FIRST, then middleware, routes, DB. Use process.env.
□ ${db} connection with error handling in config/db.js
□ Auth middleware: JWT Bearer verification, attaches req.user
□ authController: bcrypt on register, JWT token on login
□ All controllers: try/catch, { success, data, message } shape
□ Full Route Established: Router (FE) and Controller/Routes (BE) match perfectly
□ .env Standard: Uses placeholders (your_mongodb_url) and code uses process.env
□ Frontend uses relative /api/... paths (proxied to backend)
□ README: step-by-step for backend first (port 5000) then frontend (port 5173)
□ ZERO cross-referencing imports between frontend/ and backend/
□ .env.example documents all environment variables`,
        fileCount: '18–26 files'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — rebuild tree from flat file list
// ─────────────────────────────────────────────────────────────────────────────
function buildStructureFromFiles(files) {
    const root = { name: 'root', type: 'folder', children: [] };
    files.forEach(file => {
        if (!file.path) return;
        const parts = file.path.split('/').filter(p => p.trim() && p !== '.');
        let node = root;
        parts.forEach((part, i) => {
            const isFile = i === parts.length - 1;
            if (!node.children) node.children = [];
            let child = node.children.find(c => c.name === part);
            if (!child) {
                child = { name: part, type: isFile ? 'file' : 'folder' };
                if (!isFile) child.children = [];
                node.children.push(child);
            }
            if (!isFile) node = child;
        });
    });
    return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — sanitize/normalize file list
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeFiles(files) {
    if (!Array.isArray(files)) return [];
    return files
        .filter(f => f && typeof f.path === 'string' && f.path.trim())
        .map(f => ({
            path: f.path.replace(/^[./\\]+/, '').replace(/\\/g, '/').trim(),
            code: typeof f.code === 'string'
                ? f.code
                : (f.code != null ? JSON.stringify(f.code, null, 2) : '')
        }))
        .filter(f => f.path.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE PROJECT  (Vibe Coding — full project in one shot)
// ─────────────────────────────────────────────────────────────────────────────
class VibeCodingService {
    constructor() {}

    detectMode(userPrompt) { return detectMode(userPrompt); }

    /**
     * Generate a complete project from a prompt + project context.
     * @param {string} userPrompt - The user's generation request
     * @param {string} projectContext - Stringified context (description, requirements)
     * @param {object|null} selectedStack - Design phase selected tech stack object
     */
    async generateProject(userPrompt, projectContext = '', selectedStack = null) {
        const mode = detectMode(userPrompt);

        // Extract project name from prompt or context
        const nameMatch = userPrompt.match(/"([^"]+)"/) || userPrompt.match(/for ([a-zA-Z0-9 ]+)/i);
        const projectName = nameMatch ? nameMatch[1].trim() : 'New Project';
        const projectDesc = projectContext || userPrompt;

        // Resolve technology-specific dependency versions from the selected stack
        const resolvedDeps = resolveStackDependencies(selectedStack);
        const stackMandate = buildStackMandate(selectedStack, resolvedDeps);

        const cfg = getModePromptConfig(mode, projectName, projectDesc, selectedStack, resolvedDeps);
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const prompt = `${cfg.systemContext}

${stackMandate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROJECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT NAME   : "${projectName}"
USER REQUEST   : ${userPrompt}
${projectContext ? `PROJECT CONTEXT:\n${projectContext}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROFESSIONAL BLUEPRINT — follow this structure exactly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cfg.blueprint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CODE GENERATION STANDARDS (must follow every rule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${GENERATION_STANDARDS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OUTPUT FORMAT  (target: ${cfg.fileCount})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond with ONLY this JSON — no prose, no markdown fences:
{
  "files": [
    { "path": "README.md",   "code": "# ${projectName}\\n..." },
    { "path": "frontend/package.json", "code": "{ \\"name\\": \\"${slug}\\", ... }" },
    ...all other files...
  ],
  "summary": "2–3 sentence plain-English description of what was built and how to run it."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FINAL VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cfg.checklist}

Apply all checks above, then generate the complete project JSON now:`;

        const result = await mistralService.generateJSON(prompt);
        result.files = sanitizeFiles(result.files || []);
        result.structure = buildStructureFromFiles(result.files);
        result.mode = mode;
        result.techStack = selectedStack;
        return result;
    }

    // ── Update an existing project ─────────────────────────────────────────────
    async updateProject(userPrompt, currentFiles, selectedStack = null) {
        const filePaths = currentFiles.map(f => `  ${f.path}`).join('\n');
        const existingCode = currentFiles.map(f =>
            `--- ${f.path} ---\n${f.code || ''}`
        ).join('\n\n');

        const resolvedDeps = resolveStackDependencies(selectedStack);
        const stackMandate = selectedStack ? buildStackMandate(selectedStack, resolvedDeps) : '';

        const prompt = `You are a senior software developer updating an existing project.
Apply the requested change surgically — only touch files that need changing.
${stackMandate}

USER REQUEST: "${userPrompt}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXISTING PROJECT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${filePaths}

SAMPLE OF EXISTING CODE (for context):
${existingCode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UPDATE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. You may add new files, modify existing files, or mark files as deleted.
2. For MODIFIED files: return their complete new content (not a diff).
3. For DELETED files: include { "path": "...", "code": "", "action": "deleted" }.
4. For NEW files: include { "path": "...", "code": "...", "action": "created" }.
5. Never change pinned dependency versions in package.json files.
6. Every import in modified files must still reference a file that EXISTS.
7. No TODO comments, no placeholders, no stub implementations.
8. Keep the selected tech stack — do NOT introduce new frameworks.

${GENERATION_STANDARDS}

Respond with ONLY this JSON:
{
  "files": [
    { "path": "path/to/file.js", "code": "full new content", "action": "modified" },
    { "path": "path/to/new.js",  "code": "full content",     "action": "created"  },
    { "path": "path/to/old.js",  "code": "",                 "action": "deleted"  }
  ],
  "summary": "2–3 sentences describing exactly what was changed and why."
}`;

        const result = await mistralService.generateJSON(prompt);
        if (result.files) {
            result.files = result.files.map(f => ({
                ...f,
                path: (f.path || '').replace(/^[./\\]+/, '').replace(/\\/g, '/').trim(),
                code: typeof f.code === 'string' ? f.code : ''
            }));
        }

        return result;
    }
}

module.exports = new VibeCodingService();
