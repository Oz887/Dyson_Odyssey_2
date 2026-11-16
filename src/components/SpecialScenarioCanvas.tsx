import React, { useEffect, useRef } from 'react';
import { PLANET_CATALOG } from '../data/phase3Planets';
import { soundEngine } from '../engine/audio';
import { InputManager } from '../engine/input';
import { stepSurvival } from '../engine/survival';
import { GameSnapshot, Language, ScreenId } from '../types/game';

interface SpaceObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

interface SolarFlareWave {
  radius: number;
  speed: number;
  angleStart: number;
  angleSpan: number;
  hitShip: boolean;
}

interface SpecialScenarioCanvasProps {
  snapshotRef: React.MutableRefObject<GameSnapshot>;
  inputManager: InputManager;
  paused: boolean;
  language: Language;
  onSyncHud: (snap: GameSnapshot) => void;
  onOpenScreen: (screen: ScreenId) => void;
  onScenarioCleared: (planetId: 'jupiter' | 'saturn') => void;
  onSunSetback: () => void;
  onSunDysonComplete: () => void;
  onGameOver: (snap: GameSnapshot) => void;
}

interface DysonAnchor {
  x: number;
  y: number;
  pulse: number;
}

/**
 * Phase 3 + Phase 4 Special Ship Scenarios (§1.2, §3.1, §3.11, §3.13):
 * - Jupiter & Saturn: Dodge space objects & escape planetary gravitational pull
 * - Sun (§3.13): Enormous Sun sphere, 1 Solar Flare every 4s, place 50 Dyson Sphere panels.
 *   Hitting a flare or getting too close resets panels and replays Mercury → Sun (4.2).
 *   Placing all 50 triggers Final Animation (4.3)!
 */
