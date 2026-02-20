import { useState, useRef, useEffect } from 'react'
import huggingFaceService from '../services/huggingFaceService'
import { chatbotPrompt } from '../utils/promptTemplates'

function ChatbotAgent() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'Hi! 👋 I\'m your AI SDLC Guide. I\'m here to help you understand software development concepts and guide you through the platform. Feel free to ask me anything!',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    // Dragging state
    const [position, setPosition] = useState({
        x: window.innerWidth - 180,
        y: window.innerHeight - 80
    })
    const [isDragging, setIsDragging] = useState(false)
    const [hasDragged, setHasDragged] = useState(false)
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 })

    // Handle window resize to keep button in view
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 60),
                y: Math.min(prev.y, window.innerHeight - 60)
            }))
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const onMouseDown = (e) => {
        setIsDragging(true)
        setHasDragged(false)
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        }
    }

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isDragging) return

            const dx = e.clientX - dragRef.current.startX
            const dy = e.clientY - dragRef.current.startY

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                setHasDragged(true)
            }

            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.initialX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.initialY + dy))
            })
        }

        const onMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [isDragging])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const quickQuestions = [
        { id: 1, text: 'What is SDLC?', icon: '📚' },
        { id: 2, text: 'How do I start?', icon: '🚀' },
        { id: 3, text: 'What are requirements?', icon: '📋' },
        { id: 4, text: 'Explain system design', icon: '🎨' },
        { id: 5, text: 'Testing best practices', icon: '🧪' },
        { id: 6, text: 'What\'s next for me?', icon: '🎯' }
    ]

    const knowledgeBase = {
        'what is sdlc': {
            title: 'Software Development Life Cycle (SDLC)',
            response: `SDLC is a structured process for building software. Think of it like building a house:

🏗️ **6 Main Phases:**

1. **Requirements** - What do you want to build? (Like creating blueprints)
2. **Design** - How will you build it? (Choosing materials and structure)
3. **Development** - Actually building it (Construction phase)
4. **Testing** - Making sure it works (Quality inspection)
5. **Deployment** - Moving in (Going live)
6. **Maintenance** - Keeping it in good shape (Ongoing care)

Each phase builds on the previous one, ensuring a solid, well-planned product!`
        },
        'how do i start': {
            title: 'Getting Started Guide',
            response: `Great question! Here's your step-by-step guide:

**Step 1: Click "Get Started" or "Launch Platform"**
This opens the SDLC Dashboard where you'll see all 6 phases.

**Step 2: Start with Requirements Analysis**
Click "Start Phase" on the first card. The Requirements Agent will help you:
- Describe your project idea
- Generate functional requirements
- Identify stakeholders
- Document assumptions

**Step 3: Follow the Flow**
Each phase unlocks after you complete the previous one. Just follow the natural progression!

**Pro Tip:** Don't rush! Take time to review and edit what each agent generates. The better your inputs, the better your outputs! 🎯`
        },
        'what are requirements': {
            title: 'Understanding Requirements',
            response: `Requirements are like a shopping list for your software project. They describe WHAT you want to build.

**Two Main Types:**

📋 **Functional Requirements (FRs)**
What the system should DO:
- "Users can register and login"
- "System sends email notifications"
- "Users can upload profile pictures"

⚡ **Non-Functional Requirements (NFRs)**
HOW the system should perform:
- **Performance:** "Page loads in under 2 seconds"
- **Security:** "Passwords must be encrypted"
- **Usability:** "Interface works on mobile devices"

**Why They Matter:**
Clear requirements prevent confusion, save time, and ensure everyone knows what to build! Think of them as your project's foundation. 🏗️`
        },
        'explain system design': {
            title: 'System Design Explained',
            response: `System Design is the blueprint for HOW you'll build your software.

**Key Components:**

🏗️ **Architecture**
- Monolithic (all-in-one) vs Microservices (separate pieces)
- Like choosing between a single building vs a campus

🧩 **Components**
- Breaking your system into manageable parts
- Each component has a specific job

📊 **Diagrams**
- **Use Case:** Who uses the system and how?
- **Class:** What objects/data do you need?
- **Sequence:** How do processes flow?

🗄️ **Database Schema**
- How you'll store and organize data
- Tables, columns, relationships

**Think of it as:**
Requirements = WHAT to build
Design = HOW to build it

Good design makes development easier and faster! 🎨`
        },
        'testing best practices': {
            title: 'Testing Best Practices',
            response: `Testing ensures your software actually works! Here are the essentials:

🧪 **Testing Pyramid:**

1. **Unit Tests (Most)** - 70%
   - Test individual functions
   - Fast and cheap
   - Example: "Does login validation work?"

2. **Integration Tests (Medium)** - 20%
   - Test components working together
   - Example: "Does frontend connect to backend?"

3. **E2E Tests (Least)** - 10%
   - Test complete user flows
   - Slow but comprehensive
   - Example: "Can user register, login, and update profile?"

**Golden Rules:**
✅ Test early and often
✅ Test both success AND failure cases
✅ Automate repetitive tests
✅ Test edge cases (empty inputs, special characters)
✅ Aim for 80%+ code coverage

**Remember:** A bug found in testing is cheaper than one found in production! 🐛`
        },
        'what\'s next for me': {
            title: 'Your Next Steps',
            response: `Let me check where you are and guide you forward!

**If you haven't started:**
1. Click "Get Started" on the homepage
2. Begin with Requirements Analysis
3. Describe your project idea

**If you're in Requirements:**
- Complete your project description
- Review generated requirements
- Edit/add as needed
- Click "Complete & Save"

**If you're in Design:**
- Review the architecture recommendation
- Explore components and diagrams
- Check the database schema
- Complete when satisfied

**If you're in Development:**
- Review the tech stack
- Study code snippets
- Copy useful code
- Learn best practices

**If you're in Testing:**
- Review test cases
- Check edge cases
- Understand risk areas
- Complete the test plan

**General Tip:** Each phase builds on the previous one. Don't skip ahead - the sequential flow ensures quality! 🎯`
        },
        'requirements agent': {
            title: 'Requirements Agent Guide',
            response: `The Requirements Agent helps you define WHAT to build.

**What it does:**
✅ Analyzes your project description
✅ Generates Functional Requirements (FRs)
✅ Creates Non-Functional Requirements (NFRs)
✅ Identifies stakeholders
✅ Documents assumptions and constraints

**How to use it:**
1. Describe your project in plain English
2. Click "Analyze Requirements"
3. Review what's generated
4. Edit, add, or remove requirements
5. Export or complete when ready

**Pro Tips:**
- Be specific in your description
- Mention key features you want
- Think about who will use it
- Don't worry about technical details yet

The agent understands natural language, so just explain your idea like you're talking to a friend! 💬`
        },
        'design agent': {
            title: 'Design Agent Guide',
            response: `The Design Agent transforms requirements into technical architecture.

**What it generates:**
🏗️ Architecture (Monolithic vs Microservices)
🧩 System Components
📊 UML Diagrams (Use Case, Class, Sequence)
🗄️ Database Schema

**How it helps:**
- Recommends best architecture for your needs
- Breaks system into manageable components
- Visualizes system structure
- Designs database tables

**Navigation:**
Use the tabs to explore:
- **Architecture:** See the big picture
- **Components:** Understand each part
- **Diagrams:** Visualize interactions
- **Database:** Review data structure

**Why it matters:**
Good design = Easier development + Better performance + Lower costs! 🎨`
        },
        'development agent': {
            title: 'Development Agent Guide',
            response: `The Development Agent gives you code and guidance to start building.

**What you get:**
🛠️ **Tech Stack** - 25+ recommended technologies
📁 **Folder Structure** - Complete project organization
💾 **Code Snippets** - Production-ready examples
🔌 **API Contracts** - Complete API documentation
✅ **Best Practices** - 30+ development guidelines

**How to use it:**
1. Review recommended technologies
2. Set up your project structure
3. Copy code snippets you need
4. Follow API contracts for endpoints
5. Apply best practices

**Pro Tip:**
You can copy any code snippet with one click! Use them as starting points and customize for your needs. 💻`
        },
        'testing agent': {
            title: 'Testing Agent Guide',
            response: `The Testing Agent creates comprehensive test plans for quality assurance.

**What it generates:**
📋 Test Strategy
✅ Detailed Test Cases
🔗 Integration Tests
⚠️ Edge Cases & Boundary Tests
🎯 Risk Areas & Mitigation

**Test Case Structure:**
Each test case includes:
- Priority (High/Medium/Low)
- Preconditions
- Step-by-step instructions
- Expected results
- Test data

**Why testing matters:**
- Catches bugs early (cheaper to fix!)
- Ensures quality
- Builds user confidence
- Reduces production issues

**Remember:** Good testing = Happy users! 🧪`
        },
        'best practices': {
            title: 'SDLC Best Practices',
            response: `Here are the golden rules for successful software development:

**1. Start with Clear Requirements** 📋
- Know WHAT before HOW
- Get stakeholder buy-in
- Document everything

**2. Design Before Coding** 🎨
- Plan your architecture
- Think about scalability
- Consider security early

**3. Write Clean Code** 💻
- Use meaningful names
- Keep functions small
- Comment complex logic
- Follow coding standards

**4. Test Thoroughly** 🧪
- Test as you build
- Cover edge cases
- Automate tests
- Aim for high coverage

**5. Version Control** 🔀
- Use Git
- Commit often
- Write clear messages
- Use branches

**6. Continuous Learning** 📚
- Stay updated
- Learn from mistakes
- Share knowledge
- Ask questions

**Remember:** Quality over speed! 🎯`
        }
    }

    const findBestMatch = (userInput) => {
        const input = userInput.toLowerCase().trim()

        // Direct matches
        for (const [key, value] of Object.entries(knowledgeBase)) {
            if (input.includes(key)) {
                return value
            }
        }

        // Keyword matching
        if (input.includes('requirement') || input.includes('fr') || input.includes('nfr')) {
            return knowledgeBase['what are requirements']
        }
        if (input.includes('design') || input.includes('architecture') || input.includes('diagram')) {
            return knowledgeBase['explain system design']
        }
        if (input.includes('test') || input.includes('qa') || input.includes('quality')) {
            return knowledgeBase['testing best practices']
        }
        if (input.includes('start') || input.includes('begin') || input.includes('first')) {
            return knowledgeBase['how do i start']
        }
        if (input.includes('next') || input.includes('what now') || input.includes('continue')) {
            return knowledgeBase['what\'s next for me']
        }
        if (input.includes('code') || input.includes('develop') || input.includes('build')) {
            return knowledgeBase['development agent']
        }
        if (input.includes('practice') || input.includes('tip') || input.includes('advice')) {
            return knowledgeBase['best practices']
        }

        return null
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputValue,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        const currentInput = inputValue
        setInputValue('')
        setIsTyping(true)

        try {
            // Try AI response first
            const conversationHistory = messages.slice(-5) // Last 5 messages for context
            const prompt = chatbotPrompt(currentInput, conversationHistory)

            const responseText = await huggingFaceService.generateContent(prompt)

            const botResponse = {
                id: messages.length + 2,
                type: 'bot',
                text: responseText,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, botResponse])
            setIsTyping(false)
        } catch (error) {
            console.error('Chatbot error:', error)

            // Fallback to knowledge base on error
            const match = findBestMatch(currentInput)

            let botResponse
            if (match) {
                botResponse = {
                    id: messages.length + 2,
                    type: 'bot',
                    title: match.title,
                    text: match.response,
                    timestamp: new Date()
                }
            } else {
                botResponse = {
                    id: messages.length + 2,
                    type: 'bot',
                    text: `I'm having trouble connecting to AI services right now. Here are some things I can help with:\n\n📚 Explain SDLC concepts\n🚀 Guide you through the platform\n📋 Explain requirements, design, development, testing\n🎯 Suggest next steps\n✅ Share best practices\n\nTry asking one of the quick questions below, or rephrase your question!`,
                    timestamp: new Date()
                }
            }

            setMessages(prev => [...prev, botResponse])
            setIsTyping(false)
        }
    }

    const handleQuickQuestion = (question) => {
        setInputValue(question)
        handleSendMessage()
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <>
            {/* Floating Chat Button - Movable */}
            {!isOpen && (
                <button
                    className={`chatbot-toggle ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={onMouseDown}
                    onClick={() => {
                        if (!hasDragged) setIsOpen(true)
                    }}
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        bottom: 'auto',
                        right: 'auto',
                        position: 'fixed'
                    }}
                >
                    <span className="chatbot-icon">💬</span>
                    <span className="chatbot-badge">AI Guide</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">🤖</div>
                            <div>
                                <h4>AI SDLC Guide</h4>
                                <p className="chatbot-status">
                                    <span className="status-dot"></span>
                                    Online & Ready to Help
                                </p>
                            </div>
                        </div>
                        <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 5L5 15M5 5L15 15" />
                            </svg>
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((message) => (
                            <div key={message.id} className={`message message-${message.type}`}>
                                {message.type === 'bot' && (
                                    <div className="message-avatar">🤖</div>
                                )}
                                <div className="message-content">
                                    {message.title && (
                                        <div className="message-title">{message.title}</div>
                                    )}
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                {message.type === 'user' && (
                                    <div className="message-avatar user-avatar">👤</div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="message message-bot">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length <= 2 && (
                        <div className="quick-questions">
                            <p className="quick-questions-label">Quick questions:</p>
                            <div className="quick-questions-grid">
                                {quickQuestions.map((q) => (
                                    <button
                                        key={q.id}
                                        className="quick-question-btn"
                                        onClick={() => {
                                            setInputValue(q.text)
                                            setTimeout(handleSendMessage, 100)
                                        }}
                                    >
                                        <span className="qq-icon">{q.icon}</span>
                                        <span className="qq-text">{q.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask me anything about SDLC..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            className="chatbot-send"
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M2 10L18 2L10 18L9 11L2 10Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default ChatbotAgent
