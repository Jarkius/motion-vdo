import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono, sans, springs } from "../theme";

export type CounterProps = {
  label: string;
  from?: number;
  to: number;
  /** Frames, relative to this component. */
  start?: number;
  duration?: number;
  color?: string;
  prefix?: string;
  x: number;
  y: number;
  size?: number;
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** A labelled number that rolls up, then pops when it lands. */
export const Counter: React.FC<CounterProps> = ({
  label,
  from = 0,
  to,
  start = 0,
  duration = 45,
  color = colors.amber,
  prefix = "$",
  x,
  y,
  size = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - start, fps, config: springs.pop });
  const land = spring({ frame: frame - start - duration, fps, config: springs.pop });

  const value = interpolate(frame, [start, start + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: interpolate(enter, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
        translate: `0px ${interpolate(enter, [0, 1], [40, 0])}px`,
      }}
    >
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: size * 0.28, color: colors.muted, letterSpacing: 2 }}>
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontWeight: 700,
          fontSize: size,
          color,
          lineHeight: 1.05,
          textShadow: `0 0 40px ${color}55`,
          scale: String(1 + 0.08 * Math.sin(Math.min(land, 1) * Math.PI)),
          transformOrigin: "left center",
        }}
      >
        {prefix}
        {fmt(value)}
      </div>
    </div>
  );
};
