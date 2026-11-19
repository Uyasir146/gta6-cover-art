import { getLayout, GUTTER } from './panel-layouts.js';
import { applyColorGrade, drawChromaticAberration, drawBloom, drawHalftone, drawGrain } from './color-grade.js';
import { initFont, isFontReady, drawTitle, drawSubtitle, drawCaptionText } from './lettering.js';

const BG = '#0a0a0c';

initFont();

export function drawCover(canvas, photos, panelStates, title, subtitle, caption, sizeKey, options) {
  const ctx = canvas.getContext('2d');
  const layout = getLayout(sizeKey);
  const { w, h } = layout;
  canvas.width = w;
  canvas.height = h;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const gradeI = options && options.colorGrade != null ? options.colorGrade : 1.0;
  const seed = hashString(title + '_' + sizeKey);

  for (let pi = 0; pi < layout.panels.length; pi++) {
    const panel = layout.panels[pi];
    const state = panelStates && panelStates[pi] || { photoIndex: 0, ox: 0.5, oy: 0.5, zoom: 1, tint: 0.5 };
    const photoIdx = state.photoIndex != null ? state.photoIndex : (pi % Math.max(1, photos.length));
    const photo = photos[photoIdx];
    const tint = state.tint != null ? state.tint : 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();

    ctx.fillStyle = '#1a1428';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

    if (photo) {
      const pw = photo.naturalWidth || photo.width;
      const ph = photo.naturalHeight || photo.height;
      const panelAspect = panel.w / panel.h;
      const photoAspect = pw / ph;
      let drawW, drawH;
      if (photoAspect > panelAspect) {
        drawH = panel.h * (state.zoom || 1);
        drawW = drawH * photoAspect;
      } else {
        drawW = panel.w * (state.zoom || 1);
        drawH = drawW / photoAspect;
      }
      const ox = (state.ox != null ? state.ox : 0.5);
      const oy = (state.oy != null ? state.oy : 0.5);
      const dx = panel.x + (panel.w - drawW) * ox;
      const dy = panel.y + (panel.h - drawH) * oy;
      ctx.drawImage(photo, dx, dy, drawW, drawH);
    }

    applyColorGrade(ctx, panel.x, panel.y, panel.w, panel.h, gradeI);
    if (gradeI > 0.3) {
      drawChromaticAberration(ctx, panel.x, panel.y, panel.w, panel.h, 1.2 * gradeI);
    }

    drawPanelTint(ctx, panel.x, panel.y, panel.w, panel.h, tint);
    drawHalftone(ctx, panel.x, panel.y, panel.w, panel.h, 0.6 + gradeI * 0.4, seed + pi * 37);
    drawGrain(ctx, panel.x, panel.y, panel.w, panel.h, 0.5 + gradeI * 0.5, seed + pi * 53);
    drawPanelBorder(ctx, panel.x, panel.y, panel.w, panel.h);

    ctx.restore();
  }

  drawGutters(ctx, layout, w, h);

  drawBloom(ctx, 0, 0, w, h, gradeI);

  drawVignette(ctx, w, h);

  drawFlourishes(ctx, w, h, seed);

  drawTitleBar(ctx, layout, title, subtitle, caption, w, h);

  drawCaptionStrip(ctx, layout, caption);

  drawScanlines(ctx, w, h);

  return { w, h };
}

function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function drawPanelTint(ctx, x, y, w, h, tint) {
  const hue = 0.08 - tint * 0.06;
  const sat = 0.6 + tint * 0.4;
  const alpha = 0.08 + tint * 0.12;
  ctx.fillStyle = 'hsla(' + (hue * 360 | 0) + ', ' + (sat * 100 | 0) + '%, 50%, ' + alpha + ')';
  ctx.fillRect(x, y, w, h);
}

