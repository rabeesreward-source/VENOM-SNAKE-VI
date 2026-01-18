
export enum GameState {
  HOME = 'HOME',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  INFO = 'INFO'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  rot: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  speed: number;
  isDriving: boolean;
  carId: string | null;
  health: number;
  wantedLevel: number;
  jumpZ: number;
  isJumping: boolean;
  segments: Vector2[]; // Snake segments
  history: Vector2[]; // Smooth path history for trailing
  hillPoints: number; // For King of the Hill
}

export interface NPCSnake extends Entity {
  segments: Vector2[];
  history: Vector2[];
  speed: number;
  color: string;
  targetRot: number;
  hillPoints: number; // For King of the Hill
}

export interface Car extends Entity {
  color: string;
  speed: number;
  isNpc: boolean;
  type: 'sport' | 'sedan' | 'suv' | 'bugatti';
}

export interface Pedestrian extends Entity {
  color: string;
  speed: number;
  targetRot: number;
  behavior: 'walk' | 'idle' | 'jog';
}

export interface Coin extends Entity {
  collected: boolean;
  isBonus?: boolean;
}

export interface GameStats {
  score: number;
  timeElapsed: number;
  difficulty: number;
}

export interface Ramp extends Vector2 {
  w: number;
  h: number;
  rot: number;
}
