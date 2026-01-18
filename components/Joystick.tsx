
import React, { useState, useRef, useEffect } from 'react';

interface JoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setActive(true);
  };

  const handleMove = (e: TouchEvent | MouseEvent) => {
    if (!active || !baseRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = rect.width / 2;
    
    const limitedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);
    
    const nx = Math.cos(angle) * (limitedDistance / maxDistance);
    const ny = Math.sin(angle) * (limitedDistance / maxDistance);

    setPos({ x: Math.cos(angle) * limitedDistance, y: Math.sin(angle) * limitedDistance });
    onMove({ x: nx, y: ny });
  };

  const handleEnd = () => {
    setActive(false);
    setPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [active]);

  return (
    <div 
      ref={baseRef}
      className="w-24 h-24 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center relative touch-none"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div 
        className="w-12 h-12 bg-white/60 rounded-full shadow-lg absolute pointer-events-none transition-transform duration-75"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
    </div>
  );
};

export default Joystick;
