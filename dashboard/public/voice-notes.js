class VoiceNotesApp {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordings = [];
        this.currentAudio = null;
        this.recognition = null;
        this.currentTranscription = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadRecordings();
        this.checkMicrophonePermission();
        this.initializeSpeechRecognition();
    }
    
    initializeElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.recordingStatus = document.getElementById('recording-status');
        this.showRecordingsBtn = document.getElementById('showRecordingsBtn');
        this.recordingsList = document.getElementById('recordingsList');
        this.recordingsContainer = document.getElementById('recordingsContainer');
        this.transcriptionModal = document.getElementById('transcriptionModal');
        this.transcriptionContent = document.getElementById('transcriptionContent');
        this.closeModal = document.getElementById('closeModal');
        
        this.recordIcon = this.recordBtn.querySelector('.record-icon');
        this.stopIcon = this.recordBtn.querySelector('.stop-icon');
        
        // Add live transcription display elements
        this.liveTranscriptionContainer = document.getElementById('liveTranscriptionContainer');
        this.liveTranscriptionEl = document.getElementById('liveTranscription');
    }
    
    bindEvents() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.showRecordingsBtn.addEventListener('click', () => this.toggleRecordingsList());
        this.closeModal.addEventListener('click', () => this.closeTranscriptionModal());
        
        // Close modal when clicking outside
        this.transcriptionModal.addEventListener('click', (e) => {
            if (e.target === this.transcriptionModal) {
                this.closeTranscriptionModal();
            }
        });
        
        // Handle all recording controls with event delegation
        this.recordingsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button && !button.disabled) {
                const action = button.getAttribute('data-action');
                const recordingId = parseInt(button.getAttribute('data-recording-id'));
                
                switch (action) {
                    case 'play':
                        this.playRecording(recordingId);
                        break;
                    case 'transcribe':
                        this.retranscribeRecording(recordingId);
                        break;
                    case 'delete':
                        this.deleteRecording(recordingId);
                        break;
                }
            }
            
            // Handle transcription preview clicks
            const transcriptionPreview = e.target.closest('.transcription-preview');
            if (transcriptionPreview) {
                const recordingId = transcriptionPreview.getAttribute('data-recording-id');
                if (recordingId) {
                    this.showFullTranscription(parseInt(recordingId));
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTranscriptionModal();
            }
            if (e.key === ' ' && e.target === document.body) {
                e.preventDefault();
                this.toggleRecording();
            }
        });
    }
    
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Microphone permission denied:', error);
            this.recordBtn.disabled = true;
            this.recordingStatus.textContent = 'Microphone permission required';
            this.recordingStatus.style.color = '#ef4444';
        }
    }
    
    initializeSpeechRecognition() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.log('Speech recognition not supported in this browser');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript + ' ';
                } else {
                    transcript += event.results[i][0].transcript;
                }
            }
            
            this.currentTranscription = transcript;
            this.updateLiveTranscriptionDisplay();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                // Restart recognition if still recording
                this.recognition.start();
            }
        };
    }
    
    startLiveTranscription() {
        if (this.recognition) {
            this.currentTranscription = '';
            this.updateLiveTranscriptionDisplay();
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Could not start speech recognition:', error);
            }
        }
    }
    
    stopLiveTranscription() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    updateLiveTranscriptionDisplay() {
        if (this.liveTranscriptionEl) {
            this.liveTranscriptionEl.textContent = this.currentTranscription || 'Listening...';
        }
    }
    
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.audioChunks = [];
            this.currentTranscription = '';
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.saveRecording(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            
            // Start live transcription
            this.startLiveTranscription();
            
            this.updateUI();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        // Stop live transcription
        this.stopLiveTranscription();
        
        this.isRecording = false;
        this.updateUI();
    }
    
    updateUI() {
        if (this.isRecording) {
            this.recordingStatus.textContent = 'Recording...';
            this.recordingStatus.classList.add('recording');
            this.recordBtn.classList.add('recording');
            this.recordIcon.classList.add('hidden');
            this.stopIcon.classList.remove('hidden');
            
            // Show live transcription container
            if (this.liveTranscriptionContainer) {
                this.liveTranscriptionContainer.classList.remove('hidden');
            }
        } else {
            this.recordingStatus.textContent = 'Tap to Record';
            this.recordingStatus.classList.remove('recording');
            this.recordBtn.classList.remove('recording');
            this.recordIcon.classList.remove('hidden');
            this.stopIcon.classList.add('hidden');
            
            // Hide live transcription container
            if (this.liveTranscriptionContainer) {
                this.liveTranscriptionContainer.classList.add('hidden');
            }
        }
    }
    
    saveRecording(audioBlob) {
        const recording = {
            id: Date.now(),
            blob: audioBlob,
            createdAt: new Date(),
            transcription: this.currentTranscription || null,
            isTranscribing: false,
            url: URL.createObjectURL(audioBlob)
        };
        
        this.recordings.unshift(recording);
        this.saveToLocalStorage();
        this.updateRecordingsList();
        this.enableRecordingsButton();
    }
    
    enableRecordingsButton() {
        this.showRecordingsBtn.disabled = false;
    }
    
    toggleRecordingsList() {
        this.recordingsList.classList.toggle('hidden');
        if (!this.recordingsList.classList.contains('hidden')) {
            this.updateRecordingsList();
        }
    }
    
    updateRecordingsList() {
        if (this.recordings.length === 0) {
            this.recordingsContainer.innerHTML = '<p class="no-recordings">No recordings yet. Start by making your first recording!</p>';
            return;
        }
        
        this.recordingsContainer.innerHTML = this.recordings.map(recording => `
            <div class="recording-item" data-id="${recording.id}">
                <div class="recording-header">
                    <div class="recording-title">Recording ${this.formatDate(recording.createdAt)}</div>
                    <div class="recording-date">${this.formatTime(recording.createdAt)}</div>
                </div>
                
                <div class="recording-controls">
                    <button class="control-btn play-btn" data-action="play" data-recording-id="${recording.id}"
                            ${!recording.url ? 'disabled title="Audio not available - can only play in same session"' : ''}>
                        ${recording.url ? '▶️ Play' : '🚫 No Audio'}
                    </button>
                    <button class="control-btn transcribe-btn" data-action="transcribe" data-recording-id="${recording.id}"
                            ${!recording.transcription ? 'disabled' : ''}>
                        ${recording.transcription ? '🔄 View Transcription' : '❌ No Transcription'}
                    </button>
                    <button class="control-btn delete-btn" data-action="delete" data-recording-id="${recording.id}">
                        🗑️ Delete
                    </button>
                </div>
                
                ${this.renderTranscriptionPreview(recording)}
            </div>
        `).join('');
    }
    
    renderTranscriptionPreview(recording) {
        if (recording.isTranscribing) {
            return '<div class="transcription-preview transcribing">Transcribing audio... Please wait.</div>';
        } else if (recording.transcription) {
            const preview = recording.transcription.length > 100 
                ? recording.transcription.substring(0, 100) + '...'
                : recording.transcription;
            return `<div class="transcription-preview" data-recording-id="${recording.id}" style="cursor: pointer;">
                ${preview} <span style="color: #3b82f6; font-weight: 500;">Click to view full transcription</span>
            </div>`;
        }
        return '';
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    playRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording || !recording.url) {
            alert('Audio data not available. Recording can only be played in the same session it was created.');
            return;
        }
        
        // Stop current audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        this.currentAudio = new Audio(recording.url);
        this.currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Could not play recording');
        });
    }
    
    retranscribeRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording || !recording.transcription) {
            alert('No transcription available. Transcription is captured live during recording.');
            return;
        }
        
        // Show the full transcription
        this.showFullTranscription(id);
    }
    
    showFullTranscription(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording || !recording.transcription) return;
        
        this.transcriptionContent.innerHTML = `
            <h4>Recording from ${this.formatDate(recording.createdAt)} at ${this.formatTime(recording.createdAt)}</h4>
            <p style="margin-top: 16px;">${recording.transcription}</p>
        `;
        this.transcriptionModal.classList.remove('hidden');
    }
    
    closeTranscriptionModal() {
        this.transcriptionModal.classList.add('hidden');
    }
    
    deleteRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording) return;
        
        if (confirm('Are you sure you want to delete this recording?')) {
            // Revoke the object URL to free memory
            URL.revokeObjectURL(recording.url);
            
            this.recordings = this.recordings.filter(r => r.id !== id);
            this.saveToLocalStorage();
            this.updateRecordingsList();
            
            if (this.recordings.length === 0) {
                this.showRecordingsBtn.disabled = true;
            }
        }
    }
    
    saveToLocalStorage() {
        // Save recordings metadata (without blobs) to localStorage
        const recordingsMetadata = this.recordings.map(r => ({
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            transcription: r.transcription,
            isTranscribing: r.isTranscribing
        }));
        
        localStorage.setItem('voiceNotesRecordings', JSON.stringify(recordingsMetadata));
    }
    
    loadRecordings() {
        try {
            const savedData = localStorage.getItem('voiceNotesRecordings');
            if (savedData) {
                const recordingsMetadata = JSON.parse(savedData);
                // Note: We can't restore audio blobs from localStorage
                // In a real app, you'd store recordings on a server
                this.recordings = recordingsMetadata.map(r => ({
                    ...r,
                    createdAt: new Date(r.createdAt),
                    blob: null,
                    url: null
                }));
                
                if (this.recordings.length > 0) {
                    this.enableRecordingsButton();
                }
            }
        } catch (error) {
            console.error('Error loading recordings:', error);
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VoiceNotesApp();
    // Make app available globally for onclick handlers
    window.app = app;
});