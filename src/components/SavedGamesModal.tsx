import React from 'react';
import { Cloud, Trash2, Play, X } from 'lucide-react';
import { soundEngine } from '../engine/audio';
import { TEXT } from '../i18n/translations';
import { Language, SaveSlot } from '../types/game';

interface SavedGamesModalProps {
  language: Language;
  saves: SaveSlot[];
  onLoad: (slot: SaveSlot) => void;
  onDelete: (slotId: string) => void;
  onOpenDrive?: () => void;
  onClose: () => void;
}

export const SavedGamesModal: React.FC<SavedGamesModalProps> = ({
  language,
  saves,
  onLoad,
  onDelete,
  onOpenDrive,
  onClose,
}) => {
  const t = TEXT[language];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-xl p-5 text-slate-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-slate-700">
          <h2 className="font-pixel text-lg text-amber-300">{t.savedGames}</h2>
          <div className="flex items-center gap-2">
            {onOpenDrive && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playOpenMenu();
                  onOpenDrive();
                }}
                className="pixel-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-500 border-2 border-sky-200 text-slate-950 font-pixel text-[11px] cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playCloseMenu();
                onClose();
              }}
              className="pixel-btn p-2 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
              aria-label={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {saves.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              {t.noSaves}
            </div>
          ) : (
            saves.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 border-2 border-slate-700"
              >
                <div className="min-w-0">
                  <div className="font-pixel text-sm text-white truncate">
                    {slot.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono-num">
                    <span>
                      {t.day} {slot.day}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>HP {Math.round(slot.stats.health)}%</span>
                    <span aria-hidden="true">·</span>
                    <span>O2 {Math.round(slot.stats.oxygen)}%</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(slot.savedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onLoad(slot);
                    }}
                    className="pixel-btn flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{t.resume}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onDelete(slot.id);
                    }}
                    className="pixel-btn p-2 bg-rose-600 border-2 border-rose-300 text-white cursor-pointer"
                    aria-label={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
