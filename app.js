/* ==========================================
   ADINDA - AI Assistant
   Main Application Logic
   ========================================== */

// ==========================================
// STATE MANAGEMENT
// ==========================================
const AppState = {
    currentChatId: null,
    chats: {},
    settings: {
        provider: 'openrouter',
        model: 'anthropic/claude-3-haiku-20240307',
        apiKey: '',
        baseUrl: '',
        theme: 'dark',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2'
    },
    isTyping: false,
    attachedFile: null,
    todoTab: 'todo',
    
    // Initialize
    init() {
        this.load();
        this.setupEventListeners();
        this.renderChatHistory();
        this.applyTheme();
        this.loadSettings();
    },
    
    // Load from localStorage
    load() {
        const savedChats = localStorage.getItem('adinda_chats');
        const savedSettings = localStorage.getItem('adinda_settings');
        
        if (savedChats) {
            this.chats = JSON.parse(savedChats);
        }
        
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Load last chat
        const lastChat = localStorage.getItem('adinda_last_chat');
        if (lastChat && this.chats[lastChat]) {
            this.currentChatId = lastChat;
            this.loadChat(lastChat);
        }
    },
    
    // Save to localStorage
    save() {
        localStorage.setItem('adinda_chats', JSON.stringify(this.chats));
        localStorage.setItem('adinda_settings', JSON.stringify(this.settings));
        if (this.currentChatId) {
            localStorage.setItem('adinda_last_chat', this.currentChatId);
        }
    },
    
    // Load settings to UI
    loadSettings() {
        document.getElementById('apiProvider').value = this.settings.provider;
        document.getElementById('apiKeyInput').value = this.settings.apiKey;
        document.getElementById('baseUrlInput').value = this.settings.baseUrl;
        document.getElementById('ollamaUrl').value = this.settings.ollamaUrl;
        document.getElementById('ollamaModelSelect').value = this.settings.ollamaModel;
        
        // Update model badge
        this.updateModelBadge();
        
        // Show/hide provider-specific settings
        this.updateProviderSettings();
    },
    
    // Update model badge
    updateModelBadge() {
        const badge = document.getElementById('modelBadge');
        const nameEl = document.getElementById('currentModelName');
        
        badge.setAttribute('data-provider', this.settings.provider);
        
        let modelName = '';
        if (this.settings.provider === 'ollama') {
            modelName = this.settings.ollamaModel;
        } else {
            const modelSelect = document.getElementById('openrouterModelSelect');
            if (modelSelect) {
                modelSelect.value = this.settings.model;
            }
            modelName = this.settings.model.split('/').pop();
        }
        
        nameEl.textContent = modelName || 'Not configured';
    },
    
    // Update provider-specific settings visibility
    updateProviderSettings() {
        const provider = this.settings.provider;
        const ollamaSettings = document.getElementById('ollamaSettings');
        const customUrlGroup = document.getElementById('customUrlGroup');
        const openrouterModels = document.getElementById('openrouterModels');
        
        // Hide all first
        if (ollamaSettings) ollamaSettings.style.display = 'none';
        if (customUrlGroup) customUrlGroup.style.display = 'none';
        if (openrouterModels) openrouterModels.style.display = 'none';
        
        // Show relevant
        switch(provider) {
            case 'ollama':
                if (ollamaSettings) ollamaSettings.style.display = 'block';
                break;
            case 'custom':
                if (customUrlGroup) customUrlGroup.style.display = 'block';
                break;
            case 'openrouter':
            case 'openai':
            case 'anthropic':
            case 'groq':
                if (openrouterModels) openrouterModels.style.display = 'block';
                break;
        }
    },
    
    // Apply theme
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Update theme buttons
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        
        // New chat
        document.getElementById('newChatBtn').addEventListener('click', () => {
            this.newChat();
        });
        
        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Message input
        const input = document.getElementById('messageInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 150) + 'px';
        });
        
        // Voice input
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });
        
        document.getElementById('stopVoiceBtn').addEventListener('click', () => {
            this.stopVoiceInput();
        });
        
        // File attachment
        document.getElementById('attachFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
        
        document.getElementById('removeFileBtn').addEventListener('click', () => {
            this.removeAttachedFile();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme();
            this.save();
        });
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openModal('settingsModal');
        });
        
        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });
        
        document.getElementById('settingsBackdrop').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });
        
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });
        
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // API Provider change
        document.getElementById('apiProvider').addEventListener('change', (e) => {
            this.settings.provider = e.target.value;
            this.updateProviderSettings();
        });
        
        // Ollama model select
        document.getElementById('ollamaModelSelect').addEventListener('change', (e) => {
            const customGroup = document.getElementById('customModelGroup');
            if (customGroup) {
                customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });
        
        // Test Ollama connection
        document.getElementById('testOllamaBtn').addEventListener('click', () => {
            this.testOllamaConnection();
        });
        
        // Toggle API key visibility
        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKeyInput');
            const btn = document.getElementById('toggleApiKey');
            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('show-password');
            } else {
                input.type = 'password';
                btn.classList.remove('show-password');
            }
        });
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.theme = btn.dataset.theme;
                this.applyTheme();
                this.save();
            });
        });
        
        // Skills modal
        document.getElementById('skillsBtn').addEventListener('click', () => {
            SkillsRegistry.render();
            this.openModal('skillsModal');
        });
        
        document.getElementById('closeSkillsBtn').addEventListener('click', () => {
            this.closeModal('skillsModal');
        });
        
        document.getElementById('skillsBackdrop').addEventListener('click', () => {
            this.closeModal('skillsModal');
        });
        
        // Install skill
        document.getElementById('installSkillBtn').addEventListener('click', () => {
            this.installSkill();
        });
        
        // Todo modal
        document.getElementById('todoBtn').addEventListener('click', () => {
            this.openModal('todoModal');
            this.loadTodos();
        });
        
        document.getElementById('closeTodoBtn').addEventListener('click', () => {
            this.closeModal('todoModal');
        });
        
        document.getElementById('todoBackdrop').addEventListener('click', () => {
            this.closeModal('todoModal');
        });
        
        // Todo tabs
        document.querySelectorAll('.todo-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTodoTab(tab.dataset.tab);
            });
        });
        
        // Add todo
        document.getElementById('addTodoBtn').addEventListener('click', () => {
            this.addTodo();
        });
        
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
        
        // Notes auto-save
        document.getElementById('notesTextarea').addEventListener('input', (e) => {
            localStorage.setItem('adinda_notes', e.target.value);
        });
        
        // Clear chat
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            this.clearCurrentChat();
        });
        
        // Suggestion cards
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                document.getElementById('messageInput').value = card.dataset.prompt;
                this.sendMessage();
            });
        });
        
        // Data management
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importData();
        });
        
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Close modals on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
};