export const SpecialScenarioCanvas: React.FC<SpecialScenarioCanvasProps> = ({
  snapshotRef,
  inputManager,
  paused,
  language,
  onSyncHud,
  onOpenScreen,
  onScenarioCleared,
  onSunSetback,
  onSunDysonComplete,
  onGameOver,
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

    const W = 480;
    const H = 270;
    const isInitialSun = snapshotRef.current.planetPreset.id === 'sun';
    const coreX = isInitialSun ? 28 : 48;
    const coreY = H / 2;
    const dangerRadius = isInitialSun ? 66 : 42;

    let shipX = isInitialSun ? 290 : 240;
    let shipY = H / 2;
    let shipVx = 0;
    let shipVy = 0;
    let escapeProgress = 0;
    let sunPanelsPlaced = snapshotRef.current.specialScenario?.sunPanelsPlaced ?? 0;
    let invulnTimer = 0;
    let hitstopTimer = 0;
    let shakeIntensity = 0;
    let objectSpawnTimer = 0.6;
    let flareSpawnTimer = 4.0;
    let hudSyncAcc = 0;
    let globalTime = 0;
    let scenarioDone = false;

    const objects: SpaceObject[] = [];
    const flares: SolarFlareWave[] = [];

    const createDysonAnchor = (): DysonAnchor => ({
      x: 165 + Math.random() * 265,
      y: 36 + Math.random() * (H - 72),
      pulse: Math.random() * Math.PI * 2,
    });
    const dysonAnchors: DysonAnchor[] = isInitialSun
      ? [createDysonAnchor(), createDysonAnchor(), createDysonAnchor()]
      : [];

    const updateTargetFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * W;
      const ny = ((clientY - rect.top) / Math.max(1, rect.height)) * H;
      inputManager.shipTargetCanvasPos = { x: nx, y: ny };
    };

    const onPointerMove = (e: PointerEvent) => updateTargetFromClient(e.clientX, e.clientY);
    const onPointerDown = (e: PointerEvent) => updateTargetFromClient(e.clientX, e.clientY);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(320, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(240, Math.floor(canvas.clientHeight * dpr));
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      globalTime += dt;

      const actions = inputManager.consumeActions();
      for (const act of actions) {
        if (act === 'pause') {
          onOpenScreen(pausedRef.current ? 'playing' : 'pause');
          return;
        }
        if (act === 'suit' && !pausedRef.current) {
          const nextSuit = !snapshotRef.current.suitEquipped;
          soundEngine.playSuitToggle(nextSuit);
          snapshotRef.current = { ...snapshotRef.current, suitEquipped: nextSuit };
          onSyncHud(snapshotRef.current);
        }
      }

      const snap = snapshotRef.current;
      const planet = PLANET_CATALOG[snap.planetPreset.id];
      const isSun = planet.id === 'sun';

      if (!pausedRef.current && snap.stats.health > 0 && !scenarioDone) {
        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        } else {
          // 1. Survival rules run live during flight
          const surv = stepSurvival(snap, {
            dt,
            isMoving: true,
            isRunning: false,
            isMiningOrTraining: false,
            ambientTempC: planet.baseTempC,
            currentZone: 'space_scenario',
          });
          let nextSnap = surv.snapshot;

          // 2. Ship movement toward cursor/touch (§1.2) + Gravitational Pull (§3.11)
          const target = inputManager.shipTargetCanvasPos;
          const moveInput = inputManager.getMoveVector();
          let thrustX = 0;
          let thrustY = 0;

          if (target) {
            const dx = target.x - shipX;
            const dy = target.y - shipY;
            const d = Math.hypot(dx, dy);
            if (d > 4) {
              thrustX = (dx / d) * 205;
              thrustY = (dy / d) * 205;
            }
          } else if (Math.hypot(moveInput.x, moveInput.y) > 0.05) {
            thrustX = moveInput.x * 205;
            thrustY = moveInput.y * 205;
          }

          // Gravitational tug toward planet/star core
          const gx = coreX - shipX;
          const gy = coreY - shipY;
          const gDist = Math.max(30, Math.hypot(gx, gy));
          const gravAccel = planet.gravityStrength * (1 + (180 - Math.min(180, gDist)) / 180);
          const pullX = (gx / gDist) * gravAccel;
          const pullY = (gy / gDist) * gravAccel;

          shipVx = (shipVx + (thrustX + pullX) * dt) * Math.exp(-2.6 * dt);
          shipVy = (shipVy + (thrustY + pullY) * dt) * Math.exp(-2.6 * dt);
          shipX = Math.max(20, Math.min(W - 22, shipX + shipVx * dt));
          shipY = Math.max(20, Math.min(H - 20, shipY + shipVy * dt));

          // Check gravity core / scorching photosphere capture
          if (Math.hypot(shipX - coreX, shipY - coreY) < dangerRadius) {
            soundEngine.playDamage();
            if (isSun) {
              scenarioDone = true;
              onSunSetback();
              return;
            }
            nextSnap = {
              ...nextSnap,
              stats: { ...nextSnap.stats, health: 0 },
              deathReason: `Failed to escape ${planet.nameEn}’s gravitational pull`,
            };
            snapshotRef.current = nextSnap;
            onSyncHud(nextSnap);
            onGameOver(nextSnap);
            return;
          }

          if (invulnTimer > 0) invulnTimer = Math.max(0, invulnTimer - dt);
          if (shakeIntensity > 0) shakeIntensity = Math.max(0, shakeIntensity - dt * 14);

          // 3. Space Objects (Jupiter & Saturn)
          if (planet.hasSpaceObjects) {
            objectSpawnTimer -= dt;
            if (objectSpawnTimer <= 0) {
              objectSpawnTimer = planet.id === 'saturn' ? 0.55 : 0.68;
              objects.push({
                x: W + 16,
                y: 24 + Math.random() * (H - 48),
                vx: -(85 + Math.random() * 75),
                vy: (Math.random() - 0.5) * 32,
                r: 5 + Math.floor(Math.random() * 6),
                color: planet.id === 'saturn' ? '#fde68a' : '#94a3b8',
              });
            }

            for (let i = objects.length - 1; i >= 0; i--) {
              const o = objects[i];
              o.x += o.vx * dt;
              o.y += o.vy * dt;
              if (Math.hypot(o.x - shipX, o.y - shipY) < o.r + 9 && invulnTimer <= 0) {
                invulnTimer = 0.7;
                hitstopTimer = 0.045;
                shakeIntensity = 4;
                soundEngine.playDamage();
                nextSnap = {
                  ...nextSnap,
                  stats: {
                    ...nextSnap.stats,
                    health: Math.max(0, nextSnap.stats.health - 16),
                  },
                };
                objects.splice(i, 1);
                continue;
              }
              if (o.x < -24) objects.splice(i, 1);
            }

            const distBonus = shipX > 280 ? 6.2 : 4.2;
            escapeProgress = Math.min(100, escapeProgress + distBonus * dt);
            if (escapeProgress >= 100 && !scenarioDone) {
              scenarioDone = true;
              soundEngine.playWake();
              snapshotRef.current = nextSnap;
              onSyncHud(nextSnap);
              onScenarioCleared(planet.id as 'jupiter' | 'saturn');
              return;
            }
          }

          // 4. Sun Final Objective (§3.13):
          // - 1 Solar Flare every 4 seconds
          // - Hitting a flare loses attempt -> Mercury-to-Sun cinematic replays + panels reset
          // - Placing 50 panels completes Dyson Sphere -> triggers Final Animation 4.3
          if (planet.hasSolarFlares) {
            flareSpawnTimer -= dt;
            if (flareSpawnTimer <= 0) {
              flareSpawnTimer = 4.0;
              const centerAng = (Math.random() - 0.5) * 0.95;
              flares.push({
                radius: 70,
                speed: 96,
                angleStart: centerAng - 0.42,
                angleSpan: 0.84,
                hitShip: false,
              });
              soundEngine.playWarning();
            }

            const shipDist = Math.hypot(shipX - coreX, shipY - coreY);
            const shipAng = Math.atan2(shipY - coreY, shipX - coreX);

            for (let i = flares.length - 1; i >= 0; i--) {
              const f = flares[i];
              f.radius += f.speed * dt;
              if (
                !f.hitShip &&
                Math.abs(shipDist - f.radius) < 9 &&
                shipAng >= f.angleStart &&
                shipAng <= f.angleStart + f.angleSpan
              ) {
                f.hitShip = true;
                scenarioDone = true;
                soundEngine.playDamage();
                onSunSetback();
                return;
              }
              if (f.radius > W + 70) flares.splice(i, 1);
            }

            // Collect/deploy Dyson Sphere panels by flying through glowing Orbital Anchor Nodes
            for (let i = 0; i < dysonAnchors.length; i++) {
              const anc = dysonAnchors[i];
              anc.pulse += dt * 4;
              if (Math.hypot(shipX - anc.x, shipY - anc.y) < 18) {
                sunPanelsPlaced = Math.min(50, sunPanelsPlaced + 1);
                soundEngine.playInteract();
                dysonAnchors[i] = createDysonAnchor();
                if (sunPanelsPlaced >= 50 && !scenarioDone) {
                  scenarioDone = true;
                  soundEngine.playWake();
                  const wonSnap: GameSnapshot = {
                    ...nextSnap,
                    dysonSphereCompleted: true,
                    specialScenario: {
                      active: true,
                      planetId: 'sun',
                      escapeProgress: 100,
                      sunPanelsPlaced: 50,
                      elapsedSeconds: (snap.specialScenario?.elapsedSeconds ?? 0) + dt,
                    },
                  };
                  snapshotRef.current = wonSnap;
                  onSyncHud(wonSnap);
                  onSunDysonComplete();
                  return;
                }
              }
            }
          }

          nextSnap = {
            ...nextSnap,
            hooks: {
              ...nextSnap.hooks,
              gravitationalPull: { x: pullX, y: pullY },
              spaceObjectsActive: planet.hasSpaceObjects,
              solarFlaresActive: planet.hasSolarFlares,
            },
            specialScenario: {
              active: true,
              planetId: planet.id as 'jupiter' | 'saturn' | 'sun',
              escapeProgress,
              sunPanelsPlaced,
              elapsedSeconds: (snap.specialScenario?.elapsedSeconds ?? 0) + dt,
            },
          };

          snapshotRef.current = nextSnap;
          if (nextSnap.stats.health <= 0) {
            onSyncHud(nextSnap);
            onGameOver(nextSnap);
            return;
          }

          hudSyncAcc += dt;
          if (hudSyncAcc >= 0.12) {
            hudSyncAcc = 0;
            onSyncHud(nextSnap);
          }
        }
      }

      // === RENDER 16-BIT SPECIAL SCENARIO ===
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = isSun ? '#140603' : '#050713';
      ctx.fillRect(0, 0, cw, ch);

      const scaleX = cw / W;
      const scaleY = ch / H;
      const shakeX = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;
      const shakeY = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;

      ctx.save();
      ctx.scale(scaleX, scaleY);
      ctx.translate(shakeX, shakeY);

      // Moving starfield
      for (let i = 0; i < 60; i++) {
        const sx = (((i * 97 - globalTime * (20 + (i % 4) * 14)) % W) + W) % W;
        const sy = (i * 53) % H;
        ctx.fillStyle = isSun ? '#fed7aa' : i % 5 === 0 ? '#7dd3fc' : '#e2e8f0';
        ctx.fillRect(Math.round(sx), sy, i % 6 === 0 ? 2 : 1, 1);
      }

      // Gravity well rings
      ctx.strokeStyle = isSun ? 'rgba(251, 146, 60, 0.25)' : 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      for (let r = 82; r <= 200; r += 38) {
        ctx.beginPath();
        ctx.arc(coreX, coreY, r, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      }

      // Giant Planet / Enormous Sun Sphere (§3.13)
      const sphereRadius = isSun ? 74 : 44;
      if (isSun) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
        ctx.beginPath();
        ctx.arc(coreX, coreY, sphereRadius + 10 + Math.sin(globalTime * 5) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(coreX, coreY, sphereRadius, 0, Math.PI * 2);
      ctx.fill();
      if (planet.id === 'saturn') {
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(coreX, coreY, 64, 16, -0.35, 0, Math.PI * 2);
        ctx.stroke();
      } else if (planet.id === 'jupiter') {
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(coreX - 6, coreY + 8, 18, 8);
      } else if (isSun) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(coreX, coreY, 52 + Math.sin(globalTime * 7) * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Render already-placed Dyson Sphere panels orbiting around the enormous Sun!
        for (let p = 0; p < sunPanelsPlaced; p++) {
          const ang = -Math.PI * 0.42 + (p / 50) * Math.PI * 0.84;
          const r = 82 + (p % 2) * 8;
          const px = coreX + Math.cos(ang) * r;
          const py = coreY + Math.sin(ang) * r;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(Math.round(px - 2), Math.round(py - 2), 5, 5);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(px - 2), Math.round(py - 2), 5, 5);
        }

        // Render active Dyson Panel Anchor Targets to fly into
        for (const anc of dysonAnchors) {
          const r = 9 + Math.sin(anc.pulse) * 2;
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.strokeRect(Math.round(anc.x - r), Math.round(anc.y - r), Math.round(r * 2), Math.round(r * 2));
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(Math.round(anc.x - 4), Math.round(anc.y - 4), 8, 8);
        }
      }

      // Solar Flare Waves (1 every 4s)
      for (const f of flares) {
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(coreX, coreY, f.radius, f.angleStart, f.angleStart + f.angleSpan);
        ctx.stroke();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coreX, coreY, f.radius, f.angleStart, f.angleStart + f.angleSpan);
        ctx.stroke();
      }

      // Space Objects
      for (const o of objects) {
        ctx.fillStyle = o.color;
        ctx.fillRect(Math.round(o.x - o.r), Math.round(o.y - o.r), o.r * 2, o.r * 2);
        ctx.fillStyle = '#475569';
        ctx.fillRect(Math.round(o.x - o.r + 2), Math.round(o.y - o.r + 2), 3, 3);
      }

      // Player Ship
      if (invulnTimer <= 0 || Math.floor(globalTime * 20) % 2 === 0) {
        ctx.fillStyle = Math.sin(globalTime * 25) > 0 ? '#facc15' : '#f97316';
        ctx.fillRect(Math.round(shipX - 13), Math.round(shipY - 2), 6, 4);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(Math.round(shipX - 8), Math.round(shipY - 5), 16, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.round(shipX + 2), Math.round(shipY - 3), 5, 6);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(Math.round(shipX - 6), Math.round(shipY - 7), 5, 2);
        ctx.fillRect(Math.round(shipX - 6), Math.round(shipY + 5), 5, 2);
      }

      // Top Scenario Progress / Objective Banner
      ctx.fillStyle = 'rgba(11, 16, 34, 0.9)';
      ctx.fillRect(130, 8, 220, 24);
      ctx.strokeStyle = isSun ? '#facc15' : '#38bdf8';
      ctx.strokeRect(130.5, 8.5, 219, 23);
      ctx.font = 'bold 7px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      if (isSun) {
        ctx.fillText(
          langRef.current === 'es'
            ? `ESFERA DE DYSON: ${sunPanelsPlaced} / 50 PANELES`
            : `DYSON SPHERE: ${sunPanelsPlaced} / 50 PANELS`,
          240,
          17
        );
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(156, 22, 168, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(156, 22, Math.round((168 * sunPanelsPlaced) / 50), 5);
      } else {
        ctx.fillText(
          langRef.current === 'es'
            ? `ESCAPAR GRAVEDAD: ${Math.round(escapeProgress)}%`
            : `ESCAPE GRAVITY: ${Math.round(escapeProgress)}%`,
          240,
          17
        );
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(156, 22, 168, 5);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(156, 22, Math.round(1.68 * escapeProgress), 5);
      }

      ctx.restore();
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [inputManager, onGameOver, onOpenScreen, onScenarioCleared, onSunDysonComplete, onSunSetback, onSyncHud, snapshotRef]);

  return <canvas ref={canvasRef} className="w-full h-full block pixelated cursor-crosshair" />;
};
