# Lemmings — Web Edition

A faithful, **original** re-implementation of the classic *Lemmings* puzzle game,
playable in any modern browser. Guide hordes of (not very bright) lemmings from
the entrance hatch to the exit by assigning them a limited set of skills, before
they wander off cliffs, into water, or onto traps.

> **About originality / IP.** *Lemmings* and *Oh No! More Lemmings* are
> copyrighted by Psygnosis / DMA Design (now Sony). This project re-implements
> the game's **mechanics, physics and UI** from scratch and ships **entirely
> original artwork, audio and level designs** — no ripped sprites, music, sound
> samples, or original level data are used. It is a homage/clone built for
> learning and fun, not a copy of the original assets.

## Play

- **Goal:** rescue at least the required number of lemmings before time runs out.
- Lemmings walk automatically, turn at walls, and fall off ledges. You help them
  by assigning skills from the bottom panel.

### The eight skills

| Skill | Effect |
|-------|--------|
| **Climber** | Permanently climbs vertical walls. |
| **Floater** | Permanently opens a brolly — survives any fall. |
| **Bomber** | 5-second fuse, then explodes, cratering nearby (non-steel) terrain. |
| **Blocker** | Stands still and turns back other lemmings. |
| **Builder** | Builds a 12-brick diagonal staircase upward. |
| **Basher** | Tunnels horizontally (stops at steel). |
| **Miner** | Tunnels diagonally downward (stops at steel). |
| **Digger** | Tunnels straight down (stops at steel). |

A lemming given both Climber and Floater becomes an **Athlete**.

### Controls

- **Mouse:** select a skill in the panel, then click a lemming to assign it.
  Click the panel `-`/`+` to change the release rate, `‖` to pause, `☢` (twice)
  to nuke. Push the cursor to the screen edges to scroll. Click the minimap to
  jump. Hold the **right mouse button** to target only plain walkers (and to
  scroll faster).
- **Keyboard:** `F1`/`F2` release rate, `F3`–`F10` skills (Climber…Digger),
  `F11`/`Space`/`P` pause, `F12` nuke, arrow keys scroll.
- **Touch:** tap to act, drag near the edges to scroll.

### Passwords

Completing a level grants a 10-letter password for the next one. Enter it from
the main menu's **PASSWORD** button to resume. Progress is also saved locally.

## Develop

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
npm test           # run the engine unit/integration tests (Vitest)
npm run lint       # lint the TypeScript sources
```

## Architecture

- **`src/engine`** — framework-agnostic simulation: terrain (typed-array
  collision / steel / one-way masks + colour buffer), the lemming state machine
  (`skills/`), gravity & fall-death rules, objects/hazards, release-rate logic,
  win/lose evaluation, and all tunable constants in `constants.ts`.
- **`src/render`** — Canvas 2D rendering: procedurally-drawn lemming and object
  sprites, terrain blitting, the control panel, the minimap, and the HUD.
- **`src/audio`** — a WebAudio engine that synthesizes all sound effects **and
  an original looping chiptune soundtrack** (separate menu and in-level themes)
  at runtime (no audio files).
- **`src/ui`** — the scene manager and scenes (menu → objective → play →
  results), plus campaign progression and password handling.
- **`src/levels`** — original level data grouped into difficulty ratings.
- **`tests`** — Vitest coverage of physics constants, terrain, every skill,
  full-loop integration, level geometry safety, and scripted level solves.

The simulation runs on a fixed 60 ms logic tick (≈16.7 Hz, matching the original)
decoupled from `requestAnimationFrame` rendering.

## License

MIT (code). All bundled art, audio, and level designs are original to this
project.
