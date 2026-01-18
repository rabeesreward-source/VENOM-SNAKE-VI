
import React, { useEffect, useRef, useState } from 'react';
import { 
  MAP_SIZE, COLORS, CITY_LAYOUT, PLAYER_SPEED, NITRO_SPEED,
  NPC_SNAKE_SPEED, SEGMENT_SPACING, MAX_HISTORY, INITIAL_SEGMENTS,
  COIN_VALUE, INITIAL_HEALTH, HILL_ZONE_SIZE, HILL_POINTS_PER_TICK, HILL_SCORE_BONUS
} from '../constants';
import { Player, NPCSnake, Coin, GameStats, Vector2 } from '../types';

interface GameEngineProps {
  onGameOver: (score: number) => void;
  inputDir: { x: number; y: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface RankEntry {
  id: string;
  name: string;
  length: number;
  hillPoints: number;
  color: string;
  isPlayer: boolean;
}

class AudioManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, slideTo?: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCoin() { this.playTone(880, 'sine', 0.1, 0.4, 1760); }
  playJump() { this.playTone(110, 'triangle', 0.5, 0.5, 440); }
  playKill() { this.playTone(220, 'square', 0.3, 0.3, 55); }
  playCrash() { this.playTone(150, 'sawtooth', 0.8, 0.5, 20); }
  playNitro() { this.playTone(60, 'sawtooth', 0.2, 0.05, 120); }

  playAmbient() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
  }
}

const audio = new AudioManager();

