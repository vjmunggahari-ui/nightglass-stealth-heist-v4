// ECHOBELL — six heists. Every map is 32x18 tiles, hand-laid.
// Legend: # wall | . stone | , carpet (silent) | = wood (creaky, loud)
//         M marble (echoes) | L lantern (light pool) | C locked case
//         T treasure | G target gem | S spawn | X exit
//         P patroller | W watcher | H hound | K captain (radios alarm)
// Guard waypoints live in `guards` per level; every waypoint is walkable floor.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;

export const FLOOR = {
  '.': { name: 'stone', noise: 1.0, speed: 1.0 },
  ',': { name: 'carpet', noise: 0.25, speed: 0.95 },
  '=': { name: 'wood', noise: 2.2, speed: 1.0 },
  M: { name: 'marble', noise: 1.6, speed: 1.05 },
  L: { name: 'stone', noise: 1.0, speed: 1.0, lantern: true },
};

export const LEVELS = [
  {
    id: 1, name: 'The Vestibule', sub: 'Learn to walk quiet',
    brief: 'A sleepy manor hall. Carpet drinks your footsteps; the three patrollers do not. Lift 6 treasures, take the Chime, leave by the west door before dawn.',
    dawn: 240, par: 90,
    map: [
      '################################',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,S,,,,,,T,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,P,,,,,,,,,,,,,#',
      '#,,,######,,,,,,,,,,######,,,,,#',
      '#,,,######,,,,,T,,,,######,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,T,,,,,,,,,,#',
      '#,,,,,,,,,,L,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,W,,,,,,,,,#',
      '#,,,######,,,,,,,,,,######,,,,,#',
      '#,,,######,,,,,T,,,,######,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,T,,,,,,,,,,,,,,,,,,,,,,G,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,X,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,P,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,T,,,,,#',
      '################################',
    ],
    guards: [
      { k: 'P', x: 16, y: 3, path: [[16, 3], [16, 8], [8, 8], [8, 3]], speed: 1.1 },
      { k: 'W', x: 25, y: 8, path: [[25, 8]], speed: 0 },
      { k: 'P', x: 8, y: 15, path: [[8, 15], [24, 15], [24, 11], [8, 11]], speed: 1.1 },
    ],
  },
  {
    id: 2, name: 'The Gallery of Echoes', sub: 'Marble remembers every step',
    brief: 'A long marble gallery. Every footstep echoes twice as far here. The hound hears everything — stay on the carpet runner, or move only when it turns away.',
    dawn: 240, par: 105,
    map: [
      '################################',
      '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM#',
      '#M,S,,,,T,,,,,,,,,,,,,,,,,,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,,,,,MMM#',
      '#M,,,,,,######,,,,,,######,,MMM#',
      '#M,,T,,,######,,,T,,######,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,T,,,,,,,MMM#',
      '#M,,,,,,,,,,L,,,,,,,,,,,,,,MMMM#',
      '#M,,,,,,,,,,,,,,,,,,,,H,,,,,MMM#',
      '#M,,,,,,######,,,,,,######,,MMM#',
      '#M,,T,,,######,,,T,,######,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,,,,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,G,,MMMM#',
      '#M,,,,,P,,,,,,,,,,,,,,,,,,,MMMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,,,,,MMM#',
      '#M,,X,,,,,,,,,,,,,,,,,,T,,,MMMM#',
      '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM#',
      '################################',
    ],
    guards: [
      { k: 'P', x: 6, y: 13, path: [[6, 13], [26, 13], [26, 3], [6, 3]], speed: 1.15 },
      { k: 'H', x: 24, y: 8, path: [[24, 8], [10, 8], [10, 6], [24, 6]], speed: 1.5 },
      { k: 'W', x: 16, y: 2, path: [[16, 2]], speed: 0 },
      { k: 'P', x: 28, y: 13, path: [[28, 13], [28, 2]], speed: 1.1 },
    ],
  },
  {
    id: 3, name: 'The Marble Hall', sub: 'Creaky boards under the chandeliers',
    brief: 'Chandeliers swing, and their light pools sweep the floor. Wooden boards creak — cross them only while a guard walks away. Two locked cases hide the best loot.',
    dawn: 260, par: 120,
    map: [
      '################################',
      '#..............................#',
      '#.S.....T...............T......#',
      '#..............................#',
      '#..======,,,,,,======,,,,,,....#',
      '#..======,,,,,,======,,,,,,..T.#',
      '#..............................#',
      '#......L............L.......T..#',
      '#.........................P....#',
      '#..======,,,,,,======,,,,,,....#',
      '#..======,,,,,,======,,,,,,....#',
      '#..........C...........C.......#',
      '#..............................#',
      '#.T.................T.....G....#',
      '#..............................#',
      '#.X..........P.................#',
      '#...T...................T......#',
      '################################',
    ],
    guards: [
      { k: 'P', x: 26, y: 8, path: [[26, 8], [26, 15], [5, 15], [5, 8]], speed: 1.2 },
      { k: 'P', x: 13, y: 15, path: [[13, 15], [13, 2], [28, 2], [28, 15]], speed: 1.2 },
      { k: 'W', x: 16, y: 5, path: [[16, 5]], speed: 0 },
      { k: 'H', x: 22, y: 12, path: [[22, 12], [8, 12]], speed: 1.5 },
    ],
  },
  {
    id: 4, name: 'The Library of Whispers', sub: 'Shelves hide you. Shelves betray you.',
    brief: 'Tall shelves break every sightline — and every sound bounces between them. The captain radios the whole floor if he spots you. Silence him first, or never be seen at all.',
    dawn: 280, par: 135,
    map: [
      '################################',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,S,,,,,,T,,,,,,,,,,,,,,T,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,####,,,,,,####,,,,,,####,,,,#',
      '#,,####,,,T,,####,,,T,,####,,,,#',
      '#,,,T,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,####,,,,,,####,,,,,,####,,,,#',
      '#,,####,,,,,,####,,K,,,####,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,####,,,,,,####,,,,,,####,,,,#',
      '#,,####,,,T,,####,,,C,,####,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,G,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,X,,,,,,P,,,,,,,,,,,,,,,T,,T,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '################################',
    ],
    guards: [
      { k: 'K', x: 21, y: 8, path: [[21, 8], [21, 14], [10, 14], [10, 8]], speed: 1.15 },
      { k: 'P', x: 8, y: 15, path: [[8, 15], [26, 15], [26, 3], [8, 3]], speed: 1.25 },
      { k: 'H', x: 14, y: 6, path: [[14, 6], [14, 12], [24, 12], [24, 6]], speed: 1.55 },
      { k: 'W', x: 28, y: 3, path: [[28, 3]], speed: 0 },
    ],
  },
  {
    id: 5, name: 'The Treasury of Chimes', sub: 'Every chime is a bell waiting to ring',
    brief: 'Nine treasures, three locked cases, and a hound that never sleeps. The blackout switch by the east wall kills every lantern for ten seconds — spend them well.',
    dawn: 300, par: 150,
    map: [
      '################################',
      '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM#',
      '#M,S,,,,T,,,,,,,,,,,T,,,,,,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,,,,,MMM#',
      '#M,,######,,,,,,######,,,,,,MMM#',
      '#M,,######,,T,,,######,,T,,MMMM#',
      '#M,,,,,,,,,,,,,,,,,,T,,,,,,,MMM#',
      '#M,,,,,,,L,,,,,,,,,,L,,,,,,MMMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,H,,,MMMM#',
      '#M,,######,,,,,,######,,,,,,MMM#',
      '#M,,######,,C,,,######,,C,,MMMM#',
      '#M,,,,,,,,,,T,,,,,,,,,,,,,,,MMM#',
      '#M,,,,,,,,,,,,,,,,,,,,,,G,,MMMM#',
      '#M,,,,,P,,,,,,,,,,,,,,,,,,,MMMM#',
      '#M,,,,,,T,,,,,,,,,,,,,,,T,,,MMM#',
      '#M,,X,,,,,,,,,,,,,,,C,,T,,MMMMM#',
      '#MMMMMMMMMMMMMMMMMMMMMMMMMMMMMM#',
      '################################',
    ],
    guards: [
      { k: 'P', x: 6, y: 13, path: [[6, 13], [26, 13], [26, 3], [6, 3]], speed: 1.3 },
      { k: 'H', x: 25, y: 8, path: [[25, 8], [8, 8], [8, 11], [25, 11]], speed: 1.6 },
      { k: 'K', x: 16, y: 15, path: [[16, 15], [16, 2]], speed: 1.2 },
      { k: 'W', x: 29, y: 6, path: [[29, 6]], speed: 0 },
    ],
  },
  {
    id: 6, name: 'The Belltower', sub: 'Steal the Bell of Silence',
    brief: 'Six floors up, the Bell of Silence hangs in the dark. Five guards, the captain, the hound — and a dawn that comes fast. Take the bell, ring nothing, vanish.',
    dawn: 300, par: 165,
    map: [
      '################################',
      '#..............................#',
      '#.S.....T...........T...T......#',
      '#..............................#',
      '#..======,,,,,,======,,,,,,....#',
      '#..======,,,,,,======,,,,,,..T.#',
      '#..............................#',
      '#......L............L.....TK...#',
      '#..............................#',
      '#..======,,,,,,======,,,,,,....#',
      '#..======,,,,,,======,,,,,,....#',
      '#..........C...........C.......#',
      '#..............................#',
      '#.T.................T.....G.T..#',
      '#..............................#',
      '#.X..........P..........H......#',
      '#...T...................T......#',
      '################################',
    ],
    guards: [
      { k: 'K', x: 28, y: 7, path: [[28, 7], [28, 14], [4, 14], [4, 7]], speed: 1.25 },
      { k: 'P', x: 13, y: 15, path: [[13, 15], [13, 2], [28, 2], [28, 15]], speed: 1.35 },
      { k: 'H', x: 25, y: 15, path: [[25, 15], [6, 15], [6, 8], [25, 8]], speed: 1.7 },
      { k: 'W', x: 16, y: 5, path: [[16, 5]], speed: 0 },
      { k: 'P', x: 22, y: 3, path: [[22, 3], [22, 12], [10, 12], [10, 3]], speed: 1.3 },
    ],
  },
];

