# motion-vdo

## `/watch` skill

`.claude/skills/watch/` is a vendored copy of the [claude-video](https://github.com/bradautomates/claude-video)
`watch` skill (MIT). It lets Claude Code look at a video: it extracts timestamped frames with
ffmpeg, pulls captions or a transcript, and Claude reads both. Claude Code loads it
automatically from this repo, so there is no plugin to install.

Usage inside Claude Code:

```
/watch path/to/render.mp4 does the title animate in before 0:02?
```

### Requirements

- Python 3.10+, `ffmpeg`/`ffprobe`
- `yt-dlp` (`python3 -m pip install 'yt-dlp[default]'`)
- YouTube URLs also need Deno, and won't work from most cloud servers (YouTube returns 403).
  Use local files there, or the Gemini engine.

Non-interactive setup (local engine, no transcription fallback):

```
python3 .claude/skills/watch/scripts/setup.py --engine local --detail balanced --backend none
```

That writes `~/.config/watch/.env`. To use Gemini or a Whisper backend instead, rerun
`setup.py` without flags and follow the skill's prompts. With a `GEMINI_API_KEY` set,
`auto` mode uploads videos to Google.
