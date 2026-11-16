import React from 'react';
import { Cloud, RotateCcw, Save, Play, Home, Gamepad2 } from 'lucide-react';
import { soundEngine } from '../../engine/audio';
import { TEXT } from '../../i18n/translations';
import { GameSnapshot, Language } from '../../types/game';

interface PauseModalProps {
  language: Language;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onToggleLanguage: () => void;
  onResume: () => void;
  onSave: () => void;
  onOpenDrive: () => void;
  onReturnTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  showTouchControls,
  onToggleTouchControls,
  onToggleLanguage,
  onResume,
  onSave,
  onOpenDrive,
  onReturnTitle,
}) => {
  const t = TEXT[language];
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md p-5 text-slate-100 space-y-4">
        <h2 className="font-pixel text-lg text-amber-300 text-center pb-2 border-b-2 border-slate-700">
          {t.pauseTitle}
        </h2>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playCloseMenu();
              onResume();
            }}
            className="pixel-btn w-full py-3 px-4 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>{t.resumePlay}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onSave();
            }}
            className="pixel-btn w-full py-3 px-4 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveGame}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playOpenMenu();
              onOpenDrive();
            }}
            className="pixel-btn w-full py-3 px-4 bg-indigo-500 border-2 border-indigo-200 text-white font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Cloud className="w-4 h-4" />
            <span>
              {language === 'es' ? 'Google Drive · Nube' : 'Google Drive · Cloud'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onToggleTouchControls();
              }}
              className="pixel-btn py-2.5 px-3 bg-slate-800 border-2 border-slate-500 text-slate-100 font-pixel text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-300" />
              <span>
                {t.touchPadToggle}: {showTouchControls ? t.on : t.off}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onToggleLanguage();
              }}
              className="pixel-btn py-2.5 px-3 bg-slate-800 border-2 border-slate-500 text-slate-100 font-pixel text-[11px] cursor-pointer"
            >
              Lang: {language.toUpperCase()}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onReturnTitle();
            }}
            className="pixel-btn w-full py-3 px-4 bg-rose-600 border-2 border-rose-300 text-white font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.returnTitle}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          {t.controlsHint}
        </p>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  snapshot: GameSnapshot;
  language: Language;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  snapshot,
  language,
  onPlayAgain,
  onReturnTitle,
}) => {
  const t = TEXT[language];
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md p-6 text-slate-100 space-y-4 text-center">
        <h2 className="font-pixel text-2xl text-rose-400">{t.gameOver}</h2>
        <p className="text-sm text-slate-300">
          {snapshot.deathReason ?? 'Life support critical.'}
        </p>
        <div className="py-2 px-3 bg-slate-900 border-2 border-slate-700 font-mono-num text-xs text-slate-300 flex justify-around">
          <span>
            {t.day} {snapshot.day}
          </span>
          <span>O2: {Math.round(snapshot.stats.oxygen)}%</span>
          <span>Temp: {Math.round(snapshot.stats.temperature)}°C</span>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onPlayAgain();
            }}
            className="pixel-btn w-full py-3 px-5 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.playAgain}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onReturnTitle();
            }}
            className="pixel-btn w-full py-2.5 px-4 bg-slate-800 border-2 border-slate-500 text-slate-200 font-pixel text-xs cursor-pointer"
          >
            {t.returnTitle}
          </button>
        </div>
      </div>
    </div>
  );
};
