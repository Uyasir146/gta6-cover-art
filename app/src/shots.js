import { waitForFonts } from './lettering.js';

export async function runShot(shot, query, load) {
  const photoParam = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Sunset Heist';
  const title = query.get('title') || 'SUNSET HEIST';
  const subtitle = query.get('subtitle') || 'Coming 2025';
  const sizeKey = query.get('size') || '1920x1080';

  await waitForFonts();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await load('cover', photoParam, caption, title, subtitle, sizeKey);
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    })));
  } else if (shot === 'editor') {
    await load('editor', photoParam, caption, title, subtitle, sizeKey);
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
    })));
  }
}