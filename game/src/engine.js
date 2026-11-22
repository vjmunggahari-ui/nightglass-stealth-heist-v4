// ECHOBELL engine — sound is visible, silence is loot.
// One update step, fixed dt. No DOM here except through the callbacks the
// boot file wires in; the state object is plain data so shots can pose it.

import { TILE, COLS, ROWS, FLOOR, LEVELS } from './levels.js';

export const VIEW = { W: COLS * TILE, H: ROWS * TILE };

const TAU = Math.PI * 2;

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

// Deterministic PRNG (mulberry32) so screenshot poses and replays are stable.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tileAt(level, x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return level.map[ty][tx];
}
export function solidAt(level, x, y) {
  const t = tileAt(level, x, y);
  return t === '#' || t === 'C';
}
export function floorAt(level, x, y) {
  const t = tileAt(level, x, y);
  return FLOOR[t] || FLOOR['.'];
}

// Grid raycast: true when no wall/case blocks the segment.
export function lineOfSight(level, ax, ay, bx, by) {
  const steps = Math.ceil(dist(ax, ay, bx, by) / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solidAt(level, ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
  }
  return true;
}

const GUARD = {
  P: { name: 'Patroller', speed: 62, view: 230, hear: 1.0, fov: 1.05, color: '#e8b34b' },
  W: { name: 'Watcher', speed: 0, view: 260, hear: 0.8, fov: 1.25, color: '#e07a5f' },
  H: { name: 'Hound', speed: 96, view: 200, hear: 1.7, fov: 0.9, color: '#b565d8' },
  K: { name: 'Captain', speed: 66, view: 250, hear: 1.2, fov: 1.1, color: '#e5484d' },
};

export function newRun(seed = 7) {
  return {
    seed, heist: 0, score: 0, loot: 0, ghost: true,
    state: 'title', // title | briefing | playing | paused | lockpick | caught | complete | campaign
    time: 0, dawn: 0, alarm: 0, // 0 calm, 1 stirred, 2 hunted
    player: null, guards: [], ripples: [], echoes: [], trail: [],
    treasures: [], cases: [], gem: null, exit: null, lanterns: [],
    gadgets: { smoke: 3, decoy: 2, blackout: 1, boots: false },
    lockpick: null, message: '', messageT: 0, caughtBy: '',
    stats: { seen: 0, heard: 0, alarms: 0 },
    blackoutT: 0, smokeT: 0, smokeX: 0, smokeY: 0,
  };
}

export function loadHeist(run, idx) {
  const L = LEVELS[idx];
  run.level = L;
  run.heist = idx;
  run.ghost = true; // each heist is a fresh chance to be a ghost
  run.state = 'briefing';
  run.dawn = L.dawn;
  run.time = 0;
  run.alarm = 0;
  run.ripples = []; run.echoes = []; run.trail = [];
  run.treasures = []; run.cases = []; run.lanterns = [];
  run.blackoutT = 0; run.smokeT = 0;
  run.lockpick = null;
  run.message = L.brief; run.messageT = 6;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = L.map[y][x];
    const cx = x * TILE + TILE / 2, cy = y * TILE + TILE / 2;
    if (c === 'S') run.player = { x: cx, y: cy, dir: 0, speed: 0, moving: false, sneak: false, run: false, step: 0, seen: 0, hidden: 0 };
    if (c === 'T') run.treasures.push({ x: cx, y: cy, got: false, value: 100 });
    if (c === 'C') run.cases.push({ x, y, cx, cy, opened: false, value: 250 });
    if (c === 'G') run.gem = { x: cx, y: cy, got: false };
    if (c === 'X') run.exit = { x: cx, y: cy };
    if (c === 'L') run.lanterns.push({ x: cx, y: cy, phase: (x * 7 + y * 13) % 10 });
  }
  run.guards = L.guards.map((g) => ({
    kind: g.k, def: GUARD[g.k],
    x: g.x * TILE + TILE / 2, y: g.y * TILE + TILE / 2,
    path: g.path.map(([px, py]) => ({ x: px * TILE + TILE / 2, y: py * TILE + TILE / 2 })),
    wp: 0, dir: 0, mode: 'patrol', // patrol | suspicious | search | chase
    meter: 0, wait: 0, tx: 0, ty: 0, searchT: 0, speed: g.speed || 1,
    stuck: 0,
  }));
  return L;
}

