import * as PIXI from 'pixi.js'

export class Tower {
  sprite: PIXI.Container
  gridX: number
  gridY: number
  x: number
  y: number
  data: any
  level: number = 1
  lastFireTime: number = 0
  
  constructor(gridX: number, gridY: number, data: any, gridSize: number) {
    this.gridX = gridX
    this.gridY = gridY
    this.x = gridX * gridSize + gridSize / 2
    this.y = gridY * gridSize + gridSize / 2
    this.data = data
    
    this.sprite = new PIXI.Container()
    this.sprite.x = this.x
    this.sprite.y = this.y
    
    // Draw tower
    const graphics = new PIXI.Graphics()
    
    if (data.isWall) {
      // Draw wall
      graphics.beginFill(parseInt(data.color, 16))
      graphics.drawRect(-gridSize / 2, -gridSize / 2, gridSize, gridSize)
      graphics.endFill()
    } else {
      // Draw tower base
      graphics.beginFill(0x333333)
      graphics.drawRect(-12, -12, 24, 24)
      graphics.endFill()
      
      // Draw tower
      graphics.beginFill(parseInt(data.color, 16))
      graphics.drawCircle(0, 0, 10)
      graphics.endFill()
      
      // Draw range indicator (initially hidden)
      const rangeGraphics = new PIXI.Graphics()
      rangeGraphics.lineStyle(1, 0x00FF00, 0.3)
      rangeGraphics.drawCircle(0, 0, data.range)
      rangeGraphics.visible = false
      this.sprite.addChild(rangeGraphics)
    }
    
    this.sprite.addChild(graphics)
    
    // Make interactive
    this.sprite.eventMode = 'static'
    this.sprite.cursor = 'pointer'
    
    
  }
  
  update() {
    // Update cooldowns, effects, etc.
  }
  
  canFire(): boolean {
    if (this.data.isWall || this.data.isTrap) return false
    
    const now = Date.now()
    const cooldown = 1000 / this.data.fireRate
    
    return now - this.lastFireTime >= cooldown
  }
  
  fire() {
    this.lastFireTime = Date.now()
  }
  
  upgrade(upgradeData: any) {
    Object.assign(this.data, upgradeData)
    this.level++
    
    // Update visuals
    // TODO: Update tower appearance based on upgrade
  }
}