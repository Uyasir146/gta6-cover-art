import { drawCover, getPanelCount, findPanelAtPoint, getPanelRect } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const sizeSelect = document.getElementById('size');
const titleInput = document.getElementById('title-input');
const subtitleInput = document.getElementById('subtitle');
const captionInput = document.getElementById('caption');
const exportBtn = document.getElementById('export');
const export1080Btn = document.getElementById('export-1080x1080');
const exportPortraitBtn = document.getElementById('export-1080x1350');
const addPhotoBtn = document.getElementById('add-photo');
const statusEl = document.getElementById('status');
const panelInfoEl = document.getElementById('panel-info');
const zoomSlider = document.getElementById('panel-zoom');
const offsetXSlider = document.getElementById('panel-ox');
const offsetYSlider = document.getElementById('panel-oy');
const tintSlider = document.getElementById('panel-tint');
const gradeSlider = document.getElementById('grade');
const photoStrip = document.getElementById('photo-strip');
const photoFileInput = document.getElementById('photo-file');
const canvasWrap = document.getElementById('canvas-wrap');
const dropOverlay = document.getElementById('drop-overlay');

let photos = [];
let panelStates = [];
let titleText = 'SUNSET HEIST';
let subtitleText = 'Coming 2025';
let caption = 'Sunset Heist';
let sizeKey = '1920x1080';
let grade = 1.0;
let selectedPanel = -1;

const INITIAL_SIZE = '1920x1080';

let dragInfo = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getCurrentSizeKey() {
  return sizeSelect ? sizeSelect.value : sizeKey;
}

function getCurrentTitle() {
  return titleInput ? titleInput.value : titleText;
}

function getCurrentSubtitle() {
  return subtitleInput ? subtitleInput.value : subtitleText;
}

function getCurrentCaption() {
  return captionInput ? captionInput.value : caption;
}

function initPanelStates() {
  const sk = getCurrentSizeKey();
  const count = getPanelCount(sk);
  while (panelStates.length < count) {
    panelStates.push({
      photoIndex: panelStates.length % Math.max(1, photos.length),
      ox: 0.5, oy: 0.5, zoom: 1, tint: 0.5
    });
  }
  panelStates.length = count;
  for (let i = 0; i < panelStates.length; i++) {
    if (panelStates[i].photoIndex >= photos.length) {
      panelStates[i].photoIndex = photos.length > 0 ? i % photos.length : 0;
    }
    if (panelStates[i].tint == null) panelStates[i].tint = 0.5;
  }
}

function redraw() {
  const sk = getCurrentSizeKey();
  const tit = getCurrentTitle();
  const sub = getCurrentSubtitle();
  const cap = getCurrentCaption();
  const cw = parseInt(sk.split('x')[0]);
  const ch = parseInt(sk.split('x')[1]);
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.width = cw;
  canvas.height = ch;
  drawCover(canvas, photos, panelStates, tit, sub, cap, sk, { colorGrade: grade });
}

function drawPanelHighlight() {
  if (selectedPanel >= 0) {
    const sk = getCurrentSizeKey();
    const rect = getPanelRect(sk, selectedPanel);
    if (rect) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.strokeStyle = '#ff5090';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.9;
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.restore();
    }
  }
}

function redrawWithHighlight() {
  redraw();
  drawPanelHighlight();
}

