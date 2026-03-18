# SDLC Platform - Backend API ⚙️

> **The high-performance orchestration layer for AI-driven software development.**

This API handles project persistence, user authentication, and serves as the bridge to **Mistral AI** for intelligent code and document generation.

---

## 🚀 Key Features

- **Expert Generation Service**: Specialized logic in `vibeCodingService` with Hyper-Premium SAAS visual mandates.
- **Reliable Rendering Engine**: Fixed PlantUML server-side cache with full MD5 hashing for collision-free diagrams.
- **Mistral AI Integration**: Leverages `mistral-large-latest` with senior-architect system prompts.
- **Security-First**: 
  - `helmet` for secure HTTP headers.
  - `morgan` for detailed request logging.
  - `bcryptjs` for industry-standard password hashing.
  - `JWT` for stateless session management.
- **Robust Persistence**: MongoDB/Mongoose integration with lean schema design for SDLC artifacts.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Database**: MongoDB (via Mongoose 8.x)
- **AI Integration**: Mistral AI REST API
- **Middleware**: CORS, Helmet, Morgan, Express-Validator

---

## 📦 API Endpoints

### Authentication
- `POST /api/auth/register` - New user signup.
- `POST /api/auth/login` - Authenticate and get JWT.
- `GET /api/auth/me` - Get current session info.

### Project Management
- `GET /api/projects` - List user projects.
- `POST /api/projects` - Initialize a new project.
- `GET /api/projects/:id` - Get full project details including requirements/design.
- `PUT /api/projects/:id/development` - Persist development-phase code and structure.

### Development Engine (Vibe Coding)
- `POST /api/development/generate-tech-stack` - Proposes modern stacks based on description.
- `POST /api/vibe-coding/generate-project` - One-click full repository generation with SAAS-grade UI.
- `POST /api/ai/plantuml/render` - Server-side PlantUML rendering (collision-free).

---

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/             # DB & API configurations
│   ├── controllers/        # Logical handlers (Phase-specific)
│   ├── middleware/         # Auth, Security, Error Handlers
│   ├── models/             # Mongoose Schemas (User, Project)
│   ├── routes/             # Express Route Definitions
│   ├── services/           # External API Clients (Mistral, PlantUML)
│   └── server.js           # Entry Point (Helmet, Morgan, Express)
├── .env.example            # Environment template
└── package.json            # Pinned professional dependencies
```

---

## 🔧 Setup & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in:
   - `MISTRAL_API_KEY`: Your Mistral developer key.
   - `MONGODB_URI`: Connection string.
   - `JWT_SECRET`: Random secure string.

3. **Run Server**:
   ```bash
   npm run dev    # Development mode (nodemon)
   npm start      # Production mode (node)
   ```

---

## 🛡️ Security Standards

- **Input Sanitization**: Controllers use validation middleware for clean inputs.
- **Error Handling**: A global `errorHandler` middleware hides stack traces in production.
- **AI Sandboxing**: Prompt engineers ensure AI-generated code is robust and secure.

---

## 📄 License
MIT
