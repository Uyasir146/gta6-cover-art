const GUTTER = 16;
const LAYOUTS = {
  '1920x1080': {
    w: 1920, h: 1080,
    title: { x: 0, y: 0, w: 1920, h: 130 },
    panels: [
      { x: 0, y: 146, w: 880, h: 460 },
      { x: 896, y: 146, w: 520, h: 230 },
      { x: 1432, y: 146, w: 488, h: 460 },
      { x: 896, y: 392, w: 520, h: 214 },
      { x: 0, y: 622, w: 600, h: 344 },
      { x: 616, y: 622, w: 680, h: 344 },
      { x: 1312, y: 622, w: 608, h: 344 },
    ],
    caption: { x: 0, y: 982, w: 1920, h: 98 },
  },
  '1080x1350': {
    w: 1080, h: 1350,
    title: { x: 0, y: 0, w: 1080, h: 140 },
    panels: [
      { x: 0, y: 156, w: 1080, h: 480 },
      { x: 0, y: 652, w: 520, h: 362 },
      { x: 536, y: 652, w: 544, h: 180 },
      { x: 536, y: 848, w: 544, h: 166 },
      { x: 0, y: 1030, w: 1080, h: 226 },
    ],
    caption: { x: 0, y: 1256, w: 1080, h: 94 },
  },
  '1080x1080': {
    w: 1080, h: 1080,
    title: { x: 0, y: 0, w: 1080, h: 130 },
    panels: [
      { x: 0, y: 146, w: 520, h: 490 },
      { x: 536, y: 146, w: 544, h: 240 },
      { x: 536, y: 402, w: 544, h: 234 },
      { x: 0, y: 652, w: 360, h: 328 },
      { x: 376, y: 652, w: 704, h: 328 },
    ],
    caption: { x: 0, y: 980, w: 1080, h: 100 },
  },
};

export function getLayout(sizeKey) {
  return LAYOUTS[sizeKey] || LAYOUTS['1080x1080'];
}

export function layoutSizeKey(w, h) {
  return w + 'x' + h;
}

export { GUTTER };