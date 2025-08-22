class SpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        // Game stats
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        // Player
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 60,
            width: 50,
            height: 30,
            speed: 5,
            color: '#00ff00'
        };
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 7;
        
        // Invaders
        this.invaders = [];
        this.invaderBullets = [];
        this.invaderSpeed = 1;
        this.invaderDirection = 1;
        this.invaderDropDistance = 30;
        
        // Timing
        this.lastInvaderShot = 0;
        this.invaderShootDelay = 1000;
        
        // Input
        this.keys = {};
        this.touchInput = {
            left: false,
            right: false,
            shoot: false
        };
        
        // Touch shooting rate limiter
        this.lastTouchShot = 0;
        this.touchShootDelay = 200;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.createInvaders();
        this.updateUI();
    }
    
    createInvaders() {
        this.invaders = [];
        const rows = 5;
        const cols = 10;
        const invaderWidth = 40;
        const invaderHeight = 30;
        const spacing = 10;
        const startX = 50;
        const startY = 50;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.invaders.push({
                    x: startX + col * (invaderWidth + spacing),
                    y: startY + row * (invaderHeight + spacing),
                    width: invaderWidth,
                    height: invaderHeight,
                    color: row < 2 ? '#ff0000' : row < 4 ? '#ffff00' : '#00ffff',
                    points: row < 2 ? 30 : row < 4 ? 20 : 10,
                    alive: true
                });
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.resetGame());
        
        // Touch events
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const touchLeftBtn = document.getElementById('touchLeftBtn');
        const touchRightBtn = document.getElementById('touchRightBtn');
        const touchShootBtn = document.getElementById('touchShootBtn');
        
        // Prevent context menu on long press
        [touchLeftBtn, touchRightBtn, touchShootBtn].forEach(btn => {
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
        
        // Left button
        touchLeftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchInput.left = true;
        }, { passive: false });
        
        touchLeftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchInput.left = false;
        }, { passive: false });
        
        // Right button  
        touchRightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchInput.right = true;
        }, { passive: false });
        
        touchRightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchInput.right = false;
        }, { passive: false });
        
        // Shoot button with rate limiting
        touchShootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchInput.shoot = true;
            this.touchShoot();
        }, { passive: false });
        
        touchShootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchInput.shoot = false;
        }, { passive: false });
        
        // Mouse events as fallback for testing
        touchLeftBtn.addEventListener('mousedown', () => this.touchInput.left = true);
        touchLeftBtn.addEventListener('mouseup', () => this.touchInput.left = false);
        touchRightBtn.addEventListener('mousedown', () => this.touchInput.right = true);
        touchRightBtn.addEventListener('mouseup', () => this.touchInput.right = false);
        touchShootBtn.addEventListener('mousedown', () => {
            this.touchInput.shoot = true;
            this.touchShoot();
        });
        touchShootBtn.addEventListener('mouseup', () => this.touchInput.shoot = false);
        
        // Show touch controls on touch devices
        this.detectTouchDevice();
    }
    
    detectTouchDevice() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const touchControls = document.getElementById('touchControls');
        const controlsText = document.getElementById('controlsText');
        
        if (isTouchDevice) {
            touchControls.classList.remove('hidden');
            if (controlsText) {
                controlsText.textContent = 'Use touch controls below';
            }
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gameLoop();
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            document.getElementById('pauseBtn').textContent = this.gamePaused ? 'Resume' : 'Pause';
            if (!this.gamePaused) {
                this.gameLoop();
            }
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.player.x = this.canvas.width / 2 - 25;
        this.bullets = [];
        this.invaderBullets = [];
        this.invaderSpeed = 1;
        
        this.createInvaders();
        this.updateUI();
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('gameOver').classList.add('hidden');
        
        this.draw();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Move player (keyboard + touch)
        if (this.keys['a'] || this.keys['arrowleft'] || this.touchInput.left) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['d'] || this.keys['arrowright'] || this.touchInput.right) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        
        // Continuous touch shooting
        if (this.touchInput.shoot) {
            this.touchShoot();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= this.bulletSpeed;
            return bullet.y > 0;
        });
        
        // Update invader bullets
        this.invaderBullets = this.invaderBullets.filter(bullet => {
            bullet.y += 4;
            return bullet.y < this.canvas.height;
        });
        
        // Move invaders
        this.moveInvaders();
        
        // Invader shooting
        this.handleInvaderShooting();
        
        // Collision detection
        this.checkCollisions();
        
        // Check game state
        this.checkGameState();
    }
    
    moveInvaders() {
        let shouldDrop = false;
        
        this.invaders.forEach(invader => {
            if (!invader.alive) return;
            
            if (this.invaderDirection === 1 && invader.x + invader.width >= this.canvas.width) {
                shouldDrop = true;
            } else if (this.invaderDirection === -1 && invader.x <= 0) {
                shouldDrop = true;
            }
        });
        
        if (shouldDrop) {
            this.invaderDirection *= -1;
            this.invaders.forEach(invader => {
                if (invader.alive) {
                    invader.y += this.invaderDropDistance;
                }
            });
        } else {
            this.invaders.forEach(invader => {
                if (invader.alive) {
                    invader.x += this.invaderSpeed * this.invaderDirection;
                }
            });
        }
    }
    
    handleInvaderShooting() {
        const now = Date.now();
        if (now - this.lastInvaderShot > this.invaderShootDelay) {
            const aliveInvaders = this.invaders.filter(inv => inv.alive);
            if (aliveInvaders.length > 0) {
                const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
                this.invaderBullets.push({
                    x: shooter.x + shooter.width / 2,
                    y: shooter.y + shooter.height,
                    width: 3,
                    height: 10
                });
                this.lastInvaderShot = now;
            }
        }
    }
    
    checkCollisions() {
        // Bullet hits invader
        this.bullets.forEach((bullet, bulletIndex) => {
            this.invaders.forEach((invader, invaderIndex) => {
                if (invader.alive && this.collision(bullet, invader)) {
                    invader.alive = false;
                    this.bullets.splice(bulletIndex, 1);
                    this.score += invader.points;
                    this.updateUI();
                }
            });
        });
        
        // Invader bullet hits player
        this.invaderBullets.forEach((bullet, bulletIndex) => {
            if (this.collision(bullet, this.player)) {
                this.invaderBullets.splice(bulletIndex, 1);
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        });
        
        // Invader reaches player
        this.invaders.forEach(invader => {
            if (invader.alive && invader.y + invader.height >= this.player.y) {
                this.endGame();
            }
        });
    }
    
    collision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkGameState() {
        const aliveInvaders = this.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
            this.level++;
            this.invaderSpeed += 0.5;
            this.invaderShootDelay = Math.max(500, this.invaderShootDelay - 100);
            this.createInvaders();
            this.updateUI();
        }
    }
    
    shoot() {
        if (this.gameRunning && !this.gamePaused && !this.gameOver) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10
            });
        }
    }
    
    touchShoot() {
        const now = Date.now();
        if (now - this.lastTouchShot > this.touchShootDelay) {
            this.shoot();
            this.lastTouchShot = now;
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars background
        this.drawStars();
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw player bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw invaders
        this.invaders.forEach(invader => {
            if (invader.alive) {
                this.ctx.fillStyle = invader.color;
                this.ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
            }
        });
        
        // Draw invader bullets
        this.ctx.fillStyle = '#ff0000';
        this.invaderBullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    drawStars() {
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SpaceInvaders();
});