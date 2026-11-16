import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, springs } from "../theme";

export type PoseName = "idle" | "point" | "shrug" | "cheer" | "think";
export type Mood = "neutral" | "happy" | "worried" | "surprised";

/**
 * Arm angles in degrees: [shoulder, elbow]. 0 = hanging straight down,
 * positive = away from the body, 180 = straight up. Elbow is relative to the
 * upper arm. Legs: hip spread in degrees. hop: vertical lift in px.
 */
type Pose = {
  left: [number, number];
  right: [number, number];
  legs: number;
  hop: number;
  lean: number;
};

const POSES: Record<PoseName, Pose> = {
  idle: { left: [12, 8], right: [12, 8], legs: 8, hop: 0, lean: 0 },
  point: { left: [12, 8], right: [88, 4], legs: 10, hop: 0, lean: 4 },
  shrug: { left: [38, 95], right: [38, 95], legs: 8, hop: 0, lean: 0 },
  cheer: { left: [160, 18], right: [160, 18], legs: 14, hop: 18, lean: 0 },
  // Solved so the hand lands under the chin with the elbow across the chest.
  think: { left: [12, 8], right: [-62, -132], legs: 6, hop: 0, lean: -3 },
};

type Keyframe<T> = { at: number; value: T };

export type CharacterProps = {
  /** Pose changes over time, `at` in frames relative to this component. */
  poses?: Keyframe<PoseName>[];
  moods?: Keyframe<Mood>[];
  /** Frame ranges [start, end) where the mouth moves. */
  talking?: [number, number][];
  shirt?: string;
  x: number;
  y: number;
  scale?: number;
  enterAt?: number;
  /** Mirror horizontally (faces the other way). */
  flip?: boolean;
  /** Offsets the blink cycle so two characters don't blink in sync. */
  seed?: number;
};

const UPPER = 72;
const FORE = 66;
const LIMB = 15;

const active = <T,>(keys: Keyframe<T>[], frame: number) => {
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

const rad = (d: number) => (d * Math.PI) / 180;

/** Returns elbow and hand points for an arm. side = -1 (screen left) or 1. */
const arm = (sx: number, sy: number, [a, b]: [number, number], side: number) => {
  const ex = sx + side * UPPER * Math.sin(rad(a));
  const ey = sy + UPPER * Math.cos(rad(a));
  const hx = ex + side * FORE * Math.sin(rad(a + b));
  const hy = ey + FORE * Math.cos(rad(a + b));
  return { ex, ey, hx, hy };
};

const Mouth: React.FC<{ mood: Mood; open: number }> = ({ mood, open }) => {
  const y = -322;
  if (open > 0.05 || mood === "surprised") {
    const h = mood === "surprised" ? 10 : 3 + open * 9;
    return <ellipse cx={0} cy={y} rx={mood === "surprised" ? 8 : 11} ry={h} fill={colors.bg} />;
  }
  const curve = mood === "happy" ? 12 : mood === "worried" ? -9 : 3;
  return (
    <path
      d={`M -14 ${y} Q 0 ${y + curve} 14 ${y}`}
      stroke={colors.bg}
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
  );
};

export const Character: React.FC<CharacterProps> = ({
  poses = [{ at: 0, value: "idle" }],
  moods = [{ at: 0, value: "neutral" }],
  talking = [],
  shirt = colors.cyan,
  x,
  y,
  scale = 1,
  enterAt = 0,
  flip = false,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pose: spring from the previous keyframe's pose into the current one.
  const pi = active(poses, frame);
  const target = POSES[poses[pi].value];
  const from = pi > 0 ? POSES[poses[pi - 1].value] : target;
  const t = spring({ frame: frame - poses[pi].at, fps, config: springs.smooth, durationInFrames: 12 });
  const pose = blendPose(from, target, t);

  const mood = moods[active(moods, frame)].value;

  const enter = spring({ frame: frame - enterAt, fps, config: springs.pop });
  const breath = Math.sin((frame / fps) * Math.PI * 0.5) * 3;

  const isTalking = talking.some(([s, e]) => frame >= s && frame < e);
  const open = isTalking ? Math.abs(Math.sin(frame * 0.85 + seed)) : 0;

  const blinkPhase = (frame + seed * 37) % 96;
  const eyeScale = blinkPhase < 4 ? 0.15 : 1;

  // Brow end heights (negative = up). Inner ends raised reads as worry.
  const [browInner, browOuter] = {
    neutral: [0, 0],
    happy: [-5, -5],
    worried: [-7, 3],
    surprised: [-10, -9],
  }[mood];

  const shoulderY = -270 + breath;
  const L = arm(-46, shoulderY, pose.left, -1);
  const R = arm(46, shoulderY, pose.right, 1);
  const hipY = -150;
  const footSpread = 22 + Math.sin(rad(pose.legs)) * 60;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        scale: `${(flip ? -1 : 1) * scale * interpolate(enter, [0, 1], [0.6, 1])} ${scale * interpolate(enter, [0, 1], [0.6, 1])}`,
        translate: `0px ${interpolate(enter, [0, 1], [80, 0])}px`,
      }}
    >
      <svg
        width={420}
        height={460}
        viewBox="-210 -430 420 460"
        style={{ position: "absolute", left: -210, top: -430, overflow: "visible" }}
      >
        {/* Ground shadow shrinks as the character hops. */}
        <ellipse cx={0} cy={6} rx={90 - pose.hop} ry={14} fill="#000" opacity={0.45} />
        <g transform={`translate(0 ${-pose.hop}) rotate(${pose.lean} 0 -150)`}>
          <g stroke={colors.ink} strokeWidth={LIMB} strokeLinecap="round" fill="none">
            <path d={`M -18 ${hipY} L ${-footSpread} 0`} />
            <path d={`M 18 ${hipY} L ${footSpread} 0`} />
          </g>
          {/* Back arm drawn before the torso for depth. */}
          <path
            d={`M -46 ${shoulderY} L ${L.ex} ${L.ey} L ${L.hx} ${L.hy}`}
            stroke={colors.muted}
            strokeWidth={LIMB}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect
            x={-52}
            y={-292 + breath}
            width={104}
            height={150 - breath}
            rx={34}
            fill={shirt}
            stroke={colors.ink}
            strokeWidth={4}
          />
          <path
            d={`M 46 ${shoulderY} L ${R.ex} ${R.ey} L ${R.hx} ${R.hy}`}
            stroke={colors.ink}
            strokeWidth={LIMB}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx={R.hx} cy={R.hy} r={11} fill={colors.ink} />
          <g transform={`translate(0 ${breath * 0.6})`}>
            <circle cx={0} cy={-345} r={50} fill={colors.face} stroke={colors.ink} strokeWidth={4} />
            {[-1, 1].map((s) => (
              <g key={s}>
                <ellipse cx={s * 17} cy={-350} rx={6} ry={8 * eyeScale} fill={colors.bg} />
                <path
                  d={`M ${s * 9} ${-366 + browInner} L ${s * 26} ${-366 + browOuter}`}
                  stroke={colors.bg}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              </g>
            ))}
            <Mouth mood={mood} open={open} />
          </g>
        </g>
      </svg>
    </div>
  );
};
