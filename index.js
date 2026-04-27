require('dotenv').config();
const express = require('express');
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

// ===== Ollama AI Setup =====
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

console.log(`🤖 Ollama Host  : ${OLLAMA_HOST}`);
console.log(`🧠 Ollama Model : ${OLLAMA_MODEL}`);

// System Instruction — Tuned "Budi" Persona
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

// Verify Ollama connection at startup
async function verifyOllamaConnection() {
    try {
        const res = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const models = (data.models || []).map(m => m.name);
        const modelAvailable = models.some(m => m.startsWith(OLLAMA_MODEL.split(':')[0]));
        if (modelAvailable) {
            console.log(`✅ Ollama terkoneksi. Model "${OLLAMA_MODEL}" tersedia.`);
        } else {
            console.warn(`⚠️  Model "${OLLAMA_MODEL}" tidak ditemukan. Model tersedia: ${models.join(', ') || 'tidak ada'}`);
            console.warn(`💡 Jalankan: ollama pull ${OLLAMA_MODEL}`);
        }
    } catch (err) {
        console.error(`❌ Tidak dapat terhubung ke Ollama di ${OLLAMA_HOST}:`, err.message);
        console.error('💡 Pastikan Ollama sudah berjalan: ollama serve');
    }
}
verifyOllamaConnection();

// ===== Chat History Store (in-memory per session) =====
// Format: array of { role: 'user' | 'assistant' | 'system', content: string }
const chatSessions = new Map();

function getOrCreateSession(sessionId) {
    if (!chatSessions.has(sessionId)) {
        // Inject system prompt sebagai pesan pertama
        chatSessions.set(sessionId, [
            { role: 'system', content: SYSTEM_INSTRUCTION }
        ]);
    }
    return chatSessions.get(sessionId);
}

// ===== Routes =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: 'ollama',
        ollamaHost: OLLAMA_HOST,
        model: OLLAMA_MODEL,
    });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get conversation history (includes system prompt)
        const messages = getOrCreateSession(sessionId);

        // Tambahkan pesan user ke history
        messages.push({ role: 'user', content: message });

        // Kirim ke Ollama /api/chat
        const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: messages,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 1024,
                },
            }),
        });

        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            throw new Error(`Ollama error ${ollamaRes.status}: ${errText}`);
        }

        const data = await ollamaRes.json();
        const text = data.message?.content || '';

        // Simpan balasan asisten ke history
        messages.push({ role: 'assistant', content: text });

        // Batasi history: pertahankan system prompt + 20 exchange terakhir (41 entri)
        if (messages.length > 41) {
            const systemMsg = messages[0];
            messages.splice(1, messages.length - 41);
            if (messages[0] !== systemMsg) messages.unshift(systemMsg);
        }

        res.json({ reply: text });
    } catch (error) {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] Error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync('error.log', logMsg);

        console.error('Error in /api/chat:', error.message || error);

        const isConnectionError = error.message?.toLowerCase().includes('fetch') ||
                                  error.message?.toLowerCase().includes('econnrefused') ||
                                  error.message?.toLowerCase().includes('ollama');

        res.status(isConnectionError ? 503 : 500).json({
            error: isConnectionError
                ? `Tidak dapat terhubung ke Ollama di ${OLLAMA_HOST}. Pastikan Ollama sudah berjalan.`
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
