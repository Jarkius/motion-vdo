import React from "react";
import { Freeze, useCurrentFrame } from "remotion";

/**
 * Game-feel timing for impacts: hit-stop (the picture holds on the impact frame
 * for a few frames) and a decaying screen shake. Technique as used in action games;
 * see PixelFX's act.js (MIT) for a pixel-art take on the same idea.
 */

export type Hit = {
  /** Impact frame, in story time (the frame numbers you would use without hit-stop). */
  at: number;
  /** Frames to hold the impact frame. 2-4 reads as weight; more reads as a glitch. */
  hold: number;
};

/** Video frame -> story frame. During a hold, story time stays on the impact frame. */
export const storyFrame = (frame: number, hits: Hit[]) => {
  let shift = 0;
  for (const h of [...hits].sort((a, b) => a.at - b.at)) {
    const videoAt = h.at + shift; // where this hit lands in video time
    if (frame < videoAt) break;
    if (frame < videoAt + h.hold) return h.at;
    shift += h.hold;
  }
  return frame - shift;
};

/** Total frames the holds add, so calculateMetadata can lengthen the video. */
export const holdFrames = (hits: Hit[]) => hits.reduce((s, h) => s + h.hold, 0);

/** Video frame at which a story-time hit lands (for placing SFX outside the freeze). */
export const videoFrameOf = (storyAt: number, hits: Hit[]) =>
  storyAt + hits.filter((h) => h.at < storyAt).reduce((s, h) => s + h.hold, 0);

/**
 * Wrap the picture (not the audio): children see story time, so everything,
 * camera included, holds on each impact frame.
 */
export const HitStop: React.FC<{ hits: Hit[]; children: React.ReactNode }> = ({ hits, children }) => {
  const frame = useCurrentFrame();
  return <Freeze frame={storyFrame(frame, hits)}>{children}</Freeze>;
};

export type ShakeHit = { at: number; amp?: number; frames?: number };

/** Decaying screen shake, in video time (it keeps moving during a hit-stop, as in games). */
export const Shake: React.FC<{ hits: ShakeHit[]; children: React.ReactNode }> = ({ hits, children }) => {
  const frame = useCurrentFrame();
  let dx = 0;
  let dy = 0;
  for (const h of hits) {
    const len = h.frames ?? 10;
    const u = frame - h.at;
    if (u < 0 || u >= len) continue;
    const k = (h.amp ?? 12) * (1 - u / len);
    dx += Math.sin(u * 2.4) * k;
    dy += Math.cos(u * 3.7) * k * 0.7;
  }
  return <div style={{ position: "absolute", inset: 0, translate: `${dx}px ${dy}px` }}>{children}</div>;
};
