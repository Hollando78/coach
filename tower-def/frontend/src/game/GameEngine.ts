import * as PIXI from 'pixi.js'
import { Pathfinder } from './systems/Pathfinder'
import { Tower } from './entities/Tower'
import { Creep } from './entities/Creep'
import { Projectile } from './entities/Projectile'
import { WaveManager } from './systems/WaveManager'
import { PRNG } from '../lib/prng'
import towersData from './content/towers.json'
import creepsData from './content/creeps.json'

export interface GameState {
  wave: number
  lives: number
  cash: number
  score: number
  isPaused: boolean
  speed: number
  seed: string
}

export class GameEngine {
  app: PIXI.Application
  container: HTMLElement
  
  // Game state
  state: GameState
  
  // Systems
  pathfinder: Pathfinder
  waveManager: WaveManager
  prng: PRNG
  
  // Entities
  towers: Tower[] = []
  creeps: Creep[] = []
  projectiles: Projectile[] = []
  
  // Grid
  gridSize = 32
  gridWidth = 25
  gridHeight = 18
  
  // Layers
  backgroundLayer: PIXI.Container
  gridLayer: PIXI.Container
  pathLayer: PIXI.Container
  towerLayer: PIXI.Container
  creepLayer: PIXI.Container
  projectileLayer: PIXI.Container
  uiLayer: PIXI.Container
  
  // Path
  path: PIXI.Point[] = []
  
  // Callbacks
  onStateChange?: (state: GameState) => void
  onGameOver?: () => void
  
  constructor(container: HTMLElement, seed?: string) {
    this.container = container
    
    // Initialize PIXI
    try {
      this.app = new PIXI.Application({
        width: this.gridWidth * this.gridSize,
        height: this.gridHeight * this.gridSize,
        backgroundColor: 0xF5F5DC,
        antialias: true,
      })
    } catch (error) {
      throw error
    }
    
    try {
      container.appendChild(this.app.view as HTMLCanvasElement)
    } catch (error) {
      throw error
    }
    
    // Initialize state
    this.state = {
      wave: 0,
      lives: 20,
      cash: 200,
      score: 0,
      isPaused: false,
      speed: 1,
      seed: seed || Math.random().toString(36).substring(7),
    }
    
    // Initialize PRNG
    this.prng = new PRNG(this.state.seed)
    
    // Initialize layers
    this.backgroundLayer = new PIXI.Container()
    this.gridLayer = new PIXI.Container()
    this.pathLayer = new PIXI.Container()
    this.towerLayer = new PIXI.Container()
    this.creepLayer = new PIXI.Container()
    this.projectileLayer = new PIXI.Container()
    this.uiLayer = new PIXI.Container()
    
    this.app.stage.addChild(this.backgroundLayer)
    this.app.stage.addChild(this.gridLayer)
    this.app.stage.addChild(this.pathLayer)
    this.app.stage.addChild(this.towerLayer)
    this.app.stage.addChild(this.creepLayer)
    this.app.stage.addChild(this.projectileLayer)
    this.app.stage.addChild(this.uiLayer)
    
    // Initialize systems
    this.pathfinder = new Pathfinder(this.gridWidth, this.gridHeight)
    this.waveManager = new WaveManager(this)
    
    // Setup default path
    this.setupDefaultPath()
    
    // Draw grid
    this.drawGrid()
    
    // Add debug info to UI layer
    this.addDebugInfo()
    
    // Start game loop
    this.app.ticker.add(this.update.bind(this))
    
    console.log('GameEngine initialized:', {
      gridSize: this.gridSize,
      gridWidth: this.gridWidth, 
      gridHeight: this.gridHeight,
      pathLength: this.path.length,
      layers: this.app.stage.children.length
    })
    
    // Initialize UI state
    this.updateState()
  }
  
  setupDefaultPath() {
    // Simple S-curve path
    this.path = [
      new PIXI.Point(0, 9),
      new PIXI.Point(5, 9),
      new PIXI.Point(5, 3),
      new PIXI.Point(10, 3),
      new PIXI.Point(10, 15),
      new PIXI.Point(15, 15),
      new PIXI.Point(15, 9),
      new PIXI.Point(20, 9),
      new PIXI.Point(20, 3),
      new PIXI.Point(24, 3),
    ]
    
    // Update pathfinder
    this.pathfinder.setPath(this.path)
    
    // Draw path
    this.drawPath()
  }
  
