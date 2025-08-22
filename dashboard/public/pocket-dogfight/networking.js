// Pocket Dogfight - WebRTC Networking Module
// Handles real-time multiplayer communication

class NetworkManager {
    constructor() {
        this.signalingServerUrl = `ws://${window.location.host}/pocket-dogfight-ws`;
        this.localPeerId = this.generatePeerId();
        this.roomCode = null;
        this.isHost = false;
        this.peers = new Map();
        this.signalingSocket = null;
        this.connectionStatus = 'disconnected';
        
        // WebRTC Configuration
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        // Game events
        this.onPeerConnected = null;
        this.onPeerDisconnected = null;
        this.onGameMessage = null;
        this.onConnectionStatusChanged = null;
        
        // Message handlers
        this.messageHandlers = new Map();
        this.setupMessageHandlers();
        
        // Auto-connect to signaling server
        this.connectToSignalingServer();
    }
    
    generatePeerId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    connectToSignalingServer() {
        console.log('[Network] Connecting to signaling server:', this.signalingServerUrl);
        
        try {
            this.signalingSocket = new WebSocket(this.signalingServerUrl);
            
            this.signalingSocket.onopen = () => {
                console.log('[Network] Connected to signaling server');
                this.setConnectionStatus('connected');
            };
            
            this.signalingSocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleSignalingMessage(message);
            };
            
            this.signalingSocket.onerror = (error) => {
                console.error('[Network] Signaling server error:', error);
                this.setConnectionStatus('error');
            };
            
            this.signalingSocket.onclose = () => {
                console.log('[Network] Disconnected from signaling server');
                this.setConnectionStatus('disconnected');
                // Try to reconnect after 3 seconds
                setTimeout(() => this.connectToSignalingServer(), 3000);
            };
            
        } catch (error) {
            console.error('[Network] Failed to connect to signaling server:', error);
            this.setConnectionStatus('error');
        }
    }
    
    setConnectionStatus(status) {
        this.connectionStatus = status;
        if (this.onConnectionStatusChanged) {
            this.onConnectionStatusChanged(status);
        }
        this.updateConnectionUI();
    }
    
    updateConnectionUI() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        switch (this.connectionStatus) {
            case 'connected':
                statusElement.className = 'connection-status status-connected';
                statusElement.innerHTML = '✅ Connected to server';
                break;
            case 'connecting':
                statusElement.className = 'connection-status status-connecting';
                statusElement.innerHTML = '🔄 Connecting...';
                break;
            case 'error':
                statusElement.className = 'connection-status status-disconnected';
                statusElement.innerHTML = '❌ Connection failed';
                break;
            default:
                statusElement.className = 'connection-status status-disconnected';
                statusElement.innerHTML = '⚠️ Disconnected';
        }
    }
    
    setupMessageHandlers() {
        this.messageHandlers.set('playerUpdate', (data) => {
            const player = window.game?.engine.players.get(data.playerId);
            if (player && !player.isLocal) {
                // Interpolate remote player position
                player.x = data.x;
                player.y = data.y;
                player.angle = data.angle;
                player.vx = data.vx;
                player.vy = data.vy;
            }
        });
        
        this.messageHandlers.set('fire', (data) => {
            if (window.game?.engine) {
                window.game.engine.addProjectile(data);
            }
        });
        
        this.messageHandlers.set('hit', (data) => {
            if (window.game?.engine) {
                window.game.engine.handleHit(data.victimId, data.attackerId);
            }
        });
        
        this.messageHandlers.set('powerUpSpawn', (data) => {
            if (window.game?.engine) {
                window.game.engine.addPowerUp(data.type, data.x, data.y);
            }
        });
        
        this.messageHandlers.set('powerUpCollect', (data) => {
            const player = window.game?.engine.players.get(data.playerId);
            if (player) {
                player.applyPowerUp(data.type);
            }
            
            // Remove power-up from game
            if (window.game?.engine) {
                const powerUps = window.game.engine.powerUps;
                for (let i = powerUps.length - 1; i >= 0; i--) {
                    if (powerUps[i].type === data.type) {
                        powerUps.splice(i, 1);
                        break;
                    }
                }
            }
        });
        
        this.messageHandlers.set('gameStart', () => {
            if (window.game?.engine) {
                window.game.engine.startGame();
            }
        });
        
        this.messageHandlers.set('rematch', () => {
            if (window.game?.engine) {
                window.game.engine.startGame();
            }
        });
    }
    
    handleSignalingMessage(message) {
        console.log('[Network] Received signaling message:', message.type);
        
        switch (message.type) {
            case 'connected':
                console.log('[Network] Signaling server connection confirmed');
                break;
                
            case 'room-created':
                console.log('[Network] Room created successfully');
                this.showHostingPanel();
                break;
                
            case 'room-joined':
                console.log('[Network] Joined room successfully');
                this.showLobby();
                break;
                
            case 'peer-joined':
                if (this.isHost) {
                    console.log('[Network] New peer joined:', message.peerId);
                    this.createPeerConnection(message.peerId, true);
                    this.updatePlayersList();
                }
                break;
                
            case 'peer-left':
                console.log('[Network] Peer left:', message.peerId);
                this.closePeerConnection(message.peerId);
                this.updatePlayersList();
                break;
                
            case 'offer':
                this.handleOffer(message.peerId, message.offer);
                break;
                
            case 'answer':
                this.handleAnswer(message.peerId, message.answer);
                break;
                
            case 'ice-candidate':
                this.handleIceCandidate(message.peerId, message.candidate);
                break;
                
            case 'error':
                console.error('[Network] Signaling error:', message.error);
                alert('Connection error: ' + message.error);
                break;
        }
    }
    
    hostGame() {
        if (this.connectionStatus !== 'connected') {
            alert('Not connected to server. Please wait...');
            return;
        }
        
        this.isHost = true;
        this.roomCode = this.generateRoomCode();
        
        this.signalingSocket.send(JSON.stringify({
            type: 'create-room',
            roomCode: this.roomCode,
            peerId: this.localPeerId
        }));
    }
    
    joinGame(roomCode) {
        if (this.connectionStatus !== 'connected') {
            alert('Not connected to server. Please wait...');
            return;
        }
        
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-character room code');
            return;
        }
        
        this.isHost = false;
        this.roomCode = roomCode.toUpperCase();
        
        this.signalingSocket.send(JSON.stringify({
            type: 'join-room',
            roomCode: this.roomCode,
            peerId: this.localPeerId
        }));
    }
    
    leaveRoom() {
        if (this.signalingSocket && this.roomCode) {
            this.signalingSocket.send(JSON.stringify({
                type: 'leave-room',
                roomCode: this.roomCode,
                peerId: this.localPeerId
            }));
        }
        
        // Close all peer connections
        for (let [peerId, peer] of this.peers) {
            this.closePeerConnection(peerId);
        }
        
        this.roomCode = null;
        this.isHost = false;
        this.peers.clear();
    }
    
    createPeerConnection(peerId, shouldCreateOffer) {
        console.log('[Network] Creating peer connection for:', peerId);
        
        const peerConnection = new RTCPeerConnection(this.rtcConfig);
        let dataChannel;
        
        if (shouldCreateOffer) {
            // Host creates data channel
            dataChannel = peerConnection.createDataChannel('gameData', {
                ordered: false,
                maxRetransmits: 0
            });
            this.setupDataChannel(peerId, dataChannel);
        } else {
            // Client waits for data channel
            peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(peerId, event.channel);
            };
        }
        
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingSocket.send(JSON.stringify({
                    type: 'ice-candidate',
                    roomCode: this.roomCode,
                    targetPeer: peerId,
                    candidate: event.candidate
                }));
            }
        };
        
        peerConnection.onconnectionstatechange = () => {
            console.log('[Network] Connection state changed:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'failed' || 
                peerConnection.connectionState === 'disconnected') {
                this.closePeerConnection(peerId);
            }
        };
        
        this.peers.set(peerId, {
            peerConnection: peerConnection,
            dataChannel: dataChannel
        });
        
        if (shouldCreateOffer) {
            this.createOffer(peerId);
        }
    }
    
    setupDataChannel(peerId, dataChannel) {
        console.log('[Network] Setting up data channel for:', peerId);
        
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.dataChannel = dataChannel;
        }
        
        dataChannel.onopen = () => {
            console.log('[Network] Data channel opened for:', peerId);
            if (this.onPeerConnected) {
                this.onPeerConnected(peerId);
            }
            this.updatePlayersList();
        };
        
        dataChannel.onclose = () => {
            console.log('[Network] Data channel closed for:', peerId);
            if (this.onPeerDisconnected) {
                this.onPeerDisconnected(peerId);
            }
            this.updatePlayersList();
        };
        
        dataChannel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleGameMessage(message);
            } catch (error) {
                console.error('[Network] Error parsing message:', error);
            }
        };
        
        dataChannel.onerror = (error) => {
            console.error('[Network] Data channel error:', error);
        };
    }
    
    createOffer(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        peer.peerConnection.createOffer().then((offer) => {
            return peer.peerConnection.setLocalDescription(offer);
        }).then(() => {
            this.signalingSocket.send(JSON.stringify({
                type: 'offer',
                roomCode: this.roomCode,
                targetPeer: peerId,
                offer: peer.peerConnection.localDescription
            }));
        }).catch((error) => {
            console.error('[Network] Error creating offer:', error);
        });
    }
    
    handleOffer(peerId, offer) {
        this.createPeerConnection(peerId, false);
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        peer.peerConnection.setRemoteDescription(offer).then(() => {
            return peer.peerConnection.createAnswer();
        }).then((answer) => {
            return peer.peerConnection.setLocalDescription(answer);
        }).then(() => {
            this.signalingSocket.send(JSON.stringify({
                type: 'answer',
                roomCode: this.roomCode,
                targetPeer: peerId,
                answer: peer.peerConnection.localDescription
            }));
        }).catch((error) => {
            console.error('[Network] Error handling offer:', error);
        });
    }
    
    handleAnswer(peerId, answer) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        peer.peerConnection.setRemoteDescription(answer).catch((error) => {
            console.error('[Network] Error handling answer:', error);
        });
    }
    
    handleIceCandidate(peerId, candidate) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        peer.peerConnection.addIceCandidate(candidate).catch((error) => {
            console.error('[Network] Error adding ICE candidate:', error);
        });
    }
    
    closePeerConnection(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            if (peer.dataChannel) {
                peer.dataChannel.close();
            }
            if (peer.peerConnection) {
                peer.peerConnection.close();
            }
            this.peers.delete(peerId);
            
            if (this.onPeerDisconnected) {
                this.onPeerDisconnected(peerId);
            }
        }
    }
    
    sendGameMessage(type, data) {
        const message = {
            type: type,
            timestamp: Date.now(),
            peerId: this.localPeerId,
            ...data
        };
        
        this.sendToAllPeers(JSON.stringify(message));
        
        // Handle message locally too (for host)
        if (this.isHost) {
            this.handleGameMessage(message);
        }
    }
    
    sendToAllPeers(data) {
        for (let [peerId, peer] of this.peers) {
            if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
                try {
                    peer.dataChannel.send(data);
                } catch (error) {
                    console.error('[Network] Error sending to peer:', peerId, error);
                }
            }
        }
    }
    
    handleGameMessage(message) {
        if (this.onGameMessage) {
            this.onGameMessage(message);
        }
        
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        }
    }
    
    startGame() {
        if (!this.isHost) return;
        
        // Send start game message to all peers
        this.sendGameMessage('gameStart', {});
        
        // Start locally
        if (window.game?.engine) {
            window.game.engine.startGame();
        }
    }
    
    // UI Management
    showHostingPanel() {
        document.getElementById('menuButtons').style.display = 'none';
        document.getElementById('joinForm').style.display = 'none';
        document.getElementById('hostingPanel').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = this.roomCode;
        
        // Add local player
        if (window.game?.engine) {
            window.game.engine.addPlayer(this.localPeerId, { x: 100, y: 100 });
        }
        
        this.updatePlayersList();
    }
    
    showLobby() {
        // For now, just join the game immediately
        // In a full implementation, you'd show a lobby UI
        alert(`Joined room ${this.roomCode}! Waiting for host to start...`);
        
        // Add local player
        if (window.game?.engine) {
            window.game.engine.addPlayer(this.localPeerId, { x: 200, y: 200 });
        }
    }
    
    updatePlayersList() {
        const playersListElement = document.getElementById('playersList');
        if (!playersListElement) return;
        
        const connectedPeers = Array.from(this.peers.keys()).filter(peerId => {
            const peer = this.peers.get(peerId);
            return peer?.dataChannel?.readyState === 'open';
        });
        
        const totalPlayers = connectedPeers.length + 1; // +1 for local player
        
        playersListElement.innerHTML = `
            <div>Connected Players: ${totalPlayers}/4</div>
            <div>• You (Host)</div>
            ${connectedPeers.map(peerId => `<div>• Player ${peerId}</div>`).join('')}
        `;
        
        // Enable start button if we have at least 2 players
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.disabled = totalPlayers < 2;
        }
    }
    
    getConnectedPeers() {
        return Array.from(this.peers.keys()).filter(peerId => {
            const peer = this.peers.get(peerId);
            return peer?.dataChannel?.readyState === 'open';
        });
    }
    
    disconnect() {
        this.leaveRoom();
        if (this.signalingSocket) {
            this.signalingSocket.close();
        }
    }
}