// ==========================================
// CHAT MANAGEMENT
// ==========================================
AppState.newChat = function() {
    const chatId = 'chat_' + Date.now();
    this.currentChatId = chatId;
    
    this.chats[chatId] = {
        id: chatId,
        title: 'Obrolan Baru',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    this.save();
    this.renderChatHistory();
    this.loadChat(chatId);
};

AppState.loadChat = function(chatId) {
    const chat = this.chats[chatId];
    if (!chat) return;
    
    this.currentChatId = chatId;
    
    // Update header title
    document.getElementById('chatTitle').textContent = chat.title;
    
    // Show/hide welcome screen
    const welcome = document.getElementById('welcomeScreen');
    const messages = document.getElementById('messages');
    
    if (chat.messages.length === 0) {
        welcome.style.display = 'flex';
        messages.innerHTML = '';
    } else {
        welcome.style.display = 'none';
        this.renderMessages(chat.messages);
    }
    
    // Update active chat in history
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.chat === chatId);
    });
    
    this.save();
};

AppState.renderChatHistory = function() {
    const container = document.getElementById('chatHistory');
    const chatList = Object.values(this.chats).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    if (chatList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">Belum ada obrolan</p>';
        return;
    }
    
    container.innerHTML = chatList.map(chat => `
        <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" 
             data-chat="${chat.id}">
            <svg class="chat-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="chat-item-title">${this.escapeHtml(chat.title)}</span>
            <button class="chat-item-delete" data-chat="${chat.id}" title="Hapus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-item-delete')) {
                this.loadChat(item.dataset.chat);
            }
        });
    });
    
    container.querySelectorAll('.chat-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteChat(btn.dataset.chat);
        });
    });
};

AppState.deleteChat = function(chatId) {
    delete this.chats[chatId];
    
    if (this.currentChatId === chatId) {
        const chatIds = Object.keys(this.chats);
        this.currentChatId = chatIds.length > 0 ? chatIds[0] : null;
        
        if (this.currentChatId) {
            this.loadChat(this.currentChatId);
        } else {
            this.newChat();
        }
    }
    
    this.save();
    this.renderChatHistory();
};

AppState.clearCurrentChat = function() {
    if (!this.currentChatId) return;
    
    this.chats[this.currentChatId].messages = [];
    this.chats[this.currentChatId].updatedAt = new Date().toISOString();
    
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('messages').innerHTML = '';
    
    this.save();
    this.renderChatHistory();
};

AppState.renderMessages = function(messages) {
    const container = document.getElementById('messages');
    container.innerHTML = messages.map(msg => this.createMessageHTML(msg)).join('');
    container.scrollTop = container.scrollHeight;
    
    // Highlight code blocks
    container.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
};

AppState.createMessageHTML = function(message) {
    const time = new Date(message.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const content = message.role === 'assistant' 
        ? marked.parse(message.content)
        : this.escapeHtml(message.content);
    
    return `
        <div class="message ${message.role}">
            <div class="message-avatar">
                ${message.role === 'assistant' ? 'A' : 'U'}
            </div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;
};

// ==========================================
// MESSAGE HANDLING
// ==========================================
AppState.sendMessage = async function() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content && !this.attachedFile) return;
    
    // Create new chat if needed
    if (!this.currentChatId) {
        this.newChat();
    }
    
    const chat = this.chats[this.currentChatId];
    
    // Add user message
