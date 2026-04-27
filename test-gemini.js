require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testApi() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        console.error('❌ Error: GEMINI_API_KEY is not set in .env file.');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('Testing Gemini API...');
        const result = await model.generateContent("Halo Budi, perkenalkan diri kamu!");
        const response = result.response;
        console.log('✅ API Connection Successful!');
        console.log('Response:', response.text());
    } catch (error) {
        console.error('❌ API Connection Failed:', error.message);
    }
}

testApi();