export function emitNoise(run, x, y, radius, label) {
  run.ripples.push({ x, y, r: 8, max: radius, age: 0, label });
  // A lingering echo: guards path to the last loud sound for a few seconds.
  run.echoes.push({ x, y, radius, age: 0, ttl: 4.5, label });
  if (run.echoes.length > 6) run.echoes.shift();
}

function moveCircle(level, e, dx, dy, radius) {
  // Axis-separated so the thief slides along walls instead of sticking.
  let nx = e.x + dx;
  if (!solidAt(level, nx + Math.sign(dx) * radius, e.y - radius + 2) &&
      !solidAt(level, nx + Math.sign(dx) * radius, e.y + radius - 2) &&
      !solidAt(level, nx + Math.sign(dx) * radius, e.y)) e.x = nx;
  let ny = e.y + dy;
  if (!solidAt(level, e.x - radius + 2, ny + Math.sign(dy) * radius) &&
      !solidAt(level, e.x + radius - 2, ny + Math.sign(dy) * radius) &&
      !solidAt(level, e.x, ny + Math.sign(dy) * radius)) e.y = ny;
}

export function update(run, input, dt) {
  const L = LEVELS[run.heist];
  if (run.state !== 'playing' && run.state !== 'lockpick') return;
  run.time += dt;
  run.dawn -= dt;
  if (run.messageT > 0) run.messageT -= dt;
  if (run.blackoutT > 0) run.blackoutT -= dt;
  if (run.smokeT > 0) run.smokeT -= dt;
  if (run.dawn <= 0) {
    run.dawn = 0;
    return endHeist(run, false, 'Dawn broke over the rooftops. The city woke — and so did the guards.');
  }
  for (const r of run.ripples) { r.age += dt; r.r = 8 + (r.max - 8) * Math.min(1, r.age * 1.4); }
  run.ripples = run.ripples.filter((r) => r.age < 1.2);
  for (const e of run.echoes) e.age += dt;
  run.echoes = run.echoes.filter((e) => e.age < e.ttl);

  const p = run.player;
  if (run.state === 'playing') updatePlayer(run, L, input, dt, p);
  updateGuards(run, L, dt);
  if (run.state === 'lockpick') updateLockpick(run, input, dt);
  checkPickups(run, L);
}

function updatePlayer(run, L, input, dt, p) {
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(mx, my) || 1;
  p.sneak = !!input.sneak;
  p.run = !!input.run && !p.sneak;
  const floor = floorAt(L, p.x, p.y);
  const base = 108 * floor.speed;
  const speed = p.sneak ? base * 0.55 : p.run ? base * 1.55 : base;
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    p.dir = Math.atan2(my, mx);
    moveCircle(L, p, (mx / mag) * speed * dt, (my / mag) * speed * dt, 13);
    // Footsteps ring out. Carpet drinks them; wood shouts; marble echoes.
    p.step += speed * dt;
    const stride = p.sneak ? 46 : p.run ? 30 : 38;
    if (p.step >= stride) {
      p.step = 0;
      const gait = p.sneak ? 0.35 : p.run ? 1.9 : 1.0;
      const boots = run.gadgets.boots ? 0.3 : 1.0;
      const radius = 46 * floor.noise * gait * boots;
      if (radius > 14) emitNoise(run, p.x, p.y, radius, floor.name);
    }
    run.trail.push({ x: p.x, y: p.y, t: run.time });
    if (run.trail.length > 900) run.trail.shift();
  }
  p.seen = Math.max(0, p.seen - dt * 0.25);
}

function guardSees(run, L, g) {
  const p = run.player;
  const d = dist(g.x, g.y, p.x, p.y);
  const view = g.def.view * (run.blackoutT > 0 ? 0.5 : 1);
  if (d > view) return 0;
  let a = Math.atan2(p.y - g.y, p.x - g.x) - g.dir;
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  if (Math.abs(a) > g.def.fov) return 0;
  if (!lineOfSight(L, g.x, g.y, p.x, p.y)) return 0;
  // Shadow hides you: standing in darkness halves the read. Sneaking halves it again.
  const inLight = run.blackoutT <= 0 && run.lanterns.some((l) => dist(p.x, p.y, l.x, l.y) < 95);
  let strength = 1 - d / view;
  if (!inLight) strength *= 0.55;
  if (p.sneak) strength *= 0.55;
  if (run.smokeT > 0 && dist(p.x, p.y, run.smokeX, run.smokeY) < 95) strength = 0;
  return strength;
}