function drawPanelBorder(ctx, x, y, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawGutters(ctx, layout, w, h) {
  const sorted = [...layout.panels].sort((a, b) => a.y - b.y || a.x - b.x);
  ctx.fillStyle = BG;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (Math.abs(b.y - (a.y + a.h)) < GUTTER * 2 && b.y >= a.y + a.h) {
      const hGap = b.y - (a.y + a.h);
      if (hGap > 0) ctx.fillRect(0, a.y + a.h, w, hGap);
    }
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j];
      if (a.y < b.y + b.h && a.y + a.h > b.y) {
        if (a.x + a.w < b.x) {
          const vGap = b.x - (a.x + a.w);
          if (vGap > 0 && vGap <= GUTTER * 2) {
            const gy = Math.max(a.y, b.y);
            const gh = Math.min(a.y + a.h, b.y + b.h) - gy;
            ctx.fillRect(a.x + a.w, gy, vGap, gh);
          }
        }
      }
    }
  }
}

function drawTitleBar(ctx, layout, title, subtitle, caption, w, h) {
  const t = layout.title;
  const barGrad = ctx.createLinearGradient(0, 0, 0, t.y + t.h);
  barGrad.addColorStop(0, 'rgba(10,10,12,0.95)');
  barGrad.addColorStop(0.5, 'rgba(20,5,25,0.85)');
  barGrad.addColorStop(1, 'rgba(10,10,12,0.7)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(t.x, t.y, t.w, t.h + 6);

  const accentGrad = ctx.createLinearGradient(0, 0, t.w, 0);
  accentGrad.addColorStop(0, 'rgba(255,30,100,0.9)');
  accentGrad.addColorStop(0.3, 'rgba(255,100,30,0.7)');
  accentGrad.addColorStop(0.7, 'rgba(255,180,40,0.5)');
  accentGrad.addColorStop(1, 'rgba(255,50,130,0.8)');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(t.x, t.y + t.h, t.w, 3);

  const titleText = (title || caption || '').toUpperCase();
  if (titleText) {
    const titleSize = drawTitle(ctx, titleText, t.x, t.y + 6, t.w, t.h - 10, 'left');
    if (subtitle && subtitle.trim()) {
      drawSubtitle(ctx, subtitle, t.x + t.w * 0.01, t.y + 6, t.w * 0.98, 36, t.y + t.h - 8, titleSize);
    }
  }
}

function drawVignette(ctx, w, h) {
  const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createLinearGradient(0, h * 0.55, 0, h);
  glow.addColorStop(0, 'rgba(255,30,100,0)');
  glow.addColorStop(0.4, 'rgba(220,15,80,0.1)');
  glow.addColorStop(1, 'rgba(150,5,50,0.3)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawFlourishes(ctx, w, h, seed) {
  drawPalmSilhouette(ctx, w, seed);
  drawSunFlare(ctx, w, h, seed);
}

function drawPalmSilhouette(ctx, w, seed) {
  const cx = w - 80;
  const cy = 240;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 80);
  ctx.quadraticCurveTo(cx - 35, cy + 20, cx - 40, cy - 60);
  ctx.lineTo(cx - 55, cy - 40);
  ctx.quadraticCurveTo(cx - 25, cy - 20, cx - 30, cy - 40);
  ctx.lineTo(cx - 50, cy - 20);
  ctx.quadraticCurveTo(cx - 15, cy + 10, cx - 5, cy - 50);
  ctx.lineTo(cx, cy - 30);
  ctx.lineTo(cx + 8, cy - 60);
  ctx.lineTo(cx + 4, cy - 25);
  ctx.lineTo(cx + 25, cy - 35);
  ctx.quadraticCurveTo(cx + 10, cy + 5, cx + 30, cy - 10);
  ctx.lineTo(cx + 50, cy - 20);
  ctx.quadraticCurveTo(cx + 20, cy - 5, cx + 25, cy + 15);
  ctx.lineTo(cx + 45, cy + 5);
  ctx.quadraticCurveTo(cx + 15, cy + 15, cx + 10, cy + 40);
  ctx.lineTo(cx - 10, cy + 35);
  ctx.quadraticCurveTo(cx - 5, cy + 15, cx - 20, cy + 25);
  ctx.lineTo(cx - 5, cy + 30);
  ctx.quadraticCurveTo(cx + 0, cy + 40, cx - 5, cy + 50);
  ctx.lineTo(cx - 8, cy + 45);
  ctx.quadraticCurveTo(cx - 5, cy + 55, cx - 5, cy + 65);
  ctx.lineTo(cx, cy + 80);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo(cx - 3, cy + 30, cx - 2, cy + 80);
  ctx.quadraticCurveTo(cx + 2, cy + 30, cx + 1, cy);
  ctx.fill();
  ctx.restore();

  const cx2 = 90;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx2, cy + 70);
  ctx.quadraticCurveTo(cx2 - 25, cy + 10, cx2 - 30, cy - 45);
  ctx.lineTo(cx2 - 40, cy - 28);
  ctx.quadraticCurveTo(cx2 - 18, cy - 10, cx2 - 20, cy - 30);
  ctx.lineTo(cx2 - 35, cy - 12);
  ctx.quadraticCurveTo(cx2 - 10, cy + 5, cx2, cy - 40);
  ctx.lineTo(cx2 + 4, cy - 20);
  ctx.lineTo(cx2 + 10, cy - 45);
  ctx.lineTo(cx2 + 6, cy - 18);
  ctx.lineTo(cx2 + 20, cy - 25);
  ctx.quadraticCurveTo(cx2 + 8, cy + 5, cx2 + 22, cy + 0);
  ctx.lineTo(cx2 + 38, cy - 12);
  ctx.quadraticCurveTo(cx2 + 15, cy + 2, cx2 + 18, cy + 20);
  ctx.lineTo(cx2 + 35, cy + 8);
  ctx.quadraticCurveTo(cx2 + 10, cy + 20, cx2 + 8, cy + 45);
  ctx.lineTo(cx2 - 8, cy + 38);
  ctx.quadraticCurveTo(cx2 - 2, cy + 18, cx2 - 12, cy + 25);
  ctx.lineTo(cx2 - 2, cy + 30);
  ctx.quadraticCurveTo(cx2 + 2, cy + 45, cx2, cy + 58);
  ctx.lineTo(cx2 - 4, cy + 50);
  ctx.quadraticCurveTo(cx2 - 2, cy + 60, cx2 - 2, cy + 70);
  ctx.lineTo(cx2 + 2, cy + 70);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx2, cy);
  ctx.quadraticCurveTo(cx2 - 2, cy + 25, cx2 - 1, cy + 70);
  ctx.quadraticCurveTo(cx2 + 2, cy + 25, cx2 + 1, cy);
  ctx.fill();
  ctx.restore();
}