// Utility functions for network debugging
class NetworkDebugger {
    constructor() {
        this.enabled = false;
        this.messageLog = [];
        this.maxLogSize = 100;
    }
    
    enable() {
        this.enabled = true;
        console.log('[NetworkDebugger] Enabled');
    }
    
    disable() {
        this.enabled = false;
        console.log('[NetworkDebugger] Disabled');
    }
    
    log(direction, peerId, message) {
        if (!this.enabled) return;
        
        const entry = {
            timestamp: Date.now(),
            direction: direction, // 'send' or 'receive'
            peerId: peerId,
            message: message
        };
        
        this.messageLog.push(entry);
        
        if (this.messageLog.length > this.maxLogSize) {
            this.messageLog.shift();
        }
        
        console.log(`[NetworkDebugger] ${direction.toUpperCase()} ${peerId}:`, message);
    }
    
    getStats() {
        const now = Date.now();
        const recentMessages = this.messageLog.filter(entry => 
            now - entry.timestamp < 10000 // Last 10 seconds
        );
        
        const stats = {
            totalMessages: this.messageLog.length,
            recentMessages: recentMessages.length,
            messagesByType: {},
            messagesByPeer: {}
        };
        
        for (let entry of recentMessages) {
            const type = entry.message.type || 'unknown';
            stats.messagesByType[type] = (stats.messagesByType[type] || 0) + 1;
            stats.messagesByPeer[entry.peerId] = (stats.messagesByPeer[entry.peerId] || 0) + 1;
        }
        
        return stats;
    }
    
    clearLog() {
        this.messageLog = [];
        console.log('[NetworkDebugger] Log cleared');
    }
}

// Create global network debugger
window.networkDebugger = new NetworkDebugger();

// Helper function to test signaling server connection
function testSignalingServer(url = 'ws://localhost:3010') {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
            console.log('✅ Signaling server test: Connected');
            ws.close();
            resolve(true);
        };
        
        ws.onerror = (error) => {
            console.error('❌ Signaling server test: Error', error);
            reject(error);
        };
        
        ws.onclose = () => {
            console.log('Signaling server test: Connection closed');
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                ws.close();
                reject(new Error('Connection timeout'));
            }
        }, 5000);
    });
}