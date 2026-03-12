const mistralService = require('./mistralService');

// ─────────────────────────────────────────────────────────────────────────────
// PINNED DEPENDENCY CATALOGUE  (verified stable as of early 2025)
// These are the ONLY versions the AI is allowed to use.
// ─────────────────────────────────────────────────────────────────────────────
const PINNED = {
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
// SYSTEM-LEVEL CODE GENERATION STANDARDS
// Injected into every prompt — the AI must obey these in all cases.
// ─────────────────────────────────────────────────────────────────────────────
const GENERATION_STANDARDS = `
╔══════════════════════════════════════════════════════════════════════╗
║           PROFESSIONAL CODE GENERATION STANDARDS                     ║
║     Treat every generated project as a real client deliverable       ║
╚══════════════════════════════════════════════════════════════════════╝

STANDARD 1 — DEPENDENCY LOCK (NON-NEGOTIABLE):
  Use ONLY these exact package versions. Any deviation is forbidden:

  FRONTEND (React + Vite):
    react: ^18.2.0 | react-dom: ^18.2.0 | react-router-dom: ^6.22.0
    axios: ^1.6.7 | vite: ^5.1.4 | @vitejs/plugin-react: ^4.2.1

  BACKEND (Node.js + Express):
    express: ^4.18.2 | cors: ^2.8.5 | dotenv: ^16.4.5
    mongoose: ^8.2.1 | bcryptjs: ^2.4.3 | jsonwebtoken: ^9.0.2
    helmet: ^7.1.0 | morgan: ^1.10.0 | nodemon: ^3.1.0 (devDep only)

STANDARD 2 — ZERO TOLERANCE FOR PLACEHOLDERS:
  The following are STRICTLY FORBIDDEN in any generated file:
  ✗ // TODO: implement this
  ✗ // Add your logic here
  ✗ console.log('placeholder')
  ✗ return null  (as a stub for unimplemented logic)
  ✗ throw new Error('Not implemented')
  Every function body MUST contain real, working logic.

STANDARD 3 — IMPORT INTEGRITY:
  Before finalizing, mentally trace EVERY import statement.
  Every imported path must exist in the generated file list.
  Use relative paths consistently (e.g., './components/Header' not '../components/Header'
  unless the depth is correct).

STANDARD 4 — ARCHITECTURE DISCIPLINE:
  Separation of concerns is mandatory:
  - React components: only UI logic and local state
  - Services (api.js): all HTTP calls via axios
  - Backend controllers: business logic only
  - Backend routes: routing + middleware only
  - Backend models: schema + static methods only
  Never mix concerns across layers.

STANDARD 5 — PRODUCTION ENTRY POINTS:
  frontend/index.html      → <div id="root"> + <script type="module" src="/src/main.jsx">
  frontend/src/main.jsx    → ReactDOM.createRoot + <React.StrictMode><App /></React.StrictMode>
  frontend/vite.config.js  → @vitejs/plugin-react + proxy /api → http://localhost:5000
  backend/server.js        → dotenv.config() FIRST, then express setup, then mongoose.connect()

STANDARD 6 — PROFESSIONAL UI QUALITY:
  Every React component must:
  - Have styled, meaningful UI (not a blank div with text)
  - Use CSS classes (defined in corresponding .css files)
  - Handle loading and error states where data fetching is involved
  - Be interactive where it makes sense (buttons do things, forms submit)

STANDARD 7 — README EXCELLENCE:
  The README.md must be the first file and must include:
  1. Project name + 1-paragraph description
  2. Screenshots section (placeholder for user to add)
  3. Prerequisites (Node.js ≥18, npm ≥9, MongoDB Atlas or local)
  4. Quick Start with numbered bash commands for backend AND frontend
  5. Environment Variables table with Name | Required | Description | Example
  6. Available API endpoints (for full-stack/backend projects)
  7. Project folder structure summary
  8. Common Issues & Solutions (at least 4 entries)
  9. Tech stack badges or table

STANDARD 8 — STRUCTURED ERROR HANDLING:
  Backend: every route handler wrapped in try/catch, returns:
    { "success": true/false, "data": ..., "message": "..." }
  Frontend: axios calls wrapped with try/catch, errors shown in UI (not just console.log)

STANDARD 9 — SECURITY BEST PRACTICES:
  Backend must include: helmet(), cors() with proper options,
  JWT verification middleware, bcryptjs for passwords,
  express-validator for input sanitization on auth routes.

STANDARD 10 — OUTPUT FORMAT:
  Respond ONLY with the raw JSON object.
  No markdown fences, no prose explanation, no comments outside of code strings.
`;

// ─────────────────────────────────────────────────────────────────────────────
// MODE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function detectMode(userPrompt) {
    const p = userPrompt.toLowerCase();
    const fe = ['frontend only', 'react + vite frontend only', 'frontend project',
        'no backend', 'just frontend', 'only frontend', 'react only',
        'generate a complete react + vite frontend only'];
    const be = ['backend only', 'rest api backend only', 'api only', 'server only',
        'no frontend', 'just backend', 'only backend', 'generate a complete rest api backend only'];

    if (fe.some(k => p.includes(k))) return 'frontend';
    if (be.some(k => p.includes(k))) return 'backend';
    return 'fullstack';
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE-SPECIFIC PROMPT CONFIGURATION
// Each mode gets a unique system context, file scaffold blueprint, and checklist.
// ─────────────────────────────────────────────────────────────────────────────
function getModePromptConfig(mode, projectName, projectDesc) {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (mode === 'frontend') {
        return {
            systemContext: `You are a senior React developer with deep expertise in Vite, React Router, and modern frontend architecture.
You are building a PRODUCTION-READY frontend-only React + Vite application.
DO NOT generate any backend files. NO server.js, NO express, NO Node.js server code.`,

            blueprint: `
REQUIRED FILE STRUCTURE (frontend-only):
  README.md                          ← Complete setup guide
  package.json                       ← Pinned React 18 + Vite 5 deps
  vite.config.js                     ← Vite config with React plugin
  index.html                         ← HTML entry point
  src/
    main.jsx                         ← ReactDOM.createRoot entry
    App.jsx                          ← Root component with Router
    App.css                          ← Global styles + CSS variables
    components/
      Navbar.jsx                     ← Navigation with React Router links
      Navbar.css
      [Feature]Card.jsx              ← Domain-specific feature component
      [Feature]Card.css
      Footer.jsx                     ← Footer component
      Footer.css
    pages/
      HomePage.jsx                   ← Landing/home page
      [Feature]Page.jsx              ← Main feature page
      NotFoundPage.jsx               ← 404 page
    services/
      api.js                         ← Axios instance with baseURL + interceptors
    hooks/
      use[Feature].js                ← Custom hook for domain logic
    utils/
      helpers.js                     ← Pure utility functions
    .gitignore`,

            checklist: `
VERIFICATION CHECKLIST (you must satisfy ALL before responding):
□ package.json: react@^18.2.0, react-dom@^18.2.0, react-router-dom@^6.22.0, axios@^1.6.7
□ package.json devDeps: vite@^5.1.4, @vitejs/plugin-react@^4.2.1
□ index.html: <div id="root"> + <script type="module" src="/src/main.jsx">
□ vite.config.js: plugins: [react()] — no proxy needed for frontend-only
□ App.jsx: uses <BrowserRouter> + <Routes> with at least 3 <Route> definitions
□ Navbar: renders on all pages, has working navigation links
□ At least 3 React components with real interaction logic (not just display text)
□ App.css: defines CSS custom properties in :root, uses Flexbox/Grid layouts
□ src/services/api.js: axios.create() with baseURL set to env variable or config
□ At least 1 custom hook (use[Feature].js) with useState/useEffect
□ Every CSS file imported in its corresponding component
□ All component imports use correct relative paths
□ NotFoundPage.jsx handles 404 routing
□ NO server.js, NO express, NO backend files whatsoever
□ README has: npm install → npm run dev → http://localhost:5173`,
            fileCount: '12–18 files'
        };
    }

    if (mode === 'backend') {
        return {
            systemContext: `You are a senior Node.js/Express developer with deep expertise in REST API design, MongoDB/Mongoose, and API security.
You are building a PRODUCTION-READY backend REST API.
DO NOT generate any React/Vite/frontend files. NO HTML, NO CSS, NO JSX files.`,

            blueprint: `
REQUIRED FILE STRUCTURE (backend-only):
  README.md                          ← Complete API documentation
  package.json                       ← Pinned Express + Mongoose deps
  .env.example                       ← All environment variables documented
  .gitignore                         ← Excludes node_modules, .env
  server.js                          ← Express app entry point
  src/
    config/
      db.js                          ← Mongoose connection with retry logic
    middleware/
      auth.js                        ← JWT Bearer token verification
      errorHandler.js                ← Global error handler middleware
      validate.js                    ← express-validator error formatter
    models/
      User.js                        ← User Mongoose model
      [Domain].js                    ← Domain-specific Mongoose model
    routes/
      authRoutes.js                  ← POST /register, POST /login
      [domain]Routes.js              ← Domain CRUD routes
    controllers/
      authController.js              ← register, login handlers
      [domain]Controller.js          ← CRUD handlers
    utils/
      generateToken.js               ← JWT sign helper`,

            checklist: `
VERIFICATION CHECKLIST (you must satisfy ALL before responding):
□ package.json: express@^4.18.2, mongoose@^8.2.1, cors@^2.8.5, dotenv@^16.4.5
□ package.json: bcryptjs@^2.4.3, jsonwebtoken@^9.0.2, helmet@^7.1.0, morgan@^1.10.0
□ package.json devDeps: nodemon@^3.1.0
□ package.json scripts: "start": "node server.js", "dev": "nodemon server.js"
□ server.js: require('dotenv').config() is line 1
□ server.js: uses helmet(), cors(), morgan('dev'), express.json()
□ server.js: imports and mounts all route files under /api/v1/
□ server.js: calls connectDB() and then starts listening
□ src/config/db.js: mongoose.connect with error handling + console log on success
□ auth.js middleware: verifies JWT from "Authorization: Bearer <token>" header
□ authController.js: register hashes password with bcryptjs, login returns JWT
□ Every controller function: async, try/catch, returns { success, data, message }
□ .env.example: PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRE with descriptions
□ README: npm install → cp .env.example .env → fill values → npm run dev → Postman/curl examples
□ NO React, NO Vite, NO HTML, NO CSS, NO JSX files`,
            fileCount: '12–18 files'
        };
    }

    // fullstack
    return {
        systemContext: `You are a senior full-stack developer with expertise in React, Node.js, Express, MongoDB, and modern web architecture.
You are building a PRODUCTION-READY full-stack application with a React frontend and Node.js backend in separate directories.
Both the frontend/ and backend/ directories must be complete and independently runnable.`,

        blueprint: `
REQUIRED FILE STRUCTURE (full-stack):
  README.md                             ← Covers BOTH frontend and backend setup
  frontend/
    package.json                        ← Pinned React 18 + Vite 5 deps
    vite.config.js                      ← /api proxy → http://localhost:5000
    index.html                          ← <div id="root"> entry
    src/
      main.jsx                          ← ReactDOM.createRoot
      App.jsx                           ← BrowserRouter + Route definitions
      App.css                           ← Global CSS variables + resets
      components/
        Navbar.jsx + Navbar.css         ← Navigation
        [Feature].jsx + [Feature].css   ← Domain component
      pages/
        HomePage.jsx                    ← Landing page
        [Feature]Page.jsx               ← Main feature page
      services/
        api.js                          ← Axios + token interceptor
      hooks/
        use[Feature].js                 ← Custom data hook
  backend/
    package.json                        ← Pinned Express + Mongoose deps
    .env.example                        ← PORT, MONGODB_URI, JWT_SECRET
    .gitignore                          ← node_modules, .env
    server.js                           ← Express entry point
    src/
      config/db.js                      ← Mongoose connect
      middleware/auth.js                ← JWT verification
      middleware/errorHandler.js        ← Global error handler
      models/User.js                    ← User schema
      models/[Domain].js                ← Domain schema
      routes/authRoutes.js              ← Auth endpoints
      routes/[domain]Routes.js          ← Domain endpoints
      controllers/authController.js     ← Register/login logic
      controllers/[domain]Controller.js ← CRUD logic
      utils/generateToken.js            ← JWT helper`,

        checklist: `
VERIFICATION CHECKLIST (you must satisfy ALL before responding):
□ frontend/package.json: react@^18.2.0, vite@^5.1.4, react-router-dom@^6.22.0, axios@^1.6.7
□ frontend/vite.config.js: React plugin + proxy /api → http://localhost:5000
□ frontend/index.html: proper <div id="root"> + <script type="module" src="/src/main.jsx">
□ frontend/src/main.jsx: ReactDOM.createRoot with <React.StrictMode>
□ frontend/src/App.jsx: BrowserRouter + at least 3 Routes
□ frontend/src/services/api.js: axios.create + token injection interceptor
□ backend/package.json: express@^4.18.2, mongoose@^8.2.1, bcryptjs@^2.4.3, jsonwebtoken@^9.0.2
□ backend/server.js: dotenv.config() first, then middleware, routes, DB connect
□ backend/src/config/db.js: mongoose.connect with error handling
□ backend/src/middleware/auth.js: JWT Bearer verification, attaches req.user
□ backend/src/middleware/errorHandler.js: catches and formats all errors to JSON
□ authController.js: bcrypt hashing on register, JWT return on login
□ All controllers: try/catch, { success, data, message } response shape
□ frontend API calls use relative /api/... paths (proxied by Vite)
□ README: step-by-step for backend first (port 5000) then frontend (port 5173)
□ ZERO cross-referencing imports between frontend/ and backend/`,
        fileCount: '20–30 files'
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
    buildModeConfig(mode)   { return getModePromptConfig(mode, 'Project', 'A web application'); }

    async generateProject(userPrompt, projectContext = '') {
        const mode = detectMode(userPrompt);
        // Infer project name from prompt (best-effort)
        const nameMatch = userPrompt.match(/"([^"]+)"/);
        const projectName = nameMatch ? nameMatch[1] : 'My Project';
        const projectDesc = projectContext || userPrompt;

        const cfg = getModePromptConfig(mode, projectName, projectDesc);
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');

        const prompt = `${cfg.systemContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROJECT REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAME: "${projectName}"
WHAT TO BUILD: ${userPrompt}
${projectContext ? `ADDITIONAL CONTEXT: ${projectContext}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROFESSIONAL BLUEPRINT — follow this structure exactly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cfg.blueprint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CODE GENERATION STANDARDS (must follow every rule)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${GENERATION_STANDARDS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OUTPUT FORMAT  (${cfg.fileCount})
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
        result.files = sanitizeFiles(result.files);
        result.structure = buildStructureFromFiles(result.files);
        return result;
    }

    // ── Update an existing project ─────────────────────────────────────────────
    async updateProject(userPrompt, currentFiles) {
        const filePaths = currentFiles.map(f => `  ${f.path}`).join('\n');
        const existingCode = currentFiles.slice(0, 8).map(f =>
            `--- ${f.path} ---\n${(f.code || '').slice(0, 400)}`
        ).join('\n\n');

        const prompt = `You are a senior software developer updating an existing project.
Apply the requested change surgically — only touch files that need changing.

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

    // Expose helpers for controller use
    sanitizeFiles(files) { return sanitizeFiles(files); }
    buildStructureFromFiles(files) { return buildStructureFromFiles(files); }
}

module.exports = new VibeCodingService();
