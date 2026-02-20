const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from frontend
dotenv.config({ path: path.join(__dirname, 'frontend', '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testGemini() {
    if (!API_KEY) {
        console.error('No GEMINI_API_KEY found in frontend/.env');
        return;
    }
    console.log('Testing Gemini API Key...');
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('Say hello world');
        const response = await result.response;
        console.log('✅ Success! Response:', response.text());
    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
    }
}

testGemini();
