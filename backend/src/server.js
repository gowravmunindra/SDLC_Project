// Backend Server Entry
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const { errorHandler } = require('./middleware/errorHandler')

// Connect to database
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/projects', require('./routes/projectRoutes'))
app.use('/api/ai', require('./routes/aiRoutes'))
app.use('/api/development', require('./routes/developmentRoutes'))
app.use('/api/vibe-coding', require('./routes/vibeCodingRoutes'))
app.use('/api/guide', require('./routes/aiGuideRoutes'))

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' })
})


// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
