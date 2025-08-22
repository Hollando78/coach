import * as PIXI from 'pixi.js'
import { Creep } from './Creep'

export class Projectile {
  sprite: PIXI.Graphics
  x: number
  y: number
  target: Creep
  damage: number
  speed: number
  
  onHit?: () => void
  
  constructor(x: number, y: number, target: Creep, damage: number, speed: number, color: number) {
    this.x = x
    this.y = y
    this.target = target
    this.damage = damage
    this.speed = speed
    
    // Create sprite
    this.sprite = new PIXI.Graphics()
    this.sprite.beginFill(typeof color === 'string' ? parseInt(color, 16) : color)
    this.sprite.drawCircle(0, 0, 3)
    this.sprite.endFill()
    
    this.sprite.x = x
    this.sprite.y = y
  }
  
  update(delta: number) {
    // Move towards target
    const dx = this.target.x - this.x
    const dy = this.target.y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 5) {
      // Hit target
      if (this.onHit) {
        this.onHit()
      }
    } else {
      // Move
      const moveDistance = this.speed * delta * 0.016
      this.x += (dx / distance) * moveDistance
      this.y += (dy / distance) * moveDistance
      
      this.sprite.x = this.x
      this.sprite.y = this.y
    }
  }
}