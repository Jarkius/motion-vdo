# Cinematic silhouette

Reference video: `src/videos/reflex/`.

## Use it for / not for
Stories, "what if" scenarios, anything where an action makes the point (a race, a catch,
a fall). Not for dense numbers: there is no room for charts and the badges hold one figure each.

## Look
Dusk: gradient sky (`cine.skyTop` → `skyMid` → `skyHorizon`), a low sun, a far city
skyline, dark ground with a thin warm horizon line, dark foliage framing the corners,
and a vignette. Everything in the action layer is a dark silhouette lit from one side.

## Characters
`Silhouette`: dark core (`cine.core`), 3 px warm rim (`cine.rim`) on the side the light
comes *from* (`light` in degrees; -15 = low front-right sun). Expressions
`neutral happy_arcs wide_shock focused_glint determined`. Give every recurring character
a signature `prop` (`cap`, `scarf`) and `propColor`, and keep it for the whole series.

## Motion and acting
- Pose keys say how they arrive: `how: "snap"` for startles and flinches, `"out"` for
  strikes and catches, default smooth for everything else.
- Impacts: wrap the picture in `<HitStop hits={[{ at, hold: 3-4 }]}>` and the stage in
  `<Shake>` (amp 10-14, 10 frames). Place impact SFX with `videoFrameOf()`, outside the freeze.
- `limbFps={12}` gives limbs a hand-drawn stepped feel; use it for a whole video or not at all.
- All beat times come from one `timeline(voFrames)` function. Encode the story's numbers as
  frame gaps where you can (NORMAL flinches `NORMAL_S * FPS` frames late).

## Camera
`ParallaxStage`: `pan` drifts the camera across the scene; `closeUp` pushes in around a
focus point and blurs far and foreground (5 px). Use at least three kinds of camera
move per minute (pan, push-in, cut) and give each video one shot people will remember.

## Text on screen
No subtitles. Only `Badge`: uppercase labels for numbers, timers (`0.25 s`), comparisons
(`NORMAL` / `YOU`) and section headers. The action carries the narration.

## Sound
`whoosh` on every throw or fast move, `pop` on impacts, a quiet `ding` after a win.

## Components
| Component | Use | Key props |
|---|---|---|
| `ParallaxStage` | The whole picture | `far`, `mid`, `fore`, `pan`, `closeUp` |
| `Skyline`, `Ground`, `Foliage` | Default far / mid / fore layers | `sunX`, `horizon`; `y` |
| `Silhouette` | Characters | `poses`, `expressions`, `light`, `prop`, `propColor`, `flip`, `limbFps` |
| `Badge` | The only text | `text`, `x`, `y`, `start`, `mono`, `color` |
| `TargetRings` | Mark the focal point *before* the action | `x`, `y`, `start`, `end` |
| `Trajectory` + `quad()` | Dotted path of a moving object, and its position | `p0`, `c`, `p1`, `start`, `duration`, `hold` |
| `Ghosts` | Afterimages trailing anything fast | `at(frame)`, `count`, `gap` |
| `SpeedBurst` | Radial lines on the impact frame only | `x`, `y`, `at` |
| `HitStop`, `Shake` | Impact feel | `hits` |

Put every overlay in the `mid` layer so it zooms with the action.

## Pitfalls found in QA
- A cap covered the eyes: props must sit above the brow line.
- A finished trajectory cluttered later shots: `Trajectory` fades after `hold`; keep it short.
- A rim light with no visible source: the sun in `far` must be on the same side as `light`.
