
import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import GameEngine from './components/GameEngine';
import Joystick from './components/Joystick';
import { getCityNews } from './services/geminiService';
import { Play, Info, RotateCcw, Home as HomeIcon, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [score, setScore] = useState(0);
  const [inputDir, setInputDir] = useState({ x: 0, y: 0 });
  const [news, setNews] = useState<string[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getCityNews();
      setNews(data);
    };
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [news]);

  const startGame = () => setGameState(GameState.PLAYING);
  const endGame = (finalScore: number) => {
    setScore(finalScore);
    setGameState(GameState.GAME_OVER);
  };
  const goHome = () => setGameState(GameState.HOME);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Ticker */}
      <div className="bg-gradient-to-r from-pink-700 to-indigo-900 text-white py-2 px-4 font-bold text-xs z-50 flex items-center gap-4 overflow-hidden whitespace-nowrap border-b-2 border-cyan-400">
        <span className="uppercase tracking-widest bg-cyan-400 text-black px-3 py-0.5 rounded italic font-black text-[10px]">VENOM SNAKE LIVE</span>
        <div className="animate-pulse flex-1 uppercase tracking-wider">
           {news[currentNewsIndex] || "Synchronizing Neural Tunnels..."}
        </div>
      </div>

      {gameState === GameState.HOME && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in zoom-in duration-700 relative">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="bg" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>
          
          <div className="text-center space-y-4 z-10">
            <div className="relative inline-block">
               <h1 className="text-8xl font-game text-white drop-shadow-[0_0_25px_#ff00ff] italic rotate-[-3deg]">
                VENOM<br/><span className="text-cyan-400 drop-shadow-[0_0_25px_#00ffff]">SNAKE VI</span>
              </h1>
            </div>
            <p className="text-pink-400 font-bold tracking-[0.5em] uppercase text-sm">Slither. Eat. Dominate the City.</p>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-sm z-10">
            <button 
              onClick={startGame}
              className="bg-white text-black p-6 rounded-none font-game text-3xl flex items-center justify-center gap-3 shadow-[10px_10px_0_#ff00ff] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-4 border-black group hover:bg-cyan-400"
            >
              <Play fill="currentColor" size={32} /> START HUNTING
            </button>
            <button 
              onClick={() => setGameState(GameState.INFO)}
              className="bg-slate-800 text-white p-4 rounded-none font-game text-xl flex items-center justify-center gap-3 shadow-[10px_10px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-2 border-slate-700"
            >
              <Info size={24} /> MISSION INTEL
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="relative flex-1 bg-slate-900">
          <GameEngine onGameOver={endGame} inputDir={inputDir} />
          
          <div className="absolute bottom-10 left-10">
            <Joystick onMove={(dir) => setInputDir(dir)} />
          </div>
          
          <div className="absolute top-20 right-10 text-right bg-black/60 p-5 border-r-8 border-pink-500 backdrop-blur-md">
            <p className="text-[12px] uppercase text-cyan-400 font-black tracking-widest mb-1">Current State</p>
            <p className="font-game text-3xl text-white italic">FEEDING TIME</p>
          </div>

          <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2">
            <div className="bg-yellow-400/20 p-2 border border-yellow-400/40 rounded italic text-[10px] text-yellow-400 uppercase font-black tracking-widest">
              Push Joystick for Turbo
            </div>
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_#facc15] animate-pulse">
              <Zap className="text-black" fill="black" />
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-16 bg-black relative animate-in fade-in duration-1000 overflow-hidden">
          {/* Wasted Effect Background */}
          <div className="absolute inset-0 bg-red-900/20 backdrop-grayscale" />
          
          <div className="text-center z-10 scale-125">
            <h2 className="text-[10rem] font-game text-red-600 drop-shadow-[0_0_60px_rgba(220,38,38,0.9)] italic tracking-tighter skew-x-[-10deg] leading-none">WASTED</h2>
            <p className="text-white tracking-[1.0em] font-black uppercase text-xl mt-4 opacity-80">You crashed your collection</p>
          </div>

          <div className="bg-white text-black p-12 rounded-none border-x-[12px] border-cyan-400 shadow-[20px_20px_0_#ff00ff] z-10 transition-transform hover:scale-105">
            <p className="uppercase font-black text-[12px] mb-2 text-slate-400 tracking-widest text-center">Net Worth Recovered</p>
            <p className="text-8xl font-game">${score.toLocaleString()}</p>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-sm z-10">
            <button 
              onClick={startGame}
              className="bg-cyan-400 text-black p-6 font-game text-3xl shadow-[12px_12px_0_#fff] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all border-4 border-black hover:bg-pink-500 hover:text-white"
            >
              <RotateCcw size={32} /> RESPAWN NOW
            </button>
            <button 
              onClick={goHome}
              className="bg-slate-800 text-white p-4 font-game text-xl shadow-[8px_8px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-2 border-slate-700"
            >
               BACK TO MENU
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.INFO && (
        <div className="flex-1 p-10 overflow-y-auto space-y-10 bg-slate-950 border-t-[12px] border-pink-600">
          <div className="flex items-center gap-6">
            <button onClick={goHome} className="p-4 bg-white text-black rounded-none border-4 border-black shadow-[6px_6px_0_#00ffff] hover:bg-cyan-400"><HomeIcon /></button>
            <h2 className="text-5xl font-game text-cyan-400 italic">HUNTING GUIDE</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-100 font-medium leading-relaxed">
            <section className="bg-slate-900/80 p-8 border-l-[12px] border-pink-500 shadow-xl backdrop-blur-sm">
              <h3 className="text-pink-400 font-black text-2xl mb-4 italic uppercase tracking-wider">Evolution</h3>
              <p className="text-lg">Eat glowing coins to grow your body. Longer snakes are faster but harder to maneuver through the neon streets.</p>
            </section>
            
            <section className="bg-slate-900/80 p-8 border-l-[12px] border-cyan-400 shadow-xl backdrop-blur-sm">
              <h3 className="text-cyan-400 font-black text-2xl mb-4 italic uppercase tracking-wider">Combats</h3>
              <p className="text-lg">Cut off other snakes! If they hit your glowing trail, they explode into high-value bonus points for you to eat.</p>
            </section>
          </div>

          <button 
            onClick={goHome}
            className="w-full bg-pink-500 p-6 font-game text-3xl shadow-[12px_12px_0_#00ffff] border-4 border-black hover:bg-cyan-400 transition-colors"
          >
            START THE FEED
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
