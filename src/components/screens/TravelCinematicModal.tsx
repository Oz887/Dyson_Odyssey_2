import React, { useEffect, useRef, useState } from 'react';
import { PLANET_CATALOG } from '../../data/phase3Planets';
import { soundEngine } from '../../engine/audio';
import { Language, TravelCinematicState } from '../../types/game';

interface TravelCinematicModalProps {
  travel: TravelCinematicState;
  language: Language;
  onComplete: () => void;
}

/**
 * Animation 4.1: Responsive 16-bit Planet-to-Planet Travel Sequence
 * Adapts to phone, tablet, and laptop; plays warp flight + odometer counter
 * and returns control to the game on completion.
 */
export const TravelCinematicModal: React.FC<TravelCinematicModalProps> = ({
  travel,
  language,
  onComplete,
}) => {
  const es = language === 'es';
  const isSunTrip = travel.variant === 'mercury_to_sun_4_2';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const fromPlanet = PLANET_CATALOG[travel.fromPlanetId];
  const toPlanet = PLANET_CATALOG[travel.toPlanetId];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = Math.max(320, Math.floor(window.innerWidth / 2));
      canvas.height = Math.max(180, Math.floor(window.innerHeight / 2));
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 85 }, (_, i) => ({
      x: Math.random() * 600,
      y: Math.random() * 400,
      speed: 90 + (i % 5) * 55,
      len: 4 + (i % 4) * 5,
      color: isSunTrip
        ? i % 3 === 0
          ? '#fde047'
          : '#fb923c'
        : i % 4 === 0
          ? '#7dd3fc'
          : i % 7 === 0
            ? '#e9d5ff'
            : '#ffffff',
    }));

    const duration = isSunTrip ? 4.0 : 3.4;
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let finished = false;

    soundEngine.playAirlock(true);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const pct = Math.min(1, elapsed / duration);
      setProgress(pct);

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = isSunTrip ? '#160704' : '#050712';
      ctx.fillRect(0, 0, w, h);

      if (isSunTrip) {
        // Warm solar radiance background glow
        const grad = ctx.createRadialGradient(w * 0.9, h * 0.5, 10, w * 0.9, h * 0.5, w * 0.85);
        grad.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
        grad.addColorStop(1, 'rgba(22, 7, 4, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Warp star / plasma streaks
      for (const s of stars) {
        s.x -= s.speed * dt * (1 + pct * 1.5);
        if (s.x < -20) {
          s.x = w + 10;
          s.y = Math.random() * h;
        }
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.len, 1);
      }

      // Origin planet receding on left
      const originX = Math.round(w * 0.14 - pct * w * 0.3);
      const originR = Math.round(Math.min(w, h) * 0.14);
      ctx.fillStyle = fromPlanet.color;
      ctx.beginPath();
      ctx.arc(originX, h * 0.5, originR, 0, Math.PI * 2);
      ctx.fill();

      // Destination planet/star approaching on right
      const destX = Math.round(w * 1.12 - pct * w * 0.34);
      const destR = isSunTrip
        ? Math.round(Math.min(w, h) * (0.24 + pct * 0.24))
        : Math.round(Math.min(w, h) * (0.1 + pct * 0.1));
      if (isSunTrip) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.32)';
        ctx.beginPath();
        ctx.arc(destX, h * 0.5, destR + 12 + Math.sin(elapsed * 8) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = toPlanet.color;
      ctx.beginPath();
      ctx.arc(destX, h * 0.5, destR, 0, Math.PI * 2);
      ctx.fill();
      if (isSunTrip) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(destX, h * 0.5, Math.round(destR * 0.7), 0, Math.PI * 2);
        ctx.fill();
      }

      // Pixel Odyssey-1 Ship flying left-to-right
      const shipX = Math.round(w * (0.24 + pct * 0.38));
      const shipY = Math.round(h * 0.5 + Math.sin(elapsed * 8) * 3);
      if (isSunTrip) {
        // Golden thermal plasma deflector arc in front of ship
        ctx.strokeStyle = Math.sin(elapsed * 20) > 0 ? '#fde047' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shipX + 2, shipY, 15, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }
      ctx.fillStyle = Math.sin(elapsed * 30) > 0 ? '#facc15' : '#f97316';
      ctx.fillRect(shipX - 18, shipY - 3, 10, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(shipX - 14, shipY - 2, 5, 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(shipX - 10, shipY - 6, 20, 12);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(shipX + 2, shipY - 4, 6, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(shipX - 8, shipY - 9, 6, 3);
      ctx.fillRect(shipX - 8, shipY + 6, 6, 3);

      if (pct >= 1 && !finished) {
        finished = true;
        soundEngine.playWake();
        onComplete();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [fromPlanet.color, isSunTrip, onComplete, toPlanet.color]);

  const traveledKm = Math.round(travel.distanceKm * progress);

  return (
    <div className="fixed inset-0 z-50 bg-[#050712] flex flex-col justify-between">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pixelated" />

      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between">
        <div>
          <div className={`font-pixel text-xs ${isSunTrip ? 'text-amber-300' : 'text-cyan-300'}`}>
            {isSunTrip
              ? es
                ? 'APROXIMACIÓN SOLAR · ESFERA DE DYSON'
                : 'SOLAR APPROACH · DYSON SPHERE PHASE'
              : es
                ? 'VIAJE INTERPLANETARIO'
                : 'INTERPLANETARY TRANSIT'}
          </div>
          <div className="font-pixel text-base sm:text-xl text-white mt-1">
            {es ? fromPlanet.nameEs : fromPlanet.nameEn} →{' '}
            <span className="text-amber-300">
              {es ? toPlanet.nameEs : toPlanet.nameEn}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onComplete();
          }}
          className="pixel-btn px-3 py-1.5 bg-slate-800 border-2 border-slate-500 text-slate-200 font-pixel text-xs cursor-pointer"
        >
          {es ? 'Saltar' : 'Skip'}
        </button>
      </div>

      <div className="relative z-10 p-4 sm:p-6 max-w-xl mx-auto w-full space-y-2">
        <div className="flex items-center justify-between text-xs font-mono-num text-slate-200">
          <span>{traveledKm.toLocaleString()} km</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div
          className={`w-full h-3 bg-slate-900 border-2 ${
            isSunTrip ? 'border-amber-400' : 'border-cyan-400'
          }`}
        >
          <div
            className={`h-full transition-all duration-75 ${
              isSunTrip ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
