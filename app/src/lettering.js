let fontLoaded = false;
let fontFamily = 'Anton, sans-serif';

export function initFont() {
  if (fontLoaded) return;
  try {
    if ('fonts' in document) {
      document.fonts.load('400 1px Anton').then(function () {
        fontLoaded = true;
      });
    }
  } catch (_) {
    fontLoaded = true;
  }
}

export function waitForFonts() {
  if (fontLoaded) return Promise.resolve();
  if ('fonts' in document) {
    return document.fonts.ready.then(function () {
      fontLoaded = true;
    });
  }
  fontLoaded = true;
  return Promise.resolve();
}

export function isFontReady() {
  if (fontLoaded) return true;
  if ('fonts' in document) {
    const f = document.fonts.check('400 12px Anton');
    if (f) fontLoaded = true;
    return f;
  }
  return true;
}

export function drawTitle(ctx, text, x, y, w, h, align) {
  const t = text.toUpperCase();
  ctx.save();
  const maxSize = h * 0.92;
  const size = fitText(ctx, t, w, maxSize, 300);
  ctx.font = size + 'px "' + fontFamily + '"';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  const measure = ctx.measureText(t);
  const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
  const ty = y + h / 2;

  ctx.shadowColor = 'rgba(0,0,0,1)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = size * 0.06;
  ctx.shadowOffsetY = size * 0.08;

  const grad = ctx.createLinearGradient(tx - measure.width * 0.5, ty - size * 0.3, tx + measure.width * 0.5, ty + size * 0.3);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, '#ffcc88');
  grad.addColorStop(0.7, '#ff6090');
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillText(t, tx, ty);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
  return size;
}

export function drawSubtitle(ctx, text, x, y, w, h, titleBottom, titleSize) {
  if (!text.trim()) return;
  const t = text.trim();
  ctx.save();
  const fontSize = Math.min(titleSize * 0.35, h * 0.7, fitSubtitle(ctx, t, w));
  ctx.font = '700 ' + fontSize + 'px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc80';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = fontSize * 0.1;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(t, x + w / 2, titleBottom + fontSize * 0.3);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

export function drawCaptionText(ctx, text, x, y, w, h) {
  const t = text.toUpperCase().trim();
  if (!t) return;
  ctx.save();
  const fontSize = fitCaption(ctx, t, w, h);
  ctx.font = fontSize + 'px "' + fontFamily + '"';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = fontSize * 0.12;
  ctx.shadowOffsetX = fontSize * 0.04;
  ctx.shadowOffsetY = fontSize * 0.05;
  ctx.fillText(t, x + w / 2, y + h / 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
}

function fitText(ctx, text, maxW, maxSize, minW) {
  let lo = 1, hi = maxSize, best = lo;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    ctx.font = mid + 'px "' + fontFamily + '"';
    const m = ctx.measureText(text);
    if (m.width > maxW) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }
  if (maxW < minW) {
    ctx.font = best + 'px "' + fontFamily + '"';
    const m = ctx.measureText(text);
    if (m.width > maxW) {
      best = best * (maxW / m.width) * 0.95;
    }
  }
  return best;
}

function fitSubtitle(ctx, text, maxW) {
  let lo = 1, hi = 120, best = lo;
  for (let i = 0; i < 15; i++) {
    const mid = (lo + hi) / 2;
    ctx.font = '700 ' + mid + 'px system-ui, -apple-system, sans-serif';
    const m = ctx.measureText(text);
    if (m.width > maxW) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }
  return best;
}

function fitCaption(ctx, text, maxW, maxH) {
  let lo = 1, hi = maxH * 0.9, best = lo;
  for (let i = 0; i < 15; i++) {
    const mid = (lo + hi) / 2;
    ctx.font = mid + 'px "' + fontFamily + '"';
    const m = ctx.measureText(text);
    if (m.width > maxW * 0.92) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }
  return Math.min(best, maxH * 0.85);
}