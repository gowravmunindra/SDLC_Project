// Backend Server Entry
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const morgan  = require('morgan')

const connectDB      = require('./config/db')
const { errorHandler } = require('./middleware/errorHandler')

// Connect to MongoDB
connectDB()

const app = express()

// ── Security & Logging Middleware ─────────────────────────────────────────────
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false }))

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'))
app.use('/api/projects',    require('./routes/projectRoutes'))
app.use('/api/ai',          require('./routes/aiRoutes'))
app.use('/api/development', require('./routes/developmentRoutes'))
app.use('/api/vibe-coding', require('./routes/vibeCodingRoutes'))
app.use('/api/guide',       require('./routes/aiGuideRoutes'))

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() })
})

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   AI Engine   : Mistral Large\n`)
})

// Increase timeout to 10 minutes for heavy AI generation requests
server.timeout = 600000

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`)
    server.close(() => {
        console.log('HTTP server closed.')
        process.exit(0)
    })
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

