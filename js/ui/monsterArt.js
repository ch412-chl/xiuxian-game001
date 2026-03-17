export function drawMonsterIllustration(ctx, rect, monster, opts = {}) {
  if (!monster) return;
  const x = rect.x;
  const y = rect.y;
  const w = rect.w;
  const h = rect.h;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const alpha = opts.alpha == null ? 1 : opts.alpha;
  const glowColor = getGlowColor(monster.aura || '');

  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.44);
  glow.addColorStop(0, toRgba(glowColor, 0.26));
  glow.addColorStop(0.58, toRgba(glowColor, 0.1));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = 'rgba(15,13,12,0.82)';
  ctx.strokeStyle = toRgba(glowColor, 0.28);
  ctx.lineWidth = 1;

  switch (monster.artType) {
    case 'wolf':
    case 'wolf_king':
      drawWolf(ctx, cx, cy, w, h, monster.artType === 'wolf_king');
      break;
    case 'sword_spirit':
    case 'sword_lord':
      drawSwordSpirit(ctx, cx, cy, w, h, monster.artType === 'sword_lord');
      break;
    case 'flame_fiend':
    case 'flame_lord':
      drawFlameFiend(ctx, cx, cy, w, h, monster.artType === 'flame_lord');
      break;
    case 'ice_beast':
    case 'ice_king':
      drawIceBeast(ctx, cx, cy, w, h, monster.artType === 'ice_king');
      break;
    case 'thunder_bird':
    case 'thunder_king':
      drawThunderBird(ctx, cx, cy, w, h, monster.artType === 'thunder_king');
      break;
    case 'void_eye':
    case 'void_overlord':
      drawVoidEye(ctx, cx, cy, w, h, monster.artType === 'void_overlord');
      break;
    case 'stone_golem':
    case 'stone_king':
      drawStoneGolem(ctx, cx, cy, w, h, monster.artType === 'stone_king');
      break;
    case 'celestial_serpent':
    case 'celestial_dragon':
      drawSerpent(ctx, cx, cy, w, h, monster.artType === 'celestial_dragon');
      break;
    case 'corpse_king':
    case 'corpse_emperor':
      drawCorpseKing(ctx, cx, cy, w, h, monster.artType === 'corpse_emperor');
      break;
    case 'spirit_fox':
    case 'fox_queen':
      drawFox(ctx, cx, cy, w, h, monster.artType === 'fox_queen');
      break;
    case 'gold_crow':
    case 'sun_crow':
      drawCrow(ctx, cx, cy, w, h, monster.artType === 'sun_crow');
      break;
    case 'lotus_spirit':
    case 'lotus_queen':
      drawLotus(ctx, cx, cy, w, h, monster.artType === 'lotus_queen');
      break;
    case 'star_whale':
    case 'whale_king':
      drawWhale(ctx, cx, cy, w, h, monster.artType === 'whale_king');
      break;
    case 'chaos_dragon':
    case 'dao_dragon':
      drawChaosDragon(ctx, cx, cy, w, h, monster.artType === 'dao_dragon');
      break;
    default:
      drawVoidEye(ctx, cx, cy, w, h, false);
      break;
  }

  ctx.restore();
}

function drawWolf(ctx, cx, cy, w, h, king) {
  const headR = Math.min(w, h) * (king ? 0.21 : 0.18);
  triangle(ctx, cx - headR * 0.7, cy - headR * 1.2, cx - headR * 1.35, cy - headR * 2.1, cx - headR * 0.1, cy - headR * 1.8);
  triangle(ctx, cx + headR * 0.7, cy - headR * 1.2, cx + headR * 1.35, cy - headR * 2.1, cx + headR * 0.1, cy - headR * 1.8);
  fillCircle(ctx, cx, cy - headR * 0.2, headR);
  fillEllipse(ctx, cx, cy + headR * 0.48, headR * 0.58, headR * 0.42);
  fillCircle(ctx, cx - headR * 0.45, cy - headR * 0.18, headR * 0.12);
  fillCircle(ctx, cx + headR * 0.45, cy - headR * 0.18, headR * 0.12);
  triangle(ctx, cx - headR * 0.25, cy + headR * 0.82, cx - headR * 0.08, cy + headR * 1.25, cx, cy + headR * 0.88);
  triangle(ctx, cx + headR * 0.25, cy + headR * 0.82, cx + headR * 0.08, cy + headR * 1.25, cx, cy + headR * 0.88);
  if (king) {
    strokeArc(ctx, cx, cy - headR * 0.55, headR * 1.46);
  }
}