function guardHears(run, g, e) {
  const d = dist(g.x, g.y, e.x, e.y);
  return d < e.radius * g.def.hear;
}

function updateGuards(run, L, dt) {
  const p = run.player;
  for (const g of run.guards) {
    const seen = guardSees(run, L, g);
    if (seen > 0) {
      g.meter = clamp(g.meter + seen * dt * 1.5, 0, 1);
      if (g.meter > 0.35 && g.mode === 'patrol') { g.mode = 'suspicious'; run.stats.seen++; }
      if (g.meter >= 1 && g.mode !== 'chase') {
        g.mode = 'chase';
        run.ghost = false;
        run.alarm = 2;
        run.stats.alarms++;
        if (g.kind === 'K') {
          // The captain radios the whole floor: every guard hunts you.
          for (const o of run.guards) if (o.mode !== 'chase') { o.mode = 'chase'; o.meter = 1; }
          run.message = 'The captain raised the alarm — every guard is hunting you!';
          run.messageT = 4;
        }
      }
      g.dir = angleTo(g.x, g.y, p.x, p.y);
    } else {
      g.meter = Math.max(0, g.meter - dt * 0.4);
      if (g.mode === 'suspicious' && g.meter <= 0.05) g.mode = 'patrol';
    }
    // Hearing: the loudest fresh echo pulls the guard to investigate.
    if (g.mode === 'patrol' || g.mode === 'suspicious') {
      for (const e of run.echoes) {
        if (guardHears(run, g, e)) {
          g.mode = 'search'; g.tx = e.x; g.ty = e.y; g.searchT = 6;
          run.stats.heard++;
          run.alarm = Math.max(run.alarm, 1);
          break;
        }
      }
    }
    const sp = g.def.speed * g.speed * (g.mode === 'chase' ? 1.35 : g.mode === 'search' ? 1.1 : 1);
    if (g.mode === 'chase') {
      stepToward(run, L, g, p.x, p.y, sp, dt);
      if (dist(g.x, g.y, p.x, p.y) < 26) {
        return endHeist(run, false, `Caught by the ${g.def.name.toLowerCase()} — ${g.def.name === 'Hound' ? 'it heard you coming a mile off.' : 'seen, chased, caught.'}`);
      }
      if (seen <= 0) {
        g.searchT -= dt;
        if (g.searchT <= -4) { g.mode = 'search'; g.tx = p.x; g.ty = p.y; g.searchT = 6; }
      } else g.searchT = 0;
    } else if (g.mode === 'search') {
      stepToward(run, L, g, g.tx, g.ty, sp, dt);
      g.searchT -= dt;
      if (dist(g.x, g.y, g.tx, g.ty) < 24 || g.searchT <= 0) {
        g.mode = 'patrol'; g.wait = 1.2;
      }
    } else if (g.mode === 'suspicious') {
      g.dir += dt * 0.9; // turns, scanning for what it half-saw
      g.wait -= dt;
      if (g.wait <= 0) g.mode = 'patrol';
    } else {
      // Patrol: walk the waypoints, pause and look around at each one.
      if (g.wait > 0) { g.wait -= dt; g.dir += dt * 0.6; continue; }
      if (!g.path.length) continue;
      const wp = g.path[g.wp % g.path.length];
      if (dist(g.x, g.y, wp.x, wp.y) < 12) {
        g.wp = (g.wp + 1) % g.path.length;
        g.wait = 1.6;
        continue;
      }
      stepToward(run, L, g, wp.x, wp.y, sp, dt);
    }
  }
  // The hunt cools when nobody has seen you for a while.
  if (run.alarm === 2 && !run.guards.some((g) => g.mode === 'chase')) run.alarm = 1;
  if (run.alarm === 1 && !run.guards.some((g) => g.mode !== 'patrol')) run.alarm = 0;
}