let userContent = content;
if (this.attachedFile) {
    userContent += `\n\n**📎 File Dilampirkan:**\n`;
    userContent += `- Nama: ${this.attachedFile.name}\n`;
    userContent += `- Tipe: ${this.attachedFile.type.toUpperCase()}\n`;
    userContent += `- Ukuran: ${FileProcessor.formatFileSize(this.attachedFile.size)}\n`;
    userContent += `- Kata: ${this.attachedFile.metadata.wordCount}\n\n`;
    userContent += `**Konten File:**\n\`\`\`\n`;
    userContent += this.attachedFile.content.substring(0, 3000); // Limit 3000 char
    if (this.attachedFile.content.length > 3000) {
        userContent += `\n... (dipotong karena terlalu panjang)\n`;
    }
    userContent += `\`\`\``;
}
    
    chat.messages.push({
        role: 'user',
        content: userContent,
        timestamp: new Date().toISOString(),
        hasFile: !!this.attachedFile
    });
    
    // Update chat title from first message
    if (chat.messages.length === 1) {
        chat.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
        document.getElementById('chatTitle').textContent = chat.title;
    }
    
    chat.updatedAt = new Date().toISOString();
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    this.removeAttachedFile();
    
    // Show messages & hide welcome
    document.getElementById('welcomeScreen').style.display = 'none';
    this.renderMessages(chat.messages);
    this.renderChatHistory();
    this.save();
    
    // Show typing indicator
    this.showTyping();
    
    // Process through skills first
    const skillResult = await SkillsRegistry.process(content, {
        file: this.attachedFile
    });
    
    if (skillResult && skillResult.success) {
        this.hideTyping();
        this.addAssistantMessage(skillResult.result);
        return;
    }
    
    // Send to AI
    try {
        const response = await this.callAI(chat.messages);
        this.hideTyping();
        this.addAssistantMessage(response);
    } catch (error) {
        this.hideTyping();
        this.addAssistantMessage(`⚠️ **Error:** ${error.message}\n\nPastikan API key valid dan coba lagi.`);
    }
};

