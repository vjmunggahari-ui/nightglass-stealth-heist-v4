// ECHOBELL sound — everything synthesized with WebAudio, no audio files.
// Footsteps change with the floor under you: carpet is a soft thud, wood a
// sharp knock, marble a ringing tap that hangs in the air.

let ac = null;
let master = null;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.35;
    master.connect(ac.destination);
    // A low room tone so silence itself has a texture.
    const drone = ac.createOscillator();
    drone.type = 'sine'; drone.frequency.value = 55;
    const dg = ac.createGain(); dg.gain.value = 0.03;
    drone.connect(dg); dg.connect(master);
    drone.start();
  } catch { ac = null; }
}

function blip(freq, dur, type, vol, slideTo) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start(); o.stop(ac.currentTime + dur);
}

function knock(freq, dur, vol, lowpass) {
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
}

export function footstep(floorName, sneaking) {
  if (!ac) return;
  const v = sneaking ? 0.05 : 0.16;
  if (floorName === 'carpet') knock(220, 0.05, v * 0.6, 400);
  else if (floorName === 'wood') { knock(900, 0.07, v, 1400); blip(180, 0.05, 'triangle', v * 0.5); }
  else if (floorName === 'marble') { knock(1200, 0.09, v, 2400); blip(1320, 0.18, 'sine', v * 0.35, 880); }
  else knock(500, 0.05, v * 0.8, 900);
}

export function pickup() { blip(880, 0.12, 'sine', 0.2, 1320); }
export function gemTake() { blip(660, 0.3, 'sine', 0.22, 1980); blip(990, 0.4, 'sine', 0.15, 1320); }
export function alarmSting() { blip(220, 0.35, 'sawtooth', 0.18, 440); blip(233, 0.35, 'sawtooth', 0.12, 466); }
export function bellRing() { blip(1568, 0.9, 'sine', 0.25, 1480); blip(2093, 0.7, 'sine', 0.12); }
export function lockClick(ok) { if (ok) blip(1200, 0.06, 'square', 0.12); else knock(300, 0.12, 0.25, 600); }
export function caughtSting() { blip(110, 0.8, 'sawtooth', 0.2, 55); }
