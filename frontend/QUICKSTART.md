# 🚀 Quick Start Guide - Gemini AI Integration

## ⚡ 3-Minute Setup

### 1️⃣ Get Your API Key (1 min)
```
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key
```

### 2️⃣ Configure Environment (30 sec)
```bash
# Open file: frontend/.env
# Replace with your key:
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 3️⃣ Start the App (1 min)
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## ✅ Verification Checklist

**Test each agent:**
- [ ] Requirements: Enter project description → See AI generate requirements
- [ ] Design: Complete requirements → See AI create architecture  
- [ ] Development: Review tech stack and code snippets
- [ ] Testing: Check AI-generated test cases
- [ ] Chatbot: Ask "What is SDLC?" → Get AI response

---

## 🎯 What Changed

| Agent | Before | After |
|-------|--------|-------|
| **Requirements** | Keywords → Templates | AI Analysis → Custom Requirements |
| **Design** | Static Architecture | AI → Tailored System Design |
| **Development** | Generic Code | AI → Project-Specific Code |
| **Testing** | Template Tests | AI → Comprehensive Test Plan |
| **Chatbot** | Keyword Matching | AI → Real Conversation |

---

## 🔧 Files You Created

| File | Purpose | Action Needed |
|------|---------|---------------|
| `src/services/geminiService.js` | AI Integration | ✅ Done |
| `src/utils/promptTemplates.js` | AI Prompts | ✅ Done |
| `.env` | API Key Storage | ⚠️ **Add your API key** |
| `.env.example` | Template | ✅ Done |
| `.gitignore` | Security | ✅ Done |

---

## ⚠️ Important Notes

### **API Key Security**
- ✅ `.env` is in `.gitignore` (not tracked by git)
- ✅ Never commit API keys to version control
- ✅ For production, use backend proxy

### **API Usage**
- **Free Tier**: 60 requests/minute
- **Per Project**: ~4-10 API calls total
- **Cost**: Free for moderate usage
- **Monitor**: https://ai.google.dev/pricing

### **Error Handling**
- If API fails → Automatic fallback to templates
- If API key missing → Clear error message
- All agents work offline with fallbacks

---

## 💡 Usage Tips

### **Get Better AI Results**

✅ **Do This**:
```
"Build a social media platform for photographers to share 
portfolios, follow other artists, comment on photos, and 
sell prints. Target audience: professional photographers. 
Must support high-resolution images and mobile access."
```

❌ **Not This**:
```
"A social media app"
```

### **Optimize Performance**
1. **Use Cache**: Results saved to localStorage
2. **Edit Locally**: Modify AI output without re-calling API
3. **Export Data**: Download to avoid regeneration

---

## 🆘 Troubleshooting

### **"API key not configured" Error**
```bash
# Solution:
1. Check .env file exists
2. Verify API key is not empty
3. Restart dev server: npm run dev
```

### **AI Returns Weird Results**
```bash
# Try:
1. Provide more detailed project description
2. Check console for errors
3. Verify API key is valid
4. Use fallback templates if needed
```

### **Slow Response**
```bash
# Expected: 5-15 seconds per agent
# If longer:
1. Check internet connection
2. Verify API service status
3. Try shorter descriptions
```

---

## 📚 Documentation

- **Full Guide**: `GEMINI_SETUP.md`
- **Implementation**: `implementation_plan.md` (in artifacts)
- **Walkthrough**: `walkthrough.md` (in artifacts)

---

## 🎉 You're Ready!

1. ✅ Add your API key to `.env`
2. ✅ Run `npm run dev`
3. ✅ Test with a real project
4. ✅ Enjoy AI-powered SDLC! 🚀

---

**Need Help?** Check console logs or review documentation files.

**Happy Building!** 🎨💻🧪
