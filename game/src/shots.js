// Screenshot poses (?shot=1..4, deterministic, fixed seed).
// Each pose loads a heist, places the thief and the guards, and settles a few
// fixed steps so the frame shows a real moment of play — never a mock-up.

import { TILE } from './levels.js';
import { loadHeist, update, emitNoise } from './engine.js';

const P = (x, y) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });

function settle(run, input, steps) {
  for (let i = 0; i < steps; i++) update(run, input || {}, 1 / 60);
}

export function applyShot(run, shot) {
  const idle = {};
  if (shot === '1') {
    // Cover: the Belltower, thief in shadow under a swinging lantern,
    // the captain's cone sweeping past, a fresh footstep ripple ringing out.
    loadHeist(run, 5);
    run.state = 'playing';
    const p = P(22, 13);
    run.player.x = p.x; run.player.y = p.y; run.player.dir = Math.PI;
    run.guards[0].x = P(26, 7).x; run.guards[0].y = P(26, 7).y; run.guards[0].dir = Math.PI;
    run.guards[1].x = P(13, 6).x; run.guards[1].y = P(13, 6).y; run.guards[1].dir = Math.PI / 2;
    emitNoise(run, p.x, p.y, 90, 'wood');
    run.message = 'The Bell of Silence hangs above. Ring nothing.';
    run.messageT = 99;
    settle(run, idle, 3);
  } else if (shot === '2') {
    // Tension: the Library, a hound half-sure it heard something — '?' above it,
    // suspicion meter half full, thief flat against a bookshelf in the dark.
    loadHeist(run, 3);
    run.state = 'playing';
    const p = P(12, 6);
    run.player.x = p.x; run.player.y = p.y; run.player.dir = 0; run.player.sneak = true;
    const h = run.guards[2];
    h.x = P(16, 8).x; h.y = P(16, 8).y; h.dir = Math.PI; h.mode = 'suspicious'; h.meter = 0.62; h.wait = 99;
    run.guards[0].x = P(21, 10).x; run.guards[0].y = P(21, 10).y; run.guards[0].dir = -Math.PI / 2;
    emitNoise(run, P(13, 6).x, P(13, 6).y, 70, 'wood');
    run.message = 'The hound heard that. Hold still — darkness is on your side.';
    run.messageT = 99;
    settle(run, idle, 3);
  } else if (shot === '3') {
    // Lockpick: the Marble Hall, needle mid-swing over the green zone,
    // a patroller's cone closing in from the right.
    loadHeist(run, 2);
    run.state = 'playing';
    const p = P(10, 11);
    run.player.x = p.x; run.player.y = p.y; run.player.dir = 0;
    run.guards[0].x = P(20, 12).x; run.guards[0].y = P(20, 12).y; run.guards[0].dir = Math.PI;
    run.lockpick = { case: run.cases[0], needle: 0.7, dir: 1, hits: 2, need: 3, zone: [0.62, 0.82], t: 0 };
    run.state = 'lockpick';
    run.message = '';
    run.messageT = 0;
  } else {
    // Complete: the final heist won, ghost bonus, the echo of the whole route
    // drawn behind the thief as a fading trail.
    loadHeist(run, 5);
    run.state = 'playing';
    const p = P(2, 15);
    run.player.x = p.x; run.player.y = p.y; run.player.dir = 0;
    run.treasures.forEach((t) => { t.got = true; });
    run.gem.got = true;
    run.loot = 48 * 100 + 500 + 3 * 250;
    run.score = run.loot + 500 + 240;
    run.dawn = 120;
    run.trail = [];
    for (let i = 0; i < 120; i++) {
      run.trail.push({ x: 80 + i * 9, y: 620 - Math.sin(i / 9) * 120, t: i * 0.25 });
    }
    run.state = 'complete';
    run.complete = { timeBonus: 240, ghostBonus: 500, loot: run.loot };
    run.message = '';
    run.messageT = 0;
  }
}
