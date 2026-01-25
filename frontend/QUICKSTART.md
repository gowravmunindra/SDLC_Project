# 🚀 Quick Start Guide - Hugging Face AI Integration

## ⚡ 3-Minute Setup

### 1️⃣ Get Your API Key (1 min)
```
1. Visit: https://huggingface.co/settings/tokens
2. Sign up or log in
3. Click "New token"
4. Name it (e.g., "SDLC Project")
5. Select "Read" permissions
6. Copy the token (starts with hf_...)
```

### 2️⃣ Configure Environment (30 sec)
```bash
# Open file: frontend/.env
# Add your token:
VITE_HF_API_KEY=hf_YourActualTokenHere
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

## 🎯 What's New - Hugging Face

| Feature | Old (Gemini) | New (Hugging Face) |
|---------|--------------|---------------------|
| **Free Requests** | 20/day | 1000+/day |
| **Rate Limit** | Very low | ~100/hour |
| **Models** | 1 model | 100+ models |
| **Best For** | Testing | Production |

**Model**: Using `Qwen2.5-72B-Instruct` (72B parameters, free, powerful)

---

## 🔧 Files Created

| File | Purpose | Action Needed |
|------|---------|---------------|
| `src/services/huggingFaceService.js` | HF AI Integration | ✅ Done |
| `src/utils/promptTemplates.js` | AI Prompts | ✅ Done |
| `.env` | API Key Storage | ⚠️ **Add your HF token** |
| `HF_SETUP.md` | Full Guide | ✅ Done |

---

## ⚠️ Important Notes

### **API Key Security**
- ✅ `.env` is in `.gitignore` (not tracked by git)
- ✅ Never commit API keys
- ✅ Token is free and safe for frontend use

### **API Usage - FREE**
- **Free Tier**: ~100 requests/hour
- **Cost**: $0 (completely free)
- **No token limit**: Unlike Gemini's 20/day!

### **Error Handling**
- If API fails → Automatic fallback to templates
- If API key missing → Clear error message
- All agents work offline with fallbacks

---

## 💡 Usage Tips

### **Get Better AI Results**

✅ **Do This**:
```
"Build an e-commerce platform for handmade crafts.
Buyers can browse products, add to cart, and checkout.
Sellers can list products and manage inventory.
Payment via Stripe. Target: small artisan businesses."
```

❌ **Not This**:
```
"Shopping website"
```

### **Optimize Performance**
1. **First Request**: May take 15-30 seconds (model "cold start")
2. **Subsequent Requests**: 3-10 seconds
3. **Use Cache**: Results saved to localStorage
4. **Edit Locally**: Modify outputs without re-calling API

---

## 🆘 Troubleshooting

### **"API key not configured" Error**
```bash
# Solution:
1. Check .env file has: VITE_HF_API_KEY=hf_...
2. Restart dev server: npm run dev
3. Clear browser cache
```

### **Slow Response (>30 seconds)**
```bash
# First request is slow (normal)
# Model is "warming up"
# Subsequent requests are faster
```

### **Different Model (Optional)**
```bash
# Edit src/services/huggingFaceService.js line 13:

# Faster model (7B):
this.model = 'mistralai/Mistral-7B-Instruct-v0.3'

# Current model (72B):
this.model = 'Qwen/Qwen2.5-72B-Instruct'
```

---

## 📚 Documentation

- **Full Guide**: `HF_SETUP.md` (comprehensive)
- **Implementation**: `implementation_plan.md` (in artifacts)
- **Walkthrough**: `walkthrough.md` (in artifacts)
- **HF Docs**: https://huggingface.co/docs

---

## 🎉 You're Ready!

1. ✅ Add your HF token to `.env`
2. ✅ Run `npm run dev`
3. ✅ Test with a real project
4. ✅ Enjoy unlimited AI-powered SDLC! 🚀

---

**Need Help?** Check `HF_SETUP.md` or console logs (F12).

**Happy Building!** 🎨💻🧪🤗
