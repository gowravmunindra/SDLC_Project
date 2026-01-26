# SDLC Platform Backend API

RESTful API for SDLC Platform with MongoDB database and JWT authentication.

## Tech Stack

- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin support

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file or update existing one:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sdlc_platform
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Set Up MongoDB

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Create free account at https://mongodb.com/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

**Option B: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use default `MONGODB_URI`

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user (protected)
```

### Projects
```
GET    /api/projects         - Get all user projects (protected)
POST   /api/projects         - Create project (protected)
GET    /api/projects/:id     - Get single project (protected)
PUT    /api/projects/:id     - Update project (protected)
DELETE /api/projects/:id     - Delete project (protected)
```

### SDLC Phases
```
POST   /api/projects/:id/requirements   - Save requirements (protected)
POST   /api/projects/:id/design         - Save design (protected)
POST   /api/projects/:id/development    - Save development (protected)
POST   /api/projects/:id/testing        - Save testing (protected)
```

## Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Project.js         # Project schema
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   └── projectController.js # Project logic
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── projectRoutes.js   # Project endpoints
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── errorHandler.js    # Error handling
│   └── server.js              # Entry point
├── .env                        # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variables

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  status: String,
  requirements: {...},
  design: {...},
  development: {...},
  testing: {...},
  createdAt: Date,
  updatedAt: Date
}
```

## Development

- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start without auto-reload

## Deployment

Can be deployed to:
- **Heroku**
- **Render**
- **Railway**
- **DigitalOcean App Platform**

MongoDB can be hosted on:
- **MongoDB Atlas** (Free 512MB)

## License

ISC