function updatePanelControls() {
  if (selectedPanel >= 0 && selectedPanel < panelStates.length) {
    const s = panelStates[selectedPanel];
    zoomSlider.value = s.zoom || 1;
    offsetXSlider.value = s.ox || 0.5;
    offsetYSlider.value = s.oy || 0.5;
    tintSlider.value = s.tint != null ? s.tint : 0.5;
    panelInfoEl.textContent = 'Panel ' + (selectedPanel + 1) + ' of ' + panelStates.length;
    zoomSlider.disabled = false;
    offsetXSlider.disabled = false;
    offsetYSlider.disabled = false;
    tintSlider.disabled = false;
  } else {
    panelInfoEl.textContent = 'Click a panel to adjust';
    zoomSlider.disabled = true;
    offsetXSlider.disabled = true;
    offsetYSlider.disabled = true;
    tintSlider.disabled = true;
  }
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function handleCanvasMouseDown(e) {
  if (e.button !== 0) return;
  const pt = canvasPoint(e);
  const sk = getCurrentSizeKey();
  const idx = findPanelAtPoint(sk, pt.x, pt.y);
  if (idx >= 0) {
    const rect = getPanelRect(sk, idx);
    if (rect && pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h) {
      selectedPanel = idx;
      updatePanelControls();
      dragInfo = {
        panel: idx,
        sx: pt.x,
        sy: pt.y,
        startOx: panelStates[idx].ox,
        startOy: panelStates[idx].oy
      };
      redrawWithHighlight();
    }
  }
}

function handleCanvasMouseMove(e) {
  if (!dragInfo) return;
  const pt = canvasPoint(e);
  const sk = getCurrentSizeKey();
  const rect = getPanelRect(sk, dragInfo.panel);
  if (!rect) return;
  const state = panelStates[dragInfo.panel];
  const pxRange = Math.max(0.1, rect.w * (state.zoom || 1) - rect.w);
  const pyRange = Math.max(0.1, rect.h * (state.zoom || 1) - rect.h);
  const dx = pt.x - dragInfo.sx;
  const dy = pt.y - dragInfo.sy;
  state.ox = Math.min(1, Math.max(0, dragInfo.startOx - (pxRange > 0 ? dx / pxRange : 0)));
  state.oy = Math.min(1, Math.max(0, dragInfo.startOy - (pyRange > 0 ? dy / pyRange : 0)));
  updatePanelControls();
  redrawWithHighlight();
}

function handleCanvasMouseUp() {
  dragInfo = null;
}

function handleCanvasWheel(e) {
  e.preventDefault();
  const pt = canvasPoint(e);
  const sk = getCurrentSizeKey();
  const idx = findPanelAtPoint(sk, pt.x, pt.y);
  if (idx >= 0) {
    selectedPanel = idx;
    const s = panelStates[idx];
    s.zoom = Math.min(2.5, Math.max(0.5, (s.zoom || 1) - e.deltaY * 0.002));
    updatePanelControls();
    redrawWithHighlight();
  }
}

function handleCanvasClick(e) {
  if (dragInfo) return;
  const pt = canvasPoint(e);
  const sk = getCurrentSizeKey();
  const idx = findPanelAtPoint(sk, pt.x, pt.y);
  selectedPanel = idx;
  updatePanelControls();
  redrawWithHighlight();
}

async function addPhoto(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  img._objectURL = url;
  photos.push(img);
  initPanelStates();
  renderPhotoStrip();
  redrawWithHighlight();
}

function renderPhotoStrip() {
  if (!photoStrip) return;
  photoStrip.innerHTML = '';
  photos.forEach((img, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.title = 'Photo ' + (idx + 1);
    const c = document.createElement('canvas');
    c.width = 60;
    c.height = 60;
    const tctx = c.getContext('2d');
    const scale = Math.min(60 / img.naturalWidth, 60 / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    tctx.drawImage(img, (60 - dw) / 2, (60 - dh) / 2, dw, dh);
    thumb.appendChild(c);

    thumb.addEventListener('click', () => {
      if (selectedPanel >= 0 && selectedPanel < panelStates.length) {
        panelStates[selectedPanel].photoIndex = idx;
        redrawWithHighlight();
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '\u00d7';
    removeBtn.className = 'remove-photo';
    removeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (photos.length <= 1) return;
      if (img._objectURL) URL.revokeObjectURL(img._objectURL);
      photos.splice(idx, 1);
      for (let i = 0; i < panelStates.length; i++) {
        if (panelStates[i].photoIndex >= photos.length) {
          panelStates[i].photoIndex = photos.length - 1;
        }
        if (panelStates[i].photoIndex > idx) {
          panelStates[i].photoIndex--;
        }
      }
      renderPhotoStrip();
      redrawWithHighlight();
    });
    thumb.appendChild(removeBtn);
    photoStrip.appendChild(thumb);
  });
}

function exportPNG(sizeW, sizeH) {
  const expCanvas = document.createElement('canvas');
  const sk = sizeW + 'x' + sizeH;
  const tit = getCurrentTitle();
  const sub = getCurrentSubtitle();
  const cap = getCurrentCaption();
  drawCover(expCanvas, photos, panelStates, tit, sub, cap, sk, { colorGrade: grade });
  expCanvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta-cover-' + sk + '.png';
    a.click();
    if (statusEl) statusEl.textContent = 'Saved gta-cover-' + sk + '.png';
  }, 'image/png');
}

function setupDropZone() {
  const body = document.body;
  let dragCounter = 0;

  body.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.add('active');
    if (canvasWrap) canvasWrap.classList.add('drag-active');
  });

  body.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay.classList.remove('active');
      if (canvasWrap) canvasWrap.classList.remove('drag-active');
    }
  });

  body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  body.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    if (canvasWrap) canvasWrap.classList.remove('drag-active');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const promises = [];
    for (const file of files) {
      promises.push(addPhoto(file));
    }
    Promise.all(promises);
  });
}

