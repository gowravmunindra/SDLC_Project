// Test script to check available Gemini models
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.VITE_GEMINI_API_KEY || 'REPLACE_WITH_YOUR_API_KEY'

async function testModels() {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    console.log('Testing model: gemini-1.5-pro...')
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
        const result = await model.generateContent('Say hello')
        const response = await result.response
        console.log('✅ gemini-1.5-pro works!')
        console.log('Response:', response.text())
    } catch (error) {
        console.error('❌ gemini-1.5-pro failed:', error.message)
    }
    
    console.log('\nTesting model: gemini-pro...')
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
        const result = await model.generateContent('Say hello')
        const response = await result.response
        console.log('✅ gemini-pro works!')
        console.log('Response:', response.text())
    } catch (error) {
        console.error('❌ gemini-pro failed:', error.message)
    }
}

testModels()