  drawGrid() {
    const graphics = new PIXI.Graphics()
    graphics.lineStyle(1, 0xDDDDDD, 0.5)
    
    for (let x = 0; x <= this.gridWidth; x++) {
      graphics.moveTo(x * this.gridSize, 0)
      graphics.lineTo(x * this.gridSize, this.gridHeight * this.gridSize)
    }
    
    for (let y = 0; y <= this.gridHeight; y++) {
      graphics.moveTo(0, y * this.gridSize)
      graphics.lineTo(this.gridWidth * this.gridSize, y * this.gridSize)
    }
    
    this.gridLayer.addChild(graphics)
  }
  
  drawPath() {
    this.pathLayer.removeChildren()
    
    const graphics = new PIXI.Graphics()
    graphics.lineStyle(4, 0x8B7355, 0.8)
    
    if (this.path.length > 0) {
      graphics.moveTo(
        this.path[0].x * this.gridSize + this.gridSize / 2,
        this.path[0].y * this.gridSize + this.gridSize / 2
      )
      
      for (let i = 1; i < this.path.length; i++) {
        graphics.lineTo(
          this.path[i].x * this.gridSize + this.gridSize / 2,
          this.path[i].y * this.gridSize + this.gridSize / 2
        )
      }
    }
    
    this.pathLayer.addChild(graphics)
  }
  
  addDebugInfo() {
    // Add debug text showing game info
    const debugText = new PIXI.Text(`Debug: Grid ${this.gridWidth}x${this.gridHeight} | Path: ${this.path.length} points`, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x000000,
      backgroundColor: 0xFFFFFF,
      padding: 4
    })
    debugText.x = 10
    debugText.y = 10
    this.uiLayer.addChild(debugText)
    
    // Add markers at path points
    this.path.forEach((point, i) => {
      const marker = new PIXI.Graphics()
      marker.beginFill(0xFF0000)
      marker.drawCircle(0, 0, 4)
      marker.endFill()
      marker.x = point.x * this.gridSize + this.gridSize / 2
      marker.y = point.y * this.gridSize + this.gridSize / 2
      this.pathLayer.addChild(marker)
      
      // Add point number
      const pointText = new PIXI.Text(i.toString(), {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xFFFFFF
      })
      pointText.anchor.set(0.5)
      pointText.x = marker.x
      pointText.y = marker.y
      this.pathLayer.addChild(pointText)
    })
    
    // Add corner markers to confirm canvas bounds
    const corners = [
      { x: 0, y: 0, color: 0x00FF00 },
      { x: this.gridWidth * this.gridSize - 10, y: 0, color: 0x0000FF },
      { x: 0, y: this.gridHeight * this.gridSize - 10, color: 0xFFFF00 },
      { x: this.gridWidth * this.gridSize - 10, y: this.gridHeight * this.gridSize - 10, color: 0xFF00FF }
    ]
    
