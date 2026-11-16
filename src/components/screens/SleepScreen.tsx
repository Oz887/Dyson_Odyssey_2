import React, { useEffect, useState } from 'react';
import { BedDouble, Moon, Sun, X } from 'lucide-react';
import { soundEngine } from '../../engine/audio';
import { clamp, stepSurvival } from '../../engine/survival';
import { TEXT } from '../../i18n/translations';
import { GameSnapshot, Language } from '../../types/game';

interface SleepScreenProps {
  snapshot: GameSnapshot;
  language: Language;
  onCompleteSleep: (updated: GameSnapshot) => void;
  onClose: () => void;
}

export const SleepScreen: React.FC<SleepScreenProps> = ({
  snapshot,
  language,
  onCompleteSleep,
  onClose,
}) => {
  const t = TEXT[language];
  const [phase, setPhase] = useState<'choose' | 'sleeping' | 'waking'>('choose');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'sleeping') return;
    const interval = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 110);
    return () => window.clearInterval(interval);
  }, [phase]);

  const startSleep = (hours: 2 | 6) => {
    soundEngine.playSleep();
    setPhase('sleeping');
    setProgress(0);

    // Simulate survival ticks across rest period (condensed educational time)
    const simSeconds = hours === 2 ? 18 : 42;
    let current = { ...snapshot };
    const steps = 12;
    const stepDt = simSeconds / steps;
    for (let i = 0; i < steps; i++) {
      const res = stepSurvival(current, {
        dt: stepDt,
        isMoving: false,
        isRunning: false,
        isMiningOrTraining: false,
        ambientTempC: current.planetPreset.baseTempC,
        currentZone: current.insideShip ? 'ship' : 'surface',
      });
      current = res.snapshot;
    }

    // Sleeping quickly restores Fatigue and reduces Illness duration
    current = {
      ...current,
      stats: {
        ...current.stats,
        fatigue: clamp(current.stats.fatigue + (hours === 2 ? 55 : 100), 0, 100),
      },
      illnessTimer: Math.max(0, current.illnessTimer - (hours === 2 ? 12 : 30)),
    };

    window.setTimeout(() => {
      soundEngine.playWake();
      setPhase('waking');
      window.setTimeout(() => {
        onCompleteSleep(current);
      }, 650);
    }, 1250);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-lg p-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700">
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-indigo-400" />
            <h2 className="font-pixel text-base sm:text-lg text-indigo-300">{t.sleepTitle}</h2>
          </div>
          {phase === 'choose' && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playCloseMenu();
                onClose();
              }}
              className="pixel-btn p-1.5 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
              aria-label={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {/* 16-bit Pixel Sleep Bunk Scene */}
          <div className="relative h-28 bg-[#0b1124] border-2 border-indigo-500/50 flex items-center justify-center overflow-hidden">
            {phase === 'sleeping' ? (
              <div className="flex flex-col items-center gap-2">
                <Moon className="w-7 h-7 text-indigo-300" />
                <div className="font-pixel text-xs text-indigo-200">{t.wakingUp}</div>
                <div className="w-48 h-2.5 bg-slate-900 border border-indigo-400">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : phase === 'waking' ? (
              <div className="flex flex-col items-center gap-2">
                <Sun className="w-7 h-7 text-amber-300" />
                <div className="font-pixel text-xs text-amber-200">{t.wakeDone}</div>
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="font-pixel text-xs text-slate-300 mb-1">
                  {t.fatigue}: {Math.round(snapshot.stats.fatigue)}%
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{t.sleepDesc}</p>
              </div>
            )}
          </div>

          {phase === 'choose' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startSleep(2)}
                className="pixel-btn py-3 px-4 bg-indigo-500 border-2 border-indigo-200 text-white font-pixel text-xs cursor-pointer"
              >
                {t.shortNap}
              </button>
              <button
                type="button"
                onClick={() => startSleep(6)}
                className="pixel-btn py-3 px-4 bg-violet-600 border-2 border-violet-200 text-white font-pixel text-xs cursor-pointer"
              >
                {t.deepRest}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
