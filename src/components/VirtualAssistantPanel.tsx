import React, { useState } from 'react';
import { Bot, HelpCircle, PawPrint, Sparkles, X } from 'lucide-react';
import {
  ASSISTANT_TOPICS,
  AssistantTopicInfo,
  MISSION_CATALOG,
  PET_META,
} from '../data/phase4Content';
import { soundEngine } from '../engine/audio';
import {
  AssistantMood,
  AssistantTopicId,
  GameSnapshot,
  Language,
  PetId,
} from '../types/game';

interface VirtualAssistantPanelProps {
  open: boolean;
  mood: AssistantMood;
  lockedNotice: string | null;
  snapshot: GameSnapshot;
  language: Language;
  onSelectPet: (pet: PetId) => void;
  onClearLockedNotice: () => void;
  onClose: () => void;
}

export const VirtualAssistantPanel: React.FC<VirtualAssistantPanelProps> = ({
  open,
  mood,
  lockedNotice,
  snapshot,
  language,
  onSelectPet,
  onClearLockedNotice,
  onClose,
}) => {
  const es = language === 'es';
  const [selectedTopicId, setSelectedTopicId] = useState<AssistantTopicId | null>(null);

  if (!open) return null;

  const activeTopic: AssistantTopicInfo | null = selectedTopicId
    ? ASSISTANT_TOPICS.find((t) => t.id === selectedTopicId) ?? null
    : null;

  const missionInfo = snapshot.activeMission
    ? MISSION_CATALOG[snapshot.activeMission.type]
    : null;

  const effectiveMood: AssistantMood = missionInfo
    ? 'worried'
    : lockedNotice
      ? 'curious'
      : selectedTopicId
        ? 'cheerful'
        : mood;

  return (
    <aside
      className="fixed top-3 left-3 z-40 w-[calc(100vw-24px)] max-w-md max-h-[86vh] flex flex-col bg-[#0b1022]/96 border-2 border-cyan-400 text-slate-100 shadow-2xl animate-[fadeIn_160ms_ease-out]"
      aria-label={es ? 'Asistente Virtual' : 'Virtual Assistant'}
    >
      {/* Header with animated pixel assistant avatar & mood */}
      <div className="flex items-center justify-between gap-2 p-3 border-b-2 border-slate-700 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <PixelAssistantPortrait mood={effectiveMood} />
          <div>
            <div className="font-pixel text-xs text-cyan-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>{es ? 'ORBITA · ASISTENTE IA' : 'ORBITA · ASSISTANT'}</span>
            </div>
            <div className="text-[10px] font-pixel text-slate-400">
              {effectiveMood === 'worried'
                ? es
                  ? 'Estado: Preocupada (Alerta Activa)'
                  : 'Mood: Worried (Mission Alert)'
                : effectiveMood === 'curious'
                  ? es
                    ? 'Estado: Curiosa'
                    : 'Mood: Curious'
                  : es
                    ? 'Estado: Alegre y Lista'
                    : 'Mood: Cheerful'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playCloseMenu();
            onClearLockedNotice();
            onClose();
          }}
          className="pixel-btn p-1.5 bg-slate-800 border-2 border-slate-500 text-slate-200 cursor-pointer"
          aria-label={es ? 'Cerrar' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="p-3 overflow-y-auto space-y-3 flex-1">
        {/* Worried Mission Alert */}
        {missionInfo && snapshot.activeMission && (
          <div className="p-2.5 bg-rose-950/80 border-2 border-rose-400 space-y-1.5">
            <div className="flex items-center justify-between font-pixel text-[11px] text-rose-200">
              <span>{es ? missionInfo.titleEs : missionInfo.titleEn}</span>
              <span className="font-mono-num text-amber-300">
                {Math.ceil(snapshot.activeMission.timeRemaining)}s
              </span>
            </div>
            <p className="text-xs text-rose-100 leading-snug">
              {es ? missionInfo.alertEs : missionInfo.alertEn}
            </p>
            <div className="text-[11px] font-pixel text-amber-300">
              {es ? missionInfo.fixHintEs : missionInfo.fixHintEn}
            </div>
          </div>
        )}

        {/* Funny Locked Access Quip */}
        {lockedNotice && (
          <div className="p-2.5 bg-amber-950/80 border-2 border-amber-400 space-y-2">
            <div className="text-xs text-amber-100 leading-snug">{lockedNotice}</div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClearLockedNotice();
              }}
              className="pixel-btn px-2.5 py-1 bg-amber-400 border border-amber-100 text-slate-950 font-pixel text-[10px] cursor-pointer"
            >
              {es ? 'Entendido' : 'Got it!'}
            </button>
          </div>
        )}

        {/* Unlocked Space Pets Quick Switcher */}
        {snapshot.unlockedPets.length > 0 && !activeTopic && (
          <div className="p-2 bg-slate-900 border border-emerald-500/60 space-y-1.5">
            <div className="font-pixel text-[10px] text-emerald-300 flex items-center gap-1">
              <PawPrint className="w-3.5 h-3.5" />
              <span>{es ? 'Mascota Espacial Especial' : 'Special Space Pet'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {snapshot.unlockedPets.map((pid) => {
                const pm = PET_META[pid];
                const active = snapshot.activePet === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectPet(pid);
                    }}
                    className={`px-2 py-1 border font-pixel text-[10px] cursor-pointer ${
                      active
                        ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                        : 'bg-slate-950 border-slate-700 text-slate-300'
                    }`}
                  >
                    {es ? pm.nameEs : pm.nameEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flow Step 1 vs Step 2 (§2.1) */}
        {!activeTopic ? (
          <div className="space-y-2.5">
            <div className="p-2.5 bg-slate-900 border border-cyan-500/50 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="font-pixel text-xs text-cyan-200">
                {es ? '¿Qué quieres saber?' : 'What do you want to know?'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {ASSISTANT_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTopicId(topic.id);
                  }}
                  className="pixel-btn p-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-600 hover:border-cyan-400 text-slate-100 cursor-pointer flex items-center gap-1.5"
                >
                  <span
                    className="w-2.5 h-2.5 shrink-0 border border-slate-950"
                    style={{ backgroundColor: topic.accent }}
                  />
                  <span className="font-pixel text-[10px] leading-tight">
                    {es ? topic.titleEs : topic.titleEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tutorial Dashboard Image Card */}
            <div className="p-3 bg-slate-900 border-2 border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-pixel text-xs" style={{ color: activeTopic.accent }}>
                  {es ? activeTopic.titleEs : activeTopic.titleEn}
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </div>

              {/* Tutorial Visual Diagram Image */}
              <TutorialDiagram id={activeTopic.diagramType} language={language} />

              <p className="text-xs text-slate-200 leading-relaxed">
                {es ? activeTopic.summaryEs : activeTopic.summaryEn}
              </p>

              <ul className="space-y-1 text-[11px] text-slate-300 list-disc pl-4">
                {(es ? activeTopic.stepsEs : activeTopic.stepsEn).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            {/* Flow Step 2: "Do you need anything else?" -> Yes / No */}
            <div className="p-3 bg-slate-900 border-2 border-cyan-500/70 space-y-2">
              <div className="font-pixel text-xs text-cyan-200">
                {es ? '¿Necesitas algo más?' : 'Do you need anything else?'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTopicId(null);
                  }}
                  className="pixel-btn py-2 px-3 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-xs cursor-pointer"
                >
                  {es ? 'Sí' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCloseMenu();
                    setSelectedTopicId(null);
                    onClearLockedNotice();
                    onClose();
                  }}
                  className="pixel-btn py-2 px-3 bg-slate-800 border-2 border-slate-500 text-slate-100 font-pixel text-xs cursor-pointer"
                >
                  {es ? 'No' : 'No'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const PixelAssistantPortrait: React.FC<{ mood: AssistantMood }> = ({ mood }) => {
  const screenBg = mood === 'worried' ? '#7f1d1d' : mood === 'curious' ? '#312e81' : '#064e3b';
  const eyeColor = mood === 'worried' ? '#fca5a5' : mood === 'curious' ? '#fde047' : '#67e8f9';
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 18 18"
      className="shrink-0 pixelated border-2 border-cyan-300 bg-slate-950"
      aria-hidden="true"
    >
      <rect x="8" y="1" width="2" height="2" fill="#facc15" />
      <rect x="4" y="3" width="10" height="12" fill="#94a3b8" />
      <rect x="5" y="4" width="8" height="10" fill={screenBg} />
      {/* Eyes by Mood */}
      {mood === 'worried' ? (
        <>
          <rect x="6" y="6" width="2" height="2" fill={eyeColor} />
          <rect x="10" y="6" width="2" height="2" fill={eyeColor} />
          <rect x="7" y="10" width="4" height="1" fill="#fca5a5" />
          <rect x="6" y="11" width="1" height="1" fill="#fca5a5" />
          <rect x="11" y="11" width="1" height="1" fill="#fca5a5" />
        </>
      ) : mood === 'curious' ? (
        <>
          <rect x="6" y="6" width="2" height="3" fill={eyeColor} />
          <rect x="10" y="7" width="2" height="2" fill={eyeColor} />
          <rect x="8" y="11" width="2" height="1" fill={eyeColor} />
        </>
      ) : (
        <>
          <rect x="6" y="7" width="2" height="2" fill={eyeColor} />
          <rect x="10" y="7" width="2" height="2" fill={eyeColor} />
          <rect x="6" y="10" width="1" height="1" fill={eyeColor} />
          <rect x="7" y="11" width="4" height="1" fill={eyeColor} />
          <rect x="11" y="10" width="1" height="1" fill={eyeColor} />
        </>
      )}
    </svg>
  );
};

const TutorialDiagram: React.FC<{ id: AssistantTopicId; language: Language }> = ({
  id,
  language,
}) => {
  const es = language === 'es';
  return (
    <div className="p-2 bg-[#060915] border border-slate-700 flex items-center justify-center">
      <svg viewBox="0 0 240 72" className="w-full h-20 pixelated" aria-hidden="true">
        <rect width="240" height="72" fill="#060915" />
        {id === 'agriculture' && (
          <>
            <rect x="16" y="42" width="48" height="16" fill="#451a03" />
            <rect x="36" y="34" width="6" height="8" fill="#4ade80" />
            <text x="40" y="67" fill="#94a3b8" fontSize="8" textAnchor="middle">1. PREMATURE</text>
            <rect x="96" y="42" width="48" height="16" fill="#451a03" />
            <rect x="112" y="24" width="14" height="18" fill="#16a34a" />
            <text x="120" y="67" fill="#94a3b8" fontSize="8" textAnchor="middle">2. HALF</text>
            <rect x="176" y="42" width="48" height="16" fill="#451a03" />
            <rect x="190" y="18" width="18" height="24" fill="#22c55e" />
            <circle cx="200" cy="24" r="5" fill="#ef4444" />
            <text x="200" y="67" fill="#4ade80" fontSize="8" textAnchor="middle">3. READY!</text>
          </>
        )}
        {id === 'oxygen' && (
          <>
            <rect x="18" y="18" width="62" height="32" fill="#0c4a6e" stroke="#38bdf8" />
            <text x="49" y="37" fill="#e0f2fe" fontSize="9" textAnchor="middle">-10% → -5%</text>
            <text x="95" y="37" fill="#94a3b8" fontSize="12">+</text>
            <rect x="110" y="18" width="54" height="32" fill="#164e63" stroke="#22d3ee" />
            <text x="137" y="37" fill="#a5f3fc" fontSize="9" textAnchor="middle">TANK -1..-4%</text>
            <text x="176" y="37" fill="#94a3b8" fontSize="12">=</text>
            <rect x="188" y="18" width="38" height="32" fill="#064e3b" stroke="#34d399" />
            <text x="207" y="37" fill="#6ee7b7" fontSize="9" textAnchor="middle">MIN 1%</text>
          </>
        )}
        {id === 'suit' && (
          <>
            <rect x="16" y="16" width="90" height="38" fill="#1e293b" stroke="#38bdf8" />
            <text x="61" y="33" fill="#7dd3fc" fontSize="9" textAnchor="middle">NO SUIT LIMIT</text>
            <text x="61" y="46" fill="#f8fafc" fontSize="10" textAnchor="middle">-10°C .. +50°C</text>
            <rect x="128" y="16" width="96" height="38" fill="#064e3b" stroke="#34d399" />
            <text x="176" y="33" fill="#6ee7b7" fontSize="9" textAnchor="middle">SUIT ON (E)</text>
            <text x="176" y="46" fill="#fef08a" fontSize="9" textAnchor="middle">SEALED PRESS.</text>
          </>
        )}
        {id === 'gases' && (
          <>
            <circle cx="38" cy="30" r="14" fill="#38bdf8" />
            <text x="38" y="34" fill="#082f49" fontSize="10" textAnchor="middle">O2</text>
            <text x="64" y="34" fill="#fff" fontSize="12">+</text>
            <circle cx="90" cy="30" r="14" fill="#c084fc" />
            <text x="90" y="34" fill="#3b0764" fontSize="10" textAnchor="middle">H2</text>
            <text x="122" y="34" fill="#facc15" fontSize="12">→</text>
            <rect x="142" y="16" width="80" height="32" fill="#9a3412" stroke="#fb923c" />
            <text x="182" y="35" fill="#fef3c7" fontSize="9" textAnchor="middle">+25% FUEL</text>
          </>
        )}
        {id === 'jupiter_ship' && (
          <>
            <circle cx="34" cy="36" r="24" fill="#f97316" />
            <line x1="66" y1="36" x2="108" y2="36" stroke="#ef4444" strokeWidth="2" />
            <rect x="130" y="28" width="26" height="14" fill="#f1f5f9" />
            <rect x="150" y="31" width="8" height="8" fill="#38bdf8" />
            <text x="145" y="60" fill="#34d399" fontSize="8" textAnchor="middle">
              {es ? 'ESCAPA AL 100% →' : 'ESCAPE 100% →'}
            </text>
          </>
        )}
        {id === 'sun_dyson' && (
          <>
            <circle cx="52" cy="36" r="24" fill="#f59e0b" />
            <circle cx="52" cy="36" r="16" fill="#fef08a" />
            <circle cx="52" cy="36" r="32" fill="none" stroke="#38bdf8" strokeDasharray="4 3" />
            <path d="M 88 22 Q 112 36 88 50" fill="none" stroke="#fb923c" strokeWidth="3" />
            <rect x="136" y="18" width="88" height="36" fill="#1e293b" stroke="#fbbf24" />
            <text x="180" y="34" fill="#fde047" fontSize="10" textAnchor="middle">50 PANELS</text>
            <text x="180" y="46" fill="#fb923c" fontSize="8" textAnchor="middle">FLARE = 4s</text>
          </>
        )}
        {!['agriculture', 'oxygen', 'suit', 'gases', 'jupiter_ship', 'sun_dyson'].includes(id) && (
          <>
            <rect x="20" y="14" width="200" height="44" fill="#0f172a" stroke="#38bdf8" />
            <rect x="30" y="24" width="24" height="24" fill="#0284c7" />
            <text x="135" y="34" fill="#f8fafc" fontSize="10" textAnchor="middle">
              SOLAR ODYSSEY MANUAL
            </text>
            <text x="135" y="48" fill="#38bdf8" fontSize="8" textAnchor="middle">
              {es ? 'SISTEMA ACTIVO' : 'SYSTEM GUIDE'}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
