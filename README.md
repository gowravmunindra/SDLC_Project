# AI-Enhanced SDLC Platform 🚀

> **Transforming Software Concepts into Production-Ready code via Advanced AI Orchestration.**

The AI-Enhanced SDLC Platform is a professional-grade development environment that automates the entire Software Development Life Cycle. It leverages **Mistral Large** AI to guide you from initial project requirements to fully functional, high-quality codebases and test suites.

---

## 🌟 Core Features

- **Mistral-Powered Logic**: High-fidelity AI generation for SRS, architecture, code, and tests.
- **6 Specialized SDLC Agents**:
  - 📋 **Requirements Analyst**: Generates IEEE-standard SRS documents.
  - 🎨 **System Architect**: Designs 3-layer architecture and UML diagrams.
  - 💻 **Development Engine**: Professional folder structures and runnable code snippets.
  - 🧪 **Testing & QA**: Comprehensive test plans and matrix-based validation.
  - ⚡ **Vibe Coding Agent**: Modern "One-Click" generation for Full-Stack, Frontend, or Backend projects.
  - 🔍 **Consistency Validator**: Ensures architectural alignment across all phases.
- **Vibe-Coding (Cursor/Lovable Grade)**: Generates projects with production-level standards (MVC, Clean Code, Security, and Error Handling).
- **Persistent Progress**: Built on MongoDB, allowing you to resume any project at any phase.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local or Atlas)
- **Mistral API Key** (Get one at [console.mistral.ai](https://console.mistral.ai))

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd AI-Enhanced-SDLC-New-2

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Configuration
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sdlc_project
MISTRAL_API_KEY=your_mistral_api_key_here
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### 4. Running the Platform

**Start the Backend:**
```bash
cd backend
npm run dev
```

**Start the Frontend:**
```bash
cd frontend
npm run dev
```

The platform will be available at `http://localhost:5173`.

---

## 🏗️ Technical Architecture

- **Frontend**: React 18, Vite 5, Axios, CSS3 (Modern Glassmorphism Design).
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT Auth.
- **Security**: Helmet headers, Morgan logging, Bcrypt hashing.
- **AI Engine**: Mistral AI (Mistral Large) via customized prompt blueprints.

---

## 📁 Repository Structure

```
.
├── backend/            # Express API, Mistral Integration, & DB Models
├── frontend/           # React Application & SDLC Agents UI
└── README.md           # This file
```

---

## 📋 Latest Updates & Fixes (March 2026)

- **Vibe Coding Upgrade**: Added mode-specific blueprints (Frontend Only / Backend Only / Full Stack).
- **Expert Prompting**: System instructions upgraded to "Senior Architect" standards for cleaner code.
- **Security Hardening**: Integrated `helmet` and `morgan` for production-level server safety.
- **Deterministic Dependencies**: Forced pinned versions (React 18.2, Express 4.18) to ensure generated projects are immediately runnable.
- **Context-Aware Generation**: AI now reads the full project description and UI diagrams before writing a single line of code.

---

## 📄 License
Licensed under the [MIT License](LICENSE).

---

**Built with ❤️ for the Modern Developer.**
