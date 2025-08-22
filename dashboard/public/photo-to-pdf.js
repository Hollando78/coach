class PhotoToPdfScanner {
    constructor() {
        this.capturedImages = [];
        this.documents = [];
        this.currentStream = null;
        this.settings = {
            ocrLanguage: 'eng',
            pdfQuality: 'medium',
            includeOcr: true,
            autoCapture: false,
            autoDownload: false,  // Auto-download PDFs to device
            persistentStorage: true  // Request persistent storage
        };
        
        this.initializeStorage();
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.loadDocuments();
        this.updateDisplay();
    }
    
    async initializeStorage() {
        // Request persistent storage for better data retention
        if ('storage' in navigator && 'persist' in navigator.storage) {
            try {
                const persistent = await navigator.storage.persist();
                console.log(`Persistent storage: ${persistent ? 'granted' : 'denied'}`);
                
                if (persistent) {
                    this.showToast('Persistent storage enabled - documents will be preserved', 'success');
                } else {
                    this.showToast('Storage may be cleared automatically - download important documents', 'warning');
                }
            } catch (error) {
                console.warn('Could not request persistent storage:', error);
            }
        }
        
        // Initialize IndexedDB
        await this.initIndexedDB();
        
        // Check storage usage
        this.checkStorageQuota();
    }
    
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PDFScannerDB', 1);
            
            request.onerror = () => {
                console.warn('IndexedDB not available, falling back to localStorage');
                this.useIndexedDB = false;
                resolve();
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.useIndexedDB = true;
                console.log('IndexedDB initialized successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create documents store
                if (!db.objectStoreNames.contains('documents')) {
                    const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('createdDate', 'createdDate', { unique: false });
                }
                
                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }
    
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const used = (estimate.usage || 0) / 1024 / 1024; // Convert to MB
                const available = (estimate.quota || 0) / 1024 / 1024;
                
                console.log(`Storage used: ${used.toFixed(2)}MB / ${available.toFixed(2)}MB`);
                
                const percentUsed = (used / available) * 100;
                
                // Auto-download if enabled and storage is nearly full
                if (this.settings.autoDownload && percentUsed > 85 && this.documents.length > 0) {
                    this.showToast('Storage nearly full - auto-downloading documents...', 'warning');
                    await this.downloadAllDocuments();
                }
                
                if (percentUsed > 80) {
                    this.showToast(`Storage ${percentUsed.toFixed(0)}% full - consider downloading documents`, 'warning');
                }
                
                // Update storage display
                this.updateStorageDisplay(used, available);
            } catch (error) {
                console.warn('Could not check storage quota:', error);
            }
        }
    }
    
    updateStorageDisplay(used, available) {
        // Add storage info to settings tab
        const storageInfo = document.querySelector('.storage-info');
        if (storageInfo) {
            const percentUsed = (used / available) * 100;
            storageInfo.innerHTML = `
                <div class="storage-usage">
                    <div class="storage-bar">
                        <div class="storage-fill" style="width: ${percentUsed}%"></div>
                    </div>
                    <p>Storage: ${used.toFixed(1)}MB / ${available.toFixed(1)}MB used (${percentUsed.toFixed(0)}%)</p>
                </div>
            `;
        }
    }
    
    initializeElements() {
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Camera elements
        this.cameraVideo = document.getElementById('cameraVideo');
        this.captureCanvas = document.getElementById('captureCanvas');
        this.startCameraBtn = document.getElementById('startCameraBtn');
        this.captureBtn = document.getElementById('captureBtn');
        this.stopCameraBtn = document.getElementById('stopCameraBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Preview elements
        this.imagesPreview = document.getElementById('imagesPreview');
        
        // Action buttons
        this.generatePdfBtn = document.getElementById('generatePdfBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // Documents
        this.documentsList = document.getElementById('documentsList');
        this.totalDocs = document.getElementById('totalDocs');
        
        // OCR Panel
        this.ocrPanel = document.getElementById('ocrPanel');
        this.documentsOcrText = document.getElementById('documentsOcrText');
        this.documentsOcrProgress = document.getElementById('documentsOcrProgress');
        this.documentsProgressFill = document.getElementById('documentsProgressFill');
        this.documentsProgressText = document.getElementById('documentsProgressText');
        this.closeOcrPanel = document.getElementById('closeOcrPanel');
        this.copyOcrText = document.getElementById('copyOcrText');
        this.saveOcrText = document.getElementById('saveOcrText');
        
        // Settings
        this.pdfQuality = document.getElementById('pdfQuality');
        this.autoCapture = document.getElementById('autoCapture');
        this.autoDownload = document.getElementById('autoDownload');
        this.persistentStorage = document.getElementById('persistentStorage');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.clearStorageBtn = document.getElementById('clearStorageBtn');
    }
    
    setupEventListeners() {
        // Tab navigation
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Action buttons
        this.generatePdfBtn.addEventListener('click', () => this.generatePDF());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        
        // OCR Panel
        this.closeOcrPanel.addEventListener('click', () => this.hideOcrPanel());
        this.copyOcrText.addEventListener('click', () => this.copyExtractedText());
        this.saveOcrText.addEventListener('click', () => this.saveExtractedTextToDocument());
        
        // Settings
        this.pdfQuality.addEventListener('change', () => this.saveSettings());
        this.autoCapture.addEventListener('change', () => this.saveSettings());
        this.autoDownload.addEventListener('change', () => this.saveSettings());
        this.persistentStorage.addEventListener('change', () => this.saveSettings());
        
        // Storage actions
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllDocuments());
        this.clearStorageBtn.addEventListener('click', () => this.clearAllData());
        
        // Image removal (event delegation)
        this.imagesPreview.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-remove')) {
                const imageId = parseFloat(e.target.dataset.imageId);
                this.removeImage(imageId);
            }
        });
        
        // Document actions (event delegation)
        this.documentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('download-doc')) {
                const index = parseInt(e.target.dataset.docIndex);
                this.downloadDocument(index);
            } else if (e.target.classList.contains('extract-text')) {
                const index = parseInt(e.target.dataset.docIndex);
                this.extractTextFromPdf(index);
            } else if (e.target.classList.contains('delete-doc')) {
                const index = parseInt(e.target.dataset.docIndex);
                this.deleteDocument(index);
            }
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        this.tabContents.forEach(content => {
            const isActive = content.id === tabName + 'Tab';
            content.classList.toggle('active', isActive);
            content.classList.toggle('hidden', !isActive);
        });
        
        // Update documents display if switching to documents tab
        if (tabName === 'documents') {
            this.updateDocumentsDisplay();
        }
    }
    
    async startCamera() {
        try {
            console.log('Starting camera...');
            
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraVideo.srcObject = this.currentStream;
            
            this.startCameraBtn.classList.add('hidden');
            this.captureBtn.classList.remove('hidden');
            this.stopCameraBtn.classList.remove('hidden');
            
            this.showToast('Camera started successfully! 📸', 'success');
            
        } catch (error) {
            console.error('Error starting camera:', error);
            this.showToast('Failed to access camera. Please check permissions.', 'error');
        }
    }
    
    capturePhoto() {
        if (!this.currentStream) return;
        
        const canvas = this.captureCanvas;
        const video = this.cameraVideo;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
            if (blob) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.addCapturedImage(e.target.result, `captured_${Date.now()}.jpg`);
                    this.showToast('Photo captured! 📷', 'success');
                };
                reader.readAsDataURL(blob);
            }
        }, 'image/jpeg', 0.9);
    }
    
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        this.cameraVideo.srcObject = null;
        this.startCameraBtn.classList.remove('hidden');
        this.captureBtn.classList.add('hidden');
        this.stopCameraBtn.classList.add('hidden');
        
        this.showToast('Camera stopped', 'info');
    }
    
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.addCapturedImage(e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
        });
        
        if (files.length > 0) {
            this.showToast(`${files.length} image(s) uploaded! 🖼️`, 'success');
        }
        
        // Clear the file input
        event.target.value = '';
    }
    
    addCapturedImage(dataUrl, fileName) {
        const imageData = {
            id: Date.now() + Math.random(),
            dataUrl: dataUrl,
            fileName: fileName,
            timestamp: new Date()
        };
        
        this.capturedImages.push(imageData);
        this.updateImagesPreview();
        this.updateActionButtons();
    }
    
    removeImage(imageId) {
        this.capturedImages = this.capturedImages.filter(img => img.id !== imageId);
        this.updateImagesPreview();
        this.updateActionButtons();
        this.showToast('Image removed', 'info');
    }
    
    updateImagesPreview() {
        if (this.capturedImages.length === 0) {
            this.imagesPreview.innerHTML = `
                <div class="preview-placeholder">
                    <div class="placeholder-icon">📸</div>
                    <p>Captured images will appear here</p>
                </div>
            `;
            return;
        }
        
        const imagesHtml = this.capturedImages.map(img => `
            <div class="preview-image">
                <img src="${img.dataUrl}" alt="${img.fileName}">
                <button class="image-remove" data-image-id="${img.id}" title="Remove image">×</button>
            </div>
        `).join('');
        
        this.imagesPreview.innerHTML = `<div class="preview-images">${imagesHtml}</div>`;
    }
    
    updateActionButtons() {
        const hasImages = this.capturedImages.length > 0;
        this.generatePdfBtn.disabled = !hasImages;
    }
    
    async extractTextFromPdf(docIndex) {
        const document = this.documents[docIndex];
        if (!document || !document.pdfBytes) {
            this.showToast('PDF not found for text extraction', 'error');
            return;
        }
        
        // Store current document for later saving
        this.currentOcrDocument = { document, index: docIndex };
        
        // Show OCR panel
        this.showOcrPanel(document.name);
        
        // Start OCR processing
        this.documentsOcrProgress.classList.remove('hidden');
        this.documentsProgressFill.style.width = '0%';
        this.documentsProgressText.textContent = 'Starting text extraction...';
        
        try {
            // Convert PDF to images and then process with OCR
            const extractedText = await this.processDocumentOCR(document);
            
            this.documentsOcrProgress.classList.add('hidden');
            
            if (extractedText && extractedText.trim()) {
                this.documentsOcrText.value = extractedText;
                this.showToast(`Text extracted from ${document.name}!`, 'success');
            } else {
                this.documentsOcrText.value = 'No text was found in this PDF document.';
                this.showToast('No text found in this PDF', 'warning');
            }
            
        } catch (error) {
            console.error('PDF text extraction failed:', error);
            this.documentsOcrProgress.classList.add('hidden');
            this.documentsOcrText.value = `Error extracting text: ${error.message}`;
            this.showToast('Failed to extract text from PDF', 'error');
        }
    }
    
    async processDocumentOCR(document) {
        try {
            // Check if required libraries are loaded
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded. Please refresh the page and try again.');
            }
            
            if (!window.tesseractReady && typeof Tesseract === 'undefined') {
                throw new Error('OCR library not loaded. Please refresh the page and try again.');
            }
            
            // Update progress
            this.documentsProgressFill.style.width = '10%';
            this.documentsProgressText.textContent = 'Loading PDF...';
            
            // Convert PDF bytes back to Uint8Array and clone to avoid detachment
            const pdfBytes = new Uint8Array(document.pdfBytes).slice();
            
            // First try to extract existing text from PDF
            this.documentsProgressFill.style.width = '20%';
            this.documentsProgressText.textContent = 'Checking for existing text...';
            
            let extractedText = await this.extractTextFromPDF(pdfBytes);
            
            if (extractedText && extractedText.trim().length > 10) {
                // PDF already has text, return it
                this.documentsProgressFill.style.width = '100%';
                this.documentsProgressText.textContent = 'Text extraction complete!';
                return `--- Text Extracted from ${document.name} ---\n\n${extractedText}`;
            }
            
            // No existing text found, need to OCR the images in the PDF
            this.documentsProgressFill.style.width = '30%';
            this.documentsProgressText.textContent = 'Converting PDF pages to images...';
            
            const images = await this.convertPDFToImages(pdfBytes);
            
            if (images.length === 0) {
                throw new Error('No images found in PDF');
            }
            
            // OCR each image
            let allText = '';
            for (let i = 0; i < images.length; i++) {
                const progressBase = 40 + (i / images.length) * 50;
                this.documentsProgressFill.style.width = `${progressBase}%`;
                this.documentsProgressText.textContent = `OCR processing page ${i + 1} of ${images.length}...`;
                
                try {
                    const pageText = await this.ocrImage(images[i]);
                    if (pageText && pageText.trim()) {
                        allText += `--- Page ${i + 1} ---\n${pageText}\n\n`;
                    }
                } catch (ocrError) {
                    console.error(`OCR failed for page ${i + 1}:`, ocrError);
                    allText += `--- Page ${i + 1} ---\n[OCR failed: ${ocrError.message}]\n\n`;
                }
            }
            
            this.documentsProgressFill.style.width = '100%';
            this.documentsProgressText.textContent = 'Text extraction complete!';
            
            return allText || `--- Text Extraction from ${document.name} ---\n\nNo text could be extracted from this PDF document.`;
            
        } catch (error) {
            console.error('PDF OCR processing failed:', error);
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }
    
    async extractTextFromPDF(pdfBytes) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                console.error('PDF.js not available for text extraction');
                return '';
            }
            
            // Clone the buffer to avoid detachment issues
            const clonedBytes = pdfBytes.slice();
            const pdf = await pdfjsLib.getDocument({ data: clonedBytes }).promise;
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                if (pageText.trim()) {
                    fullText += `Page ${pageNum}:\n${pageText}\n\n`;
                }
            }
            
            return fullText;
        } catch (error) {
            console.error('PDF text extraction failed:', error);
            return '';
        }
    }
    
    async convertPDFToImages(pdfBytes) {
        try {
            // Clone the buffer to avoid detachment issues
            const clonedBytes = pdfBytes.slice();
            const pdf = await pdfjsLib.getDocument({ data: clonedBytes }).promise;
            const images = [];
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const imageDataUrl = canvas.toDataURL('image/png');
                images.push(imageDataUrl);
            }
            
            return images;
        } catch (error) {
            console.error('PDF to images conversion failed:', error);
            throw error;
        }
    }
    
    async ocrImage(imageDataUrl) {
        try {
            // Use simple Tesseract.recognize without scheduler to avoid CSP issues
            const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log('OCR Progress:', Math.round(m.progress * 100) + '%');
                    }
                }
            });
            
            return text.trim();
        } catch (error) {
            console.error('OCR processing failed:', error);
            throw new Error('OCR processing failed: ' + error.message);
        }
    }
    
    showOcrPanel(fileName) {
        this.ocrPanel.style.display = 'block';
        this.ocrPanel.querySelector('.ocr-header h3').textContent = `🔍 Extracted Text from ${fileName}`;
        this.documentsOcrText.value = '';
    }
    
    hideOcrPanel() {
        this.ocrPanel.style.display = 'none';
        this.currentOcrDocument = null;
        this.documentsOcrProgress.classList.add('hidden');
    }
    
    copyExtractedText() {
        if (this.documentsOcrText.value) {
            this.documentsOcrText.select();
            document.execCommand('copy');
            this.showToast('Text copied to clipboard!', 'success');
        } else {
            this.showToast('No text to copy', 'warning');
        }
    }
    
    saveExtractedTextToDocument() {
        if (!this.currentOcrDocument || !this.documentsOcrText.value.trim()) {
            this.showToast('No text to save', 'warning');
            return;
        }
        
        // Update the document with OCR text
        const { document, index } = this.currentOcrDocument;
        this.documents[index].ocrText = this.documentsOcrText.value;
        this.saveDocuments();
        this.updateDocumentsDisplay();
        
        this.showToast(`Text saved to ${document.name}!`, 'success');
    }
    
    async generatePDF() {
        if (this.capturedImages.length === 0) return;
        
        this.generatePdfBtn.disabled = true;
        this.generatePdfBtn.textContent = '📄 Generating PDF...';
        
        try {
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            for (const imageData of this.capturedImages) {
                // Convert data URL to bytes
                const imageBytes = this.dataURLtoBytes(imageData.dataUrl);
                let image;
                
                // Determine image format and embed
                if (imageData.dataUrl.includes('data:image/png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    image = await pdfDoc.embedJpg(imageBytes);
                }
                
                // Create a new page with the image dimensions
                const page = pdfDoc.addPage([image.width, image.height]);
                
                // Draw the image
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
                
                // OCR text is now handled separately in the Documents tab
                // No need to embed OCR text during PDF creation
            }
            
            // Generate PDF bytes
            const pdfBytes = await pdfDoc.save();
            
            // Create and download the PDF
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `document-${timestamp}.pdf`;
            
            this.downloadFile(pdfBytes, fileName, 'application/pdf');
            
            // Save document to local storage
            this.saveDocument({
                name: fileName,
                images: this.capturedImages.length,
                ocrText: '', // OCR text will be added later when extracted
                createdDate: new Date(),
                pdfBytes: Array.from(pdfBytes) // Convert to regular array for JSON storage
            });
            
            this.showToast('PDF generated successfully! 📄', 'success');
            
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showToast('PDF generation failed. Please try again.', 'error');
        }
        
        this.generatePdfBtn.disabled = false;
        this.generatePdfBtn.textContent = '📄 Generate PDF';
    }
    
    dataURLtoBytes(dataURL) {
        const base64 = dataURL.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    
    downloadFile(data, filename, type) {
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    clearAll() {
        if (this.capturedImages.length === 0) return;
        
        if (confirm('Are you sure you want to clear all captured images?')) {
            this.capturedImages = [];
            this.updateImagesPreview();
            this.updateActionButtons();
            this.showToast('All images cleared', 'info');
        }
    }
    
    saveDocument(document) {
        this.documents.unshift(document); // Add to beginning
        this.saveDocuments();
        this.updateDisplay();
    }
    
    async saveDocuments() {
        if (this.useIndexedDB && this.db) {
            await this.saveDocumentsToIndexedDB();
        } else {
            // Fallback to localStorage
            try {
                localStorage.setItem('pdf_scanner_documents', JSON.stringify(this.documents));
            } catch (error) {
                console.error('Error saving documents to localStorage:', error);
            }
        }
        
        // Check storage usage after saving
        this.checkStorageQuota();
    }
    
    async saveDocumentsToIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            
            // Clear existing documents
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                // Save all current documents
                const promises = this.documents.map((doc, index) => {
                    return new Promise((docResolve, docReject) => {
                        const docWithMeta = {
                            ...doc,
                            id: Date.now() + index, // Ensure unique ID
                            savedAt: new Date().toISOString()
                        };
                        const addRequest = store.add(docWithMeta);
                        addRequest.onsuccess = () => docResolve();
                        addRequest.onerror = () => docReject(addRequest.error);
                    });
                });
                
                Promise.all(promises)
                    .then(() => resolve())
                    .catch(reject);
            };
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    }
    
    async loadDocuments() {
        if (this.useIndexedDB && this.db) {
            await this.loadDocumentsFromIndexedDB();
        } else {
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('pdf_scanner_documents');
                if (stored) {
                    this.documents = JSON.parse(stored);
                }
            } catch (error) {
                console.error('Error loading documents from localStorage:', error);
                this.documents = [];
            }
        }
    }
    
    async loadDocumentsFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.documents = request.result
                    .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                    .map(doc => {
                        // Convert back to regular array for pdfBytes if needed
                        if (doc.pdfBytes && typeof doc.pdfBytes === 'object') {
                            doc.pdfBytes = Array.from(doc.pdfBytes);
                        }
                        return doc;
                    });
                resolve();
            };
            request.onerror = () => {
                console.error('Error loading documents from IndexedDB:', request.error);
                this.documents = [];
                resolve(); // Don't reject, just use empty array
            };
        });
    }
    
    updateDisplay() {
        this.totalDocs.textContent = this.documents.length;
        this.updateDocumentsDisplay();
    }
    
    updateDocumentsDisplay() {
        if (this.documents.length === 0) {
            this.documentsList.innerHTML = `
                <div class="empty-documents">
                    <div class="empty-icon">📄</div>
                    <p>No documents yet</p>
                    <small>Capture and process images to create your first PDF document</small>
                </div>
            `;
            return;
        }
        
        const documentsHtml = this.documents.map((doc, index) => `
            <div class="document-item">
                <div class="document-header">
                    <div class="document-title">${doc.name}</div>
                    <div class="document-date">${new Date(doc.createdDate).toLocaleString()}</div>
                </div>
                <div class="document-preview">
                    <div class="document-stats">
                        <small>${doc.images} image${doc.images !== 1 ? 's' : ''}</small>
                    </div>
                </div>
                ${doc.ocrText ? `
                    <div class="document-text">${this.truncateText(doc.ocrText, 200)}</div>
                ` : ''}
                <div class="document-actions">
                    <button class="doc-action-btn download-doc" data-doc-index="${index}">📥 Download</button>
                    <button class="doc-action-btn extract-text" data-doc-index="${index}">🔍 Extract Text</button>
                    <button class="doc-action-btn delete-doc" data-doc-index="${index}">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
        
        this.documentsList.innerHTML = documentsHtml;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    downloadDocument(index) {
        const document = this.documents[index];
        if (document && document.pdfBytes) {
            const pdfBytes = new Uint8Array(document.pdfBytes);
            this.downloadFile(pdfBytes, document.name, 'application/pdf');
            this.showToast('Document downloaded! 📥', 'success');
        }
    }
    
    deleteDocument(index) {
        const document = this.documents[index];
        if (confirm(`Delete document "${document.name}"?`)) {
            this.documents.splice(index, 1);
            this.saveDocuments();
            this.updateDisplay();
            this.showToast('Document deleted', 'info');
        }
    }
    
    async saveSettings() {
        this.settings.pdfQuality = this.pdfQuality.value;
        this.settings.autoCapture = this.autoCapture.checked;
        this.settings.autoDownload = this.autoDownload?.checked || false;
        this.settings.persistentStorage = this.persistentStorage?.checked || true;
        
        if (this.useIndexedDB && this.db) {
            await this.saveSettingsToIndexedDB();
        } else {
            // Fallback to localStorage
            try {
                localStorage.setItem('pdf_scanner_settings', JSON.stringify(this.settings));
            } catch (error) {
                console.error('Error saving settings to localStorage:', error);
            }
        }
        
        this.showToast('Settings saved', 'success');
    }
    
    async saveSettingsToIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            Object.entries(this.settings).forEach(([key, value]) => {
                store.put({ key, value });
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    async loadSettings() {
        if (this.useIndexedDB && this.db) {
            await this.loadSettingsFromIndexedDB();
        } else {
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('pdf_scanner_settings');
                if (stored) {
                    this.settings = { ...this.settings, ...JSON.parse(stored) };
                }
            } catch (error) {
                console.error('Error loading settings from localStorage:', error);
            }
        }
        
        // Apply settings to UI
        if (this.pdfQuality) this.pdfQuality.value = this.settings.pdfQuality;
        if (this.autoCapture) this.autoCapture.checked = this.settings.autoCapture;
        if (this.autoDownload) this.autoDownload.checked = this.settings.autoDownload;
        if (this.persistentStorage) this.persistentStorage.checked = this.settings.persistentStorage;
    }
    
    async loadSettingsFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const storedSettings = {};
                request.result.forEach(item => {
                    storedSettings[item.key] = item.value;
                });
                this.settings = { ...this.settings, ...storedSettings };
                resolve();
            };
            request.onerror = () => {
                console.error('Error loading settings from IndexedDB:', request.error);
                resolve(); // Don't reject, just use default settings
            };
        });
    }
    
    showToast(message, type = 'info') {
        const existing = document.querySelector('.scanner-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'scanner-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#4f46e5'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize scanner when page loads
let scanner;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Photo to PDF Scanner initializing...');
    scanner = new PhotoToPdfScanner();
    console.log('Scanner initialized successfully!');
});

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);