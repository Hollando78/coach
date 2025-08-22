import { GameEngine } from '../GameEngine'
import wavesData from '../content/waves.json'

interface SpawnConfig {
  creepType: string
  count: number
  interval: number
  delay?: number
}

interface WaveConfig {
  wave: number
  spawns: SpawnConfig[]
}

export class WaveManager {
  engine: GameEngine
  currentWave: number = 0
  isActive: boolean = false
  spawns: Array<{
    config: SpawnConfig
    spawned: number
    timer: number
    started: boolean
  }> = []
  
  constructor(engine: GameEngine) {
    this.engine = engine
  }
  
  startWave(waveNumber: number) {
    console.log('WaveManager.startWave called for wave:', waveNumber)
    const waveConfig = wavesData.waves.find((w: WaveConfig) => w.wave === waveNumber)
    if (!waveConfig) {
      console.log('No wave config found for wave:', waveNumber)
      return
    }
    
    console.log('Wave config found:', waveConfig)
    this.currentWave = waveNumber
    this.isActive = true
    this.spawns = waveConfig.spawns.map(spawn => ({
      config: spawn,
      spawned: 0,
      timer: spawn.delay || 0,
      started: false,
    }))
    console.log('Wave spawns initialized:', this.spawns)
  }
  
  update(delta: number) {
    if (!this.isActive) return
    
    let allComplete = true
    
    for (const spawn of this.spawns) {
      if (spawn.spawned < spawn.config.count) {
        allComplete = false
        
        if (!spawn.started) {
          spawn.timer -= delta * 16 // Convert to ms
          if (spawn.timer <= 0) {
            spawn.started = true
            spawn.timer = 0
          }
        } else {
          spawn.timer += delta * 16
          
          if (spawn.timer >= spawn.config.interval) {
            this.engine.spawnCreep(spawn.config.creepType)
            spawn.spawned++
            spawn.timer = 0
          }
        }
      }
    }
    
    if (allComplete) {
      this.isActive = false
      // Wave complete
    }
  }
  
  isWaveComplete(): boolean {
    return !this.isActive && this.engine.creeps.length === 0
  }
}