function drawSwordSpirit(ctx, cx, cy, w, h, king) {
  const swordH = h * (king ? 0.44 : 0.36);
  const offsets = king ? [-w * 0.12, 0, w * 0.12] : [-w * 0.08, w * 0.08];
  offsets.forEach((dx, idx) => {
    const scale = idx === 1 && king ? 1.14 : 1;
    drawSword(ctx, cx + dx, cy + h * 0.05, swordH * scale);
  });
  fillCircle(ctx, cx, cy + h * 0.14, Math.min(w, h) * 0.08);
}

function drawFlameFiend(ctx, cx, cy, w, h, lord) {
  fillEllipse(ctx, cx, cy + h * 0.08, w * 0.16, h * 0.18);
  triangle(ctx, cx - w * 0.09, cy - h * 0.05, cx - w * 0.16, cy - h * 0.22, cx - w * 0.01, cy - h * 0.16);
  triangle(ctx, cx + w * 0.09, cy - h * 0.05, cx + w * 0.16, cy - h * 0.22, cx + w * 0.01, cy - h * 0.16);
  triangle(ctx, cx - w * 0.13, cy + h * 0.16, cx - w * 0.26, cy + h * 0.34, cx - w * 0.06, cy + h * 0.28);
  triangle(ctx, cx + w * 0.13, cy + h * 0.16, cx + w * 0.26, cy + h * 0.34, cx + w * 0.06, cy + h * 0.28);
  triangle(ctx, cx, cy - h * 0.34, cx - w * 0.06, cy - h * 0.18, cx + w * 0.06, cy - h * 0.18);
  if (lord) strokeArc(ctx, cx, cy - h * 0.02, w * 0.22);
}

function drawIceBeast(ctx, cx, cy, w, h, king) {
  fillEllipse(ctx, cx, cy + h * 0.04, w * 0.18, h * 0.16);
  fillCircle(ctx, cx, cy - h * 0.14, Math.min(w, h) * 0.1);
  [-1, -0.4, 0.4, 1].forEach((m) => {
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.06 * m, cy + h * 0.04);
    ctx.lineTo(cx + w * 0.2 * m, cy + h * 0.22);
    ctx.stroke();
  });
  triangle(ctx, cx - w * 0.05, cy - h * 0.18, cx - w * 0.12, cy - h * 0.32, cx - w * 0.01, cy - h * 0.28);
  triangle(ctx, cx + w * 0.05, cy - h * 0.18, cx + w * 0.12, cy - h * 0.32, cx + w * 0.01, cy - h * 0.28);
  if (king) strokeArc(ctx, cx, cy - h * 0.08, w * 0.24);
}

function drawThunderBird(ctx, cx, cy, w, h, king) {
  fillEllipse(ctx, cx, cy + h * 0.08, w * 0.1, h * 0.18);
  triangle(ctx, cx, cy - h * 0.22, cx - w * 0.06, cy - h * 0.06, cx + w * 0.06, cy - h * 0.06);
  triangle(ctx, cx - w * 0.04, cy, cx - w * 0.28, cy - h * 0.14, cx - w * 0.2, cy + h * 0.18);
  triangle(ctx, cx + w * 0.04, cy, cx + w * 0.28, cy - h * 0.14, cx + w * 0.2, cy + h * 0.18);
  triangle(ctx, cx, cy + h * 0.22, cx - w * 0.08, cy + h * 0.1, cx + w * 0.08, cy + h * 0.1);
  if (king) strokeArc(ctx, cx, cy - h * 0.04, w * 0.26);
}

