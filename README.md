# ECHOBELL — steal the Bell of Silence

[![Bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/vjmunggahari-ui/nightglass-stealth-heist-v4/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/vjmunggahari-ui/nightglass-stealth-heist-v4/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

**6 heists · 24 guards · 48 treasures · 5 gadgets · sound is visible.**

A city of bells, asleep. Every footstep you take rings out as a visible
ripple across the floor — carpet drinks it, wood shouts it, marble echoes it
twice as far. The guards do not just see you. They *listen* for you. Lift
the treasures, crack the locked cases, steal each heist's chime, and reach
the exit before dawn — and in the last heist, steal the Bell of Silence
itself, the one bell that must never ring.

## What makes it different

- **Sound you can see.** Footsteps, doors and lockpicks send ripples across
  the floor. A ripple's size depends on the floor under you and how you move:
  sneak on carpet and you are a whisper; run across wood and the whole floor
  turns to listen.
- **Echoes linger.** A loud sound leaves a fading echo on the floor for
  seconds after it dies — and guards walk to the last echo they heard. A
  thrown decoy bell rings down the hall and pulls every guard toward it.
- **Guards with ears.** Four kinds: Patrollers walk their rounds, Watchers
  hold a sightline, Hounds hear half again as far and run you down, and the
  Captain radios the whole floor the moment he spots you.
- **Light that moves.** Lantern pools swing with their chandeliers. Stand in
  the dark and a guard half-misses you; step into the light and you are read
  at full strength. The blackout switch kills every lantern for ten seconds.
- **The echo of your route.** Win a heist and your whole path is drawn back
  on the floor as a fading ghost trail — the guards are still following it,
  and you are already gone.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server — the game loads nothing over the network). No build step,
no assets to download, all sound synthesized live.

- **WASD / arrows** — move
- **Shift** — sneak (slow, quiet, hard to spot)
- **Space** — run (fast, loud)
- **E** — crack a locked case (timing minigame; a slipped pick clatters)
- **1** smoke vial · **2** decoy bell · **4** blackout · **5** muffle boots
- **P** pause · **R** retry a failed heist · **Enter** advance screens

## The six heists

| # | Heist | Guards | Treasures | The twist |
|---|-------|--------|-----------|-----------|
| 1 | The Vestibule | 3 | 6 | Learn to walk quiet |
| 2 | The Gallery of Echoes | 4 | 7 | Marble remembers every step |
| 3 | The Marble Hall | 4 | 8 | Creaky boards under swinging chandeliers |
| 4 | The Library of Whispers | 4 | 8 | The captain radios the whole floor |
| 5 | The Treasury of Chimes | 4 | 9 | Blackout switch by the east wall |
| 6 | The Belltower | 5 | 10 | Steal the Bell of Silence before dawn |

Score: treasure 100, locked case 250, chime 500, ghost bonus 500 for never
being hunted, plus 2 points per second of dawn left when you slip out.

## Hand-in

`main.ts` (Node 22+, standard library only) copies `game/` and
`screenshots/` into `MAKEFUN_OUTPUT_DIR` (or `output/`) and writes
`dossier.json` with the vendored make.fun library. It refuses to hand in a
build whose heists fail their level check, and it reads the dossier back
after writing it.
