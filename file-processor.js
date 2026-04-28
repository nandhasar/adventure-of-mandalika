/* ==========================================
   FILE PROCESSOR MODULE
   Untuk mengolah Word, PDF, dan Excel
   ========================================== */

const FileProcessor = {
    // Konfigurasi
    config: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedFormats: ['pdf', 'docx', 'xlsx', 'xls', 'txt']
    },
    
    // Validasi file
    validate(file) {
        if (!file) {
            throw new Error('File tidak tersedia');
        }
        
        if (file.size > this.config.maxFileSize) {
            throw new Error(`File terlalu besar. Maksimal 10MB`);
        }
        
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (!this.config.supportedFormats.includes(ext)) {
            throw new Error(`Format tidak didukung. Gunakan: ${this.config.supportedFormats.join(', ')}`);
        }
        
        return true;
    },
    
    // Main processor
    async process(file) {
        try {
            this.validate(file);
            
            const ext = file.name.split('.').pop().toLowerCase();
            
            let content = '';
            
            // Proses berdasarkan tipe file
            if (ext === 'pdf') {
                content = await this.processPDF(file);
            } else if (ext === 'docx') {
                content = await this.processDocx(file);
            } else if (ext === 'xlsx' || ext === 'xls') {
                content = await this.processExcel(file);
            } else if (ext === 'txt') {
                content = await this.processText(file);
            }
            
            return {
                success: true,
                filename: file.name,
                type: ext,
                size: file.size,
                content: content,
                wordCount: this.countWords(content),
                charCount: content.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ==========================================
    // PDF PROCESSOR
    // ==========================================
    async processPDF(file) {
        console.log('📄 Memproses PDF...');
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Set worker untuk PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Loop semua halaman
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += `\n--- Halaman ${i} ---\n${pageText}`;
        }
        
        return fullText.trim();
    },
    
    // ==========================================
    // WORD PROCESSOR (DOCX)
    // ==========================================
    async processDocx(file) {
        console.log('📘 Memproses DOCX...');
        
        const arrayBuffer = await file.arrayBuffer();
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (result.messages && result.messages.length > 0) {
            console.warn('Peringatan:', result.messages);
        }
        
        return result.value.trim();
    },
    
    // ==========================================
    // EXCEL PROCESSOR
    // ==========================================
    async processExcel(file) {
        console.log('📊 Memproses Excel...');
        
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        let fullText = `📊 **File Excel: ${file.name}**\n\n`;
        
        // Loop semua sheet
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            const csv = XLSX.utils.sheet_to_csv(sheet);
            
            fullText += `\n## Sheet ${sheetIndex + 1}: ${sheetName}\n`;
            fullText += `**Jumlah Baris:** ${json.length}\n`;
            fullText += `**Kolom:** ${Object.keys(json[0] || {}).join(', ')}\n\n`;
            fullText += '```\n' + csv + '\n```\n';
        });
        
        return fullText.trim();
    },
    
    // ==========================================
    // TEXT PROCESSOR
    // ==========================================
    async processText(file) {
        console.log('📝 Memproses TXT...');
        
        return await file.text();
    },
    
    // ==========================================
    // UTILITIES
    // ==========================================
    countWords(text) {
        return text.trim().split(/\s+/).length;
    },
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};