function drawSunFlare(ctx, w, h, seed) {
  const fx = w * 0.45;
  const fy = h * 0.35;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i++) {
    const r = 120 + i * 60;
    const alpha = (0.06 - i * 0.012);
    const grad = ctx.createRadialGradient(fx, fy, r * 0.15, fx, fy, r);
    grad.addColorStop(0, 'rgba(255,200,100,' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(255,100,40,' + (alpha * 0.5) + ')');
    grad.addColorStop(1, 'rgba(255,20,60,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(fx - r, fy - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawScanlines(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#000000';
  const lineH = 3;
  for (let y = 0; y < h; y += lineH * 2) {
    ctx.fillRect(0, y, w, lineH);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCaptionStrip(ctx, layout, caption) {
  const c = layout.caption;
  if (!c) return;
  ctx.fillStyle = 'rgba(10,10,12,0.92)';
  ctx.fillRect(c.x, c.y, c.w, c.h);

  const accentGrad = ctx.createLinearGradient(0, 0, c.w, 0);
  accentGrad.addColorStop(0, 'rgba(255,40,110,0.5)');
  accentGrad.addColorStop(0.3, 'rgba(255,120,30,0.4)');
  accentGrad.addColorStop(0.7, 'rgba(255,180,40,0.3)');
  accentGrad.addColorStop(1, 'rgba(255,50,130,0.5)');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(c.x, c.y, c.w, 3);

  const text = (caption || '').trim();
  if (text) {
    drawCaptionText(ctx, text, c.x, c.y + 3, c.w, c.h - 3);
  }
}

export function getPanelCount(sizeKey) {
  const layout = getLayout(sizeKey);
  return layout.panels.length;
}

export function getPanelRect(sizeKey, panelIndex) {
  const layout = getLayout(sizeKey);
  if (panelIndex >= 0 && panelIndex < layout.panels.length) {
    return layout.panels[panelIndex];
  }
  return null;
}

export function findPanelAtPoint(sizeKey, px, py) {
  const layout = getLayout(sizeKey);
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}