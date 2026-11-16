import { CharacterId, Direction, PlayerAnimState } from '../types/game';

/**
 * 16-bit Pixel Art Astronaut Renderer
 * Modeled directly after Personajes_83a16f6b.jpeg:
 * - Chibi 16-bit proportions with dark pixel outlines
 * - White & cool-lavender spacesuit (#eef3ff / #b8c4df)
 * - Glowing cyan suit accents (#29d4ff / #0088cc)
 * - Leo: spiky dark charcoal hair (#222533)
 * - Nova: rich chestnut-brown ponytail (#4e3229 / #6b4639)
 * - Removable translucent blue glass helmet with glowing side ear-pods
 */
export function drawPixelAstronaut(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number; // center bottom x in logical world pixels
    y: number; // feet y in logical world pixels
    character: CharacterId;
    direction: Direction;
    suitEquipped: boolean;
    animState: PlayerAnimState;
    animTime: number;
    walkPhase: number;
    hitFlash?: boolean;
  }
) {
  const {
    x,
    y,
    character,
    direction,
    suitEquipped,
    animState,
    animTime,
    walkPhase,
    hitFlash,
  } = opts;

  ctx.save();

  // Base scale: draw on a 1px = 1 logical pixel grid (sprite is ~20x28 logical px)
  let offsetX = 0;
  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;

  // Animation transforms (16-bit squash, stretch, bounce, shiver)
  if (animState === 'idle') {
    offsetY = Math.sin(animTime * 3.5) > 0.4 ? -1 : 0;
  } else if (animState === 'move') {
    offsetY = -Math.abs(Math.sin(walkPhase)) * 2.2;
  } else if (animState === 'training') {
    const jump = Math.abs(Math.sin(animTime * 10));
    offsetY = -jump * 5;
    scaleX = 1 + (1 - jump) * 0.08;
    scaleY = 1 - (1 - jump) * 0.08;
  } else if (animState === 'freezing') {
    offsetX = Math.round(Math.sin(animTime * 42) * 1.3);
  } else if (animState === 'burn') {
    offsetY = -Math.abs(Math.sin(animTime * 16)) * 2;
  } else if (animState === 'fatigue') {
    offsetY = 1;
    scaleY = 0.94;
    scaleX = 1.04;
  } else if (animState === 'attack') {
    const lunge = Math.sin(Math.min(1, animTime * 8) * Math.PI);
    if (direction === 'left') offsetX = -lunge * 4;
    else if (direction === 'right') offsetX = lunge * 4;
    else if (direction === 'up') offsetY = -lunge * 4;
    else offsetY = lunge * 4;
    scaleX = 1 + lunge * 0.14;
    scaleY = 1 - lunge * 0.1;
  } else if (animState === 'consume' || animState === 'hydrate') {
    offsetY = Math.sin(animTime * 11) > 0 ? -1 : 0;
  }

  // Flip horizontally for right-facing side view
  const flipX = direction === 'right';
  const px = Math.round(x + offsetX);
  const py = Math.round(y + offsetY);

  ctx.translate(px, py);
  ctx.scale(flipX ? -scaleX : scaleX, scaleY);

  // Ground shadow
  ctx.fillStyle = 'rgba(5, 8, 22, 0.48)';
  ctx.fillRect(-7, -2, 14, 4);

  // Colors matching Personajes_83a16f6b.jpeg
  const outline = '#121526';
  const suitWhite = hitFlash ? '#ff8a8a' : animState === 'freezing' ? '#cdefff' : '#f1f5ff';
  const suitShade = hitFlash ? '#d85555' : animState === 'freezing' ? '#89c4ea' : '#aeb9d6';
  const suitDark = '#3a4362';
  const cyanBright = '#32d8ff';
  const cyanMid = '#0e8de6';
  const skin = animState === 'illness' ? '#cbe0b4' : animState === 'freezing' ? '#dbe9ff' : '#ffd5b8';
  const skinShade = animState === 'illness' ? '#9cb585' : '#e5ac8b';
  const hairMain = character === 'leo' ? '#232638' : '#4a2f26';
  const hairHi = character === 'leo' ? '#3d425c' : '#6c473a';

  const stride = animState === 'move' ? Math.sin(walkPhase) : 0;
  const leftLegY = stride > 0.25 ? -1 : 0;
  const rightLegY = stride < -0.25 ? -1 : 0;
  const armSwing = animState === 'move' ? Math.round(stride * 2) : 0;

  const r = (rx: number, ry: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(rx), Math.round(ry), Math.round(w), Math.round(h));
  };

  // --- LEGS & BOOTS ---
  if (direction === 'left' || direction === 'right') {
    const step = Math.round(stride * 2.5);
    // Back leg
    r(-3 - step, -8, 4, 6, suitShade);
    r(-3 - step, -3, 5, 3, suitDark);
    r(-3 - step, -7, 4, 1, outline);
    // Front leg
    r(-1 + step, -8, 5, 6, suitWhite);
    r(-1 + step, -6, 2, 2, cyanBright); // knee accent
    r(-1 + step, -3, 6, 3, suitDark);
    r(0 + step, -2, 4, 1, suitWhite);
  } else {
    // Left leg
    r(-6, -8 + leftLegY, 5, 5, suitWhite);
    r(-5, -6 + leftLegY, 2, 2, cyanBright);
    r(-6, -3 + leftLegY, 5, 3, suitDark);
    r(-6, -1 + leftLegY, 5, 1, outline);
    // Right leg
    r(1, -8 + rightLegY, 5, 5, suitWhite);
    r(3, -6 + rightLegY, 2, 2, cyanBright);
    r(1, -3 + rightLegY, 5, 3, suitDark);
    r(1, -1 + rightLegY, 5, 1, outline);
  }

  // --- TORSO & SUIT ---
  r(-6, -16, 12, 9, outline);
  r(-5, -15, 10, 7, suitWhite);
  r(-5, -10, 10, 2, suitShade);
  // Waist belt
  r(-5, -9, 10, 2, suitDark);
  r(-1, -9, 2, 2, cyanBright);

  if (direction === 'down') {
    // Front chest display unit
    r(-3, -14, 6, 4, suitDark);
    r(-2, -13, 4, 2, cyanBright);
    r(-2, -13, 1, 1, '#ffffff');
  } else if (direction === 'up') {
    // Backpack life-support unit
    r(-4, -15, 8, 6, outline);
    r(-3, -14, 6, 4, suitShade);
    r(-2, -13, 4, 1, cyanBright);
    r(-2, -11, 4, 1, cyanMid);
  } else {
    // Side view backpack
    r(3, -15, 4, 6, outline);
    r(3, -14, 3, 4, suitShade);
    r(4, -13, 1, 2, cyanBright);
  }

  // --- ARMS ---
  if (animState === 'training') {
    // Arms raised for jumping-jack training!
    r(-8, -19, 3, 5, outline);
    r(-7, -18, 2, 4, suitWhite);
    r(5, -19, 3, 5, outline);
    r(5, -18, 2, 4, suitWhite);
  } else if (animState === 'attack') {
    // Forward strike arm + energy pulse arc
    r(-8, -14, 3, 4, suitWhite);
    r(5, -15, 6, 3, suitWhite);
    r(9, -15, 2, 3, cyanBright);
  } else if (animState === 'interact') {
    // Extended scanner arm
    r(5, -15, 5, 3, suitWhite);
    r(9, -15, 2, 2, cyanBright);
  } else if (direction === 'left' || direction === 'right') {
    r(-2 + armSwing, -15, 4, 6, outline);
    r(-1 + armSwing, -14, 2, 4, suitWhite);
    r(-1 + armSwing, -11, 2, 2, suitDark);
    r(-1 + armSwing, -13, 2, 1, cyanMid);
  } else {
    // Left arm
    r(-8, -15 + armSwing, 3, 6, outline);
    r(-7, -14 + armSwing, 2, 4, suitWhite);
    r(-7, -11 + armSwing, 2, 2, suitDark);
    // Right arm
    r(5, -15 - armSwing, 3, 6, outline);
    r(5, -14 - armSwing, 2, 4, suitWhite);
    r(5, -11 - armSwing, 2, 2, suitDark);
  }

  // --- HEAD, HAIR & OPTIONAL HELMET ---
  if (suitEquipped) {
    // Space Helmet (rounded 16-bit dome with glowing side ear-pods)
    r(-7, -28, 14, 13, outline);
    r(-6, -27, 12, 11, suitWhite);
    r(-6, -18, 12, 2, suitShade);
    // Top cyan beacon
    r(-2, -27, 4, 1, cyanBright);

    if (direction === 'down') {
      // Visor window
      r(-5, -25, 10, 7, '#1a2d5c');
      r(-4, -24, 8, 5, skin);
      // Hair inside visor
      r(-4, -25, 8, 2, hairMain);
      // Eyes
      r(-3, -22, 2, 2, '#141726');
      r(1, -22, 2, 2, '#141726');
      // Visor glass shine
      r(-4, -24, 2, 1, '#9de9ff');
      // Side glowing ear-pods
      r(-8, -23, 2, 4, outline);
      r(-7, -22, 1, 2, cyanBright);
      r(6, -23, 2, 4, outline);
      r(6, -22, 1, 2, cyanBright);
    } else if (direction === 'up') {
      // Back of helmet + Nova's ponytail peeking out!
      r(-4, -24, 8, 5, suitShade);
      r(-2, -22, 4, 1, cyanBright);
      if (character === 'nova') {
        r(-2, -26, 4, 6, outline);
        r(-1, -25, 2, 5, hairMain);
      }
      r(-8, -23, 2, 4, cyanBright);
      r(6, -23, 2, 4, cyanBright);
    } else {
      // Side profile helmet (facing left by default, flipped for right)
      r(-6, -25, 6, 7, '#1a2d5c');
      r(-5, -24, 5, 5, skin);
      r(-5, -25, 5, 2, hairMain);
      r(-4, -22, 2, 2, '#141726');
      r(-5, -24, 1, 2, '#9de9ff');
      // Glowing side ear-pod
      r(1, -23, 3, 4, outline);
      r(2, -22, 1, 2, cyanBright);
      // Nova ponytail from helmet back
      if (character === 'nova') {
        r(6, -25, 4, 7, outline);
        r(6, -24, 3, 6, hairMain);
        r(7, -23, 1, 4, hairHi);
      }
    }
  } else {
    // No Helmet: bare face & distinctive hair from Personajes_83a16f6b.jpeg
    r(-6, -26, 12, 10, outline);
    r(-5, -25, 10, 8, skin);
    r(-5, -18, 10, 1, skinShade);

    if (direction === 'down') {
      // Hair crown
      r(-6, -27, 12, 4, hairMain);
      r(-5, -26, 10, 2, hairHi);
      if (character === 'leo') {
        // Spiky tufts
        r(-6, -29, 3, 2, hairMain);
        r(-1, -30, 3, 3, hairMain);
        r(3, -28, 3, 2, hairMain);
      } else {
        // Nova bangs & side ponytail
        r(-5, -24, 2, 4, hairMain);
        r(3, -24, 2, 4, hairMain);
        r(4, -28, 4, 9, hairMain);
        r(5, -27, 2, 6, hairHi);
      }
      // Eyes
      r(-3, -22, 2, 2, '#141726');
      r(1, -22, 2, 2, '#141726');
    } else if (direction === 'up') {
      r(-6, -27, 12, 10, hairMain);
      r(-4, -26, 8, 4, hairHi);
      if (character === 'leo') {
        r(-5, -29, 3, 2, hairMain);
        r(0, -30, 3, 3, hairMain);
      } else {
        r(-1, -29, 5, 11, hairMain);
        r(0, -28, 3, 8, hairHi);
      }
    } else {
      // Side profile
      r(-6, -27, 12, 4, hairMain);
      r(0, -25, 6, 8, hairMain);
      r(-4, -22, 2, 2, '#141726');
      if (character === 'leo') {
        r(-5, -29, 3, 2, hairMain);
        r(-1, -30, 4, 3, hairMain);
      } else {
        r(4, -28, 5, 11, hairMain);
        r(5, -27, 3, 8, hairHi);
      }
    }
  }

  // --- ACTION PROPS & STATUS OVERLAY PARTICLES ---
  if (animState === 'consume') {
    // Pixel ration bar in hand
    r(-10, -14, 4, 3, '#f59e0b');
    r(-9, -13, 2, 1, '#fef08a');
  } else if (animState === 'hydrate') {
    // Pixel water flask in hand
    r(-10, -16, 4, 5, '#0284c7');
    r(-9, -15, 2, 3, '#7dd3fc');
  } else if (animState === 'fatigue') {
    // Sweat drop
    if (Math.sin(animTime * 6) > 0) {
      r(6, -25, 2, 3, '#38bdf8');
    }
  } else if (animState === 'illness') {
    // Dizzy pixel stars orbiting above head
    const sx = Math.round(Math.cos(animTime * 5) * 6);
    r(sx - 1, -32, 2, 2, '#a3e635');
    r(-sx - 1, -31, 2, 2, '#bef264');
  } else if (animState === 'burn') {
    // Heat sparks
    const fy = Math.round((animTime * 20) % 8);
    r(-6, -22 - fy, 2, 2, '#fb923c');
    r(5, -18 - ((fy + 4) % 8), 2, 2, '#facc15');
  } else if (animState === 'freezing') {
    // Frost crystals
    r(-8, -22, 2, 2, '#bae6fd');
    r(7, -16, 2, 2, '#e0f2fe');
  } else if (animState === 'attack') {
    // Cyan pulse crescent
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(10, -20, 3, 12);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(12, -18, 2, 8);
  } else if (animState === 'drill') {
    // Vibrating mining drill bit + sparks
    const vib = Math.round(Math.sin(animTime * 55) * 1.5);
    r(6 + vib, -15, 7, 3, '#f59e0b');
    r(12 + vib, -14, 3, 2, '#e2e8f0');
    r(14, -17 + (vib > 0 ? 0 : 4), 2, 2, '#fde047');
  } else if (animState === 'collector') {
    // Vacuum gas collector nozzle + cyan/violet gas wisps
    r(6, -16, 6, 4, '#6366f1');
    const pull = Math.round((animTime * 18) % 6);
    r(13 + (5 - pull), -16, 2, 2, '#38bdf8');
    r(14 + pull, -13, 2, 2, '#c084fc');
  } else if (animState === 'deposit') {
    // Transfer cargo cube pulse
    r(6, -15, 5, 5, '#10b981');
    r(7, -14, 3, 3, '#a7f3d0');
  } else if (animState === 'harvest') {
    // Harvesting leaf sparkle
    r(6, -17, 4, 4, '#22c55e');
    r(7, -19, 2, 2, '#bbf7d0');
  }

  ctx.restore();
}
