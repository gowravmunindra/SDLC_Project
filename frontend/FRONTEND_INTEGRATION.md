# Frontend Integration Guide

## ✅ What's Been Created

### **New Files:**
1. `src/services/apiService.js` - API client with axios
2. `src/contexts/AuthContext.jsx` - Authentication state management
3. `src/pages/LoginPage.jsx` - Login UI
4. `src/pages/RegisterPage.jsx` - Register UI
5. `src/components/ProtectedRoute.jsx` - Route protection
6. `.env.example` - Updated with API URL

### **Updated Files:**
1. `src/App.jsx` - Added AuthProvider and protected routes
2. `package.json` - Installed axios

---

## 🚀 Setup Steps

### **1. Install Dependencies (if not already done)**
```bash
npm install axios
```

### **2. Update Your .env File**

If you have a `.env` file, add this line:
```
VITE_API_URL=http://localhost:5000/api
```

If you don't have a `.env` file yet, copy from example:
```bash
copy .env.example .env
```

Then update `.env` with your actual API keys.

---

## 🔐 How Authentication Works

### **User Flow:**
1. User visits app → Redirected to `/login` if not authenticated
2. User logs in → JWT token saved to localStorage
3. Token sent with every API request
4. Protected routes accessible only when logged in
5. Logout → Clear token and redirect to login

### **Key Components:**

#### **AuthContext**
- Provides: `user`, `login()`, `register()`, `logout()`, `isAuthenticated`
- Usage:
```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
    const { user, logout } = useAuth()
    
    return <button onClick={logout}>Logout {user.name}</button>
}
```

#### **ProtectedRoute**
- Wraps routes that need authentication
- Shows loading while checking auth
- Redirects to `/login` if not authenticated

#### **API Service**
- Handles all backend calls
- Auto-adds JWT token to requests
- Auto-redirects on 401 Unauthorized

---

## 📝 Next Steps: Update Agents to Use Database

Currently, agents still use localStorage. We need to update them to use the database.

### **Example: RequirementsAgent**

**Before (localStorage):**
```javascript
const handleComplete = () => {
    const data = { projectDescription, functionalRequirements, ... }
    localStorage.setItem('sdlc_requirements', JSON.stringify(data))
}
```

**After (Database):**
```javascript
import apiService from '../services/apiService'

const handleComplete = async () => {
    const data = { projectDescription, functionalRequirements, ... }
    
    // Create project first (if new)
    const project = await apiService.createProject({
        name: 'My Project',
        description: projectDescription
    })
    
    // Save requirements to that project
    await apiService.saveRequirements(project.data._id, data)
    
    // Move to next phase
    navigate('/design')
}
```

---

## 🎯 Testing the Integration

### **1. Start Backend Server**
```bash
cd backend
npm run dev
```

### **2. Start Frontend**
```bash
cd frontend
npm run dev
```

### **3. Test Authentication**
1. Go to http://localhost:5173
2. Click "Get Started" → Should redirect to `/login`
3. Click "Create account"
4. Fill form and register
5. Should redirect to `/dashboard`
6. Check browser console - no errors
7. Check localStorage - should have `token` and `user`

### **4. Test API Connection**
Open browser console and run:
```javascript
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
```

Should see: `{message: "Server is running!"}`

---

## 🔧 Common Issues

### **CORS Error**
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS
```

**Solution:** Backend already has `cors()` middleware, but if still seeing errors:
1. Check backend `server.js` has `app.use(cors())`
2. Restart backend server

### **Cannot connect to backend**
```
Network Error / ERR_CONNECTION_REFUSED
```

**Solution:**
1. Make sure backend is running: `cd backend && npm run dev`
2. Check backend is on port 5000
3. Verify `.env` has correct `VITE_API_URL`

### **401 Unauthorized**
```
Not authorized,  no token
```

**Solution:**
1. Make sure you're logged in
2. Check localStorage has `token`
3. Token might be expired - logout and login again

### **User redirected to login on every page**
**Solution:**
1. Check `AuthContext` is working
2. Verify token in localStorage
3. Check browser console for errors

---

## 📊 Database vs localStorage Comparison

### **Before (localStorage):**
```javascript
// Save
localStorage.setItem('sdlc_requirements', JSON.stringify(data))

// Load
const data = JSON.parse(localStorage.getItem('sdlc_requirements'))
```

### **After (Database):**
```javascript
// Save
await apiService.saveRequirements(projectId, data)

// Load
const data = await apiService.getRequirements(projectId)
```

---

## 🎨 Adding User Info to UI

### **Show User Name in Header:**
```javascript
import { useAuth } from '../contexts/AuthContext'

function Header() {
    const { user, logout } = useAuth()
    
    return (
        <div className="header">
            <span>Welcome, {user?.name}!</span>
            <button onClick={logout}>Logout</button>
        </div>
    )
}
```

### **Show User Projects:**
```javascript
import { useState, useEffect } from 'react'
import apiService from '../services/apiService'

function Dashboard() {
    const [projects, setProjects] = useState([])
    
    useEffect(() => {
        const loadProjects = async () => {
            const response = await apiService.getProjects()
            setProjects(response.data)
        }
        loadProjects()
    }, [])
    
    return (
        <div>
            {projects.map(project => (
                <div key={project._id}>{project.name}</div>
            ))}
        </div>
    )
}
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Token saved in localStorage
- [ ] Protected routes redirect to login when not authenticated
- [ ] Can access dashboard when logged in
- [ ] Logout works and clears token
- [ ] No CORS errors in console
- [ ] No authentication errors in console

---

**All set!** Frontend is now connected to the MongoDB backend with full authentication! 🎉

Next step: Update individual agents to save data to database instead of localStorage.
