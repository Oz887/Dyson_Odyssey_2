import React, { useEffect, useRef } from 'react';
import { MINERAL_META } from '../data/phase2Catalog';
import { PET_META } from '../data/phase4Content';
import { soundEngine } from '../engine/audio';
import { InputManager } from '../engine/input';
import { drawPixelAstronaut } from '../engine/pixelSprites';
import {
  applyDrinkWater,
  applyEatFood,
  applyTraining,
  collectGasFromVent,
  collectMineralFromNode,
  depositAllMineralsToStorage,
  depositGasesToFuelZone,
  getCropStage,
  harvestCropPlot,
  stepSurvival,
} from '../engine/survival';
import {
  getSurfaceZoneAndTemp,
  resolveCircleRectCollision,
  SHIP_BOUNDS,
  SHIP_INTERACTABLES,
  SHIP_SOLIDS,
  SURFACE_BOUNDS,
  SURFACE_INTERACTABLES,
  SURFACE_SOLIDS,
} from '../engine/world';
import {
  Direction,
  GameSnapshot,
  Language,
  PlayerAnimState,
  ScreenId,
  ToolType,
  WorldInteractable,
} from '../types/game';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameCanvasProps {
  snapshotRef: React.MutableRefObject<GameSnapshot>;
  positionRef: React.MutableRefObject<{ x: number; y: number }>;
  inputManager: InputManager;
  paused: boolean;
  language: Language;
  onSyncHud: (snap: GameSnapshot) => void;
  onOpenScreen: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
  onResolveMission: () => void;
  onGameOver: (snap: GameSnapshot) => void;
  externalActionRef: React.MutableRefObject<
    ((type: 'eat' | 'drink' | 'train' | 'suit' | 'airlock' | 'attack' | 'interact') => void) | null
  >;
}

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137) % 960,
  y: (i * 59) % 108,
  size: i % 7 === 0 ? 2 : 1,
  phase: i * 0.7,
  color: i % 5 === 0 ? '#a5f3fc' : i % 9 === 0 ? '#e9d5ff' : '#f8fafc',
}));

