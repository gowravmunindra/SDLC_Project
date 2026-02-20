const vibeCodingService = require('./src/services/vibeCodingService');
require('dotenv').config();

async function testUpdate() {
    console.log('Testing VibeCodingService.updateProject...');
    const userPrompt = 'add a login page';
    const currentFiles = [
        { path: 'src/App.js', code: 'import React from "react"; function App() { return <div>Home</div>; } export default App;' }
    ];

    try {
        const result = await vibeCodingService.updateProject(userPrompt, currentFiles);
        console.log('Update Result Success:', !!result);
        console.log('Summary:', result.summary);
        console.log('Files changed:', result.files.length);
    } catch (error) {
        console.error('Update Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testUpdate();
