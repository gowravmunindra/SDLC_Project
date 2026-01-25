# 🤗 Hugging Face AI Integration - Setup Guide

## Why Hugging Face Instead of Gemini?

✅ **Better Free Tier** - More generous rate limits  
✅ **No Token Limits** - Unlike Gemini's 20 requests/day free tier  
✅ **Powerful Models** - Access to Qwen, Mixtral, Llama, and more  
✅ **100% Free** - Inference API is completely free for most models  

---

## 🚀 Quick Setup (3 Minutes)

### **Step 1: Get Your Hugging Face API Key** (1 min)

1. Visit: https://huggingface.co/settings/tokens
2. Sign up or log in with your account
3. Click **"New token"**
4. Give it a name (e.g., "SDLC Project")
5. Select **"Read"** permissions (sufficient for inference)
6. Click **"Generate token"**
7. **Copy the token** (starts with `hf_...`)

### **Step 2: Configure Environment** (30 sec)

Open `frontend/.env` and add your token:

```bash
VITE_HF_API_KEY=hf_YourActualTokenHere
```

### **Step 3: Restart Dev Server** (30 sec)

```bash
npm run dev
```

**That's it!** 🎉 Your app now uses Hugging Face AI.

---

## 🤖 Current Model

**Model**: `Qwen/Qwen2.5-72B-Instruct`

- ✅ 72 billion parameters
- ✅ Excellent instruction following
- ✅ Great for JSON generation
- ✅ Completely free
- ✅ Fast inference

### **Alternative Models**

You can switch models by editing `src/services/huggingFaceService.js`:

```javascript
// Line 13 - change this.model to:

// Faster, lighter (7B params)
this.model = 'mistralai/Mistral-7B-Instruct-v0.3'

// Most powerful open model (405B params,slower)
this.model = 'meta-llama/Meta-Llama-3.1-405B-Instruct'

// Balanced (70B params)
this.model = 'meta-llama/Meta-Llama-3.1-70B-Instruct'

// Fast and efficient (8x7B MoE)
this.model = 'mistralai/Mixtral-8x7B-Instruct-v0.1'
```

---

## 📊 API Limits & Pricing

### **Free Tier** (Current)
- **Rate Limit**: ~100 requests/hour
- **Cost**: $0 (completely free)
- **Token Limit**: No hard limit
- **Models**: All open-source models

### **Pro Tier** ($9/month - Optional)
- **Rate Limit**: Higher priority
- **Cost**: $9/month
- **Benefits**: Faster inference, no queuing

**Recommendation**: Start with free tier - it's more than enough!

---

## ✅ What's Integrated

All 5 agents now use Hugging Face:

1. **Requirements Agent** ✅
2. **Design Agent** ✅
3. **Development Agent** ✅
4. **Testing Agent** ✅
5. **Chatbot Agent** ✅

---

## 🧪 Testing Your Setup

### **Test the Requirements Agent**:

1. Open app: http://localhost:5173
2. Click "Get Started"
3. Select "Requirements Agent"  
4. Enter a project description:
   ```
   Build an e-commerce platform for selling handmade crafts.
   Users should be able to browse products, add to cart, and checkout.
   Sellers can list their products and manage inventory.
   ```
5. Click "Analyze Requirements"
6. **Wait 10-15 seconds** (first request may be slower)
7. See AI-generated requirements! 🎉

### **Check Console (F12)**:

You should see:
```
Calling Hugging Face API...
✅ Response received
```

If you see errors, check:
- API key is correct in `.env`
- Dev server was restarted after adding key
- You have internet connection

---

## 🔧 Troubleshooting

### **"API key not configured" Error**

**Solution**:
```bash
# 1. Check .env file exists with key
# 2. Restart dev server
npm run dev
```

### **Slow Responses (>30 seconds)**

**Cause**: Model is "cold starting" (first request)

**Solution**:
- First request: 15-30 seconds (normal)
- Subsequent requests: 3-10 seconds
- Try a faster model (Mistral-7B) if needed

### **Rate Limit Errors**

**Cause**: Too many requests in short time

**Solution**:
- Wait 1 minute between requests
- Upgrade to HF Pro ($9/month) for higher limits
- Use a lighter model

### **JSON Parsing Errors**

**Solution**: Already handled with retry logic! The service will:
1. Try to parse JSON
2. If fails, auto-fix incomplete JSON
3. Retry up to 3 times
4. Fall back to template on final failure

---

## 💡 Pro Tips

### **Get Better AI Responses**

✅ **Detailed Prompts**:
```
Good: "E-commerce site for handmade crafts with seller
dashboard, buyer cart, payment integration via Stripe"

Bad: "Shopping website"
```

✅ **Be Specific**:
- Mention technologies you prefer
- List target users
- Note any constraints

### **Optimize Performance**

1. **Cache Results**: Agents already save to localStorage
2. **Edit Locally**: Modify AI outputs without re-calling API
3. **Batch Work**: Complete one agent fully before moving to next

### **Cost Management**

- **Free Tier**: Plenty for development and testing
- **Monitor Usage**: https://huggingface.co/settings/billing
- **No Costs**: Inference API is free for open models

---

## 🔄 Switching Models

Edit `src/services/huggingFaceService.js`:

```javascript
// Line 13
this.model = 'your-chosen-model'

// Examples:
// Fast: 'mistralai/Mistral-7B-Instruct-v0.3'
// Balanced: 'Qwen/Qwen2.5-72B-Instruct' (current)
// Powerful: 'meta-llama/Meta-Llama-3.1-405B-Instruct'
```

**Restart dev server** after changing model.

---

## 📈 Comparison: Gemini vs Hugging Face

| Feature | Gemini Free | Hugging Face Free |
|---------|-------------|-------------------|
| **Requests/Day** | 20 | ~1000+ |
| **Rate Limit** | Very restrictive | ~100/hour |
| **Models** | 1 (Gemini 2.5) | 100s (open source) |
| **Cost** | Free | Free |
| **Token Limit** | 16K output | 4K-16K (model dependent) |
| **Best For** | Quick tests | Production use |

**Winner**: 🤗 Hugging Face for this use case!

---

## 🎉 You're All Set!

Your SDLC platform now uses Hugging Face AI with:
- ✅ Better free tier limits
- ✅ Powerful open-source models
- ✅ No token restrictions
- ✅ Production-ready reliability

**Happy Building!** 🚀

---

## 📞 Support

**Issues?**
1. Check API key is correct
2. Verify internet connection
3. Review console errors (F12)
4. Try a different model if slow

**Documentation**:
- Hugging Face Docs: https://huggingface.co/docs/inference-api
- Model Hub: https://huggingface.co/models
- API Reference: https://huggingface.co/docs/api-inference
