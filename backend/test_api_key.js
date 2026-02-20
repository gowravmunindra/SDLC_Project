const axios = require('axios');
require('dotenv').config({ path: './.env' });

async function test() {
    const key = process.env.LLM_API_KEY;
    console.log('Using Key:', key);
    if (!key) {
        console.error('LLM_API_KEY not found in .env');
        process.exit(1);
    }
    try {
        console.log('Sending request...');
        const response = await axios.post('https://apifreellm.com/api/v1/chat', {
            message: 'Hello, respond with {"status": "ok"} in JSON',
            model: 'apifreellm'
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        process.exit(1);
    }
}

test();
