// Test script to verify LLM API key
require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

async function testApiKey() {
    const apiKey = process.env.LLM_API_KEY;

    console.log('='.repeat(60));
    console.log('🔑 LLM API KEY VERIFICATION TEST');
    console.log('='.repeat(60));
    console.log('\n📋 Configuration:');
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);
    console.log(`   Endpoint: https://apifreellm.com/api/v1/chat`);

    if (!apiKey || apiKey === 'apf_your_actual_key_here') {
        console.log('\n❌ ERROR: API key not configured properly!');
        console.log('   Please set LLM_API_KEY in backend/.env');
        return;
    }

    console.log('\n🚀 Testing API connection...\n');

    try {
        const response = await axios.post('https://apifreellm.com/api/v1/chat', {
            message: 'Hello, please respond with just "API key is working!"',
            model: 'apifreellm'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ SUCCESS! API Key is working!');
        console.log('\n📨 Response Details:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response Keys: ${Object.keys(response.data).join(', ')}`);

        // Try to extract the text from different possible response formats
        const text = response.data.text ||
            response.data.response ||
            response.data.content ||
            response.data.message ||
            JSON.stringify(response.data);

        console.log(`\n💬 AI Response:`);
        console.log(`   ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ API KEY VERIFICATION PASSED');
        console.log('='.repeat(60));

    } catch (error) {
        console.log('❌ FAILED! API Key test failed!');
        console.log('\n📋 Error Details:');
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Message: ${error.message}`);

        if (error.response?.status === 401) {
            console.log('\n🔴 ERROR: Invalid API Key');
            console.log('   Your API key is not valid or has expired.');
            console.log('   Please check your LLM_API_KEY in backend/.env');
        } else if (error.response?.status === 429) {
            console.log('\n🟡 WARNING: Rate Limit Exceeded');
            console.log('   Please wait before trying again.');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.log('\n🔴 ERROR: Cannot connect to API');
            console.log('   Check your internet connection.');
        } else {
            console.log('\n🔴 ERROR: Unknown error occurred');
            console.log(`   Full error: ${JSON.stringify(error.response?.data || error.message)}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('❌ API KEY VERIFICATION FAILED');
        console.log('='.repeat(60));
    }
}

// Run the test
testApiKey();
