# Handoff

Status as of 2026-11-21. Read this first in a new session, then `README.md` for usage.

## What this repo is

A Remotion video pipeline driven by Claude Code: write a script, generate per-line
voiceover, build scenes in one of two styles, render, and QA the render automatically
plus with `/watch`. See `README.md` and `.claude/skills/vector-explainer-studio/SKILL.md`
for the actual workflow — this file is state and context, not instructions.

## Where things stand

- **`main`** has everything, merged via PR #1 (`ba8551c`). This is current.
- The branch I worked on, `ccr-1aeb1155-ow46g2`, is now fully merged and behind `main`.
  **Don't keep developing on it.** Start the next change from a fresh branch off `main`.
- Two sample videos exist and pass QA: `src/videos/compound/` (flat style) and
  `src/videos/reflex/` (cinematic style). Both render with `bash scripts/build.sh <Comp>`.
- A second cloud environment named `motion-vdo` was created (separate from Default) with
  yt-dlp installed and `/watch` pre-configured. It does **not** have npm packages set up —
  run `bash scripts/setup.sh` there once. It also lacks whatever credentials/secrets
  Default has (e.g. `api.maxplus-ai.cc`), so check before assuming parity.

## Key decisions made (so they're not re-litigated)

- **Style naming:** built a "Cinematic mode" per the user's spec, but deliberately did
  NOT name it after or copy the look of the "Ifverse" channel the spec referenced — only
  generic film-language techniques (rim light, parallax, hit-stop) were used, with our
  own palette. The skill's directing rules now require this for every style: study
  references, list learn vs. don't-take, never copy a look wholesale.
- **Ideas adapted from three open-source repos** (Rea-Video, Lemo-Opuscar, PixelFX) —
  ideas and techniques only, no code or text copied. Lemo-Opuscar's own docs are
  CC BY-NC 4.0 (non-commercial), which is exactly why nothing was copied from them.
- **Voice engines:** Kokoro (English, bundled script, free, fast) is the default for
  English. F5-TTS (`tts_f5.py`) handles Thai via voice cloning but is unreliable without
  the `--verify` flag — in testing it misread ดอกเบี้ย ("interest") as ดอกเบียร์ ("beer")
  with 2 of 3 seeds tried. Never skip `--verify` for Thai output.
- **Loudness/QA:** `scripts/rhythm.py` + `scripts/build.sh` were added after discovering
  both sample videos were 5–6 dB too quiet (measured, not assumed). Always use
  `build.sh`, not a bare `remotion render`, when producing something meant to be final.
- **`/watch` on YouTube URLs fails from this cloud environment** (403/429, no JS runtime,
  YouTube blocks the IP range). Works fine on local files. For YouTube, either use the
  Gemini engine (needs a `GEMINI_API_KEY` network secret — see below) or run locally.

## Known gaps / not done

- **No Thai font bundled.** `public/fonts` only has Inter + JetBrains Mono (no Thai
  glyphs). Thai on-screen text will render as empty boxes until a Thai font (e.g. Noto
  Sans Thai, OFL) is added to `public/fonts` and registered in `src/theme.ts`. This was
  flagged repeatedly and never done — likely the next task if Thai video work continues.
- No full Thai sample video exists yet (only a 2-line CLI test using the F5 model card's
  own reference voice, not the user's).
- `scripts/tts_f5.py`'s Thai reading-time constant in the skill's directing rules is a
  guess (1.5s + 1s per 8 characters), not measured — revisit after real Thai videos exist.
- Remotion is free for individuals/teams ≤3; flag licensing if this becomes a bigger team.

## Credentials / secrets touched this session

- A `GEMINI_API_KEY` was added as a network secret on the **Default** environment
  (host `generativelanguage.googleapis.com`, header `x-goog-api-key`) to test the Gemini
  engine of `/watch`. Two raw key values were pasted into chat by the user during setup
  and are therefore considered exposed — the user was told to revoke them in AI Studio.
  Unknown whether they did. Don't assume a working Gemini key is still configured.
- `voices/` (reference voice clips for F5-TTS) and `refs/` (reference videos for
  `rhythm.py` benchmarking) are gitignored — personal/third-party audio, never committed.

## If asked to continue video work

1. Check which branch you're on — do not resume `ccr-1aeb1155-ow46g2`.
2. Read `.claude/skills/vector-explainer-studio/SKILL.md` and the relevant
   `styles/<slug>/STYLE.md` before writing scenes.
3. Never skip the fact-check gate, the build.sh QA, or (for Thai) `--verify`.
