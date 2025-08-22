// Game constants
const PHYSICS_CONFIG = {
    gravity: { x: 0, y: 1 },
    restitution: 0.2,
    friction: 0.3,
    density: 0.001,
    timeScale: 1,
    velocityIterations: 8,
    positionIterations: 3
};

const GAME_CONFIG = {
    maxItems: 250,
    spawnDebounce: 125,
    fillThresholdPercent: 0.1,
    fillWidthPercent: 0.6,
    groundHeight: 0.9,
    particleCount: 20,
    confettiCount: 100
};

// Item definitions with SVG paths
const ITEMS = [
    {
        name: 'spoon',
        width: 40,
        height: 80,
        mass: 0.5,
        color: '#c0c0c0',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.ellipse(0, -25, 15, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-3, -25, 6, 50);
            ctx.restore();
        }
    },
    {
        name: 'rabbit',
        width: 50,
        height: 60,
        mass: 1.2,
        color: '#f0f0f0',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.ellipse(0, 5, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, -15, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(-8, -30, 5, 15, -0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(8, -30, 5, 15, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.arc(0, -12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'dinner',
        width: 70,
        height: 50,
        mass: 2,
        color: '#8b4513',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 35, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.ellipse(0, -5, 20, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#90ee90';
            ctx.beginPath();
            ctx.arc(-15, 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(15, 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'ball',
        width: 40,
        height: 40,
        mass: 0.8,
        color: '#ff0000',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 20);
            gradient.addColorStop(0, '#ff6666');
            gradient.addColorStop(1, '#ff0000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },
    {
        name: 'book',
        width: 50,
        height: 60,
        mass: 1.5,
        color: '#4169e1',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#4169e1';
            ctx.fillRect(-25, -30, 50, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-20, -25, 40, 50);
            ctx.fillStyle = '#333333';
            ctx.font = '12px Arial';
            ctx.fillText('ABC', -15, -5);
            ctx.restore();
        }
    },
    {
        name: 'flower',
        width: 45,
        height: 55,
        mass: 0.6,
        color: '#ff69b4',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-2, 0, 4, 25);
            ctx.fillStyle = '#ff69b4';
            for (let i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate((Math.PI * 2 * i) / 5);
                ctx.beginPath();
                ctx.ellipse(0, -15, 8, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'boot',
        width: 45,
        height: 65,
        mass: 1.8,
        color: '#8b4513',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-15, -20, 30, 40);
            ctx.beginPath();
            ctx.moveTo(-15, 20);
            ctx.lineTo(25, 20);
            ctx.lineTo(25, 30);
            ctx.lineTo(-15, 30);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#654321';
            ctx.fillRect(-15, 25, 40, 5);
            ctx.restore();
        }
    },
    {
        name: 'clock',
        width: 50,
        height: 50,
        mass: 1.3,
        color: '#ffd700',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.restore();
        }
    },
    {
        name: 'fish',
        width: 60,
        height: 40,
        mass: 1.0,
        color: '#00ced1',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#00ced1';
            ctx.beginPath();
            ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(35, -10);
            ctx.lineTo(35, 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-10, -5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-10, -5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'block',
        width: 45,
        height: 45,
        mass: 1.1,
        color: '#ff8c00',
        draw: (ctx, x, y, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(-22, -22, 44, 44);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('A', 0, 0);
            ctx.restore();
        }
    }
];

// Special rare item (1% chance)
const SPECIAL_ITEM = {
    name: 'star',
    width: 80,
    height: 80,
    mass: 3,
    color: '#ffd700',
    special: true,
    draw: (ctx, x, y, angle) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ffd700');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 40;
            const y = Math.sin(angle) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * 20;
            const innerY = Math.sin(innerAngle) * 20;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff8c00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.effectsCanvas = document.getElementById('effectsCanvas');
        this.effectsCtx = this.effectsCanvas.getContext('2d');
        
        this.items = [];
        this.particles = [];
        this.confetti = [];
        this.itemCount = 0;
        this.round = 1;
        this.state = 'idle';
        this.lastSpawnTime = 0;
        this.isMuted = false;
        
        this.audioContext = null;
        
        // Setup canvas first to get dimensions
        this.setupCanvas();
        
        // Then initialize audio
        this.initAudio();
        
        // Setup physics after canvas dimensions are set
        this.setupPhysics();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.audioContext = null;
        }
    }
    
    ensureAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    playSound(type) {
        if (this.isMuted || !this.audioContext) return;
        
        this.ensureAudioContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (type === 'pop') {
            oscillator.frequency.value = 600 + Math.random() * 200;
            gainNode.gain.value = 0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } else if (type === 'explosion') {
            const noise = this.audioContext.createBufferSource();
            const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() - 0.5) * 2;
            }
            noise.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.gain.value = 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.5);
        }
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.effectsCanvas.width = window.innerWidth;
            this.effectsCanvas.height = window.innerHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    setupPhysics() {
        const { Engine, World, Bodies } = Matter;
        
        this.engine = Engine.create();
        this.engine.world.gravity = PHYSICS_CONFIG.gravity;
        this.engine.velocityIterations = PHYSICS_CONFIG.velocityIterations;
        this.engine.positionIterations = PHYSICS_CONFIG.positionIterations;
        
        // Create ground
        const groundY = this.canvas.height * GAME_CONFIG.groundHeight;
        this.ground = Bodies.rectangle(
            this.canvas.width / 2,
            groundY,
            this.canvas.width,
            20,
            { isStatic: true, label: 'ground' }
        );
        
        // Create walls
        this.leftWall = Bodies.rectangle(
            -10,
            this.canvas.height / 2,
            20,
            this.canvas.height,
            { isStatic: true, label: 'wall' }
        );
        
        this.rightWall = Bodies.rectangle(
            this.canvas.width + 10,
            this.canvas.height / 2,
            20,
            this.canvas.height,
            { isStatic: true, label: 'wall' }
        );
        
        World.add(this.engine.world, [this.ground, this.leftWall, this.rightWall]);
    }
    
    setupEventListeners() {
        const hat = document.getElementById('hat');
        const resetBtn = document.getElementById('resetBtn');
        const muteBtn = document.getElementById('muteBtn');
        
        if (!hat) {
            console.error('Hat element not found! Game cannot initialize properly.');
            return;
        }
        
        const spawnItem = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const now = Date.now();
            if (now - this.lastSpawnTime < GAME_CONFIG.spawnDebounce) {
                return;
            }
            if (this.state !== 'idle' && this.state !== 'spawning') {
                return;
            }
            
            this.lastSpawnTime = now;
            this.state = 'spawning';
            
            // Ensure audio context is resumed on first interaction
            this.ensureAudioContext();
            
            // Visual feedback for touch
            hat.style.filter = 'brightness(1.5) drop-shadow(0 0 20px rgba(255, 255, 0, 0.8))';
            
            this.createItem();
            
            // Slight hat animation
            hat.style.transform = `rotate(${(Math.random() - 0.5) * 10}deg)`;
            setTimeout(() => {
                hat.style.transform = '';
                hat.style.filter = '';
                this.state = 'idle';
            }, 200);
        };
        
        // Mouse events
        hat.addEventListener('click', spawnItem);
        
        // Touch events with better handling
        let touchHandled = false;
        hat.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchHandled = false;
        }, { passive: false });
        
        hat.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!touchHandled) {
                touchHandled = true;
                spawnItem(e);
            }
        }, { passive: false });
        
        // Prevent default touch behaviors
        hat.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        hat.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            touchHandled = true;
        }, { passive: false });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                spawnItem();
            }
        });
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.ensureAudioContext();
                this.reset();
            });
        }
        
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.ensureAudioContext();
                this.isMuted = !this.isMuted;
                muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
            });
        }
    }
    
    createItem() {
        const isSpecial = Math.random() < 0.01;
        const itemDef = isSpecial ? SPECIAL_ITEM : ITEMS[Math.floor(Math.random() * ITEMS.length)];
        
        const hatElement = document.getElementById('hat');
        if (!hatElement) {
            console.error('Hat element not found in createItem!');
            return;
        }
        const hatRect = hatElement.getBoundingClientRect();
        const x = hatRect.left + hatRect.width / 2;
        const y = hatRect.top;
        
        const body = Matter.Bodies.rectangle(
            x,
            y - 20,
            itemDef.width,
            itemDef.height,
            {
                restitution: PHYSICS_CONFIG.restitution + Math.random() * 0.1,
                friction: PHYSICS_CONFIG.friction,
                density: PHYSICS_CONFIG.density * itemDef.mass,
                label: itemDef.name
            }
        );
        
        // Apply upward impulse
        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 5,
            y: -8 - Math.random() * 4
        });
        
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
        
        Matter.World.add(this.engine.world, body);
        
        this.items.push({
            body: body,
            def: itemDef
        });
        
        this.itemCount++;
        document.getElementById('itemCount').textContent = this.itemCount;
        
        // Create poof particles
        this.createParticles(x, y);
        this.playSound('pop');
        
        // Check fill condition
        this.checkFillCondition();
    }
    
    createParticles(x, y) {
        for (let i = 0; i < GAME_CONFIG.particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: `hsl(${Math.random() * 360}, 100%, 70%)`
            });
        }
    }
    
    createConfetti() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < GAME_CONFIG.confettiCount; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.confettiCount;
            const speed = 5 + Math.random() * 15;
            
            this.confetti.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.5,
                size: 10 + Math.random() * 10,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                life: 1
            });
        }
    }
    
    checkFillCondition() {
        if (this.items.length >= GAME_CONFIG.maxItems) {
            this.triggerExplosion();
            return;
        }
        
        // Create occupancy grid
        const gridSize = 20;
        const cols = Math.floor(this.canvas.width / gridSize);
        const rows = Math.floor(this.canvas.height / gridSize);
        const grid = Array(rows).fill().map(() => Array(cols).fill(false));
        
        // Mark occupied cells
        this.items.forEach(item => {
            const bounds = item.body.bounds;
            const minCol = Math.max(0, Math.floor(bounds.min.x / gridSize));
            const maxCol = Math.min(cols - 1, Math.floor(bounds.max.x / gridSize));
            const minRow = Math.max(0, Math.floor(bounds.min.y / gridSize));
            const maxRow = Math.min(rows - 1, Math.floor(bounds.max.y / gridSize));
            
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    grid[r][c] = true;
                }
            }
        });
        
        // Check if items reach near top
        const topThreshold = Math.floor(rows * GAME_CONFIG.fillThresholdPercent);
        const widthThreshold = Math.floor(cols * GAME_CONFIG.fillWidthPercent);
        let filledColumns = 0;
        
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < topThreshold; r++) {
                if (grid[r][c]) {
                    filledColumns++;
                    break;
                }
            }
        }
        
        if (filledColumns >= widthThreshold) {
            this.triggerExplosion();
        }
    }
    
    triggerExplosion() {
        if (this.state === 'exploding') return;
        
        this.state = 'exploding';
        
        // Screen effects
        document.body.classList.add('shake', 'flash');
        
        // Create confetti
        this.createConfetti();
        
        // Play explosion sound
        this.playSound('explosion');
        
        // Apply outward impulses
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.items.forEach(item => {
            const dx = item.body.position.x - centerX;
            const dy = item.body.position.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = 0.05 / (distance / 100);
            
            Matter.Body.applyForce(item.body, item.body.position, {
                x: dx * force,
                y: dy * force
            });
        });
        
        // Show toast
        const toast = document.getElementById('toast');
        toast.innerHTML = `Round ${this.round} Complete!<br>Items: ${this.itemCount}`;
        toast.classList.add('show');
        
        // Reset after animation
        setTimeout(() => {
            document.body.classList.remove('shake', 'flash');
            toast.classList.remove('show');
            this.reset();
        }, 2000);
    }
    
    reset() {
        // Clear physics world
        this.items.forEach(item => {
            Matter.World.remove(this.engine.world, item.body);
        });
        
        this.items = [];
        this.particles = [];
        this.confetti = [];
        this.itemCount = 0;
        this.round++;
        this.state = 'idle';
        
        document.getElementById('itemCount').textContent = '0';
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 0.5;
            particle.life -= deltaTime * 2;
            return particle.life > 0;
        });
        
        this.confetti = this.confetti.filter(confetti => {
            confetti.x += confetti.vx * deltaTime;
            confetti.y += confetti.vy * deltaTime;
            confetti.vy += 0.8;
            confetti.rotation += confetti.rotationSpeed;
            confetti.life -= deltaTime * 0.5;
            return confetti.life > 0 && confetti.y < this.canvas.height;
        });
    }
    
    render() {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.effectsCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8b7355';
        this.ctx.fillRect(
            0,
            this.canvas.height * GAME_CONFIG.groundHeight - 10,
            this.canvas.width,
            this.canvas.height
        );
        
        // Draw items
        this.items.forEach(item => {
            const { position, angle } = item.body;
            item.def.draw(this.ctx, position.x, position.y, angle);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.effectsCtx.save();
            this.effectsCtx.globalAlpha = particle.life;
            this.effectsCtx.fillStyle = particle.color;
            this.effectsCtx.beginPath();
            this.effectsCtx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
            this.effectsCtx.fill();
            this.effectsCtx.restore();
        });
        
        // Draw confetti
        this.confetti.forEach(confetti => {
            this.effectsCtx.save();
            this.effectsCtx.translate(confetti.x, confetti.y);
            this.effectsCtx.rotate(confetti.rotation);
            this.effectsCtx.globalAlpha = confetti.life;
            this.effectsCtx.fillStyle = confetti.color;
            this.effectsCtx.fillRect(
                -confetti.size / 2,
                -confetti.size / 2,
                confetti.size,
                confetti.size
            );
            this.effectsCtx.restore();
        });
    }
    
    animate() {
        const deltaTime = 1 / 60;
        
        Matter.Engine.update(this.engine, 1000 / 60);
        
        this.updateParticles(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize game when DOM and Matter.js are ready
function initGame() {
    // Check if Matter.js is loaded
    if (typeof Matter === 'undefined') {
        console.error('Matter.js physics library not loaded! Please check your internet connection.');
        // Show error to user
        const container = document.getElementById('gameContainer');
        if (container) {
            container.innerHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;text-align:center;font-size:20px;">Error: Physics library failed to load.<br>Please refresh the page.</div>';
        }
        return;
    }
    
    try {
        new Game();
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        // Show error to user
        const container = document.getElementById('gameContainer');
        if (container) {
            container.innerHTML += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;text-align:center;font-size:20px;">Error initializing game.<br>Please refresh the page.<br>' + error.message + '</div>';
        }
    }
}

// Wait for both DOM and scripts to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM is already loaded, wait a bit for Matter.js
    if (typeof Matter !== 'undefined') {
        initGame();
    } else {
        // Wait for Matter.js to load
        window.addEventListener('load', initGame);
    }
}