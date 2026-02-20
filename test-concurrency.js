const axios = require('axios');

async function testConcurrency() {
    const start = Date.now();
    console.log('Sending two concurrent requests to check queue logic...');

    const req1 = axios.post('http://localhost:5001/api/ai/generate', { prompt: 'Test 1' });
    const req2 = axios.post('http://localhost:5001/api/ai/generate', { prompt: 'Test 2' });

    try {
        const [res1, res2] = await Promise.all([req1, req2]);
        console.log('Request 1 finished at:', (Date.now() - start) / 1000, 's');
        console.log('Request 2 finished at:', (Date.now() - start) / 1000, 's');
    } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

testConcurrency();
