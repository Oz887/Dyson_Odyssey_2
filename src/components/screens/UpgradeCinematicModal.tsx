import React, { useEffect } from 'react';
import { Rocket, Sparkles, Wrench } from 'lucide-react';
import { soundEngine } from '../../engine/audio';
import { CinematicEvent, Language } from '../../types/game';

interface UpgradeCinematicModalProps {
  cinematic: CinematicEvent;
  language: Language;
  onFinish: () => void;
}

export const UpgradeCinematicModal: React.FC<UpgradeCinematicModalProps> = ({
  cinematic,
  language,
  onFinish,
}) => {
  const es = language === 'es';

  useEffect(() => {
    soundEngine.playWake();
  }, [cinematic.id]);

  return (
    <div className="fixed inset-0 z-50 bg-[#040610]/95 flex items-center justify-center p-4">
      <div
        className="pixel-panel w-full max-w-lg p-6 text-center space-y-5"
        style={{ borderColor: cinematic.accentColor }}
      >
        <div className="font-pixel text-[11px] tracking-widest text-amber-300 uppercase">
          {cinematic.kind === 'ship'
            ? es
              ? 'CINEMÁTICA DE MEJORA DE NAVE'
              : 'SHIP UPGRADE CINEMATIC'
            : es
              ? 'CINEMÁTICA DE MEJORA DE HERRAMIENTA'
              : 'TOOL UPGRADE CINEMATIC'}
        </div>

        {/* 16-bit Pixel Blueprint Animation Stage */}
        <div className="relative h-36 bg-[#070b1a] border-2 border-slate-700 flex items-center justify-center overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, ${cinematic.accentColor}22 6px, ${cinematic.accentColor}22 7px)`,
            }}
          />
          <div className="relative flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 border-2 flex items-center justify-center bg-slate-900"
              style={{ borderColor: cinematic.accentColor }}
            >
              {cinematic.kind === 'ship' ? (
                <Rocket className="w-9 h-9" style={{ color: cinematic.accentColor }} />
              ) : (
                <Wrench className="w-9 h-9" style={{ color: cinematic.accentColor }} />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 font-pixel text-xs">
              <Sparkles className="w-4 h-4" />
              <span>{es ? cinematic.subtitleEs : cinematic.subtitleEn}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2
            className="font-pixel text-xl"
            style={{ color: cinematic.accentColor }}
          >
            {es ? cinematic.titleEs : cinematic.titleEn}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {es ? cinematic.detailEs : cinematic.detailEn}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onFinish();
          }}
          className="pixel-btn w-full py-3 px-6 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-sm cursor-pointer"
        >
          {es ? 'Continuar Misión' : 'Continue Mission'}
        </button>
      </div>
    </div>
  );
};
