# Flat explainer

Reference video: `src/videos/compound/`.

## Use it for / not for
Numbers, comparisons, how-it-works explainers where the viewer needs to read figures.
Not for action or stories: nothing in this look can show speed or impact.

## Look
Dark charcoal canvas (`colors.bg`) with a slowly drifting grid and a vignette
(`Background`). Neon-ish accents from `colors` (cyan, amber, coral, emerald), soft glow on
numbers and chart lines. Inter for words, JetBrains Mono for numbers.

## Characters
`Character`: round-headed host with a coloured shirt. Moods `neutral happy worried
surprised`; poses `idle point shrug cheer think` (+ `catch`, `brace` from the shared rig).
One host per video, always the same shirt colour.

## Motion and acting
Entrances spring in with a little overshoot (`springs.pop`); pose changes settle
(`springs.smooth`). Use `how: "out"` for a pointing strike, `"snap"` for a startle.
Counters ease out and pop when they land.

## Camera
No camera moves. Scenes are joined with 12-frame crossfades (`TransitionSeries` + `fade()`).

## Text on screen
`KineticText` headlines (one per scene, ≤ 8 words) with highlighted keywords, plus
`Counter` labels. No subtitles.

## Sound
`whoosh` on scene changes, `pop` on headline entrances, `ding` when a counter lands.

## Components
| Component | Use | Key props |
|---|---|---|
| `Background` | Every video, once, behind the `TransitionSeries` | `drift` |
| `Character` | Host. Feet at (`x`,`y`); ~430 px tall at scale 1 | `poses`, `moods` (keyframes `{at, value, how?}`), `talking`, `shirt`, `flip`, `seed`, `limbFps` |
| `KineticText` | Headlines; words spring in, highlighted words get colour + underline | `text`, `highlight`, `accent`, `start`, `stagger`, `size` |
| `Counter` | A number that rolls up then pops | `label`, `to`, `start`, `duration`, `color` |
| `LineChart` | Lines draw left to right; first series gets an area fill | `series`, `xLabels`, `drawStart`, `drawDuration` |

## Pitfalls found in QA
- Host at different positions in adjacent scenes shows two hosts mid-fade. Define
  `const HOST = {...}` once and spread it into every `Character`.
- Host pointing off-screen: on the right with content to its left, set `flip: true`.
- Chart edge labels clipped: `LineChart` anchors them inward; check any new chart.
- Odd axis ticks ($34k, $67k): `LineChart` rounds the step; check any new chart.
- `/watch` samples catch counters mid-roll: check the last frame of each scene with
  `npx remotion still`.
