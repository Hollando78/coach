import * as PIXI from 'pixi.js'

interface Node {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Node | null
}

export class Pathfinder {
  width: number
  height: number
  grid: boolean[][]
  path: PIXI.Point[] = []
  
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    
    // Initialize grid (true = walkable)
    this.grid = Array(height).fill(null).map(() => Array(width).fill(true))
  }
  
  setPath(path: PIXI.Point[]) {
    this.path = path
    
    // Mark path cells as walkable
    for (const point of path) {
      if (point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height) {
        this.grid[point.y][point.x] = true
      }
    }
  }
  
  setBlocked(x: number, y: number, blocked: boolean) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = !blocked
    }
  }
  
  findPath(startX: number, startY: number, endX: number, endY: number): PIXI.Point[] | null {
    // A* pathfinding
    const openList: Node[] = []
    const closedList: Set<string> = new Set()
    
    const startNode: Node = {
      x: startX,
      y: startY,
      g: 0,
      h: this.heuristic(startX, startY, endX, endY),
      f: 0,
      parent: null,
    }
    startNode.f = startNode.g + startNode.h
    
    openList.push(startNode)
    
    while (openList.length > 0) {
      // Find node with lowest f
      let currentIndex = 0
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i
        }
      }
      
      const current = openList.splice(currentIndex, 1)[0]
      closedList.add(`${current.x},${current.y}`)
      
      // Check if reached goal
      if (current.x === endX && current.y === endY) {
        // Reconstruct path
        const path: PIXI.Point[] = []
        let node: Node | null = current
        
        while (node) {
          path.unshift(new PIXI.Point(node.x, node.y))
          node = node.parent
        }
        
        return path
      }
      
      // Check neighbors
      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
      ]
      
      for (const neighbor of neighbors) {
        // Check bounds
        if (neighbor.x < 0 || neighbor.x >= this.width ||
            neighbor.y < 0 || neighbor.y >= this.height) {
          continue
        }
        
        // Check if walkable
        if (!this.grid[neighbor.y][neighbor.x]) {
          continue
        }
        
        // Check if in closed list
        if (closedList.has(`${neighbor.x},${neighbor.y}`)) {
          continue
        }
        
        const g = current.g + 1
        const h = this.heuristic(neighbor.x, neighbor.y, endX, endY)
        const f = g + h
        
        // Check if in open list
        const existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y)
        
        if (existingNode) {
          // Update if better path
          if (g < existingNode.g) {
            existingNode.g = g
            existingNode.f = f
            existingNode.parent = current
          }
        } else {
          // Add to open list
          openList.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current,
          })
        }
      }
    }
    
    return null // No path found
  }
  
  heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }
  
  canPlaceTower(x: number, y: number): boolean {
    // Check if placing a tower here would block the only path
    this.setBlocked(x, y, true)
    
    // Check if path still exists from spawn to goal
    if (this.path.length >= 2) {
      const pathExists = this.findPath(
        this.path[0].x,
        this.path[0].y,
        this.path[this.path.length - 1].x,
        this.path[this.path.length - 1].y
      )
      
      this.setBlocked(x, y, false)
      return pathExists !== null
    }
    
    this.setBlocked(x, y, false)
    return true
  }
}