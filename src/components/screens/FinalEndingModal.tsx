import React, { useEffect, useRef } from 'react';
import { Award, RotateCcw, Sparkles } from 'lucide-react';
import { PET_META } from '../../data/phase4Content';
import { SHIP_TIERS } from '../../data/phase2Catalog';
import { soundEngine } from '../../engine/audio';
import { GameSnapshot, Language } from '../../types/game';

interface FinalEndingModalProps {
  snapshot: GameSnapshot;
  language: Language;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

/**
 * §4.3 Final Animation:
 * Triggers when all 50 Dyson Sphere panels are placed around the Sun without losing.
 */
export const FinalEndingModal: React.FC<FinalEndingModalProps> = ({
  snapshot,
  language,
  onPlayAgain,
  onReturnTitle,
}) => {
  const es = language === 'es';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(320, Math.floor(canvas.clientWidth * dpr));
      const ch = Math.max(200, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const W = 480;
      const H = 220;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#040611';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.scale(cw / W, ch / H);

      // Stars
      for (let i = 0; i < 85; i++) {
        ctx.fillStyle = i % 4 === 0 ? '#7dd3fc' : '#f8fafc';
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
        ctx.fillRect((i * 89) % W, (i * 47) % H, i % 7 === 0 ? 2 : 1, 1);
      }
      ctx.globalAlpha = 1;

      const sunX = 180;
      const sunY = H / 2;

      // Golden Dyson Sphere Energy Beams radiating across Solar System
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(395, 110);
      ctx.stroke();

      // Sun Core
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 40 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Completed 50-Panel Dyson Sphere Swarm Ring
      for (let p = 0; p < 50; p++) {
        const ring = p < 25 ? 66 : 78;
        const idx = p % 25;
        const speed = p < 25 ? 0.35 : -0.25;
        const ang = (idx / 25) * Math.PI * 2 + t * speed;
        const px = sunX + Math.cos(ang) * ring;
        const py = sunY + Math.sin(ang) * (ring * 0.72);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.round(px - 3), Math.round(py - 3), 6, 6);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(px - 3), Math.round(py - 3), 6, 6);
      }

      // Earth receiving clean Dyson Power
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(395, 110, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(387, 102, 10, 8);
      ctx.fillRect(398, 112, 8, 7);

      // Celebrating Odyssey-1 orbiting above beam
      const sy = 56 + Math.sin(t * 2.5) * 4;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(285, Math.round(sy), 22, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(299, Math.round(sy + 2), 6, 6);

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const petInfo = snapshot.activePet ? PET_META[snapshot.activePet] : null;
  const shipLabel = es ? SHIP_TIERS[snapshot.shipTier].es : SHIP_TIERS[snapshot.shipTier].en;

  return (
    <div className="fixed inset-0 z-50 bg-[#040611] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center gap-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 font-pixel text-xs text-amber-300">
            <Award className="w-4 h-4" />
            <span>
              {es
                ? 'ESFERA DE DYSON COMPLETADA · FINAL DE SOLAR ODYSSEY'
                : 'DYSON SPHERE COMPLETED · SOLAR ODYSSEY FINALE'}
            </span>
          </div>
          <h1 className="font-pixel text-xl sm:text-3xl text-yellow-300">
            {es ? '¡MISIÓN CUMPLIDA, EXPLORADOR!' : 'MISSION ACCOMPLISHED, EXPLORER!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            {es
              ? 'Los 50 paneles solares rodean el Sol enviando energía limpia infinita a toda la humanidad.'
              : 'All 50 Dyson Sphere panels lock into orbit around the Sun, beaming limitless clean stellar energy across the Solar System.'}
          </p>
        </div>

        <div className="w-full h-56 sm:h-72 border-2 border-amber-400 bg-[#040611]">
          <canvas ref={canvasRef} className="w-full h-full block pixelated" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-2.5 bg-slate-900 border border-slate-700">
            <div className="text-[10px] text-slate-400">
              {es ? 'Distancia Recorrida' : 'Odometer'}
            </div>
            <div className="font-mono-num text-xs font-bold text-cyan-300 mt-0.5">
              {snapshot.odometerKm.toLocaleString()} km
            </div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-700">
            <div className="text-[10px] text-slate-400">{es ? 'Días' : 'Days'}</div>
            <div className="font-mono-num text-xs font-bold text-amber-300 mt-0.5">
              {snapshot.day}
            </div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-700">
            <div className="text-[10px] text-slate-400">{es ? 'Clase de Nave' : 'Ship Class'}</div>
            <div className="font-pixel text-[11px] text-emerald-300 mt-0.5">{shipLabel}</div>
          </div>
          <div className="p-2.5 bg-slate-900 border border-slate-700">
            <div className="text-[10px] text-slate-400">{es ? 'Misiones / Mascota' : 'Missions / Pet'}</div>
            <div className="font-pixel text-[11px] text-fuchsia-300 mt-0.5">
              {snapshot.missionsCompletedCount} {petInfo ? `· ${es ? petInfo.nameEs : petInfo.nameEn}` : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onPlayAgain();
            }}
            className="pixel-btn px-5 py-2.5 bg-amber-400 border-2 border-amber-100 text-slate-950 font-pixel text-xs cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{es ? 'Jugar de Nuevo' : 'Play Again'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playCloseMenu();
              onReturnTitle();
            }}
            className="pixel-btn px-5 py-2.5 bg-slate-800 border-2 border-slate-500 text-slate-100 font-pixel text-xs cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{es ? 'Menú Principal' : 'Title Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
