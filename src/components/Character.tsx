import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";
import { active, HIP_Y, Keyframe, LIMB, PoseName, useRig } from "./rig";

export type { PoseName } from "./rig";
export type Mood = "neutral" | "happy" | "worried" | "surprised";

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
  /** Move limbs on N fps steps (12 = hand-drawn feel). Off by default. */
  limbFps?: number;
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
  limbFps,
}) => {
  const { frame, pose, enter, breath, open, eyeScale, shoulderY, L, R, footSpread } = useRig({
    poses,
    talking,
    enterAt,
    seed,
    limbFps,
  });
  const mood = moods[active(moods, frame)].value;

  // Brow end heights (negative = up). Inner ends raised reads as worry.
  const [browInner, browOuter] = {
    neutral: [0, 0],
    happy: [-5, -5],
    worried: [-7, 3],
    surprised: [-10, -9],
  }[mood];

  const hipY = HIP_Y;

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
