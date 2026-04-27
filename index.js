require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
    console.log('🚪 Process exiting with code:', code);
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ===== Gemini AI Setup =====
const API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.warn('⚠️  GEMINI_API_KEY belum dikonfigurasi di file .env');
} else {
    const maskedKey = `${API_KEY.substring(0, 6)}...${API_KEY.substring(API_KEY.length - 4)}`;
    console.log(`🔑 API Key terdeteksi: ${maskedKey}`);
}

const genAI = new GoogleGenerativeAI(API_KEY || 'placeholder');

// System Instruction — Tuned "Budi" Persona (Stage 3)
const SYSTEM_INSTRUCTION = `Kamu adalah 'Budi', seorang Senior Engineering Manager dengan pengalaman 12+ tahun di perusahaan Tech ternama di Indonesia (pernah bekerja di Tokopedia, Gojek, dan sekarang di startup unicorn).

KEPRIBADIAN & GAYA BAHASA:
- Profesional tapi santai dan suportif. Gunakan kata 'saya' dan 'kamu'.
- Sesekali gunakan istilah anak IT: 'deploy', 'bug', 'sprint', 'agile', 'PR', 'code review', 'production', 'staging'.
- Berikan jawaban yang terstruktur dengan poin-poin atau langkah-langkah.
- Gunakan emoji secukupnya untuk membuat percakapan lebih hidup (🚀, 💡, ✅, 🎯).
- Jika user bertanya di luar topik karir IT, arahkan kembali dengan sopan.

KEMAMPUAN UTAMA:
1. **Chat Mentor** — Memberikan tips karir IT, saran profesional, roadmap belajar, dan motivasi.
2. **Simulasi Interview** — Jika user meminta simulasi interview:
   - Berikan pertanyaan teknis SATU PER SATU.
   - Tunggu jawaban user sebelum memberikan pertanyaan berikutnya.
   - Berikan feedback konstruktif setelah setiap jawaban.
3. **Review CV** — Jika user meminta review CV:
   - Berikan kritik membangun (roasting halus namun solutif).
   - Analisis berdasarkan standar ATS.

FORMAT RESPONS:
- Gunakan **bold** untuk penekanan penting.
- Gunakan bullet points untuk list.
- Untuk code snippet, gunakan backtick.`;

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 1024,
};

// Verify connection at startup
/*
async function verifyConnection() {
    if (!API_KEY || API_KEY === 'your_api_key_here') return;
    try {
        await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }] });
        console.log('✅ Gemini API connection verified.');
    } catch (error) {
        console.error('❌ Gemini API Verification Failed:', error.message);
        if (error.message.includes('404') || error.message.includes('not found')) {
            console.error('💡 Tip: Pastikan model "gemini-1.5-flash" tersedia untuk API Key kamu atau coba aktifkan "Generative Language API" di Google Cloud Console.');
        }
    }
}
verifyConnection();
*/

// ===== Chat History Store (in-memory per session) =====
const chatSessions = new Map();

function getOrCreateSession(sessionId) {
    if (!chatSessions.has(sessionId)) {
        chatSessions.set(sessionId, []);
    }
    return chatSessions.get(sessionId);
}

// ===== Routes =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        apiKeyConfigured: !!(API_KEY && API_KEY !== 'your_api_key_here'),
        model: 'gemini-1.5-flash',
    });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get conversation history for this session
        const history = getOrCreateSession(sessionId);

        const chatSession = model.startChat({
            generationConfig,
            history: history,
        });

        const result = await chatSession.sendMessage(message);
        const response = result.response;
        const text = response.text();

        // Save to history for conversation memory
        history.push(
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: text }] }
        );

        // Limit history to last 20 exchanges (40 entries) to prevent memory bloat
        if (history.length > 40) {
            history.splice(0, history.length - 40);
        }

        res.json({ reply: text });
    } catch (error) {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] Error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync('error.log', logMsg);
        
        console.error('Error in /api/chat:', error.message || error);
        
        const isApiKeyError = error.message?.toLowerCase().includes('api_key') || 
                             error.message?.toLowerCase().includes('api key') ||
                             error.message?.toLowerCase().includes('invalid') ||
                             error.message?.toLowerCase().includes('expired');

        res.status(isApiKeyError ? 401 : 500).json({
            error: isApiKeyError
                ? 'API Key tidak valid atau bermasalah. Periksa konfigurasi GEMINI_API_KEY di file .env'
                : 'Gagal mendapatkan respons dari AI. Coba lagi nanti.'
        });
    }
});

// Clear chat history
app.post('/api/clear', (req, res) => {
    const { sessionId = 'default' } = req.body;
    chatSessions.delete(sessionId);
    res.json({ status: 'cleared' });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 KarierKu AI Server running at http://localhost:${port}`);
    console.log(`📋 API Health: http://localhost:${port}/api/health`);
});
