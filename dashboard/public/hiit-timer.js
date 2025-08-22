class HIITTimer {
    constructor() {
        this.workTime = 30;
        this.restTime = 10;
        this.rounds = 8;
        this.currentRound = 1;
        this.timeRemaining = this.workTime;
        this.timerState = 'idle'; // 'idle', 'work', 'rest', 'finished'
        this.isRunning = false;
        this.interval = null;
        this.voiceEnabled = true;
        this.lastAnnouncedTime = null;
        this.countdownTimer = null;
        this.isCountingDown = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.initializeTTS();
    }
    
    initializeElements() {
        this.statusText = document.getElementById('statusText');
        this.timerText = document.getElementById('timerText');
        this.roundText = document.getElementById('roundText');
        this.startButton = document.getElementById('startButton');
        this.resetButton = document.getElementById('resetButton');
        this.workTimeInput = document.getElementById('workTimeInput');
        this.restTimeInput = document.getElementById('restTimeInput');
        this.roundsInput = document.getElementById('roundsInput');
        this.timerDisplay = document.querySelector('.timer-display');
        this.testSoundButton = document.getElementById('testSoundButton');
        this.voiceToggleButton = document.getElementById('voiceToggleButton');
        this.audioStatus = document.getElementById('audioStatus');
        
        // Check for text-to-speech support
        this.ttsSupported = 'speechSynthesis' in window;
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => {
            // Initialize audio context on first user interaction
            this.initializeAudio();
            this.toggleTimer();
        });
        this.resetButton.addEventListener('click', () => this.resetTimer());
        
        this.testSoundButton.addEventListener('click', () => {
            this.testSound();
        });
        
        this.voiceToggleButton.addEventListener('click', () => {
            this.toggleVoice();
        });
        
        this.workTimeInput.addEventListener('change', (e) => {
            this.workTime = parseInt(e.target.value) || 1;
            if (this.timerState === 'idle') {
                this.timeRemaining = this.workTime;
                this.updateDisplay();
            }
        });
        
        this.restTimeInput.addEventListener('change', (e) => {
            this.restTime = parseInt(e.target.value) || 1;
        });
        
        this.roundsInput.addEventListener('change', (e) => {
            this.rounds = parseInt(e.target.value) || 1;
            this.updateDisplay();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'Escape') {
                this.resetTimer();
            }
        });
        
        // Prevent screen sleep
        this.wakeLock = null;
        this.requestWakeLock();
    }
    
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake lock not supported or failed:', err);
        }
    }
    
    toggleTimer() {
        if (this.isRunning || this.isCountingDown) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        if (this.timerState === 'idle' || this.timerState === 'finished') {
            // Starting fresh - do countdown before beginning
            this.timerState = 'work';
            this.timeRemaining = this.workTime;
            this.currentRound = 1;
            this.startCountdown();
            return;
        }
        
        // Resuming - start immediately
        this.isRunning = true;
        this.startButton.textContent = 'PAUSE';
        this.disableInputs(true);
        
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.updateDisplay();
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startButton.textContent = this.timerState === 'idle' || this.timerState === 'finished' ? 'START' : 'RESUME';
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Cancel countdown if paused during countdown
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
            this.isCountingDown = false;
        }
    }
    
    resetTimer() {
        this.isRunning = false;
        this.timerState = 'idle';
        this.timeRemaining = this.workTime;
        this.currentRound = 1;
        this.startButton.textContent = 'START';
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
            this.isCountingDown = false;
        }
        
        this.disableInputs(false);
        this.updateDisplay();
        this.updateBackgroundColor();
    }
    
    tick() {
        this.timeRemaining--;
        
        // Voice announcements for specific times
        this.handleVoiceAnnouncements();
        
        if (this.timeRemaining <= 0) {
            this.handleIntervalComplete();
        }
        
        this.updateDisplay();
    }
    
    handleIntervalComplete() {
        this.playSound();
        this.triggerVibration();
        this.showCelebration();
        
        if (this.timerState === 'work') {
            if (this.currentRound >= this.rounds) {
                this.timerState = 'finished';
                this.isRunning = false;
                this.timeRemaining = 0;
                this.startButton.textContent = 'START';
                this.disableInputs(false);
                this.speak('Workout complete! Great job!');
                this.showNotification('HIIT Timer Complete!', 'Great job! You completed all rounds.');
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null;
                }
            } else {
                this.timerState = 'rest';
                this.timeRemaining = this.restTime;
                this.speak('Rest');
                this.showNotification('Rest Time!', `Take a break. Round ${this.currentRound} of ${this.rounds} complete.`);
            }
        } else if (this.timerState === 'rest') {
            this.currentRound++;
            this.timerState = 'work';
            this.timeRemaining = this.workTime;
            this.speak('Work');
            this.showNotification('Work Time!', `Round ${this.currentRound} of ${this.rounds}. Let's go!`);
        }
        
        this.lastAnnouncedTime = null; // Reset for new interval
        this.updateDisplay();
        this.updateBackgroundColor();
    }
    
    async playSound() {
        try {
            // First try to resume audio context if it's suspended (user interaction required)
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create oscillator and gain nodes
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different frequencies and patterns for different states
            if (this.timerState === 'work') {
                // Higher pitch beep for work transition
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            } else if (this.timerState === 'rest') {
                // Lower pitch beep for rest transition
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
            } else {
                // Completion sound - different tone
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.8);
                
                // Add a second beep for emphasis
                setTimeout(() => {
                    if (this.audioContext) {
                        const osc2 = this.audioContext.createOscillator();
                        const gain2 = this.audioContext.createGain();
                        osc2.connect(gain2);
                        gain2.connect(this.audioContext.destination);
                        
                        osc2.frequency.setValueAtTime(800, this.audioContext.currentTime);
                        osc2.type = 'sine';
                        gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                        gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                        
                        osc2.start(this.audioContext.currentTime);
                        osc2.stop(this.audioContext.currentTime + 0.4);
                    }
                }, 300);
            }
            
        } catch (error) {
            console.log('Audio playback failed:', error);
            // Fallback: show visual notification if audio fails
            this.showAudioFallback();
        }
    }
    
    triggerVibration() {
        if ('vibrate' in navigator) {
            // Different vibration patterns for different states
            if (this.timerState === 'finished') {
                navigator.vibrate([200, 100, 200, 100, 200]); // Long celebration vibration
            } else if (this.timerState === 'work') {
                navigator.vibrate([100, 50, 100]); // Work transition
            } else {
                navigator.vibrate(200); // Rest transition
            }
        }
    }
    
    showCelebration() {
        this.timerDisplay.classList.add('celebration');
        setTimeout(() => {
            this.timerDisplay.classList.remove('celebration');
        }, 600);
    }
    
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    }
    
    updateDisplay() {
        // Update timer text
        this.timerText.textContent = this.formatTime(this.timeRemaining);
        
        // Update status text
        this.statusText.textContent = this.getStatusText();
        
        // Update round text
        this.roundText.textContent = `Round ${this.currentRound} of ${this.rounds}`;
        
        // Add warning classes for low time
        this.timerText.classList.remove('low-time', 'critical-time');
        if (this.timeRemaining <= 3 && this.timeRemaining > 0) {
            this.timerText.classList.add('critical-time');
        } else if (this.timeRemaining <= 5 && this.timeRemaining > 3) {
            this.timerText.classList.add('low-time');
        }
        
        // Add pulse effect when running and time is low
        if (this.isRunning && this.timeRemaining <= 10) {
            this.timerText.classList.add('pulse');
        } else {
            this.timerText.classList.remove('pulse');
        }
        
        this.updateBackgroundColor();
    }
    
    updateBackgroundColor() {
        document.body.className = ''; // Clear all mode classes
        
        switch (this.timerState) {
            case 'work':
                document.body.classList.add('work-mode');
                break;
            case 'rest':
                document.body.classList.add('rest-mode');
                break;
            case 'finished':
                document.body.classList.add('finished-mode');
                break;
            default:
                // Default ready state - no additional class needed
                break;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    getStatusText() {
        if (this.isCountingDown) {
            return '⏳ GET READY';
        }
        
        switch (this.timerState) {
            case 'work':
                return '💪 WORK';
            case 'rest':
                return '😌 REST';
            case 'finished':
                return '🎉 FINISHED';
            default:
                return '⚡ READY';
        }
    }
    
    disableInputs(disabled) {
        this.workTimeInput.disabled = disabled;
        this.restTimeInput.disabled = disabled;
        this.roundsInput.disabled = disabled;
    }
    
    async initializeAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context initialized');
                this.audioStatus.textContent = 'Audio enabled 🔊';
                this.audioStatus.style.color = 'rgba(76, 175, 80, 0.9)';
            } catch (error) {
                console.log('Audio context not supported:', error);
                this.audioStatus.textContent = 'Audio not supported 🔇';
                this.audioStatus.style.color = 'rgba(239, 68, 68, 0.8)';
            }
        }
    }
    
    async testSound() {
        await this.initializeAudio();
        if (this.audioContext) {
            try {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                
                this.audioStatus.textContent = 'Sound test successful! 🎉';
                this.audioStatus.style.color = 'rgba(76, 175, 80, 0.9)';
                
                setTimeout(() => {
                    this.audioStatus.textContent = 'Audio enabled 🔊';
                }, 2000);
                
            } catch (error) {
                console.log('Sound test failed:', error);
                this.audioStatus.textContent = 'Sound test failed ⚠️';
                this.audioStatus.style.color = 'rgba(239, 68, 68, 0.8)';
            }
        }
    }
    
    showAudioFallback() {
        // Visual feedback when audio fails
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
            transition: opacity 0.3s ease;
        `;
        
        if (this.timerState === 'work') {
            notification.textContent = '🔊 WORK TIME!';
            notification.style.background = 'rgba(76, 175, 80, 0.9)';
        } else if (this.timerState === 'rest') {
            notification.textContent = '🔊 REST TIME!';
            notification.style.background = 'rgba(255, 152, 0, 0.9)';
        } else {
            notification.textContent = '🎉 FINISHED!';
            notification.style.background = 'rgba(158, 158, 158, 0.9)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    initializeTTS() {
        if (this.ttsSupported) {
            console.log('Text-to-speech supported');
            this.updateVoiceStatus();
        } else {
            console.log('Text-to-speech not supported');
            this.voiceToggleButton.disabled = true;
            this.voiceToggleButton.classList.add('disabled');
            this.voiceToggleButton.textContent = '🚫 Voice Not Supported';
            this.audioStatus.textContent = 'Audio enabled (Voice not supported) 🔊';
        }
    }
    
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        this.updateVoiceStatus();
        
        if (this.voiceEnabled) {
            this.speak('Voice enabled');
        }
    }
    
    updateVoiceStatus() {
        if (this.ttsSupported) {
            this.voiceToggleButton.textContent = this.voiceEnabled ? '🎙️ Voice On' : '🔇 Voice Off';
            this.voiceToggleButton.classList.toggle('disabled', !this.voiceEnabled);
            
            if (this.voiceEnabled) {
                this.audioStatus.textContent = 'Audio & Voice enabled 🎙️';
                this.audioStatus.style.color = 'rgba(76, 175, 80, 0.9)';
            } else {
                this.audioStatus.textContent = 'Audio enabled, Voice disabled 🔊';
                this.audioStatus.style.color = 'rgba(255, 152, 0, 0.9)';
            }
        }
    }
    
    speak(text, options = {}) {
        if (!this.voiceEnabled || !this.ttsSupported) return;
        
        try {
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice settings
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.1;
            utterance.volume = options.volume || 0.8;
            
            // Try to use a more energetic voice if available
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Google') || 
                voice.name.includes('Microsoft') ||
                voice.lang.startsWith('en')
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.log('Speech synthesis failed:', error);
        }
    }
    
    handleVoiceAnnouncements() {
        // Avoid duplicate announcements for the same time
        if (this.lastAnnouncedTime === this.timeRemaining) return;
        
        if (this.timeRemaining === 10) {
            this.speak('10 seconds');
            this.lastAnnouncedTime = 10;
        } else if (this.timeRemaining === 5) {
            this.speak('5');
            this.lastAnnouncedTime = 5;
        } else if (this.timeRemaining === 4) {
            this.speak('4');
            this.lastAnnouncedTime = 4;
        } else if (this.timeRemaining === 3) {
            this.speak('3');
            this.lastAnnouncedTime = 3;
        } else if (this.timeRemaining === 2) {
            this.speak('2');
            this.lastAnnouncedTime = 2;
        } else if (this.timeRemaining === 1) {
            this.speak('1');
            this.lastAnnouncedTime = 1;
        }
        
        // Announce halfway point for longer intervals
        const halfTime = Math.floor((this.timerState === 'work' ? this.workTime : this.restTime) / 2);
        if (this.timeRemaining === halfTime && halfTime >= 15) {
            this.speak(`${halfTime} seconds`);
            this.lastAnnouncedTime = halfTime;
        }
    }
    
    startCountdown() {
        this.isCountingDown = true;
        this.startButton.textContent = 'PAUSE';
        this.disableInputs(true);
        
        let countdown = 3;
        this.speak('Get ready');
        this.updateDisplay(); // Show "GET READY" status
        
        const countdownInterval = setInterval(() => {
            this.speak(countdown.toString());
            countdown--;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.speak('Work!');
                this.isCountingDown = false;
                
                // Start the actual timer
                this.isRunning = true;
                this.interval = setInterval(() => {
                    this.tick();
                }, 1000);
                
                this.lastAnnouncedTime = null;
                this.updateDisplay();
            }
        }, 1000);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const timer = new HIITTimer();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Add keyboard shortcut info
    console.log('HIIT Timer Controls:');
    console.log('Space: Start/Pause');
    console.log('Escape: Reset');
    
    // Add service worker for offline functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});