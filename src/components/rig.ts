import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { springs } from "../theme";

/** Shared skeleton for every character style (flat `Character`, rim-lit `Silhouette`). */

export type PoseName = "idle" | "point" | "shrug" | "cheer" | "think" | "catch" | "brace";

/**
 * Arm angles in degrees: [shoulder, elbow]. 0 = hanging straight down,
 * positive = away from the body, 180 = straight up. Elbow is relative to the
 * upper arm. Legs: hip spread in degrees. hop: vertical lift in px.
 */
export type Pose = {
  left: [number, number];
  right: [number, number];
  legs: number;
  hop: number;
  lean: number;
};

export const POSES: Record<PoseName, Pose> = {
  idle: { left: [12, 8], right: [12, 8], legs: 8, hop: 0, lean: 0 },
  point: { left: [12, 8], right: [88, 4], legs: 10, hop: 0, lean: 4 },
  shrug: { left: [38, 95], right: [38, 95], legs: 8, hop: 0, lean: 0 },
  cheer: { left: [160, 18], right: [160, 18], legs: 14, hop: 18, lean: 0 },
  // Solved so the hand lands under the chin with the elbow across the chest.
  think: { left: [12, 8], right: [-62, -132], legs: 6, hop: 0, lean: -3 },
  // Front hand up and out at head height, palm toward the incoming object.
  catch: { left: [30, 20], right: [125, -20], legs: 16, hop: 0, lean: 8 },
  // Both forearms raised in front of the face, flinching back.
  brace: { left: [-20, -150], right: [-20, -150], legs: 12, hop: 0, lean: -8 },
};

export type Keyframe<T> = { at: number; value: T };

export const UPPER = 72;
export const FORE = 66;
export const LIMB = 15;
export const SHOULDER_X = 46;
export const HIP_Y = -150;

export const active = <T,>(keys: Keyframe<T>[], frame: number) => {
  let current = 0;
  for (let i = 0; i < keys.length; i++) if (keys[i].at <= frame) current = i;
  return current;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
  left: [lerp(a.left[0], b.left[0], t), lerp(a.left[1], b.left[1], t)],
  right: [lerp(a.right[0], b.right[0], t), lerp(a.right[1], b.right[1], t)],
  legs: lerp(a.legs, b.legs, t),
  hop: lerp(a.hop, b.hop, t),
  lean: lerp(a.lean, b.lean, t),
});

export const rad = (d: number) => (d * Math.PI) / 180;

/** Returns elbow and hand points for an arm. side = -1 (screen left) or 1. */
export const arm = (sx: number, sy: number, [a, b]: [number, number], side: number) => {
  const ex = sx + side * UPPER * Math.sin(rad(a));
  const ey = sy + UPPER * Math.cos(rad(a));
  const hx = ex + side * FORE * Math.sin(rad(a + b));
  const hy = ey + FORE * Math.cos(rad(a + b));
  return { ex, ey, hx, hy };
};

/** Frame-driven state every character style needs: pose blend, entrance, breathing, mouth, blink. */
export const useRig = (opts: {
  poses: Keyframe<PoseName>[];
  talking: [number, number][];
  enterAt: number;
  seed: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pose: spring from the previous keyframe's pose into the current one.
  const pi = active(opts.poses, frame);
  const target = POSES[opts.poses[pi].value];
  const from = pi > 0 ? POSES[opts.poses[pi - 1].value] : target;
  const t = spring({ frame: frame - opts.poses[pi].at, fps, config: springs.smooth, durationInFrames: 12 });
  const pose = blendPose(from, target, t);

  const enter = spring({ frame: frame - opts.enterAt, fps, config: springs.pop });
  const breath = Math.sin((frame / fps) * Math.PI * 0.5) * 3;
  const isTalking = opts.talking.some(([s, e]) => frame >= s && frame < e);
  const open = isTalking ? Math.abs(Math.sin(frame * 0.85 + opts.seed)) : 0;
  const blinkPhase = (frame + opts.seed * 37) % 96;
  const eyeScale = blinkPhase < 4 ? 0.15 : 1;

  const shoulderY = -270 + breath;
  return {
    frame,
    pose,
    enter,
    breath,
    open,
    eyeScale,
    shoulderY,
    L: arm(-SHOULDER_X, shoulderY, pose.left, -1),
    R: arm(SHOULDER_X, shoulderY, pose.right, 1),
    footSpread: 22 + Math.sin(rad(pose.legs)) * 60,
  };
};
