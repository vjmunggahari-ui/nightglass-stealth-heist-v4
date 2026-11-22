// ECHOBELL renderer — canvas 2D. Darkness is the game: the world is drawn
// lit, then a shadow layer is punched through with lantern pools and cones.

import { TILE, COLS, ROWS, FLOOR } from './levels.js';
import { VIEW, clamp } from './engine.js';

const FLOOR_COLOR = { '.': '#2a2f3a', ',': '#3d2f2a', '=': '#4a3826', M: '#35383f', L: '#2a2f3a' };

export function draw(ctx, run) {
  const L = run.level;
  ctx.clearRect(0, 0, VIEW.W, VIEW.H);
  if (run.state === 'title') { drawTitle(ctx, run); return; }
  drawFloor(ctx, L);
  drawObjects(ctx, run);
  drawTrail(ctx, run);
  drawRipples(ctx, run);
  drawGuards(ctx, run);
  drawPlayer(ctx, run);
  drawDarkness(ctx, run);
  drawCones(ctx, run);
  drawHud(ctx, run);
  if (run.state === 'briefing') drawBriefing(ctx, run);
  if (run.state === 'paused') drawCenter(ctx, 'PAUSED', 'Press P to resume. The guards wait for no one.');
  if (run.state === 'lockpick') drawLockpick(ctx, run);
  if (run.state === 'caught') drawCaught(ctx, run);
  if (run.state === 'complete') drawComplete(ctx, run);
  if (run.state === 'campaign') drawCampaign(ctx, run);
}

function drawFloor(ctx, L) {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = L.map[y][x];
    if (c === '#') {
      ctx.fillStyle = '#171a21';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.fillStyle = '#232833';
      ctx.fillRect(x * TILE, y * TILE, TILE, 3);
      continue;
    }
    ctx.fillStyle = FLOOR_COLOR[c] || '#2a2f3a';
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    if (c === '=') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(x * TILE, y * TILE + 13); ctx.lineTo(x * TILE + TILE, y * TILE + 13);
      ctx.moveTo(x * TILE, y * TILE + 27); ctx.lineTo(x * TILE + TILE, y * TILE + 27);
      ctx.stroke();
    }
    if (c === 'M') {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
    }
    if (c === ',') {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x * TILE + 6, y * TILE + 6, TILE - 12, TILE - 12);
    }
  }
}