AppState.addAssistantMessage = function(content) {
    if (!this.currentChatId) return;
    
    const chat = this.chats[this.currentChatId];
    chat.messages.push({
        role: 'assistant',
        content: content,
        timestamp: new Date().toISOString()
    });
    
    chat.updatedAt = new Date().toISOString();
    
    this.renderMessages(chat.messages);
    this.renderChatHistory();
    this.save();
};

AppState.showTyping = function() {
    this.isTyping = true;
    document.getElementById('typingIndicator').classList.add('active');
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
};

AppState.hideTyping = function() {
    this.isTyping = false;
    document.getElementById('typingIndicator').classList.remove('active');
};

// ==========================================
// AI API CALLS
// ==========================================
AppState.callAI = async function(messages) {
    const { provider, apiKey, model, baseUrl, ollamaUrl, ollamaModel } = this.settings;
    
    // Check API key for non-Ollama providers
    if (provider !== 'ollama' && !apiKey) {
        throw new Error('API key belum diisi. Buka Pengaturan untuk menambahkan.');
    }
    
    if (provider === 'ollama') {
        return await this.callOllama(messages, ollamaUrl, ollamaModel);
    }
    
    // Build request based on provider
    const requestConfig = this.buildRequestConfig(provider, model, messages, apiKey, baseUrl);
    
    const response = await fetch(requestConfig.url, {
        method: 'POST',
        headers: requestConfig.headers,
        body: JSON.stringify(requestConfig.body)
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return this.parseAIResponse(provider, data);
};

AppState.buildRequestConfig = function(provider, model, messages, apiKey, baseUrl) {
    // Convert messages to format needed
    const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }));
    
    switch(provider) {
        case 'openrouter':
            return {
                url: 'https://openrouter.ai/api/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Adinda AI Assistant'
                },
                body: {
                    model: model,
                    messages: formattedMessages
                }
            };
            
        case 'openai':
            return {
                url: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    model: model,
                    messages: formattedMessages
                }
            };
            
        case 'anthropic':
            return {
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: {
                    model: model,
                    max_tokens: 4096,
                    messages: formattedMessages.filter(m => m.role !== 'system')
                }
            };
            
        case 'groq':
            return {
                url: 'https://api.groq.com/openai/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    model: model,
                    messages: formattedMessages
                }
            };
            
        case 'custom':
            return {
                url: `${baseUrl}/chat/completions`,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    model: model,
                    messages: formattedMessages
                }
            };
            
        default:
            throw new Error(`Provider ${provider} tidak dikenali`);
    }
};

AppState.parseAIResponse = function(provider, data) {
    switch(provider) {
        case 'openrouter':
        case 'openai':
        case 'groq':
        case 'custom':
            return data.choices[0].message.content;
            
        case 'anthropic':
            return data.content[0].text;
            
        default:
            return data.choices[0].message.content;
    }
};