function setupEvents() {
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('wheel', handleCanvasWheel, { passive: false });
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);
  }
  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      sizeKey = sizeSelect.value;
      initPanelStates();
      selectedPanel = -1;
      updatePanelControls();
      redrawWithHighlight();
    });
  }
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      titleText = titleInput.value;
      redrawWithHighlight();
    });
  }
  if (subtitleInput) {
    subtitleInput.addEventListener('input', () => {
      subtitleText = subtitleInput.value;
      redrawWithHighlight();
    });
  }
  if (captionInput) {
    captionInput.addEventListener('input', () => {
      caption = captionInput.value;
      redrawWithHighlight();
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const sk = getCurrentSizeKey();
      const parts = sk.split('x');
      exportPNG(parseInt(parts[0]), parseInt(parts[1]));
    });
  }
  if (export1080Btn) {
    export1080Btn.addEventListener('click', () => exportPNG(1080, 1080));
  }
  if (exportPortraitBtn) {
    exportPortraitBtn.addEventListener('click', () => exportPNG(1080, 1350));
  }
  if (addPhotoBtn) {
    addPhotoBtn.addEventListener('click', () => photoFileInput.click());
  }
  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        promises.push(addPhoto(files[i]));
      }
      Promise.all(promises).then(() => {
        photoFileInput.value = '';
      });
    });
  }
  if (zoomSlider) {
    zoomSlider.addEventListener('input', () => {
      if (selectedPanel >= 0) {
        panelStates[selectedPanel].zoom = parseFloat(zoomSlider.value);
        redrawWithHighlight();
      }
    });
  }
  if (offsetXSlider) {
    offsetXSlider.addEventListener('input', () => {
      if (selectedPanel >= 0) {
        panelStates[selectedPanel].ox = parseFloat(offsetXSlider.value);
        redrawWithHighlight();
      }
    });
  }
  if (offsetYSlider) {
    offsetYSlider.addEventListener('input', () => {
      if (selectedPanel >= 0) {
        panelStates[selectedPanel].oy = parseFloat(offsetYSlider.value);
        redrawWithHighlight();
      }
    });
  }
  if (tintSlider) {
    tintSlider.addEventListener('input', () => {
      if (selectedPanel >= 0) {
        panelStates[selectedPanel].tint = parseFloat(tintSlider.value);
        redrawWithHighlight();
      }
    });
  }
  if (gradeSlider) {
    gradeSlider.addEventListener('input', () => {
      grade = parseFloat(gradeSlider.value);
      redrawWithHighlight();
    });
  }
  setupDropZone();
}

async function loadSamplePhoto(mode, photoParam, cap, tit, sub, size) {
  const url = 'samples/' + photoParam + '.jpg';
  const img = await loadImage(url);
  photos = [img];
  caption = cap;
  titleText = tit || 'SUNSET HEIST';
  subtitleText = sub || 'Coming 2025';
  sizeKey = size || INITIAL_SIZE;
  if (sizeSelect) sizeSelect.value = sizeKey;
  if (titleInput) titleInput.value = titleText;
  if (subtitleInput) subtitleInput.value = subtitleText;
  if (captionInput) captionInput.value = caption;
  grade = 1.0;
  if (gradeSlider) gradeSlider.value = 1.0;
  selectedPanel = -1;
  initPanelStates();
  updatePanelControls();
  renderPhotoStrip();
  redrawWithHighlight();
}

async function init() {
  setupEvents();

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), loadSamplePhoto);
  } else {
    if (sizeSelect) sizeSelect.value = INITIAL_SIZE;
    sizeKey = INITIAL_SIZE;
    grade = 1.0;
    initPanelStates();
    updatePanelControls();
    redrawWithHighlight();
  }
}

init();