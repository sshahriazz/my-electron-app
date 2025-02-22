/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export interface Position {
  x: number
  y: number
}
export interface KeyStats {
  totalKeystrokes: number
  keyFrequencies: Record<string, number>
  startTime: number
  lastKeystrokeTime: number
}
export interface MouseStats {
  totalClicks: number
  mousePositions: Array<Position>
  clickPositions: Array<Position>
  buttonFrequencies: Record<string, number>
  lastClickTime: number
  lastMoveTime: number
}
export declare class KeystrokeCounter {
  constructor()
  startTracking(): void
  stopTracking(): void
  getTotalKeystrokes(): number
  getStats(): KeyStats
  resetStats(): void
}
export declare class MouseTracker {
  constructor()
  startTracking(): void
  stopTracking(): void
  getStats(): MouseStats
  resetStats(): void
}
