export class PRNG {
  private seed: number
  
  constructor(seed: string) {
    this.seed = this.hashCode(seed)
  }
  
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  next(): number {
    const x = Math.sin(this.seed++) * 10000
    return x - Math.floor(x)
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }
  
  chance(probability: number): boolean {
    return this.next() < probability
  }
}