# 🚀 Smart SDLC Automation Platform - Gemini AI Integration Guide

## 🔧 Setup Instructions

### **Step 1: Get Your Gemini API Key**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key

### **Step 2: Configure Environment Variables**

1. Open the `.env` file in the `frontend` directory
2. Replace the placeholder with your actual API key:

```env
VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Important**: Never commit your API key to version control!

**Model Used**: The integration uses `gemini-2.5-flash` - Google's latest fast model (2026) optimized for speed and efficiency.

### **Step 3: Install Dependencies**

```bash
cd frontend
npm install
```

The Gemini SDK (`@google/generative-ai`) is already included in dependencies.

### **Step 4: Start the Development Server**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ✨ What's Changed - Gemini AI Integration

### **All 5 Agents Now Use Real AI**

#### 1. **Requirements Agent** 📋
- **Before**: Simple keyword matching
- **Now**: Gemini analyzes your project description and generates:
  - Detailed Functional Requirements
  - Comprehensive Non-Functional Requirements
  - Stakeholder identification
  - Assumptions and constraints
  - **Result**: Professional, context-aware requirements

#### 2. **Design Agent** 🎨
- **Before**: Hardcoded architecture templates
- **Now**: Gemini creates custom system design:
  - Architecture recommendations (Monolithic/Microservices)
  - Layer-based system design
  - Detailed components with interfaces
  - UML diagram data (Use Case, Class, Sequence)
  - Database schema tailored to your project
  - **Result**: Production-ready system architecture

#### 3. **Development Agent** 💻
- **Before**: Generic code snippets
- **Now**: Gemini generates project-specific:
  - Technology stack recommendations
  - Complete folder structure
  - Working code snippets for your project
  - API contracts with request/response formats
  - Best practices aligned with your tech stack
  - **Result**: Ready-to-implement development guide

#### 4. **Testing Agent** 🧪
- **Before**: Template test cases
- **Now**: Gemini creates comprehensive testing plan:
  - Multi-level test strategy
  - Detailed, executable test cases
  - Integration test scenarios
  - Critical edge cases and boundary tests
  - Risk analysis with mitigation
  - Requirements traceability matrix
  - **Result**: Complete QA strategy

#### 5. **ChatbotAgent** 💬
- **Before**: Static knowledge base with keyword matching
- **Now**: Gemini powers conversational AI:
  - Real-time Q&A on any SDLC topic
  - Context-aware responses
  - Remembers conversation history
  - Adapts to your current phase
  - **Result**: Intelligent, helpful guidance

---

## 🛡️ Error Handling

Each agent includes robust fallback mechanisms:

- **If API key is missing**: Clear error message with setup instructions
- **If API call fails**: Automatic fallback to basic templates
- **If JSON parsing fails**: Retry with validation
- **Network issues**: User-friendly error messages

---

## 🎯 Usage Tips

### **Get Better Results**

1. **Be Specific**: Provide detailed project descriptions
   - ✅ "A social media platform for photographers to share portfolios, follow artists, and comment on photos"
   - ❌ "A social media app"

2. **Include Context**: Mention target users, key features, and constraints
   - ✅ "Target audience: Professional photographers. Must support high-res images and mobile access."

3. **Review and Edit**: AI-generated content is editable - refine as needed

4. **Iterative Approach**: Start with requirements, review thoroughly before moving to design

### **API Usage Optimization**

- **Cache Results**: Agents save to localStorage to avoid redundant API calls
- **Edit Locally**: Modify AI-generated content without re-calling the API
- **Export Data**: Download artifacts to reuse without re-generation

---

## 🔍 Troubleshooting

### **"Gemini API key not configured" Error**

**Solution**: Ensure `.env` file exists with valid API key:
```env
VITE_GEMINI_API_KEY=your_actual_key_here
```

**Note**: Restart dev server after changing .env

### **"Failed to generate content" Error**

**Possible Causes**:
1. Invalid API key
2. API quota exceeded
3. Network connectivity issues

**Solution**:
- Verify API key is correct
- Check [API quota limits](https://ai.google.dev/pricing)
- Test internet connection

### **Slow Response Times**

**Expected Behavior**: AI generation takes 5-15 seconds depending on complexity

**If Taking Longer**:
- Check network speed
- Try with shorter project descriptions
- Verify API service status

---

## 📊 API Usage & Costs

### **Gemini Pro Model Pricing** (as of 2024)

- **Free Tier**: 60 requests per minute
- **Cost**: Free for moderate usage
- **Check Latest**: [Google AI Pricing](https://ai.google.dev/pricing)

### **Estimated API Calls Per Project**

- Requirements Analysis: 1 call
- System Design: 1 call
- Development Plan: 1 call
- Testing Plan: 1 call
- Chatbot: 1 call per question

**Total for Complete SDLC**: ~4-10 API calls

---

## 🔒 Security Best Practices

1. **Never Commit API Keys**: `.env` is in `.gitignore`
2. **Use Environment Variables**: API key loaded from `process.env`
3. **Frontend Limitation**: For production, consider backend proxy
4. **Rotate Keys**: Regenerate if exposed

---

## 🚀 Advanced Features

### **Streaming Responses** (Future)

The `geminiService.js` includes `generateContentStream()` for real-time updates:

```javascript
await geminiService.generateContentStream(prompt, (chunk) => {
    console.log(chunk) // Handle each text chunk
})
```

### **Custom Prompts**

Modify prompts in `src/utils/promptTemplates.js` to customize AI behavior.

---

## 📞 Support

**Issues with Integration?**
1. Check console for detailed error messages
2. Verify API key configuration
3. Review [Gemini API Documentation](https://ai.google.dev/docs)
4. Ask the AI Chatbot for help (if API is working)

---

## 🎉 Enjoy Your AI-Powered SDLC Platform!

With Gemini integration, your SDLC platform now provides:
- ✅ Intelligent, context-aware analysis
- ✅ Professional-grade artifacts
- ✅ Real-time conversational assistance
- ✅ Adaptive to any project type

**Happy Building!** 🚀
