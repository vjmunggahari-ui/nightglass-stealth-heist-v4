// ECHOBELL — the hand-in program for best-stealth-game-20261121-1759.
// It copies game/ and screenshots/ beside this file into the output directory
// the grader provides (MAKEFUN_OUTPUT_DIR outside the grader) and writes the
// dossier the judge reads, built with the vendored make.fun library.
// Node 22+, standard library only.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';
import { LEVELS, validateLevel } from './game/src/levels.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || join(root, 'output');

// Every heist must pass its own level check before anything is handed in.
for (const level of LEVELS) {
  const problems = validateLevel(level);
  if (problems.length > 0) {
    throw new Error(`heist ${level.id} ${level.name}: ${problems.join('; ')}`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// Read the dossier back and check it says what the hand-in should say:
// the schema, four screenshots (the first is the cover), and the game source
// embedded in the text — index.html first among them.
const back = JSON.parse(readFileSync(join(out, 'dossier.json'), 'utf8'));
if (back.schema !== 'makefun/dossier/v1') throw new Error('dossier schema mismatch');
const images = back.images ?? [];
if (images.length < 3 || images.length > 4) throw new Error(`expected 3-4 screenshots, got ${images.length}`);
if (back.cover !== 0) throw new Error(`expected cover 0, got ${back.cover}`);
const text = back.text ?? '';
if (!text.includes('game/index.html')) throw new Error('game/index.html missing from dossier text');
if (!text.includes('game/src/engine.js')) throw new Error('game/src/engine.js missing from dossier text');
const sourceCount = (text.match(/### game\//g) || []).length;
if (sourceCount < 7) throw new Error(`expected 7 game source files in dossier, got ${sourceCount}`);
console.log(`ECHOBELL handed in: ${LEVELS.length} heists, ${sourceCount} game files, ${images.length} screenshots, dossier ${dossier.length} bytes`);
