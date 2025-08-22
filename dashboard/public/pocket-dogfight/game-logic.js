// Pocket Dogfight - Main Game Logic
// Integrates all systems and handles game flow

class PocketDogfight {
    constructor() {
        this.engine = null;
        this.networkManager = null;
        this.gameState = 'menu';
        this.selectedTheme = 'biplanes';
        
        // UI Elements
        this.uiElements = {
            menuPanel: null,
            gameHUD: null,
            mobileControls: null,
            themeOptions: null,
            menuButtons: null,
            joinForm: null,
            hostingPanel: null
        };
        
        // Event handlers
        this.boundEventHandlers = {};
    }
    
    init() {
        console.log('🛩️ Initializing Pocket Dogfight...');
        
        // Initialize game engine
        const canvas = document.getElementById('gameCanvas');
        this.engine = new GameEngine(canvas);
        
        // Initialize networking
        this.networkManager = new NetworkManager();
        window.networkManager = this.networkManager; // Global access
        window.game = this; // Global access
        
        // Setup UI
        this.setupUI();
        this.setupNetworking();
        
        // Start game loop
        this.engine.start();
        
        console.log('✅ Pocket Dogfight initialized successfully!');
    }
    
    setupUI() {
        // Cache UI elements
        this.uiElements.menuPanel = document.getElementById('menuPanel');
        this.uiElements.gameHUD = document.getElementById('gameHUD');
        this.uiElements.mobileControls = document.getElementById('mobileControls');
        this.uiElements.themeOptions = document.querySelectorAll('.theme-option');
        this.uiElements.menuButtons = document.getElementById('menuButtons');
        this.uiElements.joinForm = document.getElementById('joinForm');
        this.uiElements.hostingPanel = document.getElementById('hostingPanel');
        
        // Setup theme selection
        this.setupThemeSelection();
        
        // Setup menu buttons
        this.setupMenuButtons();
        
        // Setup mobile controls
        if (this.engine.isMobile) {
            this.uiElements.mobileControls.style.display = 'flex';
        }
    }
    