function stepToward(run, L, g, tx, ty, sp, dt) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return;
  const nx = g.x + ((tx - g.x) / d) * sp * dt;
  const ny = g.y + ((ty - g.y) / d) * sp * dt;
  const ox = g.x, oy = g.y;
  moveCircle(L, g, nx - g.x, ny - g.y, 13);
  g.dir = angleTo(ox, oy, g.x, g.y);
  if (dist(g.x, g.y, ox, oy) < 0.5) g.stuck += dt; else g.stuck = 0;
}

function checkPickups(run, L) {
  const p = run.player;
  for (const t of run.treasures) {
    if (!t.got && dist(p.x, p.y, t.x, t.y) < 26) {
      t.got = true; run.loot += t.value; run.score += t.value;
    }
  }
  if (run.gem && !run.gem.got && dist(p.x, p.y, run.gem.x, run.gem.y) < 26) {
    run.gem.got = true; run.loot += 500; run.score += 500;
    run.message = 'The chime is yours. Now reach the exit — unseen.';
    run.messageT = 5;
    emitNoise(run, run.gem.x, run.gem.y, 60, 'chime');
  }
  if (run.gem && run.gem.got && run.exit && dist(p.x, p.y, run.exit.x, run.exit.y) < 28) {
    return endHeist(run, true, '');
  }
}

export function startLockpick(run) {
  const p = run.player;
  const c = run.cases.find((cc) => !cc.opened && dist(p.x, p.y, cc.cx, cc.cy) < TILE * 1.6);
  if (!c) return false;
  run.lockpick = { case: c, needle: 0, dir: 1, hits: 0, need: 3, zone: [0.62, 0.82], t: 0 };
  run.state = 'lockpick';
  return true;
}

function updateLockpick(run, input, dt) {
  const lp = run.lockpick;
  lp.t += dt;
  lp.needle += lp.dir * dt * 1.7;
  if (lp.needle > 1) { lp.needle = 1; lp.dir = -1; }
  if (lp.needle < 0) { lp.needle = 0; lp.dir = 1; }
  if (input.action) {
    input.action = false;
    if (lp.needle >= lp.zone[0] && lp.needle <= lp.zone[1]) {
      lp.hits++;
      const z0 = 0.15 + Math.random() * 0.55;
      lp.zone = [z0, z0 + 0.2];
      emitNoise(run, run.player.x, run.player.y, 40, 'tumbler');
      if (lp.hits >= lp.need) {
        lp.case.opened = true;
        run.loot += lp.case.value; run.score += lp.case.value;
        run.message = `Case cracked — +${lp.case.value} loot.`;
        run.messageT = 3;
        run.state = 'playing';
        run.lockpick = null;
      }
    } else {
      // A slipped pick clatters. Loud.
      emitNoise(run, run.player.x, run.player.y, 150, 'clatter');
      run.state = 'playing';
      run.lockpick = null;
    }
  }
}

export function useGadget(run, key) {
  const p = run.player;
  if (key === '1' && run.gadgets.smoke > 0) {
    run.gadgets.smoke--; run.smokeT = 3; run.smokeX = p.x; run.smokeY = p.y;
    run.message = 'Smoke vial — three seconds of nothing to see.'; run.messageT = 3;
  } else if (key === '2' && run.gadgets.decoy > 0) {
    run.gadgets.decoy--;
    const bx = p.x + Math.cos(p.dir) * 120, by = p.y + Math.sin(p.dir) * 120;
    emitNoise(run, bx, by, 320, 'decoy bell');
    run.message = 'Decoy bell rings down the hall — they all turn to listen.'; run.messageT = 3;
  } else if (key === '4' && run.gadgets.blackout > 0) {
    run.gadgets.blackout--; run.blackoutT = 10;
    run.message = 'Blackout — the lanterns die for ten seconds.'; run.messageT = 3;
  } else if (key === '5') {
    run.gadgets.boots = !run.gadgets.boots;
    run.message = run.gadgets.boots ? 'Muffle boots on — slow, but silent.' : 'Muffle boots off.';
    run.messageT = 2;
  }
}

export function endHeist(run, won, reason) {
  if (won) {
    const timeBonus = Math.round(run.dawn) * 2;
    const ghostBonus = run.ghost ? 500 : 0;
    run.score += timeBonus + ghostBonus;
    run.state = 'complete';
    run.complete = { timeBonus, ghostBonus, loot: run.loot };
  } else {
    run.state = 'caught';
    run.caughtBy = reason;
  }
}
