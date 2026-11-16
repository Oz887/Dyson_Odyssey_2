import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfettiBurst } from './components/ConfettiBurst';
import { GameCanvas } from './components/GameCanvas';
import { SavedGamesModal } from './components/SavedGamesModal';
import { FinalEndingModal } from './components/screens/FinalEndingModal';
import { InventoryModal } from './components/screens/InventoryModal';
import { OptionScreensModal } from './components/screens/OptionScreensModal';
import { GameOverModal, PauseModal } from './components/screens/PauseAndGameOver';
import { GoogleDriveModal } from './components/screens/GoogleDriveModal';
import { PlanetMapModal } from './components/screens/PlanetMapModal';
import { SleepScreen } from './components/screens/SleepScreen';
import { ToolsAndShipModal } from './components/screens/ToolsAndShipModal';
import { TravelCinematicModal } from './components/screens/TravelCinematicModal';
import { UpgradeCinematicModal } from './components/screens/UpgradeCinematicModal';
import { SpecialScenarioCanvas } from './components/SpecialScenarioCanvas';
import { StartMenu } from './components/StartMenu';
import { SurvivalHud } from './components/SurvivalHud';
import { VirtualAssistantPanel } from './components/VirtualAssistantPanel';
import { PLANET_CATALOG } from './data/phase3Planets';
import { getFunnyLockedMessage, MISSION_CATALOG, PET_META } from './data/phase4Content';
import { soundEngine } from './engine/audio';
import { InputManager } from './engine/input';
import {
  createInitialGasVents,
  createInitialMineralNodes,
  createInitialSnapshot,
  deleteSavedGame,
  listSavedGames,
  saveGameSnapshot,
} from './engine/saveSystem';
import { resolveActiveMission, spawnRandomMission } from './engine/survival';
import { TEXT } from './i18n/translations';
import {
  AssistantMood,
  CharacterId,
  CinematicEvent,
  GameSnapshot,
  Language,
  PetId,
  PlanetId,
  SaveSlot,
  ScreenId,
  ToolType,
  TravelCinematicState,
} from './types/game';

