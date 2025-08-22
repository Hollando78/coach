// Additional storage management methods for PhotoToPdfScanner

PhotoToPdfScanner.prototype.downloadAllDocuments = async function() {
    if (this.documents.length === 0) {
        this.showToast('No documents to download', 'warning');
        return;
    }
    
    this.showToast(`Downloading ${this.documents.length} document(s)...`, 'info');
    
    for (const document of this.documents) {
        if (document.pdfBytes) {
            try {
                const pdfBytes = new Uint8Array(document.pdfBytes);
                this.downloadFile(pdfBytes, document.name, 'application/pdf');
                // Small delay between downloads to avoid overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Failed to download ${document.name}:`, error);
            }
        }
    }
    
    this.showToast('All documents downloaded successfully!', 'success');
};

PhotoToPdfScanner.prototype.clearAllData = async function() {
    const confirmed = confirm(
        'This will permanently delete all documents, settings, and clear all storage. This action cannot be undone. Are you sure?'
    );
    
    if (!confirmed) return;
    
    try {
        // Clear documents and settings
        this.documents = [];
        this.settings = {
            ocrLanguage: 'eng',
            pdfQuality: 'medium',
            includeOcr: true,
            autoCapture: false,
            autoDownload: false,
            persistentStorage: true
        };
        
        // Clear IndexedDB
        if (this.useIndexedDB && this.db) {
            const transaction = this.db.transaction(['documents', 'settings'], 'readwrite');
            await Promise.all([
                new Promise((resolve, reject) => {
                    const deleteReq = transaction.objectStore('documents').clear();
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                }),
                new Promise((resolve, reject) => {
                    const deleteReq = transaction.objectStore('settings').clear();
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                })
            ]);
        }
        
        // Clear localStorage
        localStorage.removeItem('pdf_scanner_documents');
        localStorage.removeItem('pdf_scanner_settings');
        
        // Update UI
        this.updateDisplay();
        await this.loadSettings(); // Reset UI to default settings
        this.checkStorageQuota();
        
        this.showToast('All data cleared successfully', 'success');
        
    } catch (error) {
        console.error('Error clearing data:', error);
        this.showToast('Error clearing data. Please try again.', 'error');
    }
};