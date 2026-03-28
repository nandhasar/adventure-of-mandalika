/* ==========================================
   ADINDA - Skills System
   Plugin-based Skill Manager
   ========================================== */

// Skills Registry
const SkillsRegistry = {
    skills: {},
    
    // Default Skills
    defaults: {
        webSearch: {
            id: 'webSearch',
            name: 'Web Search',
            icon: '🔍',
            description: 'Cari informasi di internet',
            enabled: true,
            keywords: ['cari', 'search', 'google', 'carikan info'],
            
            execute: async (query, context) => {
                // Using DuckDuckGo Instant Answer API (no key required)
                try {
                    const response = await fetch(
                        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
                    );
                    const data = await response.json();
                    
                    if (data.AbstractText) {
                        return {
                            success: true,
                            result: data.AbstractText,
                            source: data.AbstractURL || 'DuckDuckGo'
                        };
                    } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                        const topics = data.RelatedTopics.slice(0, 3)
                            .filter(t => t.Text)
                            .map(t => t.Text)
                            .join('\n\n');
                        return {
                            success: true,
                            result: topics || 'Tidak ada hasil yang ditemukan.',
                            source: 'DuckDuckGo'
                        };
                    }
                    
                    return {
                        success: false,
                        error: 'Tidak ada hasil pencarian ditemukan.'
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: 'Gagal melakukan pencarian: ' + error.message
                    };
                }
            }
        },
        
        calculator: {
            id: 'calculator',
            name: 'Calculator',
            icon: '🔢',
            description: 'Kalkulator matematika advanced',
            enabled: true,
            keywords: ['hitung', 'calculate', 'kalkulasi', '×', '/', '+', '-', 'pangkat', 'akar'],
            
            execute: async (input, context) => {
                try {
                    // Clean input
                    let expression = input
                        .replace(/jumlahkan/gi, '+')
                        .replace(/kurangi/gi, '-')
                        .replace(/kalikan/gi, '*')
                        .replace(/bagikan/gi, '/')
                        .replace(/pangkat/gi, '**')
                        .replace(/akar/gi, 'Math.sqrt')
                        .replace(/persen/gi, '/100')
                        .replace(/π|pi/gi, 'Math.PI')
                        .replace(/e(?!xponent)/gi, 'Math.E')
                        .replace(/sin/gi, 'Math.sin')
                        .replace(/cos/gi, 'Math.cos')
                        .replace(/tan/gi, 'Math.tan')
                        .replace(/log/gi, 'Math.log10')
                        .replace(/ln/gi, 'Math.log')
                        .replace(/\btiga\b/gi, '3')
                        .replace(/empat\b/gi, '4')
                        .replace(/lima\b/gi, '5')
                        .replace(/enam\b/gi, '6')
                        .replace(/tujuh\b/gi, '7')
                        .replace(/delapan\b/gi, '8')
                        .replace(/sembilan\b/gi, '9')
                        .replace(/nol\b/gi, '0')
                        .replace(/satu\b/gi, '1')
                        .replace(/dua\b/gi, '2');
                    
                    // Validate expression (basic security)
                    if (!/^[\d+\-*/().Math.sqrt\s,]+$/.test(expression)) {
                        throw new Error('Expression contains invalid characters');
                    }
                    
                    // Calculate
                    const result = Function('"use strict"; return (' + expression + ')')();
                    
                    return {
                        success: true,
                        result: `Hasil: **${Number.isInteger(result) ? result : result.toFixed(6).replace(/\.?0+$/, '')}**`,
                        raw: result
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: 'Gagal menghitung: ' + error.message
                    };
                }
            }
        },
        
        translator: {
            id: 'translator',
            name: 'Translator',
            icon: '🌐',
            description: 'Terjemahkan teks antar bahasa',
            enabled: true,
            keywords: ['terjemahkan', 'translate', 'ke bahasa', 'dalam bahasa'],
            
            execute: async (input, context) => {
                // Simple local translation dictionary
                const dict = {
                    'hello': 'halo',
                    'hi': 'hai',
                    'how are you': 'apa kabar',
                    'thank you': 'terima kasih',
                    'thanks': 'terima kasih',
                    'good morning': 'selamat pagi',
                    'good night': 'selamat malam',
                    'goodbye': 'selamat tinggal',
                    'yes': 'iya',
                    'no': 'tidak',
                    'please': 'tolong',
                    'sorry': 'maaf',
                    'love': 'cinta',
                    'friend': 'teman',
                    'family': 'keluarga',
                    'work': 'kerja',
                    'study': 'belajar',
                    'eat': 'makan',
                    'drink': 'minum',
                    'sleep': 'tidur',
                    'walk': 'jalan',
                    'run': 'lari',
                    'read': 'baca',
                    'write': 'tulis',
                    'speak': 'bicara'
                };
                
                try {
                    // Extract text to translate
                    const match = input.match(/terjemahkan[:\s]+["']?([^"']+)["']?\s*(?:ke|dalam)\s*bahasa\s*(\w+)/i);
                    
                    if (match) {
                        const text = match[1].trim().toLowerCase();
                        const targetLang = match[2].toLowerCase();
                        
                        if (targetLang === 'inggris' || targetLang === 'english') {
                            // Indonesian to English
                            const reverseDict = Object.fromEntries(
                                Object.entries(dict).map(([k, v]) => [v, k])
                            );
                            
                            const words = text.split(/\s+/);
                            const translated = words.map(word => {
                                return reverseDict[word] || word;
                            }).join(' ');
                            
                            return {
                                success: true,
                                result: `Terjemahan ke English: **"${translated}"**`
                            };
                        } else if (targetLang === 'indonesia' || targetLang === 'indonesian') {
                            // English to Indonesian
                            const words = text.split(/\s+/);
                            const translated = words.map(word => {
                                return dict[word] || word;
                            }).join(' ');
                            
                            return {
                                success: true,
                                result: `Terjemahan ke Indonesia: **"${translated}"**`
                            };
                        }
                    }
                    
                    // Simple word lookup
                    const cleanText = input.toLowerCase().replace(/terjemahkan\s*/gi, '');
                    
                    if (dict[cleanText]) {
                        return {
                            success: true,
                            result: `**${dict[cleanText]}**`
                        };
                    }
                    
                    return {
                        success: false,
                        error: 'Format tidak dikenali. Gunakan: "terjemahkan [teks] ke bahasa [indonesia/english]"'
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: 'Gagal menerjemahkan: ' + error.message
                    };
                }
            }
        },
        
        codeExecutor: {
            id: 'codeExecutor',
            name: 'Code Executor',
            icon: '💻',
            description: 'Jalankan kode Python & JavaScript',
            enabled: true,
            keywords: ['jalankan', 'execute', 'run', 'python', 'javascript', 'kode', 'code'],
            
            execute: async (input, context) => {
                // Extract code block
                const codeMatch = input.match(/```(?:python|javascript|js)?\n?([\s\S]*?)```/) ||
                                  input.match(/(?:kode|code)[:\s]*\n?([\s\S]+)/i);
                
                const code = codeMatch ? codeMatch[1].trim() : input.replace(/jalankan|execute|run|kode|code/gi, '').trim();
                
                if (!code) {
                    return {
                        success: false,
                        error: 'Tidak ada kode yang ditemukan untuk dijalankan.'
                    };
                }
                
                // Detect language
                const isPython = code.includes('print(') || 
                                 code.includes('def ') || 
                                 code.includes('import ') ||
                                 code.includes('for ') && code.includes(':');
                
                try {
                    if (isPython) {
                        // Python execution using Pyodide
                        return await executePython(code);
                    } else {
                        // JavaScript execution
                        return executeJavaScript(code);
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: 'Error: ' + error.message
                    };
                }
            }
        },
        
        pdfReader: {
            id: 'pdfReader',
            name: 'PDF Reader',
            icon: '📄',
            description: 'Baca dan extract teks dari file PDF',
            enabled: true,
            keywords: ['baca pdf', 'extract pdf', 'pdf'],
            
            execute: async (input, context) => {
                if (!context.file || !context.file.name.endsWith('.pdf')) {
                    return {
                        success: false,
                        error: 'Tidak ada file PDF yang dilampirkan.'
                    };
                }
                
                try {
                    const arrayBuffer = await context.file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    
                    let fullText = '';
                    const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages
                    
                    for (let i = 1; i <= maxPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += `\n\n--- Halaman ${i} ---\n\n` + pageText;
                    }
                    
                    if (pdf.numPages > maxPages) {
                        fullText += `\n\n... (${pdf.numPages - maxPages} halaman lagi)`;
                    }
                    
                    return {
                        success: true,
                        result: `PDF "${context.file.name}" (${pdf.numPages} halaman):\n${fullText.trim()}`,
                        pages: pdf.numPages
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: 'Gagal membaca PDF: ' + error.message
                    };
                }
            }
        },
        
        todoManager: {
            id: 'todoManager',
            name: 'Todo Manager',
            icon: '✅',
            description: 'Kelola daftar tugas dan catatan',
            enabled: true,
            keywords: ['tugas', 'todo', 'tasks', 'catatan', 'notes'],
            
            execute: async (input, context) => {
                const todos = JSON.parse(localStorage.getItem('adinda_todos') || '[]');
                const notes = localStorage.getItem('adinda_notes') || '';
                
                const action = input.toLowerCase();
                
                if (action.includes('tambah') || action.includes('add')) {
                    const task = input.replace(/tambah|add|tugas|todo/gi, '').trim();
                    if (task) {
                        todos.push({
                            id: Date.now(),
                            text: task,
                            completed: false,
                            createdAt: new Date().toISOString()
                        });
                        localStorage.setItem('adinda_todos', JSON.stringify(todos));
                        return {
                            success: true,
                            result: `✅ Tugas "${task}" berhasil ditambahkan!\n\nTotal: ${todos.length} tugas`
                        };
                    }
                }
                
                if (action.includes('selesai') || action.includes('done') || action.includes('cek')) {
                    const taskMatch = input.match(/\d+/);
                    if (taskMatch) {
                        const index = parseInt(taskMatch[0]) - 1;
                        if (todos[index]) {
                            todos[index].completed = true;
                            localStorage.setItem('adinda_todos', JSON.stringify(todos));
                            return {
                                success: true,
                                result: `✅ Tugas "${todos[index].text}" ditandai selesai!`
                            };
                        }
                    }
                }
                
                if (action.includes('hapus') || action.includes('delete')) {
                    const taskMatch = input.match(/\d+/);
                    if (taskMatch) {
                        const index = parseInt(taskMatch[0]) - 1;
                        if (todos[index]) {
                            const removed = todos.splice(index, 1)[0];
                            localStorage.setItem('adinda_todos', JSON.stringify(todos));
                            return {
                                success: true,
                                result: `🗑️ Tugas "${removed.text}" dihapus!`
                            };
                        }
                    }
                }
                
                if (action.includes('catatan')) {
                    const noteContent = input.replace(/catatan|notes/gi, '').trim();
                    if (noteContent) {
                        const newNotes = notes + '\n\n' + new Date().toLocaleDateString('id-ID') + ': ' + noteContent;
                        localStorage.setItem('adinda_notes', newNotes);
                        return {
                            success: true,
                            result: '📝 Catatan berhasil disimpan!'
                        };
                    }
                    if (notes) {
                        return {
                            success: true,
                            result: `📝 Catatan:\n\n${notes}`
                        };
                    }
                }
                
                // Show all todos
                const pending = todos.filter(t => !t.completed);
                const completed = todos.filter(t => t.completed);
                
                let result = '📋 **Daftar Tugas:**\n\n';
                
                if (pending.length === 0 && completed.length === 0) {
                    result += '_Tidak ada tugas_';
                } else {
                    if (pending.length > 0) {
                        result += '**Pending:**\n';
                        pending.forEach((t, i) => {
                            result += `${i + 1}. ${t.text}\n`;
                        });
                    }
                    if (completed.length > 0) {
                        result += '\n**Selesai:**\n';
                        completed.forEach((t, i) => {
                            result += `✓ ${t.text}\n`;
                        });
                    }
                }
                
                return {
                    success: true,
                    result: result
                };
            }
        },
        
        imageGenerator: {
            id: 'imageGenerator',
            name: 'Image Generator',
            icon: '🖼️',
            description: 'Buat gambar dari deskripsi (jika AI mendukung)',
            enabled: true,
            keywords: ['gambar', 'buat gambar', 'generate image', 'generate gambar', 'buatkan ilustrasi'],
            
            execute: async (input, context) => {
                const descMatch = input.match(/gambar|ilustrasi|image|buat.*(?:gambar|foto)/i);
                
                if (!descMatch) {
                    return { success: false, skip: true };
                }
                
                // Extract description
                let description = input
                    .replace(/gambar|buat|buatkan|ilustrasi|image|foto/gi, '')
                    .trim();
                
                if (description.length < 5) {
                    return {
                        success: false,
                        error: 'Deskripsi gambar terlalu pendek.'
                    };
                }
                
                // Note: Real image generation requires paid API
                // This is a placeholder that returns instructions
                return {
                    success: true,
                    result: `🎨 **Image Generation**\n\nSaya tidak memiliki kemampuan generate gambar secara langsung, tapi kamu bisa:\n\n1. **DALL-E** - Buka chat.openai.com, minta generate gambar\n2. **Midjourney** - Discord-based image AI\n3. **Stable Diffusion** - Buka huggingface.co/spaces/stabilityai/stable-diffusion\n\nDeskripsi yang kamu minta: *"${description}"*`
                };
            }
        }
    },
    
    // Initialize
    init() {
        // Load from storage or use defaults
        const saved = localStorage.getItem('adinda_skills');
        if (saved) {
            const savedSkills = JSON.parse(saved);
            // Merge with defaults (keep new default skills)
            Object.keys(this.defaults).forEach(key => {
                if (!savedSkills[key]) {
                    savedSkills[key] = this.defaults[key];
                }
            });
            this.skills = savedSkills;
        } else {
            this.skills = { ...this.defaults };
        }
        
        this.save();
    },
    
    // Get enabled skills
    getEnabled() {
        return Object.values(this.skills).filter(s => s.enabled);
    },
    
    // Toggle skill
    toggle(skillId) {
        if (this.skills[skillId]) {
            this.skills[skillId].enabled = !this.skills[skillId].enabled;
            this.save();
            return this.skills[skillId].enabled;
        }
        return false;
    },
    
    // Add custom skill
    add(skill) {
        if (skill.id && skill.name && skill.execute) {
            this.skills[skill.id] = {
                ...skill,
                enabled: skill.enabled !== false
            };
            this.save();
            return true;
        }
        return false;
    },
    
    // Remove skill
    remove(skillId) {
        if (this.skills[skillId] && !this.defaults[skillId]) {
            delete this.skills[skillId];
            this.save();
            return true;
        }
        return false;
    },
    
    // Process input through skills
    async process(input, context = {}) {
        const lowerInput = input.toLowerCase();
        
        for (const skill of this.getEnabled()) {
            // Check keywords
            const hasKeyword = skill.keywords.some(kw => 
                lowerInput.includes(kw.toLowerCase())
            );
            
            if (hasKeyword || skill.alwaysRun) {
                try {
                    const result = await skill.execute(input, context);
                    
                    if (result && result.success) {
                        return result;
                    } else if (result && result.error) {
                        // Skill failed, continue to next
                        console.log(`Skill ${skill.id} failed:`, result.error);
                    } else if (result && result.skip) {
                        // Skill skipped, continue to next
                    }
                } catch (error) {
                    console.error(`Skill ${skill.id} error:`, error);
                }
            }
        }
        
        return null; // No skill handled it
    },
    
    // Save to storage
    save() {
        localStorage.setItem('adinda_skills', JSON.stringify(this.skills));
    },
    
    // Render skills grid
    render() {
        const grid = document.getElementById('skillsGrid');
        if (!grid) return;
        
        grid.innerHTML = Object.values(this.skills).map(skill => `
            <div class="skill-card" data-skill="${skill.id}">
                <div class="skill-card-header">
                    <span class="skill-card-icon">${skill.icon}</span>
                    <button class="skill-toggle ${skill.enabled ? 'active' : ''}" 
                            data-skill="${skill.id}"
                            title="${skill.enabled ? 'Disable' : 'Enable'}">
                    </button>
                </div>
                <div class="skill-card-title">${skill.name}</div>
                <div class="skill-card-desc">${skill.description}</div>
            </div>
        `).join('');
        
        // Add toggle listeners
        grid.querySelectorAll('.skill-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillId = toggle.dataset.skill;
                const newState = SkillsRegistry.toggle(skillId);
                toggle.classList.toggle('active', newState);
            });
        });
    }
};

