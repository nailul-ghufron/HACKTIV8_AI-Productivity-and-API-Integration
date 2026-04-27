require('dotenv').config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

async function testOllama() {
    console.log(`🤖 Testing Ollama di: ${OLLAMA_HOST}`);
    console.log(`🧠 Model          : ${OLLAMA_MODEL}`);
    console.log('');

    // 1. Cek apakah Ollama berjalan dan model tersedia
    try {
        const tagsRes = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!tagsRes.ok) throw new Error(`HTTP ${tagsRes.status}`);
        const tagsData = await tagsRes.json();
        const models = (tagsData.models || []).map(m => m.name);
        console.log('✅ Ollama berjalan!');
        console.log(`📦 Model tersedia: ${models.join(', ') || '(tidak ada)'}`);

        const modelAvailable = models.some(m => m.startsWith(OLLAMA_MODEL.split(':')[0]));
        if (!modelAvailable) {
            console.warn(`\n⚠️  Model "${OLLAMA_MODEL}" belum diunduh.`);
            console.warn(`💡 Jalankan: ollama pull ${OLLAMA_MODEL}`);
            return;
        }
    } catch (err) {
        console.error(`\n❌ Tidak dapat terhubung ke Ollama: ${err.message}`);
        console.error('💡 Pastikan Ollama berjalan dengan: ollama serve');
        return;
    }

    // 2. Test chat dengan persona Budi
    console.log('\n💬 Testing chat...');
    try {
        const chatRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'Kamu adalah Budi, seorang Senior Engineering Manager. Jawab singkat dan ramah.'
                    },
                    {
                        role: 'user',
                        content: 'Halo Budi, perkenalkan diri kamu dalam 2 kalimat!'
                    }
                ],
                stream: false,
                options: { temperature: 0.7, num_predict: 200 },
            }),
        });

        if (!chatRes.ok) {
            const errText = await chatRes.text();
            throw new Error(`Ollama error ${chatRes.status}: ${errText}`);
        }

        const data = await chatRes.json();
        const reply = data.message?.content || '(tidak ada respons)';

        console.log('✅ Chat berhasil!');
        console.log('\n--- Respons Budi ---');
        console.log(reply);
        console.log('--------------------');
    } catch (err) {
        console.error(`\n❌ Chat gagal: ${err.message}`);
    }
}

testOllama();
