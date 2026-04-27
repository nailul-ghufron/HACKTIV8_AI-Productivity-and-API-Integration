// ===== DOM Elements =====
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileName = document.getElementById('file-name');
const fileRemove = document.getElementById('file-remove');
const uploadLabel = document.getElementById('upload-label');
const themeToggle = document.getElementById('theme-toggle');
const themeToggleMobile = document.getElementById('theme-toggle-mobile');
const themeLabel = document.getElementById('theme-label');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const modeBadge = document.getElementById('mode-badge-text');
const sidebarBtns = document.querySelectorAll('.sidebar__btn');
const welcomeCards = document.querySelectorAll('.welcome__card');

let currentMode = 'chat';
let selectedFile = null;
let isLoading = false;

// Session ID for conversation memory
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

// ===== Theme Management =====
function getStoredTheme() {
    return localStorage.getItem('karierku-theme') || 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karierku-theme', theme);
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
}

setTheme(getStoredTheme());

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

themeToggle.addEventListener('click', toggleTheme);
themeToggleMobile.addEventListener('click', toggleTheme);

// ===== Sidebar (Mobile) =====
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
});

// ===== Mode Switching =====
const modeLabels = {
    chat: '💬 Chat Mentor',
    interview: '🎯 Simulasi Interview',
    cv: '📄 Review CV'
};

sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        currentMode = mode;
        sidebarBtns.forEach(b => b.classList.remove('sidebar__btn--active'));
        btn.classList.add('sidebar__btn--active');
        modeBadge.textContent = modeLabels[mode];

        // Show/hide upload button based on mode
        uploadLabel.style.display = mode === 'cv' ? 'flex' : 'none';

        // Close mobile sidebar
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
});

// ===== Textarea Auto-resize =====
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    sendBtn.classList.toggle('active', userInput.value.trim().length > 0);
});

// ===== File Upload =====
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    fileName.textContent = file.name;
    filePreview.hidden = false;
});

fileRemove.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    filePreview.hidden = true;
});

// ===== Welcome Card Quick Prompts =====
welcomeCards.forEach(card => {
    card.addEventListener('click', () => {
        const prompt = card.dataset.prompt;
        userInput.value = prompt;
        sendBtn.classList.add('active');
        sendMessage();
    });
});

// ===== Format AI Response =====
function formatResponse(text) {
    let html = text
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .split('\n\n').map(p => p.trim()).filter(Boolean).join('</p><p>');
    
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// ===== Create Message Element =====
function createMessage(content, isUser) {
    const div = document.createElement('div');
    div.className = `message message--${isUser ? 'user' : 'ai'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'message__bubble';
    
    if (isUser) {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = formatResponse(content);
    }
    
    div.appendChild(avatar);
    div.appendChild(bubble);
    return div;
}

// ===== Typing Indicator =====
function showTyping() {
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="message__avatar" style="background:var(--accent-glow);color:var(--accent);">🤖</div>
        <div class="typing__dots">
            <div class="typing__dot"></div>
            <div class="typing__dot"></div>
            <div class="typing__dot"></div>
        </div>
    `;
    chatBox.appendChild(div);
    scrollToBottom();
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Build System Prompt Based on Mode =====
function buildMessage(userMsg) {
    if (currentMode === 'interview') {
        return `[MODE: SIMULASI INTERVIEW]\nUser meminta simulasi technical interview. Berikan pertanyaan interview satu per satu, tunggu jawaban user, lalu berikan feedback.\n\nUser: ${userMsg}`;
    }
    if (currentMode === 'cv') {
        return `[MODE: CV REVIEW]\nUser ingin review CV-nya. Berikan kritik membangun (roasting halus namun solutif) untuk memperbaiki CV agar lolos ATS.\n\nUser: ${userMsg}`;
    }
    return userMsg;
}

// ===== New Chat (clear history) =====
function startNewChat() {
    chatBox.innerHTML = '';
    chatBox.classList.remove('active');
    welcomeScreen.classList.remove('hidden');
    
    // Clear server-side history
    fetch('/api/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
    }).catch(() => {});
}

// Wire up the New Chat button if it exists
const newChatBtn = document.getElementById('btn-new-chat');
if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);

// ===== Send Message =====
async function sendMessage() {
    const text = userInput.value.trim();
    if ((!text && !selectedFile) || isLoading) return;

    // Hide welcome, show chat
    welcomeScreen.classList.add('hidden');
    chatBox.classList.add('active');

    // Display user message
    const displayText = selectedFile ? `${text}\n📎 ${selectedFile.name}` : text;
    chatBox.appendChild(createMessage(displayText || '(CV uploaded)', true));
    
    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.classList.remove('active');
    
    scrollToBottom();
    showTyping();
    isLoading = true;

    try {
        const messageToSend = buildMessage(text || 'Tolong review CV saya');

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageToSend, sessionId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }

        hideTyping();
        chatBox.appendChild(createMessage(data.reply, false));
    } catch (error) {
        hideTyping();
        chatBox.appendChild(createMessage(
            error.message || 'Maaf, terjadi kesalahan koneksi. Pastikan server berjalan dan API key sudah dikonfigurasi.',
            false
        ));
        console.error('Fetch error:', error);
    } finally {
        isLoading = false;
        selectedFile = null;
        fileInput.value = '';
        filePreview.hidden = true;
        scrollToBottom();
    }
}

// ===== Event Listeners =====
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Initial state: hide upload unless CV mode
uploadLabel.style.display = 'none';
