// ECHOBELL boot — input, fixed-step loop, screens, screenshot poses.
// The game is one canvas, 1280x720, no network, no assets to fetch.

import { LEVELS } from './levels.js';
import { VIEW, newRun, loadHeist, update, useGadget, startLockpick, endHeist } from './engine.js';
import { draw } from './render.js';
import { initAudio, footstep, pickup, gemTake, alarmSting, bellRing, lockClick, caughtSting } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.W;
canvas.height = VIEW.H;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

const run = newRun(seed);
run.level = LEVELS[0];
loadHeist(run, 0);
run.state = 'title';

const input = { up: false, down: false, left: false, right: false, sneak: false, run: false, action: false };
const keys = {};

function keyState(code) {
  return code === 'KeyW' || code === 'ArrowUp' ? 'up'
    : code === 'KeyS' || code === 'ArrowDown' ? 'down'
    : code === 'KeyA' || code === 'ArrowLeft' ? 'left'
    : code === 'KeyD' || code === 'ArrowRight' ? 'right' : null;
}

let lastAlarm = 0;

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  initAudio();
  const dir = keyState(e.code);
  if (dir) input[dir] = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
  if (e.code === 'Space') {
    input.run = true;
    if (run.state === 'lockpick') input.action = true;
  }
  if (e.code === 'Enter') advance();
  if (e.code === 'KeyP' && (run.state === 'playing' || run.state === 'paused')) {
    run.state = run.state === 'playing' ? 'paused' : 'playing';
  }
  if (e.code === 'KeyE') {
    if (run.state === 'playing') { if (!startLockpick(run)) input.action = true; }
    else if (run.state === 'lockpick') input.action = true;
  }
  if (e.code === 'KeyR' && run.state === 'caught') {
    loadHeist(run, run.heist);
    run.state = 'playing';
  }
  if (e.code === 'KeyT' && (run.state === 'caught' || run.state === 'campaign')) {
    run.score = 0; run.loot = 0; run.ghost = true;
    loadHeist(run, 0);
    run.state = 'title';
  }
  if (run.state === 'playing' && ['Digit1', 'Digit2', 'Digit4', 'Digit5'].includes(e.code)) {
    useGadget(run, e.code.slice(-1));
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  const dir = keyState(e.code);
  if (dir) input[dir] = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
  if (e.code === 'Space') input.run = false;
});

function advance() {
  if (run.state === 'title') {
    run.score = 0; run.loot = 0; run.ghost = true;
    loadHeist(run, 0);
    run.state = 'briefing';
  } else if (run.state === 'briefing') {
    run.state = 'playing';
  } else if (run.state === 'complete') {
    if (run.heist + 1 < LEVELS.length) {
      loadHeist(run, run.heist + 1);
      run.state = 'briefing';
    } else {
      run.state = 'campaign';
    }
  }
}

// Sound hooks: watch the run for events the engine already recorded.
let lastLoot = 0, lastRipples = 0;
function soundHooks() {
  if (run.loot > lastLoot) {
    if (run.gem && run.gem.got && lastLoot < 500) gemTake(); else pickup();
  }
  lastLoot = run.loot;
  if (run.ripples.length > lastRipples && run.player) {
    const r = run.ripples[run.ripples.length - 1];
    if (r.label === 'decoy bell') bellRing();
    else if (r.label === 'clatter') lockClick(false);
    else if (r.label === 'tumbler') lockClick(true);
    else if (r.label === 'chime') gemTake();
    else footstep(r.label, run.player ? run.player.sneak : false);
  }
  lastRipples = run.ripples.length;
  if (run.alarm === 2 && lastAlarm !== 2) alarmSting();
  lastAlarm = run.alarm;
  if (run.state === 'caught' && !soundHooks.caught) { caughtSting(); soundHooks.caught = true; }
  if (run.state !== 'caught') soundHooks.caught = false;
}

let acc = 0, last = performance.now(), frames = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  const step = 1 / 60;
  while (acc >= step) {
    acc -= step;
    frames++;
    if (shotName && frames > 6) { draw(ctx, run); requestAnimationFrame(frame); return; }
    if (run.state === 'playing' || run.state === 'lockpick') {
      update(run, input, step);
      soundHooks();
    }
  }
  draw(ctx, run);
  requestAnimationFrame(frame);
}

if (shotName) {
  applyShot(run, shotName);
} else {
  requestAnimationFrame(frame);
  // Expose the run for play-testing and debugging.
  window.__game = { run, input };
}
// In shot mode the pose is applied, a few frames settle, then the loop draws once.
if (shotName) requestAnimationFrame(frame);