function drawVoidEye(ctx, cx, cy, w, h, lord) {
  fillEllipse(ctx, cx, cy, w * 0.22, h * 0.12);
  ctx.save();
  ctx.fillStyle = 'rgba(24,20,18,0.88)';
  fillEllipse(ctx, cx, cy, w * 0.1, h * 0.04);
  ctx.restore();
  fillCircle(ctx, cx, cy, Math.min(w, h) * 0.05);
  strokeArc(ctx, cx, cy, Math.min(w, h) * (lord ? 0.24 : 0.18));
  [-1, 1].forEach((m) => {
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.18 * m, cy);
    ctx.quadraticCurveTo(cx + w * 0.28 * m, cy + h * 0.08, cx + w * 0.22 * m, cy + h * 0.2);
    ctx.stroke();
  });
}

function drawStoneGolem(ctx, cx, cy, w, h, king) {
  fillRect(ctx, cx - w * 0.12, cy - h * 0.18, w * 0.24, h * 0.24);
  fillRect(ctx, cx - w * 0.09, cy + h * 0.06, w * 0.18, h * 0.16);
  fillRect(ctx, cx - w * 0.25, cy - h * 0.04, w * 0.1, h * 0.12);
  fillRect(ctx, cx + w * 0.15, cy - h * 0.04, w * 0.1, h * 0.12);
  if (king) strokeArc(ctx, cx, cy - h * 0.04, w * 0.22);
}

function drawSerpent(ctx, cx, cy, w, h, dragon) {
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.18, cy + h * 0.18);
  ctx.quadraticCurveTo(cx - w * 0.02, cy - h * 0.18, cx + w * 0.12, cy + h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.18, cy + h * 0.18, cx + w * 0.04, cy + h * 0.24);
  ctx.lineWidth = dragon ? 24 : 18;
  ctx.lineCap = 'round';
  ctx.stroke();
  fillCircle(ctx, cx - w * 0.02, cy - h * 0.14, Math.min(w, h) * (dragon ? 0.07 : 0.055));
}

function drawCorpseKing(ctx, cx, cy, w, h, emperor) {
  fillRect(ctx, cx - w * 0.09, cy - h * 0.18, w * 0.18, h * 0.18);
  fillRect(ctx, cx - w * 0.12, cy, w * 0.24, h * 0.22);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.06, cy + h * 0.22);
  ctx.lineTo(cx - w * 0.1, cy + h * 0.34);
  ctx.moveTo(cx + w * 0.06, cy + h * 0.22);
  ctx.lineTo(cx + w * 0.1, cy + h * 0.34);
  ctx.stroke();
  if (emperor) strokeArc(ctx, cx, cy - h * 0.12, w * 0.2);
}

function drawFox(ctx, cx, cy, w, h, queen) {
  fillCircle(ctx, cx, cy - h * 0.02, Math.min(w, h) * 0.12);
  triangle(ctx, cx - w * 0.05, cy - h * 0.14, cx - w * 0.12, cy - h * 0.28, cx - w * 0.01, cy - h * 0.24);
  triangle(ctx, cx + w * 0.05, cy - h * 0.14, cx + w * 0.12, cy - h * 0.28, cx + w * 0.01, cy - h * 0.24);
  fillEllipse(ctx, cx, cy + h * 0.12, w * 0.12, h * 0.12);
  const tails = queen ? 5 : 3;
  for (let i = 0; i < tails; i++) {
    const dx = (-tails / 2 + i) * w * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + h * 0.16);
    ctx.quadraticCurveTo(cx + dx * 1.4, cy + h * 0.3, cx + dx * 1.8, cy + h * 0.38);
    ctx.stroke();
  }
}

function drawCrow(ctx, cx, cy, w, h, sun) {
  fillEllipse(ctx, cx, cy + h * 0.04, w * 0.1, h * 0.16);
  triangle(ctx, cx - w * 0.03, cy, cx - w * 0.26, cy - h * 0.08, cx - w * 0.12, cy + h * 0.16);
  triangle(ctx, cx + w * 0.03, cy, cx + w * 0.26, cy - h * 0.08, cx + w * 0.12, cy + h * 0.16);
  triangle(ctx, cx, cy - h * 0.16, cx - w * 0.03, cy - h * 0.06, cx + w * 0.03, cy - h * 0.06);
  if (sun) strokeArc(ctx, cx, cy, w * 0.22);
}

