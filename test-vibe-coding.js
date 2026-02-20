const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testVibeCoding() {
    console.log('Testing Vibe Coding Project Generation...');
    try {
        const response = await axios.post('http://localhost:5000/api/vibe-coding/generate-project', {
            userPrompt: "Create a simple React todo list app with a Node backend"
        });

        if (response.data.success) {
            console.log('✅ Success!');
            console.log('Structure:', JSON.stringify(response.data.structure, null, 2).substring(0, 500) + '...');
            console.log('Files Generated:', response.data.files.length);
            console.log('Sample File (src/App.jsx):', response.data.files.find(f => f.path.includes('App.jsx'))?.code?.substring(0, 200) + '...');
        } else {
            console.log('❌ Failed:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Error hitting endpoint:', error.response?.data || error.message);
    }
}

// Note: This requires the server to be running
console.log('NOTE: Ensure backend server is running on port 5000 before running this test.');
// testVibeCoding();