export function countChar(map, ch) {
  let n = 0;
  for (const row of map) for (const c of row) if (c === ch) n++;
  return n;
}

// Validate one level: shape, reachability, counts. Returns an array of problems (empty = clean).
export function validateLevel(level) {
  const problems = [];
  const { map } = level;
  if (map.length !== ROWS) problems.push(`rows ${map.length} != ${ROWS}`);
  map.forEach((row, y) => {
    if (row.length !== COLS) problems.push(`row ${y} len ${row.length} != ${COLS}`);
  });
  if (problems.length) return problems;
  const solid = (x, y) => map[y][x] === '#' || map[y][x] === 'C';
  let sx = -1, sy = -1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (map[y][x] === 'S') { sx = x; sy = y; }
    if ((y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) && map[y][x] !== '#') {
      problems.push(`border (${x},${y}) is ${map[y][x]}`);
    }
  }
  if (sx < 0) { problems.push('no spawn'); return problems; }
  // Flood fill from the spawn over walkable tiles.
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (solid(nx, ny) || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  const reachable = (x, y) => seen.has(`${x},${y}`);
  const nearReachable = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]
    .some(([dx, dy]) => reachable(x + dx, y + dy));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = map[y][x];
    if ((c === 'T' || c === 'G' || c === 'X') && !reachable(x, y)) problems.push(`${c} unreachable at (${x},${y})`);
    if (c === 'C' && !nearReachable(x, y)) problems.push(`case sealed at (${x},${y})`);
  }
  for (const g of level.guards) {
    if (!reachable(g.x, g.y)) problems.push(`guard ${g.k} spawn unreachable (${g.x},${g.y})`);
    for (const [wx, wy] of g.path) {
      if (!reachable(wx, wy)) problems.push(`guard ${g.k} waypoint unreachable (${wx},${wy})`);
    }
  }
  const t = countChar(map, 'T'), g = countChar(map, 'G'), x = countChar(map, 'X');
  if (t < 4) problems.push(`only ${t} treasures`);
  if (g !== 1) problems.push(`${g} gems`);
  if (x !== 1) problems.push(`${x} exits`);
  return problems;
}
