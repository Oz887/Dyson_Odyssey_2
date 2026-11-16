import React, { useEffect } from 'react';
import { Volume2, VolumeX, Globe, Cloud } from 'lucide-react';
import { soundEngine } from '../engine/audio';
import { TEXT } from '../i18n/translations';
import { CharacterId, Language } from '../types/game';

interface StartMenuProps {
  language: Language;
  onToggleLanguage: () => void;
  selectedCharacter: CharacterId;
  onSelectCharacter: (char: CharacterId) => void;
  onPlay: () => void;
  onOpenSavedGames: () => void;
  onOpenGoogleDrive: () => void;
  muted: boolean;
  onToggleMute: () => void;
  saveCount: number;
  modalOpen?: boolean;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  language,
  onToggleLanguage,
  selectedCharacter,
  onSelectCharacter,
  onPlay,
  onOpenSavedGames,
  onOpenGoogleDrive,
  muted,
  onToggleMute,
  saveCount,
  modalOpen = false,
}) => {
  const t = TEXT[language];

  useEffect(() => {
    if (modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'BUTTON')
      ) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundEngine.playClick();
        onPlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, onPlay]);

  return (
    <div className="relative w-full h-full bg-[#070914] text-slate-100 overflow-hidden flex flex-col justify-between p-5 sm:p-8 lg:p-12">
      {/* Subtle 16-bit starfield backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 14% 18%, #e0f2fe 100%, transparent), radial-gradient(1.5px 1.5px at 38% 72%, #c4b5fd 100%, transparent), radial-gradient(2px 2px at 78% 15%, #fde047 100%, transparent), radial-gradient(1.5px 1.5px at 62% 84%, #7dd3fc 100%, transparent), radial-gradient(1.5px 1.5px at 90% 48%, #ffffff 100%, transparent)',
        }}
      />

      {/* Top utility controls (Language & Sound) */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        {/* TOP-LEFT: Bespoke inline SVG + Pixel Title Lockup */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <svg
              width="44"
              height="44"
              viewBox="0 0 16 16"
              className="pixelated shrink-0"
              aria-hidden="true"
            >
              <rect x="4" y="4" width="8" height="8" fill="#f97316" />
              <rect x="5" y="5" width="6" height="6" fill="#facc15" />
              <rect x="6" y="6" width="4" height="4" fill="#fef08a" />
              <rect x="7" y="1" width="2" height="2" fill="#fb923c" />
              <rect x="7" y="13" width="2" height="2" fill="#fb923c" />
              <rect x="1" y="7" width="2" height="2" fill="#fb923c" />
              <rect x="13" y="7" width="2" height="2" fill="#fb923c" />
              <rect x="12" y="2" width="2" height="2" fill="#38bdf8" />
            </svg>
            <h1 className="font-pixel text-3xl sm:text-5xl lg:text-[52px] leading-none tracking-tight text-amber-300 drop-shadow-[0_4px_0_#9a3412]">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-sky-200/85 font-medium tracking-wide">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleLanguage();
            }}
            className="pixel-btn flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-2 border-slate-500 text-slate-100 font-pixel text-xs cursor-pointer"
            aria-label="Toggle Language"
          >
            <Globe className="w-4 h-4 text-sky-300" />
            <span>{language.toUpperCase()}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleMute();
            }}
            className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-slate-100 cursor-pointer"
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT: Left = Play & Saved Games + Character Pick | Middle-Right = Pixel Planet Art */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-10 my-4 min-h-0">
        {/* Left Column: Primary Actions below Title */}
        <div className="lg:col-span-5 flex flex-col gap-5 max-w-md">
          {/* Explorer selector using attached Personajes_83a16f6b.jpeg */}
          <div className="pixel-panel p-3.5">
            <div className="font-pixel text-[11px] text-sky-300 mb-2.5">
              {t.chooseExplorer}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['leo', 'nova'] as CharacterId[]).map((char) => {
                const isSelected = selectedCharacter === char;
                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectCharacter(char);
                    }}
                    className={`pixel-btn flex items-center gap-3 p-2.5 border-2 text-left cursor-pointer ${
                      isSelected
                        ? 'bg-sky-700/90 border-cyan-300 text-white'
                        : 'bg-slate-900/90 border-slate-600 text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-white border-2 border-slate-900">
                      <img
                        src="/assets/aistudio/Personajes_83a16f6b.jpeg"
                        alt={char === 'leo' ? 'Leo Astronaut' : 'Nova Astronaut'}
                        referrerPolicy="no-referrer"
                        className="max-w-none pixelated absolute"
                        style={{
                          width: '600%',
                          height: 'auto',
                          left: char === 'leo' ? '-16%' : '-312%',
                          top: '-212%',
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-pixel text-sm truncate">
                        {char === 'leo' ? t.leoName : t.novaName}
                      </div>
                      <div className="text-[11px] text-sky-200/80 truncate">
                        {isSelected ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Play & Saved Games Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onPlay();
              }}
              className="pixel-btn w-full py-4 px-6 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-lg sm:text-xl tracking-wide cursor-pointer flex items-center justify-center gap-3"
            >
              <span>▶ {t.play}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenSavedGames();
              }}
              className="pixel-btn w-full py-3.5 px-6 bg-amber-500 border-2 border-amber-200 text-slate-950 font-pixel text-sm sm:text-base tracking-wide cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t.savedGames}</span>
              {saveCount > 0 && (
                <span className="font-mono-num text-xs bg-slate-950/25 px-1.5 py-0.5">
                  {saveCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playOpenMenu();
                onOpenGoogleDrive();
              }}
              className="pixel-btn w-full py-3 px-6 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2"
            >
              <Cloud className="w-4 h-4 shrink-0" />
              <span>{language === 'es' ? 'Google Drive' : 'Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Middle-Right: Solar System 16-bit Pixel Art Showcase */}
        <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
          <div className="pixel-panel p-2.5 sm:p-3 w-full max-w-3xl bg-[#090d1e]">
            <div className="relative overflow-hidden border-2 border-indigo-400/50 bg-black">
              <img
                src="/assets/aistudio/Planetas_d50d8869.jpeg"
                alt="Solar Odyssey 16-Bit Solar System Panorama"
                referrerPolicy="no-referrer"
                className="w-full h-44 sm:h-64 lg:h-80 object-cover pixelated"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#070914] to-transparent" />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-300">
              <span className="font-pixel text-[11px] text-amber-300">
                SOL · MERCURIO · TIERRA · MARTE · JÚPITER · NEPTUNO
              </span>
              <span className="text-slate-400">
                16-Bit NASA Survival Simulation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom single-line control hint */}
      <div className="relative z-10 text-center text-xs text-slate-400 font-mono-num truncate">
        {t.controlsHint}
      </div>
    </div>
  );
};
