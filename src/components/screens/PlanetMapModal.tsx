import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Fuel,
  Lock,
  Navigation,
  Rocket,
  Thermometer,
  X,
} from 'lucide-react';
import {
  getNextRoutePlanet,
  PLANET_CATALOG,
  ROUTE_ORDER,
} from '../../data/phase3Planets';
import { soundEngine } from '../../engine/audio';
import { loadFuelCanisterToShip } from '../../engine/survival';
import { SOLAR_LABELS, TEXT } from '../../i18n/translations';
import { GameSnapshot, Language, PlanetId } from '../../types/game';

interface PlanetMapModalProps {
  snapshot: GameSnapshot;
  language: Language;
  onUpdateSnapshot: (next: GameSnapshot) => void;
  onLaunchTrip: (toPlanetId: PlanetId) => void;
  onLockedAccess: (contextEs: string, contextEn: string) => void;
  onClose: () => void;
}

export const PlanetMapModal: React.FC<PlanetMapModalProps> = ({
  snapshot,
  language,
  onUpdateSnapshot,
  onLaunchTrip,
  onLockedAccess,
  onClose,
}) => {
  const es = language === 'es';
  const t = TEXT[language];
  const currentId = snapshot.planetPreset.id;
  const nextPlanetId = getNextRoutePlanet(currentId);
  const [selectedId, setSelectedId] = useState<PlanetId>(
    nextPlanetId ?? currentId
  );

  const selectedPlanet = PLANET_CATALOG[selectedId];
  const isCurrent = selectedId === currentId;
  const isNext = selectedId === nextPlanetId;
  const isPassed =
    ROUTE_ORDER.indexOf(selectedId) < ROUTE_ORDER.indexOf(currentId);
  const isLocked = !isCurrent && !isNext && !isPassed;
  const hasEnoughFuel = snapshot.stats.fuel >= selectedPlanet.fuelCostToEnter;

  const formatDist = (km: number, au: number) => {
    if (km === 0) return es ? 'Inicio' : 'Origin';
    return `${km.toLocaleString()} km (${au} AU)`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="pixel-panel w-full max-w-5xl p-4 sm:p-5 text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header & Odometer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-slate-700">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-pixel text-base sm:text-lg text-cyan-300">
                {t.screens.planet_map}
              </h2>
              <div className="text-[11px] font-mono-num text-slate-400">
                {es ? 'Odómetro de Nave:' : 'Ship Odometer:'}{' '}
                <span className="text-amber-300 font-bold">
                  {snapshot.odometerKm.toLocaleString()} km
                </span>{' '}
                · {es ? 'Combustible:' : 'Fuel:'}{' '}
                <span className="text-orange-300 font-bold">
                  {Math.round(snapshot.stats.fuel)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {snapshot.storage.fuel.hydro_oxy_fuel > 0 &&
              snapshot.stats.fuel < 100 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playHydrate();
                    onUpdateSnapshot(loadFuelCanisterToShip(snapshot));
                  }}
                  className="pixel-btn px-3 py-1.5 bg-orange-500 border-2 border-orange-200 text-slate-950 font-pixel text-[10px] cursor-pointer flex items-center gap-1"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>
                    {es
                      ? `Cargar +25% (${snapshot.storage.fuel.hydro_oxy_fuel})`
                      : `Refuel +25% (${snapshot.storage.fuel.hydro_oxy_fuel})`}
                  </span>
                </button>
              )}
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
          </div>
        </div>

        {/* Interactive Solar System Route Chain */}
        <div className="mt-3 p-3 bg-[#060915] border-2 border-slate-700 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max py-1">
            {ROUTE_ORDER.map((pid, idx) => {
              const p = PLANET_CATALOG[pid];
              const pIsCurrent = pid === currentId;
              const pIsNext = pid === nextPlanetId;
              const pIsPassed = idx < ROUTE_ORDER.indexOf(currentId);
              const pIsLocked = !pIsCurrent && !pIsNext && !pIsPassed;
              const isSelected = pid === selectedId;

              return (
                <React.Fragment key={pid}>
                  {idx > 0 && (
                    <div className="flex flex-col items-center px-1 shrink-0">
                      <div
                        className={`h-0.5 w-10 ${
                          pIsPassed || pIsCurrent
                            ? 'bg-emerald-400'
                            : pIsNext
                              ? 'bg-cyan-400'
                              : 'bg-slate-700'
                        }`}
                      />
                      <span className="text-[9px] font-mono-num text-slate-400 mt-0.5 whitespace-nowrap">
                        {p.distanceFromPrevAu} AU
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedId(pid);
                      if (pIsLocked) {
                        onLockedAccess(p.nameEs, p.nameEn);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 border-2 transition-transform cursor-pointer shrink-0 w-20 ${
                      isSelected
                        ? 'bg-slate-800 border-amber-300 scale-105'
                        : pIsCurrent
                          ? 'bg-sky-950/80 border-cyan-400'
                          : pIsNext
                            ? 'bg-slate-900 border-emerald-400'
                            : pIsPassed
                              ? 'bg-slate-900/70 border-slate-600 opacity-75'
                              : 'bg-slate-950 border-slate-800 opacity-45'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full border-2 border-slate-950 flex items-center justify-center"
                      style={{
                        backgroundColor: pIsLocked ? '#1e293b' : p.color,
                      }}
                    >
                      {pIsLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      {pIsPassed && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <span className="font-pixel text-[9px] text-center leading-tight truncate w-full">
                      {es ? p.nameEs : p.nameEn}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Planet Detail & Launch Panel */}
        <div className="mt-3 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8 p-3.5 bg-slate-900 border-2 border-slate-700 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-5 h-5 inline-block border border-white/40"
                  style={{
                    backgroundColor: isLocked ? '#334155' : selectedPlanet.color,
                  }}
                />
                <h3 className="font-pixel text-base text-white">
                  {es ? selectedPlanet.nameEs : selectedPlanet.nameEn}
                </h3>
              </div>
              <span className="font-mono-num text-xs text-slate-300">
                {isCurrent
                  ? es
                    ? 'UBICACIÓN ACTUAL'
                    : 'CURRENT STOP'
                  : isPassed
                    ? es
                      ? 'VISITADO (SIN RETORNO)'
                      : 'VISITED (NO RETURN)'
                    : isNext
                      ? es
                        ? 'SIGUIENTE DESTINO'
                        : 'NEXT DESTINATION'
                      : es
                        ? 'BLOQUEADO'
                        : 'LOCKED'}
              </span>
            </div>

            {isLocked ? (
              <p className="text-xs text-slate-400 py-4">
                {es
                  ? 'Debes completar los destinos anteriores en la ruta para desbloquear este astro.'
                  : 'Complete earlier stops along the solar route to unlock this destination.'}
              </p>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {es ? selectedPlanet.descEs : selectedPlanet.descEn}
                </p>
                <div className="p-2 bg-slate-950/80 border border-slate-800 text-xs text-cyan-200">
                  <strong className="font-pixel text-[10px] text-amber-300 mr-1.5">
                    {es ? 'DATO:' : 'FACT:'}
                  </strong>
                  {es ? selectedPlanet.factEs : selectedPlanet.factEn}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2 bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-300" />
                      <span>{es ? 'Temperatura' : 'Temperature'}</span>
                    </div>
                    <div className="font-mono-num font-bold text-slate-100 mt-0.5">
                      {selectedPlanet.id === 'mercury'
                        ? '430°C / -180°C'
                        : `${selectedPlanet.baseTempC}°C`}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400">
                      {es ? 'Energía Solar' : 'Solar Energy'}
                    </div>
                    <div className="font-pixel text-[11px] text-yellow-300 mt-0.5">
                      {SOLAR_LABELS[selectedPlanet.solarExposure][language]}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400">
                      {es ? 'Distancia tramo' : 'Leg Distance'}
                    </div>
                    <div className="font-mono-num text-[11px] text-cyan-300 mt-0.5 truncate">
                      {formatDist(
                        selectedPlanet.distanceFromPrevKm,
                        selectedPlanet.distanceFromPrevAu
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Travel Action Box */}
          <div className="lg:col-span-4 p-3.5 bg-slate-900 border-2 border-slate-700 flex flex-col justify-between gap-3">
            <div className="space-y-2">
              <div className="font-pixel text-xs text-amber-300">
                {es ? 'Control de Viaje' : 'Trip Control'}
              </div>
              {isNext ? (
                <>
                  <div className="text-xs text-slate-300 font-mono-num">
                    {es ? 'Combustible necesario:' : 'Fuel required:'}{' '}
                    <span
                      className={
                        hasEnoughFuel
                          ? 'text-emerald-300 font-bold'
                          : 'text-rose-400 font-bold'
                      }
                    >
                      {selectedPlanet.fuelCostToEnter}%
                    </span>
                  </div>
                  {selectedPlanet.cannotLand && (
                    <div className="p-2 bg-amber-950/70 border border-amber-500 text-[11px] text-amber-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        {es
                          ? 'No es posible aterrizar: escenario espacial de gravedad y amenazas.'
                          : 'Cannot land: special ship gravity & hazard flight scenario!'}
                      </span>
                    </div>
                  )}
                  <div className="p-2 bg-rose-950/60 border border-rose-700 text-[11px] text-rose-200">
                    {es
                      ? 'Sin retorno: al iniciar el viaje no podrás volver al planeta anterior.'
                      : 'No going back: once launched, you cannot return to the previous planet.'}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  {isPassed
                    ? es
                      ? 'Ya dejaste atrás este destino en tu odisea.'
                      : 'You have already passed this destination.'
                    : isCurrent
                      ? es
                        ? 'Selecciona el siguiente destino en la ruta para viajar.'
                        : 'Select the next stop on the route to launch.'
                      : es
                        ? 'Destino bloqueado hasta avanzar en la ruta.'
                        : 'Destination locked until earlier stops are cleared.'}
                </p>
              )}
            </div>

            {isNext && (
              <button
                type="button"
                disabled={!hasEnoughFuel}
                onClick={() => {
                  soundEngine.playWake();
                  onLaunchTrip(selectedId);
                }}
                className="pixel-btn w-full py-3 px-4 bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 border-2 border-emerald-200 disabled:border-slate-600 text-slate-950 disabled:text-slate-400 font-pixel text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>
                  {hasEnoughFuel
                    ? es
                      ? `Viajar a ${selectedPlanet.nameEs}`
                      : `Travel to ${selectedPlanet.nameEn}`
                    : es
                      ? 'Falta Combustible'
                      : 'Not Enough Fuel'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
