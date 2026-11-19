// GTA Cover Art – a make.fun competition entry (Node 22, standard library only).
// Offline web app in app/: multi-panel key-art grid with Vice City color grade,
// halftone dots, grain, chromatic aberration, palm silhouettes and scanlines.
// Copies app/ and screenshots/ to /output and writes dossier.json.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(here, 'app', 'index.html'))) {
  console.error('FATAL: app/index.html missing – the entry directory is incomplete.');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossierBytes = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossierBytes);

const scDir = join(out, 'screenshots');
const scFiles = existsSync(scDir)
  ? readdirSync(scDir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort()
  : [];
const appFiles = readdirSync(join(out, 'app'), { recursive: true }).filter((_, i) => true);

console.log(`Dossier written: ${dossierBytes.length} bytes`);
console.log(`Screenshots: ${scFiles.length} files – ${scFiles.join(', ') || 'none'}`);
console.log(`App files: ${appFiles.length} entries under app/`);
console.log(`VERIFIED: app/index.html present, ${scFiles.length} screenshots, dossier.json ready.`);