// Python Executor using Pyodide
async function executePython(code) {
    // Load Pyodide if not loaded
    if (!window.loadPyodide) {
        // Show loading message
        showToast('⏳ Memuat Python runtime...', 'info');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
    }
    
    if (!window.pyodide) {
        window.pyodide = await loadPyodide();
    }
    
    // Redirect stdout
    await window.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
    `);
    
    // Run the code
    await window.pyodide.runPythonAsync(code);
    
    // Get output
    const stdout = await window.pyodide.runPythonAsync('sys.stdout.getvalue()');
    const stderr = await window.pyodide.runPythonAsync('sys.stderr.getvalue()');
    
    if (stderr && !stdout) {
        return {
            success: false,
            error: stderr
        };
    }
    
    return {
        success: true,
        result: stdout.trim() || '_Kode berjalan tanpa output_',
        language: 'python'
    };
}

// JavaScript Executor
function executeJavaScript(code) {
    // Capture console.log
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
        logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
    };
    
    try {
        // Create sandboxed function
        const fn = new Function(code);
        const result = fn();
        
        // Restore console
        console.log = originalLog;
        
        let output = logs.join('\n');
        
        if (result !== undefined) {
            output += (output ? '\n' : '') + 
                '→ ' + (typeof result === 'object' ? 
                    JSON.stringify(result, null, 2) : String(result));
        }
        
        return {
            success: true,
            result: output.trim() || '_Kode berjalan tanpa output_',
            language: 'javascript'
        };
    } catch (error) {
        console.log = originalLog;
        return {
            success: false,
            error: error.message
        };
    }
}

// Initialize skills on load
document.addEventListener('DOMContentLoaded', () => {
    SkillsRegistry.init();
});
