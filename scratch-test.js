require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        // The SDK doesn't have a direct listModels, we usually use the v1 API
        // But we can try to hit a known model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-flash");
    } catch (e) {
        console.log("Error with gemini-1.5-flash:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-pro");
    } catch (e) {
        console.log("Error with gemini-1.5-pro:", e.message);
    }
}

listModels();