    setupThemeSelection() {
        this.uiElements.themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                this.uiElements.themeOptions.forEach(opt => 
                    opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected theme
                this.selectedTheme = option.dataset.theme;
                this.engine.theme = this.selectedTheme;
                
                console.log('Selected theme:', this.selectedTheme);
            });
        });
    }
    
    setupMenuButtons() {
        // Host Game button
        document.getElementById('hostGameBtn').addEventListener('click', () => {
            this.hostGame();
        });
        
        // Join Game button
        document.getElementById('joinGameBtn').addEventListener('click', () => {
            this.showJoinForm();
        });
        
        // Connect button (in join form)
        document.getElementById('connectBtn').addEventListener('click', () => {
            const roomCode = document.getElementById('roomCodeInput').value.trim();
            this.joinGame(roomCode);
        });
        
        // Cancel button (in join form)
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Start Game button (in hosting panel)
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Cancel Host button
        document.getElementById('cancelHostBtn').addEventListener('click', () => {
            this.cancelHost();
        });
        
        // Exit Game button
        document.getElementById('exitGameBtn').addEventListener('click', () => {
            this.exitGame();
        });
        
        // Room code input - auto uppercase and limit to 6 chars
        const roomCodeInput = document.getElementById('roomCodeInput');
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().slice(0, 6);
        });
        
        // Enter key in room code input
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const roomCode = e.target.value.trim();
                this.joinGame(roomCode);
            }
        });
    }
    
    setupNetworking() {
        // Setup network event handlers
        this.networkManager.onPeerConnected = (peerId) => {
            console.log('Peer connected:', peerId);
            
            // Add player to game
            this.engine.addPlayer(peerId, this.getRandomSpawnPoint());
            
            // Send current game state to new peer
            if (this.networkManager.isHost) {
                this.sendGameState(peerId);
            }
        };
        
        this.networkManager.onPeerDisconnected = (peerId) => {
            console.log('Peer disconnected:', peerId);
            
            // Remove player from game
            this.engine.removePlayer(peerId);
        };
        
        this.networkManager.onGameMessage = (message) => {
            // Handle game messages
            this.handleNetworkMessage(message);
        };
        
        this.networkManager.onConnectionStatusChanged = (status) => {
            console.log('Connection status changed:', status);
            this.updateConnectionStatus(status);
        };
    }
    
    handleNetworkMessage(message) {
        // Additional message handling beyond what's in NetworkManager
        switch (message.type) {
            case 'themeChange':
                this.handleThemeChange(message);
                break;
                
            case 'chatMessage':
                this.handleChatMessage(message);
                break;
                
            case 'gameState':
                this.handleGameState(message);
                break;
        }
    }
    
    sendGameState(targetPeerId = null) {
        if (!this.networkManager.isHost) return;
        
        const gameState = {
            type: 'gameState',
            theme: this.selectedTheme,
            players: this.serializePlayers(),
            powerUps: this.serializePowerUps(),
            gameTime: this.engine.gameTime,
            gameState: this.engine.gameState
        };
        
        if (targetPeerId) {
            // Send to specific peer
            const peer = this.networkManager.peers.get(targetPeerId);
            if (peer?.dataChannel?.readyState === 'open') {
                peer.dataChannel.send(JSON.stringify(gameState));
            }
        } else {
            // Send to all peers
            this.networkManager.sendToAllPeers(JSON.stringify(gameState));
        }
    }
    
    serializePlayers() {
        const players = {};
        for (let [id, player] of this.engine.players) {
            players[id] = {
                x: player.x,
                y: player.y,
                angle: player.angle,
                score: player.score,
                kos: player.kos,
                health: player.health,
                activePowerUp: player.activePowerUp
            };
        }
        return players;
    }
    
    serializePowerUps() {
        return this.engine.powerUps.map(powerUp => ({
            type: powerUp.type,
            x: powerUp.x,
            y: powerUp.y
        }));
    }
    
    handleThemeChange(message) {
        this.selectedTheme = message.theme;
        this.engine.theme = this.selectedTheme;
        
        // Update UI
        this.uiElements.themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === this.selectedTheme);
        });
    }
    
    handleGameState(message) {
        // Sync game state from host
        this.selectedTheme = message.theme;
        this.engine.theme = this.selectedTheme;
        this.engine.gameTime = message.gameTime;
        this.engine.gameState = message.gameState;
        
        // Sync players
        for (let [playerId, playerData] of Object.entries(message.players)) {
            let player = this.engine.players.get(playerId);
            if (!player) {
                player = this.engine.addPlayer(playerId, playerData);
            }
            
            // Update player state
            Object.assign(player, playerData);
        }
        
        // Sync power-ups
        this.engine.powerUps = message.powerUps.map(data => 
            new PowerUp(data.type, data.x, data.y));
    }
    
    getRandomSpawnPoint() {
        const spawnPoints = [
            { x: 100, y: 100 },
            { x: this.engine.width - 100, y: 100 },
            { x: 100, y: this.engine.height - 100 },
            { x: this.engine.width - 100, y: this.engine.height - 100 },
            { x: this.engine.width / 2, y: 100 },
            { x: this.engine.width / 2, y: this.engine.height - 100 }
        ];
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
    
    updateConnectionStatus(status) {
        // Update UI based on connection status
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            this.networkManager.updateConnectionUI();
        }
        
        // Enable/disable buttons based on connection
        const hostBtn = document.getElementById('hostGameBtn');
        const joinBtn = document.getElementById('joinGameBtn');
        
        if (hostBtn && joinBtn) {
            const isConnected = status === 'connected';
            hostBtn.disabled = !isConnected;
            joinBtn.disabled = !isConnected;
        }
    }
    
    // Game flow methods
    hostGame() {
        console.log('Hosting new game...');
        this.networkManager.hostGame();
        this.engine.theme = this.selectedTheme;
    }
    
    showJoinForm() {
        this.uiElements.menuButtons.style.display = 'none';
        this.uiElements.joinForm.style.display = 'block';
        document.getElementById('roomCodeInput').focus();
    }
    
    joinGame(roomCode) {
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-character room code');
            return;
        }
        
        console.log('Joining game with room code:', roomCode);
        this.networkManager.joinGame(roomCode);
        this.engine.theme = this.selectedTheme;
    }
    
    startGame() {
        if (!this.networkManager.isHost) {
            console.warn('Only host can start the game');
            return;
        }
        
        const connectedPeers = this.networkManager.getConnectedPeers();
        if (connectedPeers.length === 0) {
            alert('Need at least 2 players to start the game');
            return;
        }
        
        console.log('Starting game with', connectedPeers.length + 1, 'players');
        
        // Send theme to all peers
        this.networkManager.sendGameMessage('themeChange', {
            theme: this.selectedTheme
        });
        
        // Start the game
        this.networkManager.startGame();
    }
    
    cancelHost() {
        console.log('Cancelling host...');
        this.networkManager.leaveRoom();
        this.showMainMenu();
    }
    
    exitGame() {
        console.log('Exiting game...');
        this.networkManager.leaveRoom();
        this.engine.gameState = 'menu';
        this.showMainMenu();
    }
    
    showMainMenu() {
        // Hide all panels
        this.uiElements.joinForm.style.display = 'none';
        this.uiElements.hostingPanel.style.display = 'none';
        this.uiElements.gameHUD.style.display = 'none';
        this.uiElements.mobileControls.style.display = 'none';
        document.getElementById('miniMap').style.display = 'none';
        
        // Show main menu
        this.uiElements.menuButtons.style.display = 'block';
        this.uiElements.menuPanel.style.display = 'block';
        
        // Reset engine state
        this.engine.gameState = 'menu';
        this.engine.players.clear();
        this.engine.projectiles = [];
        this.engine.powerUps = [];
        this.engine.particles = [];
    }
    
    // Utility methods
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 1000;
            max-width: 300px;
            font-size: 14px;
            border-left: 4px solid ${type === 'error' ? '#e74c3c' : '#3498db'};
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    captureScreenshot() {
        const canvas = this.engine.canvas;
        const link = document.createElement('a');
        link.download = `pocket-dogfight-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
    
    // Debug methods
    enableDebugMode() {
        console.log('🔧 Debug mode enabled');
        
        // Enable network debugging
        window.networkDebugger.enable();
        
        // Add debug info to screen
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debugInfo';
        debugInfo.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            white-space: pre-line;
        `;
        document.body.appendChild(debugInfo);
        
        // Update debug info every second
        setInterval(() => {
            this.updateDebugInfo();
        }, 1000);
        
        // Add debug keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                    case 's':
                        e.preventDefault();
                        this.captureScreenshot();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.dumpGameState();
                        break;
                }
            }
        });
    }
    
    updateDebugInfo() {
        const debugElement = document.getElementById('debugInfo');
        if (!debugElement) return;
        
        const fps = Math.round(this.engine.frameCount / ((Date.now() - this.engine.lastTime) / 1000));
        const networkStats = window.networkDebugger.getStats();
        
        debugElement.textContent = `
FPS: ${fps}
Players: ${this.engine.players.size}
Projectiles: ${this.engine.projectiles.length}
Power-ups: ${this.engine.powerUps.length}
Particles: ${this.engine.particles.length}
Network: ${this.networkManager.connectionStatus}
Peers: ${this.networkManager.peers.size}
Messages/10s: ${networkStats.recentMessages}
Room: ${this.networkManager.roomCode || 'None'}
        `.trim();
    }
    
    dumpGameState() {
        const gameState = {
            engine: {
                gameState: this.engine.gameState,
                theme: this.engine.theme,
                gameTime: this.engine.gameTime,
                playersCount: this.engine.players.size,
                projectilesCount: this.engine.projectiles.length,
                powerUpsCount: this.engine.powerUps.length
            },
            network: {
                connectionStatus: this.networkManager.connectionStatus,
                isHost: this.networkManager.isHost,
                roomCode: this.networkManager.roomCode,
                peersCount: this.networkManager.peers.size,
                localPeerId: this.networkManager.localPeerId
            }
        };
        
        console.log('🎮 Game State Dump:', gameState);
        return gameState;
    }
    
    // Clean up
    destroy() {
        console.log('🛑 Shutting down Pocket Dogfight...');
        
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
        
        // Remove event listeners
        for (let [element, handlers] of Object.entries(this.boundEventHandlers)) {
            for (let [event, handler] of Object.entries(handlers)) {
                element.removeEventListener(event, handler);
            }
        }
        
        console.log('✅ Pocket Dogfight shut down complete');
    }
}

// Global game instance
let game = null;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            transition: all 0.3s ease;
        }
        
        .notification:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize game
    game = new PocketDogfight();
    game.init();
    
    // Global access
    window.game = game;
    
    // Enable debug mode in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        game.enableDebugMode();
        console.log('🔧 Debug mode enabled for localhost');
        console.log('🎮 Use Ctrl+F for fullscreen, Ctrl+S for screenshot, Ctrl+D for game state dump');
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.destroy();
    }
});

// Global functions for HTML onclick handlers
function hostGame() {
    if (game) game.hostGame();
}

function joinGame(roomCode) {
    if (game) game.joinGame(roomCode);
}

function startGame() {
    if (game) game.startGame();
}

function exitGame() {
    if (game) game.exitGame();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PocketDogfight;
}