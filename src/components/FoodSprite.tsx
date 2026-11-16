import React from 'react';
import { FoodId, FuelId, GasId, MineralId } from '../types/game';

interface FoodSpriteProps {
  id: FoodId;
  size?: number;
}

/**
 * 16-bit Pixel Art Food & Vegetable Tiles
 * Modeled directly on the attached sprite sheets (image_b4a85714.png & image_5174349d.png):
 * Sage-cream tile backdrop (#ecf5d9), dark #1d2330 outlines, and retro 16-bit shading.
 */
export const FoodSprite: React.FC<FoodSpriteProps> = ({ id, size = 36 }) => {
  const renderIcon = () => {
    switch (id) {
      case 'chicken':
        return (
          <>
            <rect x="3" y="10" width="2" height="2" fill="#f8fafc" />
            <rect x="4" y="11" width="2" height="2" fill="#cbd5e1" />
            <rect x="6" y="3" width="6" height="7" fill="#c26323" />
            <rect x="7" y="4" width="4" height="5" fill="#d97724" />
            <rect x="9" y="4" width="2" height="2" fill="#f59e0b" />
          </>
        );
      case 'beef_fajitas':
        return (
          <>
            <rect x="2" y="6" width="12" height="6" fill="#272c3f" />
            <rect x="3" y="5" width="10" height="6" fill="#5c2d1e" />
            <rect x="4" y="6" width="2" height="2" fill="#ef4444" />
            <rect x="7" y="7" width="3" height="2" fill="#22c55e" />
            <rect x="10" y="6" width="2" height="2" fill="#facc15" />
            <rect x="5" y="2" width="1" height="2" fill="#cbd5e1" />
            <rect x="9" y="2" width="1" height="2" fill="#cbd5e1" />
          </>
        );
      case 'chili_con_carne':
        return (
          <>
            <rect x="3" y="8" width="10" height="5" fill="#d6a56e" />
            <rect x="2" y="6" width="12" height="3" fill="#991b1b" />
            <rect x="4" y="6" width="2" height="1" fill="#ef4444" />
            <rect x="8" y="6" width="2" height="1" fill="#fbbf24" />
            <rect x="6" y="2" width="1" height="2" fill="#cbd5e1" />
            <rect x="10" y="2" width="1" height="2" fill="#cbd5e1" />
          </>
        );
      case 'turkey':
        return (
          <>
            <rect x="3" y="10" width="10" height="3" fill="#e2e8f0" />
            <rect x="4" y="4" width="8" height="6" fill="#b45309" />
            <rect x="5" y="5" width="6" height="4" fill="#d97706" />
            <rect x="2" y="7" width="2" height="2" fill="#f8fafc" />
            <rect x="12" y="7" width="2" height="2" fill="#f8fafc" />
          </>
        );
      case 'tuna':
        return (
          <>
            <rect x="3" y="3" width="10" height="10" fill="#cbd5e1" />
            <rect x="3" y="5" width="10" height="6" fill="#2563eb" />
            <rect x="5" y="7" width="5" height="2" fill="#e2e8f0" />
            <rect x="10" y="6" width="1" height="4" fill="#e2e8f0" />
          </>
        );
      case 'bouillon_cubes':
        return (
          <>
            <rect x="2" y="2" width="4" height="4" fill="#b45309" />
            <rect x="3" y="3" width="2" height="2" fill="#f59e0b" />
            <rect x="9" y="3" width="4" height="4" fill="#b45309" />
            <rect x="10" y="4" width="2" height="2" fill="#f59e0b" />
            <rect x="6" y="6" width="4" height="4" fill="#b45309" />
            <rect x="7" y="7" width="2" height="2" fill="#f59e0b" />
            <rect x="3" y="10" width="4" height="4" fill="#b45309" />
            <rect x="4" y="11" width="2" height="2" fill="#f59e0b" />
            <rect x="10" y="10" width="4" height="4" fill="#b45309" />
            <rect x="11" y="11" width="2" height="2" fill="#f59e0b" />
          </>
        );
      case 'soups':
        return (
          <>
            <rect x="3" y="8" width="10" height="5" fill="#1d4ed8" />
            <rect x="4" y="10" width="8" height="1" fill="#e2e8f0" />
            <rect x="3" y="6" width="10" height="2" fill="#f59e0b" />
            <rect x="6" y="6" width="2" height="1" fill="#22c55e" />
            <rect x="5" y="2" width="1" height="2" fill="#cbd5e1" />
            <rect x="10" y="2" width="1" height="2" fill="#cbd5e1" />
          </>
        );
      case 'tomato':
        return (
          <>
            <rect x="6" y="2" width="4" height="2" fill="#16a34a" />
            <rect x="3" y="4" width="10" height="9" fill="#dc2626" />
            <rect x="4" y="5" width="8" height="7" fill="#ef4444" />
            <rect x="5" y="6" width="2" height="2" fill="#fecaca" />
          </>
        );
      case 'lettuce':
        return (
          <>
            <rect x="3" y="3" width="10" height="10" fill="#84cc16" />
            <rect x="4" y="4" width="8" height="8" fill="#a3e635" />
            <rect x="5" y="6" width="2" height="2" fill="#65a30d" />
            <rect x="9" y="8" width="2" height="2" fill="#65a30d" />
          </>
        );
      case 'cucumber':
        return (
          <>
            <rect x="2" y="5" width="12" height="6" fill="#15803d" />
            <rect x="3" y="6" width="10" height="4" fill="#22c55e" />
            <rect x="5" y="7" width="1" height="1" fill="#14532d" />
            <rect x="9" y="8" width="1" height="1" fill="#14532d" />
            <rect x="4" y="6" width="2" height="1" fill="#bbf7d0" />
          </>
        );
      case 'radish':
        return (
          <>
            <rect x="5" y="1" width="6" height="4" fill="#16a34a" />
            <rect x="4" y="5" width="8" height="6" fill="#dc2626" />
            <rect x="6" y="11" width="4" height="3" fill="#f8fafc" />
            <rect x="5" y="7" width="2" height="2" fill="#fca5a5" />
          </>
        );
      case 'spinach':
        return (
          <>
            <rect x="7" y="9" width="2" height="5" fill="#14532d" />
            <rect x="3" y="3" width="10" height="7" fill="#15803d" />
            <rect x="4" y="4" width="8" height="5" fill="#22c55e" />
          </>
        );
      case 'leafy_greens':
        return (
          <>
            <rect x="3" y="9" width="3" height="4" fill="#14532d" />
            <rect x="4" y="4" width="8" height="7" fill="#16a34a" />
            <rect x="6" y="3" width="6" height="6" fill="#4ade80" />
          </>
        );
      case 'cabbage':
        return (
          <>
            <rect x="3" y="3" width="10" height="10" fill="#65a30d" />
            <rect x="4" y="4" width="8" height="8" fill="#a3e635" />
            <rect x="5" y="5" width="5" height="2" fill="#ecfccb" />
            <rect x="7" y="8" width="4" height="2" fill="#ecfccb" />
          </>
        );
      case 'arugula':
        return (
          <>
            <rect x="7" y="9" width="2" height="5" fill="#14532d" />
            <rect x="3" y="5" width="4" height="4" fill="#22c55e" />
            <rect x="9" y="5" width="4" height="4" fill="#22c55e" />
            <rect x="6" y="2" width="4" height="7" fill="#16a34a" />
          </>
        );
      case 'beet':
        return (
          <>
            <rect x="5" y="1" width="6" height="4" fill="#16a34a" />
            <rect x="4" y="5" width="8" height="7" fill="#86198f" />
            <rect x="7" y="12" width="2" height="2" fill="#a21caf" />
            <rect x="5" y="7" width="2" height="2" fill="#f0abfc" />
          </>
        );
      case 'basil':
        return (
          <>
            <rect x="7" y="9" width="2" height="5" fill="#14532d" />
            <rect x="2" y="6" width="5" height="4" fill="#22c55e" />
            <rect x="9" y="6" width="5" height="4" fill="#22c55e" />
            <rect x="5" y="2" width="6" height="5" fill="#16a34a" />
          </>
        );
      case 'parsley':
        return (
          <>
            <rect x="7" y="9" width="2" height="5" fill="#14532d" />
            <rect x="3" y="3" width="4" height="5" fill="#22c55e" />
            <rect x="9" y="3" width="4" height="5" fill="#22c55e" />
            <rect x="6" y="2" width="4" height="6" fill="#4ade80" />
          </>
        );
      case 'chives':
        return (
          <>
            <rect x="5" y="10" width="6" height="4" fill="#f8fafc" />
            <rect x="3" y="3" width="2" height="7" fill="#4ade80" />
            <rect x="7" y="2" width="2" height="8" fill="#22c55e" />
            <rect x="11" y="3" width="2" height="7" fill="#4ade80" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="pixelated shrink-0 border-2 border-[#6e8268] bg-[#ecf5d9]"
      aria-hidden="true"
    >
      {renderIcon()}
    </svg>
  );
};

export const MineralSprite: React.FC<{ id: MineralId; size?: number }> = ({
  id,
  size = 28,
}) => {
  const palette: Record<MineralId, [string, string]> = {
    iron: ['#64748b', '#cbd5e1'],
    titanium: ['#94a3b8', '#f1f5f9'],
    ilmenite: ['#4338ca', '#818cf8'],
    silicon: ['#0284c7', '#7dd3fc'],
    nickel: ['#ca8a04', '#fde047'],
    platinum: ['#cbd5e1', '#ffffff'],
    carbon: ['#1e293b', '#475569'],
  };
  const [base, hi] = palette[id];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="pixelated shrink-0 bg-slate-900 border border-slate-600"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="8" height="8" fill={base} />
      <rect x="3" y="6" width="10" height="5" fill={base} />
      <rect x="5" y="5" width="4" height="3" fill={hi} />
      <rect x="6" y="3" width="3" height="2" fill={hi} />
    </svg>
  );
};

export const GasOrFuelSprite: React.FC<{ id: GasId | FuelId; size?: number }> = ({
  id,
  size = 28,
}) => {
  const color =
    id === 'oxygen_gas'
      ? '#38bdf8'
      : id === 'hydrogen_gas'
        ? '#c084fc'
        : id === 'hydro_oxy_fuel'
          ? '#f97316'
          : '#22d3ee';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="pixelated shrink-0 bg-slate-900 border border-slate-600"
      aria-hidden="true"
    >
      <rect x="5" y="2" width="6" height="2" fill="#94a3b8" />
      <rect x="4" y="4" width="8" height="10" fill="#334155" />
      <rect x="5" y="6" width="6" height="6" fill={color} />
      <rect x="6" y="7" width="2" height="3" fill="#ffffff" opacity="0.6" />
    </svg>
  );
};
