
export const MAP_SIZE = 10000; 
export const PLAYER_SPEED = 9;  // Normalized speed
export const NITRO_SPEED = 15; // Normalized nitro
export const NPC_SNAKE_SPEED = 6;
export const SEGMENT_SPACING = 14; 
export const MAX_HISTORY = 1000;
export const INITIAL_SEGMENTS = 5;
export const COIN_VALUE = 100;
export const INITIAL_HEALTH = 100;

export const HILL_ZONE_SIZE = 1200; // Size of the central "Hill"
export const HILL_POINTS_PER_TICK = 1;
export const HILL_SCORE_BONUS = 20;

export const CITY_LAYOUT = {
  islands: [
    { x: 0, y: 0, w: 4000, h: 3000, type: 'urban' },        
    { x: 5500, y: 500, w: 3000, h: 2000, type: 'luxury' },  
    { x: 1000, y: 4500, w: 3500, h: 3500, type: 'swamp' },  
    { x: 6000, y: 4000, w: 3500, h: 5000, type: 'keys' },   
  ],
  roads: [
    { x: 4800, y: 0, w: 400, h: 10000 }, 
    { x: 0, y: 3800, w: 10000, h: 400 }, 
    { x: 200, y: 800, w: 3600, h: 120 },
    { x: 200, y: 1800, w: 3600, h: 120 },
    { x: 800, y: 0, w: 120, h: 3000 },
    { x: 1800, y: 0, w: 120, h: 3000 },
    { x: 6000, y: 5000, w: 3500, h: 150 },
    { x: 8000, y: 5000, w: 150, h: 5000 },
  ],
  ramps: [
    { x: 4900, y: 2000, w: 200, h: 300, rot: 0 }, 
    { x: 4900, y: 6000, w: 200, h: 300, rot: Math.PI }, 
    { x: 2000, y: 3900, w: 300, h: 200, rot: Math.PI / 2 }, 
    { x: 7000, y: 3900, w: 300, h: 200, rot: -Math.PI / 2 },
    { x: 1500, y: 1500, w: 150, h: 100, rot: 0.5 },
    { x: 3000, y: 2500, w: 150, h: 100, rot: -0.8 },
  ],
  buildings: [
    { x: 400, y: 400, w: 300, h: 500, color: '#f472b6', name: 'Vercetti Estate' },
    { x: 2000, y: 800, w: 600, h: 400, color: '#22d3ee', name: 'Leonida Grand' },
    { x: 7000, y: 1000, w: 800, h: 600, color: '#fbbf24', name: 'Bugatti Showroom' },
    { x: 1500, y: 6000, w: 500, h: 400, color: '#ec4899', name: 'Swamp Lab' },
  ],
  palmTrees: Array.from({ length: 200 }).map((_, i) => ({
    x: Math.random() * MAP_SIZE,
    y: Math.random() * MAP_SIZE
  }))
};

export const COLORS = {
  GRASS: '#065f46',
  SWAMP: '#365314',
  ROAD: '#1e293b',
  BRIDGE: '#475569',
  SIDEWALK: '#64748b',
  BEACH: '#fef3c7',
  OCEAN: '#0369a1',
  PLAYER: '#ec4899',
  NPC_SNAKE: '#00ffff',
  COIN: '#fbbf24',
  NEON_PINK: '#ff00ff',
  NEON_CYAN: '#00ffff',
  HEALTH_GOOD: '#22c55e',
  HEALTH_BAD: '#ef4444',
  NITRO: '#fef08a',
  HILL_ZONE: 'rgba(250, 204, 21, 0.2)',
  HILL_BORDER: '#facc15'
};