// ==========================================
// OLLAMA SPECIFIC
// ==========================================
AppState.callOllama = async function(messages, url, model) {
    const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }));
    
    try {
        const response = await fetch(`${url}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: formattedMessages,
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        throw new Error(`Koneksi ke Ollama gagal: ${error.message}`);
    }
};

AppState.testOllamaConnection = async function() {
    const statusEl = document.getElementById('ollamaStatus');
    const url = document.getElementById('ollamaUrl').value;
    
    statusEl.textContent = 'Menguji...';
    statusEl.className = 'connection-status';
    
    try {
        const response = await fetch(`${url}/api/tags`);
        
        if (response.ok) {
            statusEl.textContent = '✓ Terhubung';
            statusEl.classList.add('success');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        statusEl.textContent = '✗ Gagal';
        statusEl.classList.add('error');
    }
};

// ==========================================
// FILE HANDLING
// ==========================================
// ==========================================
// FILE HANDLING - UPDATED
// ==========================================
AppState.handleFileUpload = async function(file) {
    if (!file) return;
    
    const preview = document.getElementById('filePreview');
    const previewName = document.getElementById('filePreviewName');
    const previewSize = document.getElementById('filePreviewSize');
    const previewIcon = document.getElementById('filePreviewIcon');
    
    // Show loading state
    preview.classList.add('loading');
    previewName.textContent = 'Memproses file...';
    previewSize.textContent = '';
    
    try {
        // Process file menggunakan FileProcessor
        const result = await FileProcessor.process(file);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Store file data
        this.attachedFile = {
            name: result.filename,
            type: result.type,
            size: result.size,
            content: result.content,
            metadata: {
                wordCount: result.wordCount,
                charCount: result.charCount
            }
        };
        
        // Update preview UI
        previewName.textContent = result.filename;
        previewSize.textContent = FileProcessor.formatFileSize(result.size);
        
        // Set icon based on type
        const icons = {
            pdf: '📄',
            docx: '📘',
            xlsx: '📊',
            xls: '📊',
            txt: '📝'
        };
        previewIcon.textContent = icons[result.type] || '📎';
        
        // Update UI
        preview.classList.remove('loading');
        preview.classList.add('active');
        
        // Show success message
        showToast(`✓ File "${result.filename}" berhasil diproses`, 'success');
        
    } catch (error) {
        preview.classList.remove('loading');
        showToast(`✗ Error: ${error.message}`, 'error');
        this.attachedFile = null;
    }
};

// ==========================================
// VOICE INPUT
// ==========================================
AppState.toggleVoiceInput = function() {
    if (this.recognition) {
        this.stopVoiceInput();
        return;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'id-ID';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        
        this.recognition.onstart = () => {
            document.getElementById('voiceStatus').classList.add('active');
            document.getElementById('voiceText').textContent = 'Mendengarkan...';
        };
        
        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            document.getElementById('messageInput').value = transcript;
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopVoiceInput();
            showToast('Error suara: ' + event.error, 'error');
        };
        
        this.recognition.onend = () => {
            this.stopVoiceInput();
        };
        
        this.recognition.start();
    } else {
        showToast('Browser tidak mendukung input suara', 'error');
    }
};

AppState.stopVoiceInput = function() {
    if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
    }
    document.getElementById('voiceStatus').classList.remove('active');
};

// ==========================================
// SETTINGS
// ==========================================
AppState.saveSettings = function() {
    this.settings.provider = document.getElementById('apiProvider').value;
    this.settings.apiKey = document.getElementById('apiKeyInput').value;
    this.settings.baseUrl = document.getElementById('baseUrlInput').value;
    this.settings.ollamaUrl = document.getElementById('ollamaUrl').value;
    this.settings.ollamaModel = document.getElementById('ollamaModelSelect').value;
    
    // Get selected model
    if (this.settings.provider === 'openrouter') {
        this.settings.model = document.getElementById('openrouterModelSelect').value;
    }
    
    this.save();
    this.updateModelBadge();
    this.updateProviderSettings();
    this.closeModal('settingsModal');
    
    showToast('Pengaturan berhasil disimpan!', 'success');
};

AppState.exportData = function() {
    const data = {
        chats: this.chats,
        settings: {
            provider: this.settings.provider,
            model: this.settings.model,
            theme: this.settings.theme,
            ollamaUrl: this.settings.ollamaUrl,
            ollamaModel: this.settings.ollamaModel
        },
        todos: JSON.parse(localStorage.getItem('adinda_todos') || '[]'),
        notes: localStorage.getItem('adinda_notes') || ''
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `adinda-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data berhasil diexport!', 'success');
};

AppState.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.chats) {
                this.chats = { ...this.chats, ...data.chats };
            }
            if (data.todos) {
                localStorage.setItem('adinda_todos', JSON.stringify(data.todos));
            }
            if (data.notes) {
                localStorage.setItem('adinda_notes', data.notes);
            }
            if (data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                this.loadSettings();
            }
            
            this.save();
            this.renderChatHistory();
            showToast('Data berhasil diimport!', 'success');
        } catch (error) {
            showToast('Gagal import: File tidak valid', 'error');
        }
    };
    
    input.click();
};