function drawObjects(ctx, run) {
  for (const t of run.treasures) {
    if (t.got) continue;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(t.x - 2, t.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const c of run.cases) {
    ctx.fillStyle = c.opened ? '#3a2f22' : '#6b4f2a';
    ctx.fillRect(c.cx - 14, c.cy - 14, 28, 28);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.cx - 14, c.cy - 14, 28, 28);
    ctx.lineWidth = 1;
    if (!c.opened) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔒'.replace('🔒', '◆'), c.cx, c.cy + 1);
    }
  }
  if (run.gem && !run.gem.got) {
    const pulse = 1 + 0.15 * Math.sin(run.time * 3);
    ctx.fillStyle = '#7ee8fa';
    ctx.beginPath(); ctx.arc(run.gem.x, run.gem.y, 11 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0fbff';
    ctx.beginPath(); ctx.arc(run.gem.x, run.gem.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  if (run.exit) {
    ctx.fillStyle = '#51cf66';
    ctx.fillRect(run.exit.x - 16, run.exit.y - 16, 32, 32);
    ctx.fillStyle = '#0b1f10';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', run.exit.x, run.exit.y);
  }
  for (const l of run.lanterns) {
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTrail(ctx, run) {
  // The echo of your route: a fading ghost trail, shown once a heist is won.
  if (run.state !== 'complete' && run.state !== 'campaign') return;
  if (run.trail.length < 2) return;
  ctx.strokeStyle = 'rgba(126,232,250,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(run.trail[0].x, run.trail[0].y);
  for (const pt of run.trail) ctx.lineTo(pt.x, pt.y);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawRipples(ctx, run) {
  for (const r of run.ripples) {
    const a = 1 - r.age / 1.2;
    ctx.strokeStyle = `rgba(255,209,102,${(a * 0.9).toFixed(2)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
  for (const e of run.echoes) {
    const a = Math.max(0, 1 - e.age / e.ttl);
    ctx.strokeStyle = `rgba(255,209,102,${(a * 0.35).toFixed(2)})`;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (0.4 + 0.6 * (1 - a)), 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawGuards(ctx, run) {
  for (const g of run.guards) {
    // Body.
    ctx.fillStyle = g.def.color;
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(g.x + Math.cos(g.dir) * 6, g.y + Math.sin(g.dir) * 6, 4, 0, Math.PI * 2); ctx.fill();
    // Suspicion meter + mark.
    if (g.meter > 0.05) {
      ctx.fillStyle = '#111';
      ctx.fillRect(g.x - 14, g.y - 26, 28, 5);
      ctx.fillStyle = g.meter >= 1 ? '#e5484d' : '#ffd166';
      ctx.fillRect(g.x - 13, g.y - 25, 26 * clamp(g.meter, 0, 1), 3);
      ctx.fillStyle = g.meter >= 1 ? '#e5484d' : '#ffd166';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.meter >= 1 ? '!' : '?', g.x, g.y - 30);
    }
    if (g.kind === 'K') {
      ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.x, g.y, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

// Vision cones are drawn AFTER the darkness so they read as light sweeping
// the floor — the thing the player is actually afraid of.
function drawCones(ctx, run) {
  for (const g of run.guards) {
    const cone = g.mode === 'chase' ? 'rgba(229,72,77,0.34)'
      : g.mode === 'suspicious' || g.mode === 'search' ? 'rgba(232,179,75,0.30)'
      : 'rgba(255,240,180,0.17)';
    const view = g.def.view * (run.blackoutT > 0 ? 0.5 : 1);
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, view, g.dir - g.def.fov, g.dir + g.def.fov);
    ctx.closePath(); ctx.fill();
  }
}

function drawPlayer(ctx, run) {
  const p = run.player;
  if (!p) return;
  ctx.fillStyle = '#7ee8fa';
  ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b2b33';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 5, p.y + Math.sin(p.dir) * 5, 4, 0, Math.PI * 2); ctx.fill();
  if (p.sneak) {
    ctx.strokeStyle = 'rgba(126,232,250,0.7)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, Math.PI * 2); ctx.stroke();
  }
}

// Darkness: a shadow veil with holes cut at lanterns (swinging), the player,
// and a soft radius around the exit. Cones stay visible through it.
let veil = null;
function drawDarkness(ctx, run) {
  if (!veil) {
    veil = document.createElement('canvas');
    veil.width = VIEW.W; veil.height = VIEW.H;
  }
  const v = veil.getContext('2d');
  v.globalCompositeOperation = 'source-over';
  v.clearRect(0, 0, VIEW.W, VIEW.H);
  v.fillStyle = 'rgba(4,6,12,0.68)';
  v.fillRect(0, 0, VIEW.W, VIEW.H);
  v.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r) => {
    const g = v.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    v.fillStyle = g;
    v.beginPath(); v.arc(x, y, r, 0, Math.PI * 2); v.fill();
  };
  if (run.blackoutT <= 0) {
    for (const l of run.lanterns) {
      const swing = Math.sin(run.time * 0.7 + l.phase) * 14;
      punch(l.x + swing, l.y, 105);
    }
  }
  if (run.player) punch(run.player.x, run.player.y, 110);
  if (run.exit) punch(run.exit.x, run.exit.y, 70);
  ctx.drawImage(veil, 0, 0);
}

function drawHud(ctx, run) {
  const L = run.level;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW.W, 34);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`HEIST ${run.heist + 1}/6 · ${L.name}`, 12, 17);
  ctx.textAlign = 'center';
  ctx.fillText(`LOOT ${run.loot}`, VIEW.W / 2 - 60, 17);
  ctx.fillStyle = run.dawn < 45 ? '#e5484d' : '#ffd166';
  const mm = Math.floor(run.dawn / 60), ss = Math.floor(run.dawn % 60);
  ctx.fillText(`DAWN ${mm}:${String(ss).padStart(2, '0')}`, VIEW.W / 2 + 90, 17);
  ctx.fillStyle = run.alarm === 2 ? '#e5484d' : run.alarm === 1 ? '#e8b34b' : '#51cf66';
  ctx.textAlign = 'right';
  ctx.fillText(run.alarm === 2 ? '● HUNTED' : run.alarm === 1 ? '● STIRRED' : '● UNSEEN', VIEW.W - 12, 17);
  ctx.textAlign = 'left';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#cdd3e0';
  ctx.fillText('1 smoke×' + run.gadgets.smoke + '  2 bell×' + run.gadgets.decoy + '  4 blackout×' + run.gadgets.blackout + '  5 boots ' + (run.gadgets.boots ? 'ON' : 'off') + '  ·  E lockpick  ·  Shift sneak  ·  Space run', 12, VIEW.H - 12);
  if (run.messageT > 0 && run.message) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const w = Math.min(VIEW.W - 40, ctx.measureText(run.message).width + 28);
    ctx.fillRect((VIEW.W - w) / 2, 44, w, 26);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(run.message, VIEW.W / 2, 57);
  }
}

function panel(ctx, title, lines, foot) {
  ctx.fillStyle = 'rgba(4,6,12,0.88)';
  ctx.fillRect(190, 150, VIEW.W - 380, 420);
  ctx.strokeStyle = '#7ee8fa';
  ctx.strokeRect(190, 150, VIEW.W - 380, 420);
  ctx.fillStyle = '#7ee8fa';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.W / 2, 205);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '16px sans-serif';
  let y = 250;
  for (const ln of lines) {
    ctx.fillText(ln, VIEW.W / 2, y);
    y += 30;
  }
  if (foot) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(foot, VIEW.W / 2, 520);
  }
}

function drawTitle(ctx, run) {
  ctx.fillStyle = '#070a12';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  ctx.fillStyle = '#7ee8fa';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ECHOBELL', VIEW.W / 2, 240);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('steal the Bell of Silence', VIEW.W / 2, 290);
  ctx.fillStyle = '#cdd3e0';
  ctx.font = '17px sans-serif';
  ctx.fillText('6 heists · 24 guards · 48 treasures · 5 gadgets', VIEW.W / 2, 350);
  ctx.fillText('Sound is visible. Every step rings out — carpet drinks it,', VIEW.W / 2, 385);
  ctx.fillText('wood shouts it, marble echoes it. The guards listen.', VIEW.W / 2, 410);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press ENTER to begin', VIEW.W / 2, 480);
  ctx.fillStyle = '#8a90a0';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / arrows move · Shift sneak · Space run · E lockpick · 1–5 gadgets · P pause', VIEW.W / 2, 520);
}

function drawBriefing(ctx, run) {
  const L = run.level;
  panel(ctx, `HEIST ${run.heist + 1} — ${L.name.toUpperCase()}`, [
    L.sub,
    '',
    L.brief,
    '',
    `Dawn in ${Math.floor(L.dawn / 60)}:${String(Math.floor(L.dawn % 60)).padStart(2, '0')} · Par ${L.par}s · Guards: ${L.guards.length}`,
  ], 'Press ENTER to slip in');
}

function drawCenter(ctx, title, sub) {
  ctx.fillStyle = 'rgba(4,6,12,0.75)';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.W / 2, VIEW.H / 2 - 10);
  ctx.fillStyle = '#cdd3e0';
  ctx.font = '17px sans-serif';
  ctx.fillText(sub, VIEW.W / 2, VIEW.H / 2 + 30);
}

function drawLockpick(ctx, run) {
  const lp = run.lockpick;
  ctx.fillStyle = 'rgba(4,6,12,0.7)';
  ctx.fillRect(0, 0, VIEW.W, VIEW.H);
  const bx = VIEW.W / 2 - 220, by = VIEW.H / 2 - 40, bw = 440, bh = 26;
  ctx.fillStyle = '#222';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#51cf66';
  ctx.fillRect(bx + lp.zone[0] * bw, by, (lp.zone[1] - lp.zone[0]) * bw, bh);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(bx + lp.needle * bw - 2, by - 8, 4, bh + 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`LOCKPICK — ${lp.hits}/${lp.need} tumblers`, VIEW.W / 2, by - 24);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#cdd3e0';
  ctx.fillText('Press E (or Space) as the needle crosses the green. A slip clatters — loudly.', VIEW.W / 2, by + 60);
}

function drawCaught(ctx, run) {
  panel(ctx, 'CAUGHT', [
    run.caughtBy || 'The guards closed in.',
    '',
    `Heist ${run.heist + 1} failed · Loot kept: ${run.loot} · Score ${run.score}`,
  ], 'Press R to retry this heist · T for title');
}

function drawComplete(ctx, run) {
  const c = run.complete || { timeBonus: 0, ghostBonus: 0, loot: 0 };
  panel(ctx, 'HEIST COMPLETE', [
    `Loot ${c.loot} · Time bonus +${c.timeBonus} · Ghost bonus +${c.ghostBonus}`,
    '',
    'Your route lingers behind you as a fading echo —',
    'the guards are still following it, and you are already gone.',
    '',
    `Score ${run.score}`,
  ], run.heist + 1 < 6 ? 'Press ENTER for the next heist' : 'Press ENTER to see the ending');
}

function drawCampaign(ctx, run) {
  panel(ctx, 'THE BELL IS YOURS', [
    'Six heists. No bell was ever rung. The city never knew you were there.',
    '',
    `Final score ${run.score} · Total loot ${run.loot}`,
    run.ghost ? 'GHOST — never once hunted.' : 'Seen, chased — but never caught.',
  ], 'Press T for the title screen');
}