function drawLotus(ctx, cx, cy, w, h, queen) {
  for (let i = -2; i <= 2; i++) {
    triangle(ctx, cx + i * w * 0.05, cy + h * 0.08, cx + i * w * 0.02, cy - h * 0.12, cx + i * w * 0.09, cy - h * 0.02);
  }
  fillCircle(ctx, cx, cy + h * 0.08, Math.min(w, h) * (queen ? 0.07 : 0.05));
  if (queen) strokeArc(ctx, cx, cy + h * 0.02, w * 0.22);
}

function drawWhale(ctx, cx, cy, w, h, king) {
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.2, cy + h * 0.08);
  ctx.quadraticCurveTo(cx - w * 0.02, cy - h * 0.16, cx + w * 0.18, cy + h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.04, cy + h * 0.18, cx - w * 0.16, cy + h * 0.16);
  ctx.closePath();
  ctx.fill();
  if (king) strokeArc(ctx, cx, cy, w * 0.24);
}

function drawChaosDragon(ctx, cx, cy, w, h, dao) {
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.22, cy + h * 0.16);
  ctx.quadraticCurveTo(cx - w * 0.04, cy - h * 0.22, cx + w * 0.1, cy);
  ctx.quadraticCurveTo(cx + w * 0.22, cy + h * 0.18, cx + w * 0.06, cy + h * 0.24);
  ctx.lineWidth = dao ? 22 : 18;
  ctx.lineCap = 'round';
  ctx.stroke();
  fillCircle(ctx, cx - w * 0.02, cy - h * 0.16, Math.min(w, h) * 0.06);
  triangle(ctx, cx - w * 0.04, cy - h * 0.21, cx - w * 0.1, cy - h * 0.28, cx - w * 0.01, cy - h * 0.26);
  triangle(ctx, cx + w * 0.01, cy - h * 0.21, cx + w * 0.08, cy - h * 0.28, cx + w * 0.03, cy - h * 0.22);
}

function drawSword(ctx, cx, cy, h) {
  const w = h * 0.16;
  fillRect(ctx, cx - w / 2, cy - h / 2, w, h * 0.7);
  triangle(ctx, cx - w / 2, cy + h * 0.2, cx + w / 2, cy + h * 0.2, cx, cy + h * 0.38);
  fillRect(ctx, cx - w, cy + h * 0.18, w * 2, h * 0.06);
}

function fillCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fillEllipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function fillRect(ctx, x, y, w, h) {
  ctx.fillRect(x, y, w, h);
}

function triangle(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function strokeArc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}

function getGlowColor(aura) {
  const map = {
    灰金: '#d6b371',
    赤金: '#e49b63',
    银青: '#b8d0d8',
    冷银: '#dbe4ea',
    炎赤: '#db7a47',
    赤橙: '#f28c54',
    霜蓝: '#8fb8d8',
    冰白: '#d8e7f2',
    雷紫: '#9e86e0',
    明紫: '#b39cff',
    幽蓝: '#6fa6c9',
    幽青: '#7cb7b8',
    土褐: '#9d8460',
    岩金: '#c4a06f',
    星青: '#75b5c8',
    星金: '#d0c27d',
    暗赤: '#9d5c52',
    血紫: '#a06796',
    月白: '#dfe6f2',
    银白: '#eef2f4',
    曜金: '#d6ae52',
    灿金: '#f1cf71',
    青碧: '#7cb49b',
    青金: '#a7c68d',
    星蓝: '#7ca6d6',
    深蓝: '#547ab2',
    混金: '#cab275',
    道金: '#f1de9a',
  };
  return map[aura] || '#c6a87a';
}

function toRgba(hex, alpha) {
  const v = hex.replace('#', '');
  const n = parseInt(v, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