    corners.forEach(corner => {
      const marker = new PIXI.Graphics()
      marker.beginFill(corner.color)
      marker.drawRect(0, 0, 10, 10)
      marker.endFill()
      marker.x = corner.x
      marker.y = corner.y
      this.uiLayer.addChild(marker)
    })
  }
  
  canPlaceTower(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false
    }
    
    // Check if on path
    for (const point of this.path) {
      if (point.x === x && point.y === y) {
        return false
      }
    }
    
    // Check if tower already exists
    for (const tower of this.towers) {
      if (tower.gridX === x && tower.gridY === y) {
        return false
      }
    }
    
    // Check if placing would block path (for wall towers)
    // This is simplified - in full implementation, would check A* pathfinding
    
    return true
  }
  
  placeTower(towerId: string, x: number, y: number): boolean {
    
    if (!this.canPlaceTower(x, y)) {
      return false
    }
    
    const towerData = (towersData as any)[towerId]
    if (!towerData) {
      return false
    }
    
    
    if (this.state.cash < towerData.cost) {
      return false
    }
    
    const tower = new Tower(
      x,
      y,
      towerData,
      this.gridSize
    )
    
    this.towers.push(tower)
    this.towerLayer.addChild(tower.sprite)
    
    this.state.cash -= towerData.cost
    this.updateState()
    
    return true
  }
  
  sellTower(tower: Tower) {
    const index = this.towers.indexOf(tower)
    if (index === -1) return
    
    this.towers.splice(index, 1)
    this.towerLayer.removeChild(tower.sprite)
    
    // Refund 80% of cost
    this.state.cash += Math.floor(tower.data.cost * 0.8)
    this.updateState()
  }
  
  spawnCreep(creepType: string) {
    const creepData = (creepsData as any)[creepType]
    if (!creepData) return
    
    const creep = new Creep(
      this.path,
      creepData,
      this.gridSize
    )
    
    creep.onReachEnd = () => {
      this.removeCreep(creep)
      this.state.lives -= creep.data.damage
      if (this.state.lives <= 0) {
        this.gameOver()
      }
      this.updateState()
    }
    
    creep.onDeath = () => {
      this.removeCreep(creep)
      this.state.cash += creep.data.reward
      this.state.score += creep.data.reward * 10
      this.updateState()
    }
    
    this.creeps.push(creep)
    this.creepLayer.addChild(creep.sprite)
  }
  
  removeCreep(creep: Creep) {
    const index = this.creeps.indexOf(creep)
    if (index !== -1) {
      this.creeps.splice(index, 1)
      this.creepLayer.removeChild(creep.sprite)
    }
  }
  
  spawnProjectile(tower: Tower, target: Creep) {
    const projectile = new Projectile(
      tower.x,
      tower.y,
      target,
      tower.data.damage,
      tower.data.projectileSpeed || 300,
      tower.data.color
    )
    
    projectile.onHit = () => {
      this.removeProjectile(projectile)
      
      // Apply damage
      if (tower.data.splashRadius) {
        // Splash damage
        const splashTargets = this.creeps.filter(c => {
          const dx = c.x - target.x
          const dy = c.y - target.y
          return Math.sqrt(dx * dx + dy * dy) <= tower.data.splashRadius
        })
        splashTargets.forEach(t => t.takeDamage(tower.data.damage))
      } else {
        // Single target
        target.takeDamage(tower.data.damage)
      }
    }
    
    this.projectiles.push(projectile)
    this.projectileLayer.addChild(projectile.sprite)
  }
  
  removeProjectile(projectile: Projectile) {
    const index = this.projectiles.indexOf(projectile)
    if (index !== -1) {
      this.projectiles.splice(index, 1)
      this.projectileLayer.removeChild(projectile.sprite)
    }
  }
  
  update(delta: number) {
    if (this.state.isPaused) return
    
    const adjustedDelta = delta * this.state.speed
    
    // Update wave manager
    this.waveManager.update(adjustedDelta)
    
    // Update towers
    this.towers.forEach(tower => {
      tower.update()
      
      // Find targets and shoot
      if (tower.canFire()) {
        const target = this.findTarget(tower)
        if (target) {
          tower.fire()
          this.spawnProjectile(tower, target)
        }
      }
    })
    
    // Update creeps
    this.creeps.forEach(creep => {
      creep.update(adjustedDelta)
    })
    
    // Update projectiles
    this.projectiles.forEach(projectile => {
      projectile.update(adjustedDelta)
    })
  }
  
  findTarget(tower: Tower): Creep | null {
    let closestCreep: Creep | null = null
    let closestDistance = tower.data.range
    
    for (const creep of this.creeps) {
      const dx = creep.x - tower.x
      const dy = creep.y - tower.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= tower.data.range && distance < closestDistance) {
        closestCreep = creep
        closestDistance = distance
      }
    }
    
    return closestCreep
  }
  
  startWave() {
    console.log('startWave called, current wave:', this.state.wave)
    if (this.state.wave >= 20) {
      console.log('Max waves reached, not starting new wave')
      return
    }
    
    this.state.wave++
    console.log('Starting wave:', this.state.wave)
    this.waveManager.startWave(this.state.wave)
    this.updateState()
  }
  
  setPaused(paused: boolean) {
    console.log('setPaused called:', paused)
    this.state.isPaused = paused
    this.updateState()
  }
  
  setSpeed(speed: number) {
    console.log('setSpeed called:', speed)
    this.state.speed = speed
    this.updateState()
  }
  
  updateState() {
    console.log('updateState called:', this.state)
    if (this.onStateChange) {
      console.log('Calling onStateChange with state:', this.state)
      this.onStateChange(this.state)
    } else {
      console.log('No onStateChange callback set')
    }
  }
  
  gameOver() {
    this.state.isPaused = true
    if (this.onGameOver) {
      this.onGameOver()
    }
  }
  
  destroy() {
    this.app.destroy(true)
  }
}