import { createRNG } from './seeded-rng.js';

export function applyColorGrade(ctx, x, y, w, h, intensity) {
  if (intensity <= 0) return;
  const id = ctx.getImageData(x, y, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const warm = 45 * intensity * (1 - lum / 255);
    r += warm * 0.85;
    g += warm * 0.08;
    b -= warm * 0.15;
    const teal = 35 * intensity * (lum / 255);
    r -= teal * 0.2;
    g += teal * 0.15;
    b += teal * 0.55;
    r += (255 - r) * 0.05 * intensity;
    const contrast = 1 + 0.25 * intensity;
    r = ((r - 128) * contrast + 128);
    g = ((g - 128) * contrast + 128);
    b = ((b - 128) * contrast + 128);
    r = Math.min(255, Math.max(0, r + 12 * intensity));
    d[i] = Math.min(255, Math.max(0, r));
    d[i + 1] = Math.min(255, Math.max(0, g));
    d[i + 2] = Math.min(255, Math.max(0, b));
  }
  ctx.putImageData(id, x, y);
}

export function drawChromaticAberration(ctx, x, y, w, h, shift) {
  if (shift <= 0) return;
  const id = ctx.getImageData(x, y, w, h);
  const copy = new ImageData(new Uint8ClampedArray(id.data), w, h);
  const d = id.data;
  const src = copy.data;
  const sx = Math.round(shift);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const di = (row * w + col) * 4;
      const ri = (row * w + Math.min(w - 1, Math.max(0, col - sx))) * 4;
      const bi = (row * w + Math.min(w - 1, Math.max(0, col + sx))) * 4;
      d[di] = src[ri];
      d[di + 2] = src[bi];
    }
  }
  ctx.putImageData(id, x, y);
}

export function drawBloom(ctx, x, y, w, h, intensity) {
  if (intensity <= 0.1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = intensity * 0.06;
  const grad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.35, w * 0.15, x + w * 0.5, y + h * 0.35, w * 0.7);
  grad.addColorStop(0, 'rgba(255,160,40,1)');
  grad.addColorStop(0.4, 'rgba(255,40,100,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function drawHalftone(ctx, x, y, w, h, intensity, seed) {
  if (intensity <= 0) return;
  const rng = createRNG(seed | 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const dotSize = 3 + rng() * 2;
  const spacing = 7 + rng() * 3;
  ctx.fillStyle = 'rgba(0,0,0,' + (intensity * 0.25) + ')';
  for (let dy = y + (rng() * spacing) | 0; dy < y + h; dy += spacing) {
    for (let dx = x + (rng() * spacing) | 0; dx < x + w; dx += spacing) {
      const d = dotSize * (0.5 + rng() * 0.5);
      ctx.beginPath();
      ctx.arc(dx, dy, d, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawGrain(ctx, x, y, w, h, intensity, seed) {
  if (intensity <= 0) return;
  const rng = createRNG(seed + 1);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const step = 4;
  ctx.globalAlpha = intensity * 0.08;
  for (let dy = y; dy < y + h; dy += step) {
    for (let dx = x; dx < x + w; dx += step) {
      const v = rng() * 255 | 0;
      ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      ctx.fillRect(dx, dy, step, step);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}