export const GameCanvas: React.FC<GameCanvasProps> = ({
  snapshotRef,
  positionRef,
  inputManager,
  paused,
  language,
  onSyncHud,
  onOpenScreen,
  onNotify,
  onResolveMission,
  onGameOver,
  externalActionRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  const langRef = useRef(language);
  pausedRef.current = paused;
  langRef.current = language;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let vx = 0;
    let vy = 0;
    let direction: Direction = 'down';
    let walkPhase = 0;
    let stepAudioTimer = 0;

    let actionAnim: PlayerAnimState | null = null;
    let actionAnimTimer = 0;
    let hitstopTimer = 0;
    let shakeIntensity = 0;
    let hitFlashTimer = 0;
    let airlockFade = 0;
    let hudSyncAcc = 0;
    let globalTime = 0;

    let camX = positionRef.current.x;
    let camY = positionRef.current.y;

    const particles: Particle[] = [];
    const spawnParticles = (
      x: number,
      y: number,
      count: number,
      color: string,
      speed = 45,
      size = 2
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const spd = speed * (0.4 + Math.random() * 0.7);
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 10,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          color,
          size,
        });
      }
    };

    const equipTool = (tool: ToolType) => {
      soundEngine.playClick();
      snapshotRef.current = {
        ...snapshotRef.current,
        tools: { ...snapshotRef.current.tools, equippedTool: tool },
      };
      onSyncHud(snapshotRef.current);
    };

    const toggleAirlock = () => {
      const snap = snapshotRef.current;
      const entering = !snap.insideShip;
      soundEngine.playAirlock(entering);
      airlockFade = 1;
      vx = 0;
      vy = 0;
      if (entering) {
        snapshotRef.current = { ...snap, insideShip: true, currentZone: 'ship' };
        positionRef.current = { x: 180, y: 174 };
      } else {
        snapshotRef.current = { ...snap, insideShip: false, currentZone: 'surface' };
        positionRef.current = { x: 480, y: 248 };
        camX = 480;
        camY = 248;
      }
      onSyncHud(snapshotRef.current);
    };

    const triggerSuitToggle = () => {
      const snap = snapshotRef.current;
      const next = !snap.suitEquipped;
      soundEngine.playSuitToggle(next);
      snapshotRef.current = { ...snap, suitEquipped: next };
      spawnParticles(
        positionRef.current.x,
        positionRef.current.y - 16,
        8,
        next ? '#38bdf8' : '#cbd5e1',
        36
      );
      onSyncHud(snapshotRef.current);
    };

    const attemptMineMineral = (nodeId: string, nodeX: number, nodeY: number) => {
      const snap = snapshotRef.current;
      const es = langRef.current === 'es';
      if (snap.tools.equippedTool !== 'drill') {
        soundEngine.playWarning();
        onNotify(
          es
            ? 'Equipa el Taladro (1) para extraer minerales.'
            : 'Equip the Drill (1) to mine minerals.'
        );
        return;
      }
      const res = collectMineralFromNode(snap, nodeId);
      if (res.fullCap) {
        soundEngine.playWarning();
        onNotify(
          es
            ? 'Mochila llena (máx. 5 por mineral). Deposita con Depósito Minerales (2) en la nave.'
            : 'Backpack full (max 5 per mineral). Deposit at Ship Storage with Mineral Storage (2).'
        );
        return;
      }
      if (res.gained > 0) {
        snapshotRef.current = res.snapshot;
        actionAnim = 'drill';
        actionAnimTimer = 0.5;
        hitstopTimer = 0.045;
        shakeIntensity = 3.2;
        soundEngine.playInteract();
        const mNode = snap.mineralNodes.find((n) => n.id === nodeId);
        const col = mNode ? MINERAL_META[mNode.mineralId].color : '#38bdf8';
        spawnParticles(nodeX, nodeY - 6, 12, col, 65, 2);
        if (mNode) {
          const name = es ? MINERAL_META[mNode.mineralId].es : MINERAL_META[mNode.mineralId].en;
          onNotify(`+${res.gained} ${name}`);
        }
        onSyncHud(snapshotRef.current);
      } else {
        onNotify(es ? 'Veta regenerándose (10s)...' : 'Mineral vein regenerating (10s)...');
      }
    };

    const attemptCollectGas = (ventId: string, vxPos: number, vyPos: number) => {
      const snap = snapshotRef.current;
      const es = langRef.current === 'es';
      if (snap.tools.equippedTool !== 'fuel_collector') {
        soundEngine.playWarning();
        onNotify(
          es
            ? 'Equipa el Colector de Gases (3) para recolectar gases.'
            : 'Equip the Fuel Collector (3) to collect gases.'
        );
        return;
      }
      const res = collectGasFromVent(snap, ventId);
      if (res.gained > 0) {
        snapshotRef.current = res.snapshot;
        actionAnim = 'collector';
        actionAnimTimer = 0.55;
        soundEngine.playHydrate();
        spawnParticles(vxPos, vyPos - 6, 10, '#c084fc', 50, 2);
        onNotify(
          es
            ? `+${res.gained} gas recolectado (deposita en la nave con 4).`
            : `+${res.gained} gas collected (deposit in ship with 4).`
        );
        onSyncHud(snapshotRef.current);
      } else {
        onNotify(es ? 'Bolsa de gas recargándose...' : 'Gas vent recharging...');
      }
    };

    const triggerAttack = () => {
      soundEngine.playAttack();
      actionAnim = 'attack';
      actionAnimTimer = 0.28;
      const px = positionRef.current.x;
      const py = positionRef.current.y - 10;
      const dx = direction === 'left' ? -18 : direction === 'right' ? 18 : 0;
      const dy = direction === 'up' ? -18 : direction === 'down' ? 18 : 0;

      if (!snapshotRef.current.insideShip) {
        for (const node of snapshotRef.current.mineralNodes) {
          const dist = Math.hypot(node.x - (px + dx), node.y - (py + dy));
          if (dist < 32) {
            attemptMineMineral(node.id, node.x, node.y);
            return;
          }
        }
      }
      spawnParticles(px + dx, py + dy, 6, '#7dd3fc', 40, 2);
    };

    const triggerTrain = () => {
      const res = applyTraining(snapshotRef.current);
      snapshotRef.current = res.snapshot;
      soundEngine.playTrain();
      actionAnim = 'training';
      actionAnimTimer = 0.75;
      spawnParticles(
        positionRef.current.x,
        positionRef.current.y - 14,
        10,
        res.gainedMotivation ? '#34d399' : '#fbbf24',
        44
      );
      onSyncHud(snapshotRef.current);
    };

    const findNearestInteractable = (): WorldInteractable | null => {
      const snap = snapshotRef.current;
      const list = snap.insideShip ? SHIP_INTERACTABLES : SURFACE_INTERACTABLES;
      const px = positionRef.current.x;
      const py = positionRef.current.y;
      let best: WorldInteractable | null = null;
      let bestDist = 36;
      for (const obj of list) {
        const d = Math.hypot(obj.x - px, obj.y - py);
        if (d < bestDist) {
          bestDist = d;
          best = obj;
        }
      }
      return best;
    };

    const executeInteract = () => {
      const target = findNearestInteractable();
      const snap = snapshotRef.current;
      const es = langRef.current === 'es';

      if (!target) {
        soundEngine.playInteract();
        actionAnim = 'interact';
        actionAnimTimer = 0.35;
        return;
      }

      if (target.id === 'sleep_bunk') {
        soundEngine.playOpenMenu();
        onOpenScreen('sleep');
      } else if (target.id === 'water_unit') {
        soundEngine.playHydrate();
        snapshotRef.current = applyDrinkWater(snap, false);
        actionAnim = 'hydrate';
        actionAnimTimer = 0.65;
        spawnParticles(positionRef.current.x, positionRef.current.y - 18, 10, '#38bdf8', 42);
        onSyncHud(snapshotRef.current);
      } else if (target.id === 'food_unit') {
        soundEngine.playOpenMenu();
        onOpenScreen('inventory');
      } else if (target.id === 'suit_locker') {
        soundEngine.playOpenMenu();
        onOpenScreen('tool_upgrade');
      } else if (target.id === 'garden_bed') {
        // Harvest any ready crop directly, or open Agriculture screen
        const readyPlot = snap.agriculture.plots.find(
          (p) => p.veggieId && getCropStage(p.elapsedSeconds) === 'ready'
        );
        if (readyPlot) {
          const res = harvestCropPlot(snap, readyPlot.id);
          snapshotRef.current = res.snapshot;
          actionAnim = 'harvest';
          actionAnimTimer = 0.6;
          soundEngine.playConsume();
          spawnParticles(target.x, target.y - 6, 12, '#4ade80', 48);
          onNotify(es ? '¡Cultivo cosechado (+1)!' : 'Harvested crop (+1)!');
          onSyncHud(snapshotRef.current);
        } else {
          soundEngine.playOpenMenu();
          onOpenScreen('garden');
        }
      } else if (target.id === 'energy_reactor') {
        if (snap.activeMission?.targetInteractable === 'energy_reactor') {
          actionAnim = 'interact';
          actionAnimTimer = 0.55;
          spawnParticles(target.x, target.y - 6, 14, '#facc15', 52);
          onResolveMission();
          return;
        }
        soundEngine.playOpenMenu();
        onOpenScreen('storage');
      } else if (target.id === 'storage_vault') {
        if (snap.activeMission?.targetInteractable === 'storage_vault') {
          actionAnim = 'interact';
          actionAnimTimer = 0.55;
          spawnParticles(target.x, target.y - 6, 14, '#34d399', 52);
          onResolveMission();
          return;
        }
        if (snap.tools.equippedTool === 'mineral_storage') {
          const res = depositAllMineralsToStorage(snap);
          if (res.moved > 0) {
            snapshotRef.current = res.snapshot;
            actionAnim = 'deposit';
            actionAnimTimer = 0.5;
            soundEngine.playInteract();
            spawnParticles(target.x, target.y - 8, 10, '#34d399', 40);
            onNotify(
              es
                ? `Depositados ${res.moved} minerales en el Almacén.`
                : `Deposited ${res.moved} minerals to Ship Storage.`
            );
            onSyncHud(snapshotRef.current);
            return;
          }
        }
        soundEngine.playOpenMenu();
        onOpenScreen('storage');
      } else if (target.id === 'fuel_zone') {
        if (snap.tools.equippedTool === 'fuel_storage') {
          const res = depositGasesToFuelZone(snap);
          if (res.moved > 0) {
            snapshotRef.current = res.snapshot;
            actionAnim = 'deposit';
            actionAnimTimer = 0.5;
            soundEngine.playInteract();
            spawnParticles(target.x, target.y - 8, 10, '#c084fc', 40);
            onNotify(
              es
                ? `Depositados ${res.moved} gases en la Zona de Combustible.`
                : `Deposited ${res.moved} gases to Fuel Zone.`
            );
            onSyncHud(snapshotRef.current);
            return;
          }
        }
        soundEngine.playOpenMenu();
        onOpenScreen('storage');
      } else if (target.id === 'training_pad') {
        triggerTrain();
      } else if (target.id === 'ship_console') {
        soundEngine.playOpenMenu();
        onOpenScreen('planet_map');
      } else if (target.type === 'airlock') {
        toggleAirlock();
      } else if (target.type === 'base_beacon') {
        soundEngine.playOpenMenu();
        onOpenScreen('planet_map');
      } else if (target.type === 'mineral_rock') {
        attemptMineMineral(target.id, target.x, target.y);
      } else if (target.type === 'gas_vent') {
        attemptCollectGas(target.id, target.x, target.y);
      }
    };

    externalActionRef.current = (type) => {
      if (type === 'eat') {
        soundEngine.playConsume();
        snapshotRef.current = applyEatFood(snapshotRef.current, false);
        actionAnim = 'consume';
        actionAnimTimer = 0.65;
        onSyncHud(snapshotRef.current);
      } else if (type === 'drink') {
        soundEngine.playHydrate();
        snapshotRef.current = applyDrinkWater(snapshotRef.current, false);
        actionAnim = 'hydrate';
        actionAnimTimer = 0.65;
        onSyncHud(snapshotRef.current);
      } else if (type === 'train') {
        triggerTrain();
      } else if (type === 'suit') {
        triggerSuitToggle();
      } else if (type === 'airlock') {
        toggleAirlock();
      } else if (type === 'attack') {
        triggerAttack();
      } else if (type === 'interact') {
        executeInteract();
      }
    };

    const updateShipTarget = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      inputManager.shipTargetCanvasPos = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };
    const onPointerMove = (e: PointerEvent) => updateShipTarget(e.clientX, e.clientY);
    const onPointerDown = (e: PointerEvent) => updateShipTarget(e.clientX, e.clientY);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(240, Math.floor(canvas.clientHeight * dpr));
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      globalTime += dt;

      const actions = inputManager.consumeActions();
      for (const act of actions) {
        if (act === 'pause') {
          if (pausedRef.current) onOpenScreen('playing');
          else onOpenScreen('pause');
          return;
        }
        if (pausedRef.current) continue;
        if (act === 'interact') executeInteract();
        else if (act === 'suit') triggerSuitToggle();
        else if (act === 'ship') {
          const nearest = findNearestInteractable();
          if (nearest?.type === 'airlock') toggleAirlock();
          else if (snapshotRef.current.insideShip) toggleAirlock();
        } else if (act === 'attack') triggerAttack();
        else if (act === 'train') triggerTrain();
        else if (act === 'tool_1') equipTool('drill');
        else if (act === 'tool_2') equipTool('mineral_storage');
        else if (act === 'tool_3') equipTool('fuel_collector');
        else if (act === 'tool_4') equipTool('fuel_storage');
      }

      if (!pausedRef.current && snapshotRef.current.stats.health > 0) {
        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        } else {
          const snap = snapshotRef.current;
          const pos = positionRef.current;
          const zoneInfo = snap.insideShip
            ? { zone: 'ship' as const, ambientTempC: snap.planetPreset.baseTempC }
            : getSurfaceZoneAndTemp(pos.x, pos.y, snap.planetPreset);

          const moveVec = inputManager.getMoveVector();
          const hasMoveInput = Math.hypot(moveVec.x, moveVec.y) > 0.05;
          const isRunning = inputManager.isRunning() && hasMoveInput;

          const survResult = stepSurvival(snap, {
            dt,
            isMoving: hasMoveInput,
            isRunning,
            isMiningOrTraining: actionAnim === 'training' || actionAnim === 'drill',
            ambientTempC: zoneInfo.ambientTempC,
            currentZone: zoneInfo.zone,
          });

          if (survResult.tookDamage) {
            hitFlashTimer = 0.18;
            shakeIntensity = Math.max(shakeIntensity, 2.2);
          }
          if (survResult.warningTriggered) {
            soundEngine.playWarning();
          }

          const baseSpeed = 96;
          const targetSpeed = baseSpeed * survResult.speedMultiplier;
          const targetVx = moveVec.x * targetSpeed;
          const targetVy = moveVec.y * targetSpeed;

          const accel = hasMoveInput ? 18 : 24;
          const blend = 1 - Math.exp(-accel * dt);
          vx += (targetVx - vx) * blend;
          vy += (targetVy - vy) * blend;

          if (!hasMoveInput && Math.hypot(vx, vy) < 2) {
            vx = 0;
            vy = 0;
          }

          if (hasMoveInput) {
            if (Math.abs(moveVec.x) > Math.abs(moveVec.y)) {
              direction = moveVec.x < 0 ? 'left' : 'right';
            } else {
              direction = moveVec.y < 0 ? 'up' : 'down';
            }
          }

          const speedMag = Math.hypot(vx, vy);
          if (speedMag > 4) {
            walkPhase += dt * (isRunning ? 15 : 10.5);
            stepAudioTimer -= dt;
            if (stepAudioTimer <= 0) {
              soundEngine.playStep(snap.insideShip);
              stepAudioTimer = isRunning ? 0.21 : 0.31;
              if (!snap.insideShip) {
                spawnParticles(pos.x, pos.y, 2, '#94a3b8', 18, 1);
              }
            }

            const solids = snap.insideShip ? SHIP_SOLIDS : SURFACE_SOLIDS;
            const bounds = snap.insideShip ? SHIP_BOUNDS : SURFACE_BOUNDS;
            let nextX = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x + vx * dt));
            let nextY = Math.max(bounds.minY, Math.min(bounds.maxY, pos.y + vy * dt));
            const resolved = resolveCircleRectCollision(nextX, nextY, 7, solids);
            nextX = Math.max(bounds.minX, Math.min(bounds.maxX, resolved.x));
            nextY = Math.max(bounds.minY, Math.min(bounds.maxY, resolved.y));
            positionRef.current = { x: nextX, y: nextY };
          }

          if (!snap.insideShip) {
            const camBlend = 1 - Math.exp(-9 * dt);
            camX += (positionRef.current.x - camX) * camBlend;
            camY += (positionRef.current.y - camY) * camBlend;
          }

          if (actionAnimTimer > 0) {
            actionAnimTimer -= dt;
            if (actionAnimTimer <= 0) actionAnim = null;
          }
          if (hitFlashTimer > 0) hitFlashTimer = Math.max(0, hitFlashTimer - dt);
          if (shakeIntensity > 0) shakeIntensity = Math.max(0, shakeIntensity - dt * 12);
          if (airlockFade > 0) airlockFade = Math.max(0, airlockFade - dt * 3);

          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
          }

          const nearest = findNearestInteractable();
          const nextSnap: GameSnapshot = {
            ...survResult.snapshot,
            activePrompt: nearest
              ? {
                  id: nearest.id,
                  labelEn: nearest.labelEn,
                  labelEs: nearest.labelEs,
                  actionHint: 'SPACE',
                }
              : null,
          };
          snapshotRef.current = nextSnap;

          if (nextSnap.stats.health <= 0) {
            onSyncHud(nextSnap);
            onGameOver(nextSnap);
          } else {
            hudSyncAcc += dt;
            if (hudSyncAcc >= 0.12) {
              hudSyncAcc = 0;
              onSyncHud(nextSnap);
            }
          }
        }
      }

      renderWorld(ctx, canvas.width, canvas.height, {
        snapshot: snapshotRef.current,
        pos: positionRef.current,
        camX,
        camY,
        direction,
        walkPhase,
        speedMag: Math.hypot(vx, vy),
        actionAnim,
        globalTime,
        hitFlash: hitFlashTimer > 0,
        shakeIntensity,
        airlockFade,
        particles,
        lang: langRef.current,
      });
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [externalActionRef, inputManager, onGameOver, onNotify, onOpenScreen, onResolveMission, onSyncHud, positionRef, snapshotRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block pixelated ${
        snapshotRef.current.statusEffects.includes('pressure') ? 'dizziness-active' : ''
      }`}
    />
  );
};

interface RenderState {
  snapshot: GameSnapshot;
  pos: { x: number; y: number };
  camX: number;
  camY: number;
  direction: Direction;
  walkPhase: number;
  speedMag: number;
  actionAnim: PlayerAnimState | null;
  globalTime: number;
  hitFlash: boolean;
  shakeIntensity: number;
  airlockFade: number;
  particles: Particle[];
  lang: Language;
}

function renderWorld(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  state: RenderState
) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#070914';
  ctx.fillRect(0, 0, cw, ch);

  const { snapshot, pos, camX, camY, globalTime, shakeIntensity } = state;
  const targetLogicalW = snapshot.insideShip ? 400 : 480;
  const pixelScale = Math.max(2, Math.floor(Math.min(cw / targetLogicalW, ch / 270) * 10) / 10);

  const shakeX = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;
  const shakeY = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;

  ctx.save();
  ctx.scale(pixelScale, pixelScale);

  const viewW = cw / pixelScale;
  const viewH = ch / pixelScale;

  if (snapshot.insideShip) {
    drawStarfieldBg(ctx, viewW, viewH, globalTime, 0);
    const ox = Math.round(viewW / 2 - 180 + shakeX);
    const oy = Math.round(viewH / 2 - 120 + shakeY);
    ctx.translate(ox, oy);
    drawShipInterior(ctx, snapshot, globalTime);
  } else {
    const maxCamX = Math.max(0, SURFACE_BOUNDS.width - viewW);
    const maxCamY = Math.max(0, SURFACE_BOUNDS.height - viewH);
    const cx = Math.max(0, Math.min(maxCamX, camX - viewW / 2));
    const cy = Math.max(0, Math.min(maxCamY, camY - viewH / 2));

    drawStarfieldBg(ctx, viewW, viewH, globalTime, cx * 0.2);
    ctx.translate(Math.round(-cx + shakeX), Math.round(-cy + shakeY));
    drawPlanetarySurface(ctx, snapshot, globalTime);
  }

  let animState: PlayerAnimState = state.actionAnim ?? 'idle';
  if (!state.actionAnim) {
    if (state.speedMag > 6) animState = 'move';
    else if (snapshot.statusEffects.includes('burn')) animState = 'burn';
    else if (snapshot.statusEffects.includes('freezing')) animState = 'freezing';
    else if (snapshot.statusEffects.includes('illness')) animState = 'illness';
    else if (snapshot.stats.fatigue < 25) animState = 'fatigue';
  }

  drawPixelAstronaut(ctx, {
    x: pos.x,
    y: pos.y,
    character: snapshot.character,
    direction: state.direction,
    suitEquipped: snapshot.suitEquipped,
    animState,
    animTime: globalTime,
    walkPhase: state.walkPhase,
    hitFlash: state.hitFlash,
  });

  // Render Unlocked Space Pet Companion (§3.12 Special Reward)
  if (snapshot.activePet) {
    const pm = PET_META[snapshot.activePet];
    const offX = state.direction === 'right' ? -15 : state.direction === 'left' ? 15 : -14;
    const bob = Math.round(Math.sin(globalTime * 8) * 1.5);
    const petX = Math.round(pos.x + offX);
    const petY = Math.round(pos.y - 4 + bob);
    ctx.fillStyle = pm.color;
    ctx.fillRect(petX - 4, petY - 4, 8, 7);
    ctx.fillStyle = pm.accent;
    ctx.fillRect(petX - 3, petY - 6, 2, 2);
    ctx.fillRect(petX + 1, petY - 6, 2, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(petX - 2, petY - 2, 1, 1);
    ctx.fillRect(petX + 1, petY - 2, 1, 1);
  }

  if (snapshot.activePrompt) {
    const promptText = state.lang === 'es' ? snapshot.activePrompt.labelEs : snapshot.activePrompt.labelEn;
    ctx.save();
    ctx.font = 'bold 7px "Silkscreen", monospace';
    const tw = ctx.measureText(promptText).width + 10;
    const bx = Math.round(pos.x - tw / 2);
    const by = Math.round(pos.y - 42 + Math.sin(globalTime * 5) * 1.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx, by, tw, 12);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, 11);
    ctx.fillStyle = '#e0f2fe';
    ctx.textAlign = 'center';
    ctx.fillText(promptText, pos.x, by + 8.5);
    ctx.restore();
  }

  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (snapshot.statusEffects.includes('pressure')) {
    const pulse = 0.28 + Math.sin(globalTime * 6) * 0.1;
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.2, cw / 2, ch / 2, cw * 0.6);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0)');
    grad.addColorStop(1, `rgba(220, 38, 38, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }
  if (state.airlockFade > 0) {
    ctx.fillStyle = `rgba(7, 9, 20, ${state.airlockFade * 0.85})`;
    ctx.fillRect(0, 0, cw, ch);
  }
}

function drawStarfieldBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  parallaxX: number
) {
  ctx.fillStyle = '#070914';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(88, 28, 135, 0.16)';
  ctx.fillRect(0, 12, w, 26);
  ctx.fillStyle = 'rgba(29, 78, 216, 0.14)';
  ctx.fillRect(0, 44, w, 22);

  for (const s of STARS) {
    const twinkle = 0.45 + 0.55 * Math.sin(time * 2.5 + s.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = s.color;
    const sx = ((s.x - parallaxX) % w + w) % w;
    ctx.fillRect(Math.round(sx), Math.round(s.y % h), s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawShipInterior(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  time: number
) {
  const powerOn = snapshot.stats.energy > 0 && snapshot.energyState.outagePauseRemaining <= 0;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(40, 36, 280, 174);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 36, 280, 174);

  for (let ty = 52; ty < 196; ty += 16) {
    for (let tx = 52; tx < 308; tx += 16) {
      ctx.fillStyle = (tx + ty) % 32 === 0 ? '#182238' : '#1d2942';
      ctx.fillRect(tx, ty, 16, 16);
      ctx.fillStyle = '#111829';
      ctx.fillRect(tx, ty, 16, 1);
      ctx.fillRect(tx, ty, 1, 16);
    }
  }

  ctx.fillStyle = '#334155';
  ctx.fillRect(52, 46, 256, 14);
  ctx.fillStyle = powerOn ? '#38bdf8' : '#ef4444';
  ctx.fillRect(52, 58, 256, 2);

  // 1. Sleep Bunk
  ctx.fillStyle = '#475569';
  ctx.fillRect(60, 58, 46, 28);
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(63, 62, 32, 20);
  ctx.fillStyle = '#e0e7ff';
  ctx.fillRect(94, 64, 9, 16);

  // 2. Water & Food Dispensers
  ctx.fillStyle = '#334155';
  ctx.fillRect(138, 58, 84, 22);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(144, 62, 24, 14);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(148, 65, 16, 6);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(190, 62, 26, 14);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(194, 65, 18, 6);

  // 3. Suit & Tools Locker
  ctx.fillStyle = '#475569';
  ctx.fillRect(256, 58, 42, 26);
  ctx.fillStyle = snapshot.suitEquipped ? '#1e293b' : '#f1f5f9';
  ctx.fillRect(264, 62, 14, 18);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(284, 64, 8, 12);

  // 4. Hydroponic Garden Bay (shows premature / semi-developed / ready crops!)
  ctx.fillStyle = '#3f2e21';
  ctx.fillRect(74, 108, 54, 24);
  ctx.strokeStyle = snapshot.agriculture.enabled ? '#4ade80' : '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(74.5, 108.5, 53, 23);
  snapshot.agriculture.plots.forEach((plot, idx) => {
    const px = 79 + idx * 12;
    const py = 114;
    if (!plot.veggieId) return;
    const stage = getCropStage(plot.elapsedSeconds);
    if (stage === 'premature') {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px + 2, py + 8, 2, 4);
    } else if (stage === 'semi_developed') {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(px + 1, py + 4, 6, 8);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(px + 2, py + 5, 3, 3);
    } else {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px, py + 2, 8, 10);
      ctx.fillStyle = Math.sin(time * 6) > 0 ? '#fde047' : '#ef4444';
      ctx.fillRect(px + 2, py + 3, 4, 4);
    }
  });

  // 5. Training Pad
  ctx.fillStyle = '#065f46';
  ctx.fillRect(74, 152, 40, 24);
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1;
  ctx.strokeRect(74.5, 152.5, 39, 23);

  // 6. Storage Vault (bottom-left-center)
  ctx.fillStyle = '#581c87';
  ctx.fillRect(124, 166, 26, 18);
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(128, 170, 18, 4);
  if (snapshot.activeMission?.targetInteractable === 'storage_vault' && Math.sin(time * 12) > 0) {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.strokeRect(122, 164, 30, 22);
  }

  // 7. Fuel & Gas Zone (bottom-right-center)
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(210, 166, 28, 18);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(214, 170, 20, 4);

  // 7b. Energy & Oxygen Reactor Area (§3.12 Mission Target)
  ctx.fillStyle = '#0c4a6e';
  ctx.fillRect(214, 110, 32, 22);
  ctx.fillStyle = snapshot.activeMission?.targetInteractable === 'energy_reactor'
    ? Math.sin(time * 14) > 0
      ? '#ef4444'
      : '#facc15'
    : '#22d3ee';
  ctx.fillRect(220, 116, 20, 10);
  if (snapshot.activeMission?.targetInteractable === 'energy_reactor' && Math.sin(time * 12) > 0) {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.strokeRect(212, 108, 36, 26);
  }

  // 8. Ship Nav & Upgrade Console
  ctx.fillStyle = '#334155';
  ctx.fillRect(254, 128, 44, 28);
  ctx.fillStyle = powerOn ? '#0ea5e9' : '#7f1d1d';
  ctx.fillRect(259, 132, 34, 14);
  if (powerOn && Math.sin(time * 4) > 0) {
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(263, 135, 10, 2);
    ctx.fillRect(263, 140, 20, 2);
  }

  // 9. Airlock Hatch
  ctx.fillStyle = '#475569';
  ctx.fillRect(156, 192, 48, 16);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(160, 194, 40, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(164, 198, 32, 10);
}

function drawPlanetarySurface(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  time: number
) {
  const pid = snapshot.planetPreset.id;
  const isMars = pid === 'mars';
  const isVenus = pid === 'venus';
  const isMercury = pid === 'mercury';
  const isIceGiant = pid === 'uranus' || pid === 'neptune';
  const isEarth = pid === 'earth';
  const baseGround = isMars
    ? '#6c2d20'
    : isVenus
      ? '#713f12'
      : isMercury
        ? '#574238'
        : isIceGiant
          ? '#164e63'
          : isEarth
            ? '#1e4d3b'
            : '#2a324b';
  const tileAlt = isMars
    ? '#7c3627'
    : isVenus
      ? '#854d0e'
      : isMercury
        ? '#664e42'
        : isIceGiant
          ? '#155e75'
          : isEarth
            ? '#245c47'
            : '#323c58';

  ctx.fillStyle = isMars ? '#4a1d15' : isEarth ? '#143328' : '#1e253b';
  ctx.fillRect(0, 106, SURFACE_BOUNDS.width, 16);

  for (let y = 114; y < SURFACE_BOUNDS.height; y += 24) {
    for (let x = 0; x < SURFACE_BOUNDS.width; x += 24) {
      let col = (x + y) % 48 === 0 ? baseGround : tileAlt;
      if (x < 220 && y > 210) {
        col = (x + y) % 48 === 0 ? '#164e63' : '#1e607a';
      } else if (x > 740 && y > 210) {
        col = (x + y) % 48 === 0 ? '#7c2d12' : '#9a3412';
      }
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 24, 24);
    }
  }

  // Cryo Frost Crystals
  ctx.fillStyle = '#67e8f9';
  ctx.fillRect(90, 260, 6, 14);
  ctx.fillRect(96, 266, 5, 8);
  ctx.fillRect(180, 390, 6, 12);

  // Thermal Vent Glow
  const glow = 0.65 + 0.35 * Math.sin(time * 5);
  ctx.fillStyle = `rgba(251, 146, 60, ${glow})`;
  ctx.fillRect(790, 350, 26, 8);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(796, 352, 14, 4);

  // Craters
  const craters = [
    [360, 310, 22],
    [540, 395, 28],
    [450, 445, 18],
    [690, 225, 20],
  ];
  for (const [cx, cy, r] of craters) {
    ctx.fillStyle = 'rgba(7, 10, 22, 0.35)';
    ctx.fillRect(cx - r, cy - r / 2, r * 2, r);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(cx - r + 2, cy + r / 2 - 2, r * 2 - 4, 2);
  }

  // Solar Panel Array
  ctx.fillStyle = '#334155';
  ctx.fillRect(316, 174, 54, 28);
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(320, 178, 46, 18);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(320, 186, 46, 2);
  ctx.fillRect(342, 178, 2, 18);

  // Mineral Veins (with 10s regeneration bar when depleted!)
  for (const node of snapshot.mineralNodes) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(node.x - 13, node.y - 10, 26, 18);
    if (node.cooldownRemaining <= 0) {
      const col = MINERAL_META[node.mineralId].color;
      ctx.fillStyle = col;
      ctx.fillRect(node.x - 7, node.y - 12, 6, 7);
      ctx.fillRect(node.x + 2, node.y - 9, 5, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - 6, node.y - 11, 2, 2);
    } else {
      // Regeneration timer bar (10s)
      const ratio = 1 - node.cooldownRemaining / 10;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(node.x - 12, node.y - 15, 24, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(node.x - 11, node.y - 14, Math.round(22 * ratio), 2);
    }
  }

  // Gas & Helium-3 Vents
  for (const vent of snapshot.gasVents) {
    const col =
      vent.resource === 'oxygen_gas'
        ? '#38bdf8'
        : vent.resource === 'hydrogen_gas'
          ? '#c084fc'
          : '#22d3ee';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(vent.x - 10, vent.y - 4, 20, 8);
    if (vent.cooldownRemaining <= 0) {
      const bob = Math.round(Math.sin(time * 5 + vent.x) * 3);
      ctx.fillStyle = col;
      ctx.fillRect(vent.x - 4, vent.y - 12 + bob, 8, 6);
      ctx.fillRect(vent.x - 2, vent.y - 18 + bob, 4, 4);
    }
  }

  // Landed Odyssey-1 Spacecraft
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(438, 152, 84, 68);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(438, 204, 84, 16);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(462, 162, 36, 20);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(466, 165, 12, 6);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(426, 184, 12, 34);
  ctx.fillRect(522, 184, 12, 34);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(466, 214, 28, 8);
  ctx.fillStyle = '#475569';
  ctx.fillRect(468, 222, 24, 18);
}