const GameEngine: React.FC<GameEngineProps> = ({ onGameOver, inputDir }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [isWasted, setIsWasted] = useState(false);
  const leaderboardRef = useRef<RankEntry[]>([]);
  
  // Ref for camera position to allow smooth following
  const camPosRef = useRef<Vector2>({ x: 5000, y: 4000 });
  // Ref for smoothed input
  const smoothInputRef = useRef<Vector2>({ x: 1, y: 0 });

  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: 5000, y: 4000 },
    rot: 0,
    width: 60,
    height: 60,
    speed: PLAYER_SPEED,
    isDriving: true,
    carId: 'venom-snake',
    health: INITIAL_HEALTH,
    wantedLevel: 0,
    jumpZ: 0,
    isJumping: false,
    segments: Array.from({ length: INITIAL_SEGMENTS }).map(() => ({ x: 5000, y: 4000 })),
    history: [],
    hillPoints: 0
  });

  const npcNames = ["PythonX", "NeonCobra", "VenomLord", "StaticTail", "CyberSlink", "SlitherBot", "DataFang", "PixelHiss", "BitAdder", "GlitchSnake", "VoltWorm", "TurboMamba", "MegaConstrictor", "HyperAsp", "UltraScale", "ProtoPython", "ShadowNaga", "GlowGarter"];

  const npcSnakesRef = useRef<NPCSnake[]>(
    npcNames.map((name, i) => ({
      id: `npc-${i}`,
      pos: { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE },
      rot: Math.random() * Math.PI * 2,
      targetRot: Math.random() * Math.PI * 2,
      width: 50,
      height: 50,
      speed: NPC_SNAKE_SPEED,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      segments: Array.from({ length: 8 + Math.floor(Math.random() * 12) }).map(() => ({ x: 0, y: 0 })),
      history: [],
      hillPoints: 0
    }))
  );

  const coinsRef = useRef<Coin[]>(
    Array.from({ length: 200 }).map((_, i) => ({
      id: `coin-${i}`,
      pos: { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE },
      rot: 0,
      width: 32,
      height: 32,
      collected: false
    }))
  );

  const statsRef = useRef<GameStats>({
    score: 0,
    timeElapsed: 0,
    difficulty: 1
  });

  const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color
      });
    }
  };

  const handleDeath = () => {
    if (isWasted) return;
    setIsWasted(true);
    audio.playCrash();
    createExplosion(playerRef.current.pos.x, playerRef.current.pos.y, COLORS.NEON_CYAN, 60);
    statsRef.current.score = Math.max(0, statsRef.current.score - 500);

    setTimeout(() => {
      playerRef.current = {
        ...playerRef.current,
        pos: { x: 5000, y: 4000 },
        segments: Array.from({ length: INITIAL_SEGMENTS }).map(() => ({ x: 5000, y: 4000 })),
        history: [],
        jumpZ: 0,
        isJumping: false,
        hillPoints: 0
      };
      camPosRef.current = { x: 5000, y: 4000 };
      setIsWasted(false);
    }, 1500);
  };

  const updateLeaderboard = () => {
    const entries: RankEntry[] = [];
    entries.push({ id: 'player', name: 'YOU', length: playerRef.current.segments.length + 1, hillPoints: playerRef.current.hillPoints, color: COLORS.NEON_CYAN, isPlayer: true });
    npcSnakesRef.current.forEach((npc, i) => {
      entries.push({ id: npc.id, name: npcNames[i], length: npc.segments.length + 1, hillPoints: npc.hillPoints, color: npc.color, isPlayer: false });
    });
    entries.sort((a, b) => (b.hillPoints - a.hillPoints) || (b.length - a.length));
    leaderboardRef.current = entries;
  };

  const checkOnHill = (pos: Vector2) => {
    const hillX = MAP_SIZE / 2 - HILL_ZONE_SIZE / 2;
    const hillY = MAP_SIZE / 2 - HILL_ZONE_SIZE / 2;
    return pos.x >= hillX && pos.x <= hillX + HILL_ZONE_SIZE &&
           pos.y >= hillY && pos.y <= hillY + HILL_ZONE_SIZE;
  };

  const update = (dt: number) => {
    const p = playerRef.current;
    
    if (frameRef.current % 10 === 0) updateLeaderboard();

    if (isWasted) {
        particlesRef.current.forEach((part) => {
          part.x += part.vx * 0.5 * dt;
          part.y += part.vy * 0.5 * dt;
          part.life -= 0.01 * dt;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        return;
    }

    // King of the Hill
    if (checkOnHill(p.pos)) {
      p.hillPoints += HILL_POINTS_PER_TICK;
      statsRef.current.score += HILL_SCORE_BONUS;
    }

    // Smooth Input
    const lerpSpeed = 0.15 * dt;
    if (inputDir.x !== 0 || inputDir.y !== 0) {
      smoothInputRef.current.x += (inputDir.x - smoothInputRef.current.x) * lerpSpeed;
      smoothInputRef.current.y += (inputDir.y - smoothInputRef.current.y) * lerpSpeed;
    }

    const inputDist = Math.sqrt(smoothInputRef.current.x**2 + smoothInputRef.current.y**2);
    const isNitro = inputDist > 0.75;
    const targetSpeed = isNitro ? NITRO_SPEED : PLAYER_SPEED;
    
    p.speed += (targetSpeed - p.speed) * 0.1 * dt;
    if (isNitro && Math.random() < 0.05) audio.playNitro();

    // Movement using dt for consistent speed across framerates
    p.pos.x += smoothInputRef.current.x * p.speed * dt;
    p.pos.y += smoothInputRef.current.y * p.speed * dt;

    const targetRot = Math.atan2(smoothInputRef.current.y, smoothInputRef.current.x);
    let rotDiff = targetRot - p.rot;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    p.rot += rotDiff * 0.2 * dt;

    if (p.pos.x < 0 || p.pos.x > MAP_SIZE || p.pos.y < 0 || p.pos.y > MAP_SIZE) {
        handleDeath();
        return;
    }

    // History tracking - important for smooth segments
    p.history.unshift({ ...p.pos });
    if (p.history.length > MAX_HISTORY) p.history.pop();

    p.segments.forEach((seg, i) => {
      const historyIndex = Math.floor((i + 1) * SEGMENT_SPACING);
      if (p.history[historyIndex]) {
        // Linear interpolation between frames for segments would be ideal, 
        // but high history density + dt movement is usually enough.
        seg.x = p.history[historyIndex].x;
        seg.y = p.history[historyIndex].y;
      }
    });

    // Camera Lerping - 10% of distance each frame
    camPosRef.current.x += (p.pos.x - camPosRef.current.x) * 0.1 * dt;
    camPosRef.current.y += (p.pos.y - camPosRef.current.y) * 0.1 * dt;

    // Ramps, NPCs, Coins (simplified dt scaling)
    if (!p.isJumping) {
      CITY_LAYOUT.ramps.forEach(ramp => {
        const dx = p.pos.x - ramp.x;
        const dy = p.pos.y - ramp.y;
        if (Math.abs(dx) < ramp.w/2 && Math.abs(dy) < ramp.h/2) {
          p.isJumping = true;
          audio.playJump();
        }
      });
    }

    if (p.isJumping) {
      p.jumpZ += 0.05 * dt;
      if (p.jumpZ > 2) { p.jumpZ = 0; p.isJumping = false; }
    }

    npcSnakesRef.current.forEach(npc => {
      let diff = npc.targetRot - npc.rot;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      npc.rot += diff * 0.05 * dt;

      npc.pos.x += Math.cos(npc.rot) * npc.speed * dt;
      npc.pos.y += Math.sin(npc.rot) * npc.speed * dt;

      npc.history.unshift({ ...npc.pos });
      if (npc.history.length > MAX_HISTORY) npc.history.pop();
      npc.segments.forEach((seg, i) => {
        const historyIndex = Math.floor((i + 1) * SEGMENT_SPACING);
        if (npc.history[historyIndex]) {
          seg.x = npc.history[historyIndex].x;
          seg.y = npc.history[historyIndex].y;
        }
      });

      npc.segments.forEach(seg => {
        const dx = p.pos.x - seg.x;
        const dy = p.pos.y - seg.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) handleDeath();
      });

      p.segments.forEach(seg => {
        const dx = npc.pos.x - seg.x;
        const dy = npc.pos.y - seg.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
           audio.playKill();
           npc.pos = { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE };
           npc.history = [];
        }
      });
    });

    coinsRef.current.forEach(coin => {
      if (!coin.collected) {
        const dx = p.pos.x - coin.pos.x;
        const dy = p.pos.y - coin.pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          coin.collected = true;
          audio.playCoin();
          p.segments.push({ x: p.pos.x, y: p.pos.y });
          setTimeout(() => { coin.collected = false; coin.pos = { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE }; }, 5000);
        }
      }
    });

    particlesRef.current.forEach((part) => {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= 0.02 * dt;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const drawSnakePart = (ctx: CanvasRenderingContext2D, color: string, glowColor: string, isHead: boolean, zOffset: number = 0, scaleFactor: number = 1, isNitro: boolean = false, isKing: boolean = false) => {
    ctx.save();
    const jumpScale = (1 + zOffset * 0.5) * scaleFactor;
    ctx.scale(jumpScale, jumpScale);

    if (isHead) {
      if (isKing) {
        ctx.save();
        ctx.translate(0, -45);
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-20, -15); ctx.lineTo(-10, -5); ctx.lineTo(0, -20); ctx.lineTo(10, -5); ctx.lineTo(20, -15); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = color;
      ctx.shadowBlur = isNitro ? 50 : (isKing ? 60 : 30);
      ctx.shadowColor = isNitro ? COLORS.NITRO : (isKing ? '#facc15' : glowColor);
      ctx.beginPath(); ctx.moveTo(35, 0); ctx.bezierCurveTo(35, -25, 0, -30, -25, -20); ctx.lineTo(-25, 20); ctx.bezierCurveTo(0, 30, 35, 25, 35, 0); ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(15, -12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(17, -12, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(17, 12, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = glowColor;
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawWorld = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    // Sub-pixel camera positioning (non-rounded) for maximum smoothness
    ctx.translate(ctx.canvas.width / 2 - camPosRef.current.x, ctx.canvas.height / 2 - camPosRef.current.y);

    ctx.fillStyle = COLORS.OCEAN;
    ctx.fillRect(-MAP_SIZE, -MAP_SIZE, MAP_SIZE * 3, MAP_SIZE * 3);

    CITY_LAYOUT.islands.forEach(isl => {
      ctx.fillStyle = isl.type === 'swamp' ? COLORS.SWAMP : (isl.type === 'luxury' ? '#064e3b' : COLORS.GRASS);
      ctx.fillRect(isl.x, isl.y, isl.w, isl.h);
      ctx.strokeStyle = COLORS.BEACH;
      ctx.lineWidth = 60; ctx.strokeRect(isl.x, isl.y, isl.w, isl.h);
    });

    const hillX = MAP_SIZE / 2 - HILL_ZONE_SIZE / 2;
    const hillY = MAP_SIZE / 2 - HILL_ZONE_SIZE / 2;
    ctx.fillStyle = COLORS.HILL_ZONE;
    ctx.fillRect(hillX, hillY, HILL_ZONE_SIZE, HILL_ZONE_SIZE);
    ctx.strokeStyle = COLORS.HILL_BORDER;
    ctx.lineWidth = 20; ctx.strokeRect(hillX, hillY, HILL_ZONE_SIZE, HILL_ZONE_SIZE);

    CITY_LAYOUT.roads.forEach(r => {
      ctx.fillStyle = COLORS.ROAD;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    coinsRef.current.forEach(coin => {
      if (!coin.collected) {
        ctx.fillStyle = coin.isBonus ? '#fff' : COLORS.COIN;
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle as string;
        ctx.beginPath(); ctx.arc(coin.pos.x, coin.pos.y, 28, 0, Math.PI * 2); ctx.fill();
      }
    });

    particlesRef.current.forEach(part => {
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.beginPath(); ctx.arc(part.x, part.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    const kingId = leaderboardRef.current[0]?.id;

    npcSnakesRef.current.forEach(npc => {
        npc.segments.forEach((seg, i) => {
            ctx.save(); ctx.translate(seg.x, seg.y);
            const historyIdx = Math.floor((i+1) * SEGMENT_SPACING);
            const prev = npc.history[historyIdx - 1] || npc.pos;
            ctx.rotate(Math.atan2(seg.y - prev.y, seg.x - prev.x) + Math.PI);
            drawSnakePart(ctx, '#111', npc.color, false, 0, Math.max(0.4, 1 - (i / npc.segments.length)));
            ctx.restore();
        });
        ctx.save(); ctx.translate(npc.pos.x, npc.pos.y); ctx.rotate(npc.rot);
        drawSnakePart(ctx, '#000', npc.color, true, 0, 1, false, npc.id === kingId);
        ctx.restore();
    });

    if (!isWasted) {
        const isNitro = Math.sqrt(smoothInputRef.current.x**2 + smoothInputRef.current.y**2) > 0.75;
        [...p.segments].reverse().forEach((seg, idx) => {
            const i = p.segments.length - 1 - idx;
            ctx.save(); ctx.translate(seg.x, seg.y);
            const historyIdx = Math.floor((i + 1) * SEGMENT_SPACING);
            const prev = p.history[historyIdx - 1] || p.pos;
            ctx.rotate(Math.atan2(seg.y - prev.y, seg.x - prev.x) + Math.PI);
            drawSnakePart(ctx, '#111', COLORS.NEON_PINK, false, Math.max(0, Math.sin((p.jumpZ - i*0.08) * Math.PI/2)), Math.max(0.5, 1.1 - (i / p.segments.length)), isNitro && i < 3);
            ctx.restore();
        });

        ctx.save(); ctx.translate(p.pos.x, p.pos.y); ctx.rotate(p.rot);
        drawSnakePart(ctx, '#000', COLORS.NEON_CYAN, true, p.jumpZ, 1, isNitro, 'player' === kingId);
        ctx.restore();
    }
    ctx.restore();
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 54px Bungee';
    ctx.fillText(`$${statsRef.current.score.toLocaleString()}`, 30, 80);
    ctx.font = 'bold 24px Bungee';
    ctx.fillStyle = COLORS.NEON_CYAN;
    ctx.fillText(`VENOM LENGTH: ${p.segments.length + 1}`, 30, 120);

    const kingName = leaderboardRef.current[0]?.name || "N/A";
    ctx.fillStyle = '#fff';
    ctx.fillText(`CURRENT KING: ${kingName}`, 30, 160);
    ctx.fillStyle = checkOnHill(p.pos) ? COLORS.HILL_BORDER : '#555';
    ctx.fillText(`HILL TIME: ${p.hillPoints}`, 30, 195);

    const lbX = ctx.canvas.width - 250;
    const lbY = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath(); ctx.roundRect(lbX, lbY, 220, 180, 10); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Bungee';
    ctx.fillText('LEADERBOARD', lbX + 15, lbY + 25);
    leaderboardRef.current.slice(0, 5).forEach((entry, i) => {
        ctx.fillStyle = entry.isPlayer ? COLORS.NEON_CYAN : (i === 0 ? '#facc15' : '#aaa');
        ctx.font = entry.isPlayer ? 'bold 12px Bungee' : '10px Bungee';
        ctx.fillText(`${i === 0 ? '👑 ' : (i+1)+'. '}${entry.name}`, lbX + 15, lbY + 50 + (i * 22));
        ctx.textAlign = 'right'; ctx.fillText(entry.hillPoints.toString(), lbX + 205, lbY + 50 + (i * 22)); ctx.textAlign = 'left';
    });

    if (isWasted) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#f00'; ctx.font = 'italic bold 120px Bungee'; ctx.textAlign = 'center';
      ctx.fillText('WASTED', ctx.canvas.width/2, ctx.canvas.height/2); ctx.textAlign = 'start';
    }

    // Mini-map
    const radarX = ctx.canvas.width - 220;
    const radarY = ctx.canvas.height - 220;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath(); ctx.roundRect(radarX, radarY, 200, 200, 15); ctx.fill();
    ctx.save();
    ctx.translate(radarX + 100, radarY + 100); ctx.scale(0.016, 0.016); ctx.translate(-p.pos.x, -p.pos.y);
    npcSnakesRef.current.forEach(npc => { ctx.fillStyle = npc.color; ctx.beginPath(); ctx.arc(npc.pos.x, npc.pos.y, 450, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 550, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  const loop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 16.666, 3.0); 
    lastTimeRef.current = timestamp;

    update(dt);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWorld(ctx, playerRef.current);
    drawHUD(ctx, playerRef.current);
    frameRef.current++;
    requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const initAudio = () => { audio.init(); audio.playAmbient(); window.removeEventListener('touchstart', initAudio); };
    window.addEventListener('touchstart', initAudio);
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    handleResize();
    const animationId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', handleResize); };
  }, [inputDir]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default GameEngine;
