import * as PIXI from 'pixi.js'

export class Creep {
  sprite: PIXI.Container
  healthBar: PIXI.Graphics
  path: PIXI.Point[]
  pathIndex: number = 0
  x: number = 0
  y: number = 0
  data: any
  health: number
  maxHealth: number
  slowAmount: number = 0
  slowDuration: number = 0
  
  onReachEnd?: () => void
  onDeath?: () => void
  
  constructor(path: PIXI.Point[], data: any, gridSize: number) {
    this.path = path
    this.data = data
    this.health = data.health
    this.maxHealth = data.health
    
    // Start at first path point
    if (path.length > 0) {
      this.x = path[0].x * gridSize + gridSize / 2
      this.y = path[0].y * gridSize + gridSize / 2
    }
    
    // Create sprite
    this.sprite = new PIXI.Container()
    this.sprite.x = this.x
    this.sprite.y = this.y
    
    // Draw creep
    const graphics = new PIXI.Graphics()
    graphics.beginFill(parseInt(data.color, 16))
    graphics.drawCircle(0, 0, data.radius)
    graphics.endFill()
    
    // Draw border
    graphics.lineStyle(1, 0x000000)
    graphics.drawCircle(0, 0, data.radius)
    
    this.sprite.addChild(graphics)
    
    // Health bar
    this.healthBar = new PIXI.Graphics()
    this.sprite.addChild(this.healthBar)
    this.updateHealthBar()
  }
  
  update(delta: number) {
    if (this.pathIndex >= this.path.length - 1) {
      if (this.onReachEnd) {
        this.onReachEnd()
      }
      return
    }
    
    // Calculate movement
    const targetPoint = this.path[this.pathIndex + 1]
    const targetX = targetPoint.x * 32 + 16 // Assuming gridSize = 32
    const targetY = targetPoint.y * 32 + 16
    
    const dx = targetX - this.x
    const dy = targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 2) {
      // Reached waypoint
      this.pathIndex++
      if (this.pathIndex >= this.path.length - 1) {
        if (this.onReachEnd) {
          this.onReachEnd()
        }
      }
    } else {
      // Move towards target
      const speed = this.data.speed * (1 - this.slowAmount)
      const moveDistance = speed * delta * 0.016 // Convert to seconds
      
      this.x += (dx / distance) * moveDistance
      this.y += (dy / distance) * moveDistance
      
      this.sprite.x = this.x
      this.sprite.y = this.y
    }
    
    // Update slow effect
    if (this.slowDuration > 0) {
      this.slowDuration -= delta * 0.016
      if (this.slowDuration <= 0) {
        this.slowAmount = 0
      }
    }
  }
  
  takeDamage(damage: number) {
    // Apply armor reduction
    const actualDamage = Math.max(1, damage - (this.data.armor || 0))
    this.health -= actualDamage
    
    if (this.health <= 0) {
      if (this.onDeath) {
        this.onDeath()
      }
    } else {
      this.updateHealthBar()
    }
  }
  
  applySlow(amount: number, duration: number) {
    this.slowAmount = Math.max(this.slowAmount, amount)
    this.slowDuration = Math.max(this.slowDuration, duration)
  }
  
  updateHealthBar() {
    this.healthBar.clear()
    
    const barWidth = 20
    const barHeight = 3
    const healthPercent = this.health / this.maxHealth
    
    // Background
    this.healthBar.beginFill(0xFF0000)
    this.healthBar.drawRect(-barWidth / 2, -this.data.radius - 8, barWidth, barHeight)
    this.healthBar.endFill()
    
    // Health
    this.healthBar.beginFill(0x00FF00)
    this.healthBar.drawRect(-barWidth / 2, -this.data.radius - 8, barWidth * healthPercent, barHeight)
    this.healthBar.endFill()
  }
}