AppState.clearAllData = function() {
    if (confirm('Hapus semua data? Ini tidak dapat dibatalkan.')) {
        localStorage.clear();
        this.chats = {};
        this.currentChatId = null;
        SkillsRegistry.init();
        this.newChat();
        showToast('Semua data dihapus', 'success');
    }
};

// ==========================================
// TODO MANAGEMENT
// ==========================================
AppState.loadTodos = function() {
    const todos = JSON.parse(localStorage.getItem('adinda_todos') || '[]');
    const todoList = document.getElementById('todoList');
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    const notesTextarea = document.getElementById('notesTextarea');
    
    todoList.innerHTML = todos.map((todo, index) => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-index="${index}">
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-index="${index}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <button class="todo-delete" data-index="${index}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </li>
    `).join('');
    
    completedCount.textContent = todos.filter(t => t.completed).length;
    totalCount.textContent = todos.length;
    
    // Load notes
    notesTextarea.value = localStorage.getItem('adinda_notes') || '';
    
    // Add event listeners
    todoList.querySelectorAll('.todo-checkbox').forEach(cb => {
        cb.addEventListener('click', () => {
            this.toggleTodo(parseInt(cb.dataset.index));
        });
    });
    
    todoList.querySelectorAll('.todo-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            this.deleteTodo(parseInt(btn.dataset.index));
        });
    });
};

AppState.addTodo = function() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const todos = JSON.parse(localStorage.getItem('adinda_todos') || '[]');
    todos.push({
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('adinda_todos', JSON.stringify(todos));
    input.value = '';
    this.loadTodos();
    
    showToast('Tugas ditambahkan!', 'success');
};

AppState.toggleTodo = function(index) {
    const todos = JSON.parse(localStorage.getItem('adinda_todos') || '[]');
    if (todos[index]) {
        todos[index].completed = !todos[index].completed;
        localStorage.setItem('adinda_todos', JSON.stringify(todos));
        this.loadTodos();
    }
};

AppState.deleteTodo = function(index) {
    const todos = JSON.parse(localStorage.getItem('adinda_todos') || '[]');
    todos.splice(index, 1);
    localStorage.setItem('adinda_todos', JSON.stringify(todos));
    this.loadTodos();
};

AppState.switchTodoTab = function(tab) {
    this.todoTab = tab;
    
    document.querySelectorAll('.todo-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    document.getElementById('todoTabContent').style.display = tab === 'todo' ? 'block' : 'none';
    document.getElementById('notesTabContent').style.display = tab === 'notes' ? 'block' : 'none';
};

// ==========================================
// SKILL MANAGEMENT
// ==========================================
AppState.installSkill = async function() {
    const url = document.getElementById('skillUrlInput').value.trim();
    
    if (!url) {
        showToast('Masukkan URL skill', 'error');
        return;
    }
    
    showToast('Menginstall skill...', 'info');
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const skillCode = await response.text();
        const skill = new Function('return ' + skillCode)();
        
        if (skill && skill.id && skill.execute) {
            SkillsRegistry.add(skill);
            SkillsRegistry.render();
            document.getElementById('skillUrlInput').value = '';
            showToast(`Skill "${skill.name}" berhasil diinstall!`, 'success');
        } else {
            throw new Error('Invalid skill format');
        }
    } catch (error) {
        showToast('Gagal install skill: ' + error.message, 'error');
    }
};

// ==========================================
// MODAL MANAGEMENT
// ==========================================
AppState.openModal = function(modalId) {
    document.getElementById(modalId).classList.add('active');
};

AppState.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
};

AppState.closeAllModals = function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
};

// ==========================================
// UTILITIES
// ==========================================
AppState.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 4s
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ==========================================
// INITIALIZE APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
