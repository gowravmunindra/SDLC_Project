const axios = require('axios');

async function testAI() {
    try {
        console.log('Testing AI endpoint: http://localhost:5001/api/ai/generate-json');
        const response = await axios.post('http://localhost:5001/api/ai/generate-json', {
            prompt: 'Generate a simple JSON object { "test": true }'
        });
        console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testAI();
