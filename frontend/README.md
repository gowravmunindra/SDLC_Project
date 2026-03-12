# SDLC Platform - Frontend Interface 🎨

> **A Premium, High-Fidelity UI for AI-Driven Software Engineering.**

The frontend of the SDLC Platform provides a seamless, high-performance interface for managing complex development workflows. Built with **React 18** and **Vite**, it features a modern glassmorphism design system and an intuitive sequential phase-tracking engine.

---

## 🌟 Premium Features

- **6 Specialized AI Agent Dashboards**: Custom UIs for Requirements, Design, Development, Testing, Validation, and Guide.
- **Vibe Coding Interface**: One-click project generation with real-time file tree exploration and code preview.
- **Glassmorphism Design System**: Vibrant indigo-themed UI with custom animations and smooth transitions.
- **Sequential Workflow Engine**: Guides users through the SDLC phases with data-driven state management.
- **Live Preview & Export**: View generated code in a high-fidelity editor and download the entire project as a ZIP file.

---

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Icons & Assets**: Custom Lucide-inspired iconography
- **Styles**: Vanilla CSS (4,500+ lines) with Modern CSS Variables
- **API Client**: Axios (with centralized service layer)
- **Utilities**: JSZip (for bundling), File-Saver, React-Router-Dom 6

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/         # Phase-specific Agents (RequirementsAgent, etc.)
│   ├── contexts/           # Global Project & Auth Contexts
│   ├── services/           # Logic-free API service layer
│   ├── hooks/              # Custom React hooks (useProject, etc.)
│   ├── App.jsx             # Root layout & phase navigation
│   ├── index.css           # Core Design System (Colors, Typography, Utility Classes)
│   └── main.jsx            # Entry Point
├── public/                 # Static Assets
└── vite.config.js          # Plugin & API Proxy Configuration
```

---

## 🔧 Setup & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   The frontend expects the backend to be running on port 5000. Configure `VITE_API_URL` in your `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```

4. **Access UI**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Design System

The platform uses a custom design system defined in `index.css`:
- **Primary Palette**: Indigo (#6366f1) & Cyan (#06b6d4)
- **Background**: Dark Slate (#0f172a)
- **Typography**: Inter / System UI
- **Components**: Polished cards, custom loaders, and interactive hover states.

---

## 📄 License
MIT