function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 1024
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('leo');
  const [screen, setScreen] = useState<ScreenId>('start');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSavedGames());
  const [muted, setMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() =>
    detectTouchDevice()
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeCinematic, setActiveCinematic] = useState<CinematicEvent | null>(null);
  const [activeTravel, setActiveTravel] = useState<TravelCinematicState | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMood, setAssistantMood] = useState<AssistantMood>('cheerful');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [showFinalEnding, setShowFinalEnding] = useState(false);

  const inputManager = useMemo(() => new InputManager(), []);
  const snapshotRef = useRef<GameSnapshot>(createInitialSnapshot('leo'));
  const positionRef = useRef<{ x: number; y: number }>({ x: 180, y: 128 });
  const [hudSnapshot, setHudSnapshot] = useState<GameSnapshot>(snapshotRef.current);

  const externalActionRef = useRef<
    ((type: 'eat' | 'drink' | 'train' | 'suit' | 'airlock' | 'attack' | 'interact') => void) | null
  >(null);

  useEffect(() => {
    inputManager.attach();
    const onResize = () => {
      if (window.matchMedia('(pointer: coarse)').matches) {
        setShowTouchControls(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      inputManager.detach();
      window.removeEventListener('resize', onResize);
    };
  }, [inputManager]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleStartNewGame = useCallback(() => {
    const fresh = createInitialSnapshot(selectedCharacter);
    snapshotRef.current = fresh;
    positionRef.current = { x: 180, y: 128 };
    setHudSnapshot(fresh);
    setActiveTravel(null);
    setShowFinalEnding(false);
    setAssistantOpen(false);
    setLockedNotice(null);
    setConfettiActive(false);
    inputManager.clearAll();
    setScreen('playing');
  }, [inputManager, selectedCharacter]);

  const handleLoadSave = useCallback(
    (slot: SaveSlot) => {
      const base = createInitialSnapshot(slot.character);
      const planet = PLANET_CATALOG[slot.planetId] ?? PLANET_CATALOG.earth;
      const loaded: GameSnapshot = {
        ...base,
        character: slot.character,
        stats: { ...slot.stats },
        suitEquipped: slot.suitEquipped,
        insideShip: slot.insideShip,
        currentZone: planet.cannotLand ? 'space_scenario' : slot.insideShip ? 'ship' : 'surface',
        energyState: { ...slot.energyState },
        hooks: { ...base.hooks, ...slot.hooks },
        inventory: slot.inventory ?? base.inventory,
        storage: slot.storage ?? base.storage,
        tools: slot.tools ?? base.tools,
        upgradeTree: slot.upgradeTree ?? base.upgradeTree,
        shipTier: slot.shipTier ?? base.shipTier,
        agriculture: slot.agriculture ?? base.agriculture,
        planetPreset: planet,
        visitedPlanets: slot.visitedPlanets ?? [planet.id],
        odometerKm: slot.odometerKm ?? 0,
        completedHardEnergyMission: slot.completedHardEnergyMission ?? false,
        missionsCompletedCount: slot.missionsCompletedCount ?? 0,
        unlockedPets: slot.unlockedPets ?? [],
        activePet: slot.activePet ?? null,
        dysonSphereCompleted: slot.dysonSphereCompleted ?? false,
        specialScenario: planet.cannotLand
          ? {
              active: true,
              planetId: planet.id as 'jupiter' | 'saturn' | 'sun',
              escapeProgress: 0,
              sunPanelsPlaced: 0,
              elapsedSeconds: 0,
            }
          : null,
        illnessTimer: slot.illnessTimer,
        motivationTimer: slot.motivationTimer,
        day: slot.day,
        missionClockSeconds: slot.missionClockSeconds,
      };
      snapshotRef.current = loaded;
      positionRef.current = { ...slot.position };
      setSelectedCharacter(slot.character);
      setHudSnapshot(loaded);
      setShowSavedModal(false);
      setShowFinalEnding(false);
      setAssistantOpen(false);
      inputManager.clearAll();
      setScreen('playing');
    },
    [inputManager]
  );

  const handleDeleteSave = useCallback((slotId: string) => {
    setSaves(deleteSavedGame(slotId));
  }, []);

  const handleSaveCurrent = useCallback(() => {
    saveGameSnapshot(snapshotRef.current, positionRef.current);
    setSaves(listSavedGames());
    showToast(TEXT[language].savedToast);
  }, [language, showToast]);

  const handleUpdateSnapshot = useCallback((next: GameSnapshot) => {
    snapshotRef.current = next;
    setHudSnapshot(next);
  }, []);

  const handleEquipTool = useCallback((tool: ToolType) => {
    const next: GameSnapshot = {
      ...snapshotRef.current,
      tools: { ...snapshotRef.current.tools, equippedTool: tool },
    };
    snapshotRef.current = next;
    setHudSnapshot(next);
  }, []);

  const completePlanetArrival = useCallback(
    (toPlanetId: PlanetId) => {
      const prev = snapshotRef.current;
      const dest = PLANET_CATALOG[toPlanetId];
      const visited = prev.visitedPlanets.includes(toPlanetId)
        ? prev.visitedPlanets
        : [...prev.visitedPlanets, toPlanetId];

      const isSpecial = dest.cannotLand;
      const next: GameSnapshot = {
        ...prev,
        planetPreset: dest,
        visitedPlanets: visited,
        odometerKm: prev.odometerKm + dest.distanceFromPrevKm,
        insideShip: !isSpecial,
        currentZone: isSpecial ? 'space_scenario' : 'ship',
        stats: {
          ...prev.stats,
          fuel: Math.max(0, prev.stats.fuel - dest.fuelCostToEnter),
          temperature: isSpecial ? dest.baseTempC : 22,
        },
        energyState: {
          ...prev.energyState,
          solarExposure: dest.solarExposure,
        },
        hooks: {
          ...prev.hooks,
          currentPlanetReached: toPlanetId,
          spaceObjectsActive: dest.hasSpaceObjects,
          solarFlaresActive: dest.hasSolarFlares,
        },
        specialScenario: isSpecial
          ? {
              active: true,
              planetId: toPlanetId as 'jupiter' | 'saturn' | 'sun',
              escapeProgress: 0,
              sunPanelsPlaced: 0,
              elapsedSeconds: 0,
            }
          : null,
        mineralNodes: createInitialMineralNodes(),
        gasVents: createInitialGasVents(),
      };

      snapshotRef.current = next;
      positionRef.current = { x: 180, y: 128 };
      setHudSnapshot(next);
      setActiveTravel(null);
      inputManager.clearAll();
      setScreen('playing');

      const es = language === 'es';
      if (toPlanetId === 'moon') {
        showToast(es ? '¡Luna alcanzada! Nave Mejorada desbloqueada.' : 'Moon reached! Improved Ship tier unlocked.');
      } else if (toPlanetId === 'asteroid_belt') {
        showToast(es ? '¡Cinturón alcanzado! Nave Avanzada desbloqueada.' : 'Asteroid Belt reached! Advanced Ship unlocked.');
      } else if (toPlanetId === 'uranus') {
        showToast(es ? '¡Urano alcanzado! Nave Élite desbloqueada.' : 'Uranus reached! Elite Ship tier unlocked.');
      } else if (toPlanetId === 'mercury') {
        showToast(es ? '¡Mercurio alcanzado! Nave Legendaria desbloqueada.' : 'Mercury reached! Legendary Ship unlocked.');
      } else if (toPlanetId === 'sun') {
        showToast(es ? '¡Coloca 50 paneles de la Esfera de Dyson sin tocar llamaradas!' : 'Place 50 Dyson Sphere panels while dodging solar flares!');
      } else {
        showToast(es ? `Llegada a ${dest.nameEs}` : `Arrived at ${dest.nameEn}`);
      }
    },
    [inputManager, language, showToast]
  );

  const handleLaunchTrip = useCallback(
    (toPlanetId: PlanetId) => {
      const fromId = snapshotRef.current.planetPreset.id;
      const dest = PLANET_CATALOG[toPlanetId];
      if (snapshotRef.current.stats.fuel < dest.fuelCostToEnter) return;

      inputManager.clearAll();
      setScreen('playing');

      // §4.1 (all standard trips) vs §4.2 (Mercury -> Sun)
      const isMercuryToSun = fromId === 'mercury' && toPlanetId === 'sun';
      setActiveTravel({
        fromPlanetId: fromId,
        toPlanetId,
        distanceKm: dest.distanceFromPrevKm,
        distanceAu: dest.distanceFromPrevAu,
        variant: isMercuryToSun ? 'mercury_to_sun_4_2' : 'standard_4_1',
      });
    },
    [inputManager]
  );

  const handleSunSetback = useCallback(() => {
    const es = language === 'es';
    const prev = snapshotRef.current;
    const resetSnap: GameSnapshot = {
      ...prev,
      stats: {
        ...prev.stats,
        health: Math.max(60, prev.stats.health),
        oxygen: 100,
      },
      specialScenario: {
        active: true,
        planetId: 'sun',
        escapeProgress: 0,
        sunPanelsPlaced: 0,
        elapsedSeconds: 0,
      },
    };
    snapshotRef.current = resetSnap;
    setHudSnapshot(resetSnap);
    showToast(
      es
        ? '¡Impacto solar! Los paneles se reinician y repites Mercurio → Sol.'
        : 'Solar impact! Panels reset — replaying Mercury → Sun!'
    );
    // Replay Cinematic 4.2 (§3.13 & §4.2)
    setActiveTravel({
      fromPlanetId: 'mercury',
      toPlanetId: 'sun',
      distanceKm: PLANET_CATALOG.sun.distanceFromPrevKm,
      distanceAu: PLANET_CATALOG.sun.distanceFromPrevAu,
      variant: 'mercury_to_sun_4_2',
    });
  }, [language, showToast]);

  const handleSunDysonComplete = useCallback(() => {
    setConfettiActive(true);
    setShowFinalEnding(true);
  }, []);

  const handleLockedAccess = useCallback(
    (contextEs: string, contextEn: string) => {
      const msg = getFunnyLockedMessage(contextEs, contextEn, language === 'es');
      setLockedNotice(msg);
      setAssistantMood('curious');
      setAssistantOpen(true);
    },
    [language]
  );

  const handleResolveMission = useCallback(() => {
    const es = language === 'es';
    const res = resolveActiveMission(snapshotRef.current);
    snapshotRef.current = res.snapshot;
    setHudSnapshot(res.snapshot);
    soundEngine.playWake();
    setConfettiActive(true);
    setAssistantMood('cheerful');
    if (res.unlockedPet) {
      const petName = es ? PET_META[res.unlockedPet].nameEs : PET_META[res.unlockedPet].nameEn;
      showToast(
        es
          ? `¡Misión Difícil Completa! Mascota especial desbloqueada: ${petName}`
          : `Hard Mission Cleared! Special Pet unlocked: ${petName}`
      );
    } else {
      showToast(
        es
          ? '¡Misión completada! Recompensa de recursos y mejora recibida.'
          : 'Mission completed! Resource & upgrade rewards granted.'
      );
    }
  }, [language, showToast]);

  const handleSelectPet = useCallback((pet: PetId) => {
    const next: GameSnapshot = { ...snapshotRef.current, activePet: pet };
    snapshotRef.current = next;
    setHudSnapshot(next);
  }, []);

  const handleScenarioCleared = useCallback(
    (planetId: 'jupiter' | 'saturn') => {
      const prev = snapshotRef.current;
      const es = language === 'es';
      const next: GameSnapshot = {
        ...prev,
        insideShip: true,
        currentZone: 'ship',
        specialScenario: null,
        hooks: {
          ...prev.hooks,
          gravitationalPull: { x: 0, y: 0 },
          spaceObjectsActive: false,
        },
      };
      snapshotRef.current = next;
      positionRef.current = { x: 180, y: 128 };
      setHudSnapshot(next);
      showToast(
        es
          ? `¡Escapaste de la gravedad de ${planetId === 'jupiter' ? 'Júpiter' : 'Saturno'}! Siguiente destino listo en el Mapa.`
          : `Escaped ${planetId === 'jupiter' ? 'Jupiter' : 'Saturn'}’s gravity! Next destination ready on Planet Map.`
      );
    },
    [language, showToast]
  );

  const handleOpenScreen = useCallback(
    (nextScreen: ScreenId) => {
      if (nextScreen !== 'playing') {
        inputManager.clearAll();
      }
      setScreen(nextScreen);
    },
    [inputManager]
  );

  const handleGameOver = useCallback(
    (snap: GameSnapshot) => {
      snapshotRef.current = snap;
      setHudSnapshot(snap);
      inputManager.clearAll();
      setScreen('game_over');
    },
    [inputManager]
  );

  const isModalOpen =
    (screen !== 'start' && screen !== 'playing') ||
    showDriveModal ||
    activeCinematic !== null ||
    activeTravel !== null ||
    showFinalEnding;

  const inSpecialScenario = Boolean(hudSnapshot.specialScenario?.active);

  // Random RPG Mission Scheduler (§3.12): triggers periodically during exploration
  useEffect(() => {
    if (screen !== 'playing' || isModalOpen || inSpecialScenario) return;
    const timer = window.setInterval(() => {
      const curr = snapshotRef.current;
      if (curr.activeMission || curr.stats.health <= 0) return;
      const m = spawnRandomMission(curr);
      const next: GameSnapshot = { ...curr, activeMission: m };
      snapshotRef.current = next;
      setHudSnapshot(next);
      setAssistantMood('worried');
      setAssistantOpen(true);
      soundEngine.playWarning();
      const tpl = MISSION_CATALOG[m.type];
      showToast(language === 'es' ? tpl.titleEs : tpl.titleEn);
    }, 52000);
    return () => window.clearInterval(timer);
  }, [inSpecialScenario, isModalOpen, language, screen, showToast]);

  return (
    <div className="relative w-full h-full bg-[#070914] overflow-hidden">
      {screen === 'start' ? (
        <>
          <StartMenu
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'es' : 'en'))}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
            onPlay={handleStartNewGame}
            onOpenSavedGames={() => {
              setSaves(listSavedGames());
              setShowSavedModal(true);
            }}
            onOpenGoogleDrive={() => {
              setSaves(listSavedGames());
              setShowDriveModal(true);
            }}
            muted={muted}
            onToggleMute={handleToggleMute}
            saveCount={saves.length}
            modalOpen={showSavedModal || showDriveModal}
          />
          {showSavedModal && (
            <SavedGamesModal
              language={language}
              saves={saves}
              onLoad={handleLoadSave}
              onDelete={handleDeleteSave}
              onOpenDrive={() => {
                setShowSavedModal(false);
                setShowDriveModal(true);
              }}
              onClose={() => setShowSavedModal(false)}
            />
          )}
        </>
      ) : (
        <>
          {inSpecialScenario ? (
            <SpecialScenarioCanvas
              snapshotRef={snapshotRef}
              inputManager={inputManager}
              paused={isModalOpen}
              language={language}
              onSyncHud={setHudSnapshot}
              onOpenScreen={handleOpenScreen}
              onScenarioCleared={handleScenarioCleared}
              onSunSetback={handleSunSetback}
              onSunDysonComplete={handleSunDysonComplete}
              onGameOver={handleGameOver}
            />
          ) : (
            <GameCanvas
              snapshotRef={snapshotRef}
              positionRef={positionRef}
              inputManager={inputManager}
              paused={isModalOpen}
              language={language}
              onSyncHud={setHudSnapshot}
              onOpenScreen={handleOpenScreen}
              onNotify={showToast}
              onResolveMission={handleResolveMission}
              onGameOver={handleGameOver}
              externalActionRef={externalActionRef}
            />
          )}

          <SurvivalHud
            snapshot={hudSnapshot}
            language={language}
            showTouchControls={showTouchControls && !inSpecialScenario}
            muted={muted}
            onToggleMute={handleToggleMute}
            onSave={handleSaveCurrent}
            onOpenScreen={handleOpenScreen}
            onOpenAssistant={() => {
              setAssistantMood(hudSnapshot.activeMission ? 'worried' : 'cheerful');
              setAssistantOpen((o) => !o);
            }}
            onEquipTool={handleEquipTool}
            inputManager={inputManager}
            onQuickAction={(type) => externalActionRef.current?.(type)}
          />

          <VirtualAssistantPanel
            open={assistantOpen}
            mood={assistantMood}
            lockedNotice={lockedNotice}
            snapshot={hudSnapshot}
            language={language}
            onSelectPet={handleSelectPet}
            onClearLockedNotice={() => setLockedNotice(null)}
            onClose={() => setAssistantOpen(false)}
          />

          {screen === 'sleep' && (
            <SleepScreen
              snapshot={hudSnapshot}
              language={language}
              onCompleteSleep={(updated) => {
                handleUpdateSnapshot(updated);
                setScreen('playing');
              }}
              onClose={() => setScreen('playing')}
            />
          )}

          {screen === 'planet_map' && (
            <PlanetMapModal
              snapshot={hudSnapshot}
              language={language}
              onUpdateSnapshot={handleUpdateSnapshot}
              onLaunchTrip={handleLaunchTrip}
              onLockedAccess={handleLockedAccess}
              onClose={() => setScreen('playing')}
            />
          )}

          {screen === 'inventory' && (
            <InventoryModal
              snapshot={hudSnapshot}
              language={language}
              onUpdateSnapshot={handleUpdateSnapshot}
              onClose={() => setScreen('playing')}
            />
          )}

          {screen === 'tool_upgrade' && (
            <ToolsAndShipModal
              snapshot={hudSnapshot}
              language={language}
              onUpdateSnapshot={handleUpdateSnapshot}
              onTriggerCinematic={(evt) => setActiveCinematic(evt)}
              onLockedAccess={handleLockedAccess}
              onClose={() => setScreen('playing')}
            />
          )}

          {(screen === 'upgrade_tree' ||
            screen === 'storage' ||
            screen === 'garden') && (
            <OptionScreensModal
              screen={screen}
              snapshot={hudSnapshot}
              language={language}
              onUpdateSnapshot={handleUpdateSnapshot}
              onLockedAccess={handleLockedAccess}
              onResolveMission={handleResolveMission}
              onClose={() => setScreen('playing')}
            />
          )}

          {screen === 'pause' && (
            <PauseModal
              language={language}
              showTouchControls={showTouchControls}
              onToggleTouchControls={() => setShowTouchControls((v) => !v)}
              onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'es' : 'en'))}
              onResume={() => setScreen('playing')}
              onSave={handleSaveCurrent}
              onOpenDrive={() => {
                setSaves(listSavedGames());
                setShowDriveModal(true);
              }}
              onReturnTitle={() => {
                setSaves(listSavedGames());
                setScreen('start');
              }}
            />
          )}

          {screen === 'game_over' && (
            <GameOverModal
              snapshot={hudSnapshot}
              language={language}
              onPlayAgain={handleStartNewGame}
              onReturnTitle={() => {
                setSaves(listSavedGames());
                setScreen('start');
              }}
            />
          )}

          {activeTravel && (
            <TravelCinematicModal
              travel={activeTravel}
              language={language}
              onComplete={() => {
                if (
                  activeTravel.toPlanetId === 'sun' &&
                  snapshotRef.current.planetPreset.id === 'sun'
                ) {
                  // Repeating Mercury->Sun after setback keeps Sun scenario ready
                  setActiveTravel(null);
                  inputManager.clearAll();
                } else {
                  completePlanetArrival(activeTravel.toPlanetId);
                }
              }}
            />
          )}

          {activeCinematic && (
            <UpgradeCinematicModal
              cinematic={activeCinematic}
              language={language}
              onFinish={() => setActiveCinematic(null)}
            />
          )}

          {showFinalEnding && (
            <FinalEndingModal
              snapshot={hudSnapshot}
              language={language}
              onPlayAgain={handleStartNewGame}
              onReturnTitle={() => {
                setShowFinalEnding(false);
                setSaves(listSavedGames());
                setScreen('start');
              }}
            />
          )}
        </>
      )}

      <ConfettiBurst active={confettiActive} onDone={() => setConfettiActive(false)} />

      {showDriveModal && (
        <GoogleDriveModal
          language={language}
          activeSnapshot={screen !== 'start' ? hudSnapshot : null}
          activePosition={positionRef.current}
          localSaves={saves}
          onLoadCloudSave={(slot) => {
            setShowDriveModal(false);
            handleLoadSave(slot);
          }}
          onNotify={showToast}
          onClose={() => setShowDriveModal(false)}
        />
      )}

      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 border-2 border-emerald-200 text-slate-950 font-pixel text-xs shadow-lg">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
