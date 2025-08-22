// Pocket Dogfight - HTML5 Game Engine
// Complete multiplayer arena game implementation

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.scale = 1;
        
        // Game state
        this.gameState = 'menu'; // menu, lobby, playing, gameOver
        this.theme = 'biplanes'; // biplanes, tanks
        this.players = new Map();
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        this.arena = null;
        
        // Game settings
        this.maxPlayers = 4;
        this.scoreLimit = 5;
        this.timeLimit = 120; // 2 minutes
        this.gameTime = this.timeLimit;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.touches = new Map();
        
        // Mobile controls
        this.isMobile = this.detectMobile();
        this.virtualControls = {
            moveStick: { x: 0, y: 0, active: false },
            fireBtn: false,
            thrustBtn: false
        };
        
        // Performance
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        
        this.setupCanvas();
        this.setupInput();
        this.setupArena();
    }
    
    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Calculate scale to fit arena in viewport
        const scaleX = rect.width / this.width;
        const scaleY = (rect.height - 140) / this.height; // Account for UI
        this.scale = Math.min(scaleX, scaleY, 1);
        
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        
        // Setup rendering context
        this.ctx.scale(this.scale, this.scale);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }
    
    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse input
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.updateMousePosition(e);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
        });
        
        // Touch input for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        });
        
        // Virtual controls
        this.setupVirtualControls();
    }
    
    setupVirtualControls() {
        if (!this.isMobile) return;
        
        const moveStick = document.getElementById('moveStick');
        const fireBtn = document.getElementById('fireBtn');
        const thrustBtn = document.getElementById('thrustBtn');
        
        // Move stick
        this.setupJoystick(moveStick, 'moveStick');
        
        // Action buttons
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.virtualControls.fireBtn = true;
            this.handleFire();
        });
        
        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.virtualControls.fireBtn = false;
        });
        
        thrustBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.virtualControls.thrustBtn = true;
        });
        
        thrustBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.virtualControls.thrustBtn = false;
        });
    }
    
    setupJoystick(element, type) {
        const knob = element.querySelector('.stick-knob');
        const rect = element.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxDistance = rect.width / 2 - 15;
        
        let isDragging = false;
        
        const handleStart = (clientX, clientY) => {
            isDragging = true;
            this.virtualControls[type].active = true;
        };
        
        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            const rect = element.getBoundingClientRect();
            const x = clientX - rect.left - centerX;
            const y = clientY - rect.top - centerY;
            const distance = Math.sqrt(x * x + y * y);
            
            if (distance <= maxDistance) {
                knob.style.transform = `translate(${x}px, ${y}px)`;
                this.virtualControls[type].x = x / maxDistance;
                this.virtualControls[type].y = y / maxDistance;
            } else {
                const angle = Math.atan2(y, x);
                const limitedX = Math.cos(angle) * maxDistance;
                const limitedY = Math.sin(angle) * maxDistance;
                knob.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
                this.virtualControls[type].x = limitedX / maxDistance;
                this.virtualControls[type].y = limitedY / maxDistance;
            }
        };
        
        const handleEnd = () => {
            isDragging = false;
            knob.style.transform = 'translate(0, 0)';
            this.virtualControls[type].x = 0;
            this.virtualControls[type].y = 0;
            this.virtualControls[type].active = false;
        };
        
        // Touch events
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        });
        
        element.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        element.addEventListener('touchend', handleEnd);
        
        // Mouse events for desktop testing
        element.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });
        
        document.addEventListener('mouseup', handleEnd);
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) / this.scale;
        this.mouse.y = (e.clientY - rect.top) / this.scale;
    }
    
    handleTouchStart(e) {
        for (let touch of e.changedTouches) {
            this.touches.set(touch.identifier, {
                x: (touch.clientX - this.canvas.getBoundingClientRect().left) / this.scale,
                y: (touch.clientY - this.canvas.getBoundingClientRect().top) / this.scale
            });
        }
    }
    
    handleTouchMove(e) {
        for (let touch of e.changedTouches) {
            if (this.touches.has(touch.identifier)) {
                this.touches.set(touch.identifier, {
                    x: (touch.clientX - this.canvas.getBoundingClientRect().left) / this.scale,
                    y: (touch.clientY - this.canvas.getBoundingClientRect().top) / this.scale
                });
            }
        }
    }
    
    handleTouchEnd(e) {
        for (let touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }
    }
    
    handleKeyPress(code) {
        if (this.gameState === 'playing') {
            switch (code) {
                case 'Space':
                    this.handleFire();
                    break;
            }
        }
    }
    
    handleFire() {
        const localPlayer = this.getLocalPlayer();
        if (localPlayer && localPlayer.canFire()) {
            localPlayer.fire();
            // Send to network
            if (window.networkManager) {
                window.networkManager.sendGameMessage('fire', {
                    playerId: localPlayer.id,
                    x: localPlayer.x,
                    y: localPlayer.y,
                    angle: localPlayer.angle,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    setupArena() {
        this.arena = new Arena(this.width, this.height);
    }
    
    getLocalPlayer() {
        if (window.networkManager) {
            return this.players.get(window.networkManager.localPeerId);
        }
        return null;
    }
    
    addPlayer(id, data) {
        const player = new Player(id, data.x || 100, data.y || 100, this.theme);
        player.isLocal = (id === window.networkManager?.localPeerId);
        this.players.set(id, player);
        return player;
    }
    
    removePlayer(id) {
        this.players.delete(id);
    }
    
    addProjectile(data) {
        const projectile = new Projectile(
            data.x, data.y, data.angle, data.playerId, this.theme
        );
        this.projectiles.push(projectile);
    }
    
    addPowerUp(type, x, y) {
        const powerUp = new PowerUp(type, x, y);
        this.powerUps.push(powerUp);
    }
    
    spawnRandomPowerUp() {
        if (this.powerUps.length >= 3) return; // Max 3 power-ups
        
        const types = ['shield', 'rapidFire', 'speedBoost'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x, y;
        let attempts = 0;
        do {
            x = Math.random() * (this.width - 100) + 50;
            y = Math.random() * (this.height - 100) + 50;
            attempts++;
        } while (this.arena.isWallAt(x, y) && attempts < 10);
        
        this.addPowerUp(type, x, y);
        
        // Send to network
        if (window.networkManager?.isHost) {
            window.networkManager.sendGameMessage('powerUpSpawn', {
                type, x, y, timestamp: Date.now()
            });
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update game timer
        this.gameTime -= deltaTime / 1000;
        if (this.gameTime <= 0) {
            this.endGame();
            return;
        }
        
        // Update players
        for (let [id, player] of this.players) {
            if (player.isLocal) {
                this.updateLocalPlayer(player, deltaTime);
            }
            player.update(deltaTime);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            // Check wall collisions
            if (this.arena.isWallAt(projectile.x, projectile.y) || 
                projectile.x < 0 || projectile.x > this.width ||
                projectile.y < 0 || projectile.y > this.height ||
                projectile.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check player collisions
            for (let [playerId, player] of this.players) {
                if (playerId !== projectile.playerId && 
                    this.circleCollision(projectile, player, 20)) {
                    this.handleHit(playerId, projectile.playerId);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(deltaTime);
            
            // Check player collisions
            for (let [playerId, player] of this.players) {
                if (this.circleCollision(powerUp, player, 25)) {
                    player.applyPowerUp(powerUp.type);
                    this.powerUps.splice(i, 1);
                    
                    // Send to network
                    if (window.networkManager) {
                        window.networkManager.sendGameMessage('powerUpCollect', {
                            playerId, type: powerUp.type, timestamp: Date.now()
                        });
                    }
                    break;
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Spawn power-ups occasionally
        if (Math.random() < 0.001) { // ~0.1% chance per frame
            this.spawnRandomPowerUp();
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateLocalPlayer(player, deltaTime) {
        // Get input
        let moveX = 0, moveY = 0, thrust = false;
        
        // Keyboard input
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) thrust = true;
        
        // Virtual controls
        if (this.virtualControls.moveStick.active) {
            moveX = this.virtualControls.moveStick.x;
            moveY = this.virtualControls.moveStick.y;
        }
        if (this.virtualControls.thrustBtn) thrust = true;
        
        // Apply input based on theme
        if (this.theme === 'biplanes') {
            // Biplane physics: thrust-based movement
            if (thrust) {
                player.thrust();
            }
            if (moveX !== 0) {
                player.rotate(moveX * deltaTime / 16.67); // Normalize to 60fps
            }
        } else {
            // Tank physics: direct movement
            if (moveX !== 0 || moveY !== 0) {
                const length = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX /= length;
                moveY /= length;
                player.move(moveX, moveY, deltaTime);
            }
        }
        
        // Wall collision
        const nextX = player.x + player.vx * deltaTime / 16.67;
        const nextY = player.y + player.vy * deltaTime / 16.67;
        
        if (this.arena.isWallAt(nextX, player.y)) {
            player.vx = 0;
        }
        if (this.arena.isWallAt(player.x, nextY)) {
            player.vy = 0;
        }
        
        // Boundary collision
        if (nextX < 15 || nextX > this.width - 15) player.vx = 0;
        if (nextY < 15 || nextY > this.height - 15) player.vy = 0;
        
        // Send position update
        if (window.networkManager && (player.moved || Math.random() < 0.1)) {
            window.networkManager.sendGameMessage('playerUpdate', {
                playerId: player.id,
                x: player.x,
                y: player.y,
                angle: player.angle,
                vx: player.vx,
                vy: player.vy,
                timestamp: Date.now()
            });
            player.moved = false;
        }
    }
    
    circleCollision(obj1, obj2, distance) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }
    
    handleHit(victimId, attackerId) {
        const victim = this.players.get(victimId);
        const attacker = this.players.get(attackerId);
        
        if (victim && attacker) {
            // Add hit effects
            this.addHitEffect(victim.x, victim.y);
            
            // Handle scoring
            attacker.score += 10;
            attacker.kos += 1;
            
            // Respawn victim
            victim.respawn(this.getRandomSpawnPoint());
            
            // Check win condition
            if (attacker.kos >= this.scoreLimit) {
                this.endGame(attackerId);
            }
            
            // Send to network
            if (window.networkManager) {
                window.networkManager.sendGameMessage('hit', {
                    victimId, attackerId, timestamp: Date.now()
                });
            }
        }
    }
    
    addHitEffect(x, y) {
        // Add explosion particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            const particle = new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff6b6b', 500
            );
            this.particles.push(particle);
        }
    }
    
    getRandomSpawnPoint() {
        const spawnPoints = [
            { x: 100, y: 100 },
            { x: this.width - 100, y: 100 },
            { x: 100, y: this.height - 100 },
            { x: this.width - 100, y: this.height - 100 }
        ];
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing') {
            // Render arena
            this.arena.render(this.ctx);
            
            // Render power-ups
            for (let powerUp of this.powerUps) {
                powerUp.render(this.ctx);
            }
            
            // Render players
            for (let [id, player] of this.players) {
                player.render(this.ctx);
            }
            
            // Render projectiles
            for (let projectile of this.projectiles) {
                projectile.render(this.ctx);
            }
            
            // Render particles
            for (let particle of this.particles) {
                particle.render(this.ctx);
            }
            
            // Render mini-map
            this.renderMiniMap();
        } else {
            // Render background pattern
            this.renderMenuBackground();
        }
    }
    
    renderMiniMap() {
        const miniCanvas = document.getElementById('miniMap');
        if (!miniCanvas) return;
        
        const miniCtx = miniCanvas.getContext('2d');
        const miniScale = 150 / Math.max(this.width, this.height);
        
        miniCtx.fillStyle = '#34495e';
        miniCtx.fillRect(0, 0, 150, 150);
        
        // Render players on mini-map
        for (let [id, player] of this.players) {
            miniCtx.fillStyle = player.color;
            miniCtx.beginPath();
            miniCtx.arc(
                player.x * miniScale,
                player.y * miniScale,
                3, 0, Math.PI * 2
            );
            miniCtx.fill();
        }
    }
    
    renderMenuBackground() {
        // Animated background pattern
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 50 + time * 30) % (this.width + 100) - 50;
            const y = 100 + Math.sin(time + i) * 50;
            
            this.ctx.fillStyle = `rgba(52, 152, 219, ${0.1 + Math.sin(time + i) * 0.05})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    updateUI() {
        // Update score display
        const localPlayer = this.getLocalPlayer();
        if (localPlayer) {
            document.getElementById('scoreDisplay').textContent = localPlayer.score;
            document.getElementById('koDisplay').textContent = localPlayer.kos;
        }
        
        // Update time display
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        document.getElementById('timeDisplay').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update players count
        document.getElementById('playersDisplay').textContent = 
            `${this.players.size}/${this.maxPlayers}`;
        
        // Update power-up indicator
        if (localPlayer && localPlayer.activePowerUp) {
            const indicator = document.getElementById('powerUpIndicator');
            indicator.style.display = 'block';
            document.getElementById('powerUpText').textContent = 
                this.getPowerUpDisplayName(localPlayer.activePowerUp.type);
            document.getElementById('powerUpTimer').textContent = 
                `${Math.ceil(localPlayer.activePowerUp.duration / 1000)}s`;
        } else {
            document.getElementById('powerUpIndicator').style.display = 'none';
        }
    }
    
    getPowerUpDisplayName(type) {
        const names = {
            shield: '🛡️ Shield',
            rapidFire: '🔥 Rapid Fire',
            speedBoost: '⚡ Speed Boost'
        };
        return names[type] || type;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameTime = this.timeLimit;
        
        // Reset all players
        let spawnIndex = 0;
        const spawnPoints = [
            { x: 100, y: 100 },
            { x: this.width - 100, y: 100 },
            { x: 100, y: this.height - 100 },
            { x: this.width - 100, y: this.height - 100 }
        ];
        
        for (let [id, player] of this.players) {
            const spawn = spawnPoints[spawnIndex % spawnPoints.length];
            player.respawn(spawn);
            player.score = 0;
            player.kos = 0;
            spawnIndex++;
        }
        
        // Clear game objects
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Show game UI
        document.getElementById('menuPanel').style.display = 'none';
        document.getElementById('gameHUD').style.display = 'flex';
        document.getElementById('miniMap').style.display = 'block';
        
        if (this.isMobile) {
            document.getElementById('mobileControls').style.display = 'flex';
        }
    }
    
    endGame(winnerId = null) {
        this.gameState = 'gameOver';
        
        // Find winner
        let winner = null;
        let highestScore = -1;
        
        for (let [id, player] of this.players) {
            if (player.kos > highestScore) {
                highestScore = player.kos;
                winner = player;
            }
        }
        
        // Show game over UI
        this.showGameOver(winner);
    }
    
    showGameOver(winner) {
        // Hide game UI
        document.getElementById('gameHUD').style.display = 'none';
        document.getElementById('miniMap').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        
        // Show menu with results
        const menuPanel = document.getElementById('menuPanel');
        menuPanel.style.display = 'block';
        
        let resultsHTML = '<h2>🏆 Game Over!</h2>';
        if (winner) {
            resultsHTML += `<p>Winner: Player ${winner.id}</p>`;
            resultsHTML += `<p>Score: ${winner.score} points, ${winner.kos} KOs</p>`;
        } else {
            resultsHTML += '<p>Time\'s up!</p>';
        }
        
        resultsHTML += '<button onclick="window.game.returnToMenu()">Return to Menu</button>';
        
        if (window.networkManager?.isHost) {
            resultsHTML += '<button onclick="window.game.startRematch()">Rematch</button>';
        }
        
        menuPanel.innerHTML = resultsHTML;
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        location.reload(); // Simple reset
    }
    
    startRematch() {
        if (window.networkManager?.isHost) {
            window.networkManager.sendGameMessage('rematch', {});
            this.startGame();
        }
    }
    
    // Game loop
    start() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.frameCount++;
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
}

// Game object classes
class Player {
    constructor(id, x, y, theme) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.theme = theme;
        this.size = 15;
        
        // Game stats
        this.score = 0;
        this.kos = 0;
        this.health = 100;
        
        // Power-ups
        this.activePowerUp = null;
        
        // Firing
        this.lastFireTime = 0;
        this.fireRate = 300; // ms between shots
        
        // Movement
        this.maxSpeed = this.theme === 'biplanes' ? 150 : 120;
        this.acceleration = this.theme === 'biplanes' ? 200 : 300;
        this.friction = 0.95;
        this.turnSpeed = this.theme === 'biplanes' ? 3 : 2;
        
        // Visual
        this.color = this.getPlayerColor(id);
        this.isLocal = false;
        this.moved = false;
    }
    
    getPlayerColor(id) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'];
        return colors[parseInt(id) % colors.length] || '#95a5a6';
    }
    
    update(deltaTime) {
        // Apply physics
        this.x += this.vx * deltaTime / 16.67;
        this.y += this.vy * deltaTime / 16.67;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update power-ups
        if (this.activePowerUp) {
            this.activePowerUp.duration -= deltaTime;
            if (this.activePowerUp.duration <= 0) {
                this.removePowerUp();
            }
        }
    }
    
    move(dirX, dirY, deltaTime) {
        if (this.theme === 'tanks') {
            // Tank movement: direct control
            const speed = this.getMovementSpeed();
            this.vx += dirX * this.acceleration * deltaTime / 16.67;
            this.vy += dirY * this.acceleration * deltaTime / 16.67;
            
            // Limit speed
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > speed) {
                this.vx = (this.vx / currentSpeed) * speed;
                this.vy = (this.vy / currentSpeed) * speed;
            }
            
            // Update angle to face movement direction
            if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
                this.angle = Math.atan2(this.vy, this.vx);
            }
        }
        this.moved = true;
    }
    
    rotate(direction) {
        if (this.theme === 'biplanes') {
            this.angle += direction * this.turnSpeed;
            this.moved = true;
        }
    }
    
    thrust() {
        if (this.theme === 'biplanes') {
            const speed = this.getMovementSpeed();
            this.vx += Math.cos(this.angle) * this.acceleration / 60;
            this.vy += Math.sin(this.angle) * this.acceleration / 60;
            
            // Limit speed
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > speed) {
                this.vx = (this.vx / currentSpeed) * speed;
                this.vy = (this.vy / currentSpeed) * speed;
            }
            this.moved = true;
        }
    }
    
    getMovementSpeed() {
        let speed = this.maxSpeed;
        if (this.activePowerUp?.type === 'speedBoost') {
            speed *= 1.5;
        }
        return speed;
    }
    
    canFire() {
        const now = Date.now();
        let fireRate = this.fireRate;
        if (this.activePowerUp?.type === 'rapidFire') {
            fireRate *= 0.3; // 3x faster
        }
        return now - this.lastFireTime >= fireRate;
    }
    
    fire() {
        if (!this.canFire()) return false;
        
        this.lastFireTime = Date.now();
        return true;
    }
    
    applyPowerUp(type) {
        this.activePowerUp = {
            type: type,
            duration: 5000 // 5 seconds
        };
    }
    
    removePowerUp() {
        this.activePowerUp = null;
    }
    
    respawn(position) {
        this.x = position.x;
        this.y = position.y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.health = 100;
        this.removePowerUp();
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw power-up effect
        if (this.activePowerUp) {
            ctx.strokeStyle = this.getPowerUpColor(this.activePowerUp.type);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw player based on theme
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        
        if (this.theme === 'biplanes') {
            // Draw biplane
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size, -this.size * 0.3);
            ctx.lineTo(-this.size * 0.7, 0);
            ctx.lineTo(-this.size, this.size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Draw tank
            ctx.fillRect(-this.size, -this.size * 0.7, this.size * 2, this.size * 1.4);
            ctx.strokeRect(-this.size, -this.size * 0.7, this.size * 2, this.size * 1.4);
            
            // Tank barrel
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(this.size + 10, 0);
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw player ID
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.id, this.x, this.y - this.size - 10);
    }
    
    getPowerUpColor(type) {
        const colors = {
            shield: '#3498db',
            rapidFire: '#e74c3c',
            speedBoost: '#f39c12'
        };
        return colors[type] || '#95a5a6';
    }
}

class Projectile {
    constructor(x, y, angle, playerId, theme) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.playerId = playerId;
        this.theme = theme;
        
        // Physics
        const speed = 300;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Lifetime
        this.life = 2000; // 2 seconds
        this.maxLife = this.life;
        
        // Visual
        this.size = 3;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 16.67;
        this.y += this.vy * deltaTime / 16.67;
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.1, this.y - this.vy * 0.1);
        ctx.stroke();
    }
}

class PowerUp {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = 12;
        this.angle = 0;
        this.pulseScale = 1;
        this.time = 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.angle += deltaTime * 0.002;
        this.pulseScale = 1 + Math.sin(this.time * 0.005) * 0.2;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        // Draw power-up based on type
        ctx.fillStyle = this.getColor();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getIcon(), 0, 5);
        
        ctx.restore();
    }
    
    getColor() {
        const colors = {
            shield: '#3498db',
            rapidFire: '#e74c3c',
            speedBoost: '#f39c12'
        };
        return colors[this.type] || '#95a5a6';
    }
    
    getIcon() {
        const icons = {
            shield: '🛡️',
            rapidFire: '🔥',
            speedBoost: '⚡'
        };
        return icons[this.type] || '?';
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 16.67;
        this.y += this.vy * deltaTime / 16.67;
        this.vx *= 0.98; // Friction
        this.vy *= 0.98;
        this.life -= deltaTime;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Arena {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.walls = [];
        this.generateWalls();
    }
    
    generateWalls() {
        // Create simple arena with some obstacles
        this.walls = [
            // Border walls (optional, can use canvas boundaries)
            
            // Center obstacles
            { x: this.width / 2 - 50, y: this.height / 2 - 25, width: 100, height: 50 },
            
            // Corner obstacles
            { x: 150, y: 150, width: 60, height: 20 },
            { x: this.width - 210, y: 150, width: 60, height: 20 },
            { x: 150, y: this.height - 170, width: 60, height: 20 },
            { x: this.width - 210, y: this.height - 170, width: 60, height: 20 }
        ];
    }
    
    isWallAt(x, y) {
        for (let wall of this.walls) {
            if (x >= wall.x && x <= wall.x + wall.width &&
                y >= wall.y && y <= wall.y + wall.height) {
                return true;
            }
        }
        return false;
    }
    
    render(ctx) {
        ctx.fillStyle = '#34495e';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        
        for (let wall of this.walls) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        }
    }
}