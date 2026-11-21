import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cine, mono, sans, springs } from "../theme";

type Pt = { x: number; y: number };

/** Point on a quadratic Bezier at t in [0, 1]. Use it to move an object along a `Trajectory`. */
export const quad = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * p1.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * p1.y,
});

const svgFill: React.CSSProperties = { position: "absolute", inset: 0, overflow: "visible" };

/** Concentric rings expanding out of a focal point, looping while visible. */
export const TargetRings: React.FC<{
  x: number;
  y: number;
  start?: number;
  end?: number;
  radius?: number;
  color?: string;
  period?: number;
}> = ({ x, y, start = 0, end = Infinity, radius = 90, color = cine.rim, period = 30 }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const local = frame - start;
  const rings = [0, 1, 2].map((i) => {
    const p = ((local + (i * period) / 3) % period) / period;
    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={radius * (0.3 + 0.9 * p)}
        stroke={color}
        strokeWidth={4 * (1 - p) + 1}
        fill="none"
        opacity={(1 - p) * 0.9}
      />
    );
  });
  return (
    <svg width={1920} height={1080} style={svgFill}>
      {rings}
      {[0, 90, 180, 270].map((a) => {
        const r = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={x + Math.cos(r) * radius * 0.25}
            y1={y + Math.sin(r) * radius * 0.25}
            x2={x + Math.cos(r) * radius * 0.45}
            y2={y + Math.sin(r) * radius * 0.45}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Dotted path that draws itself from p0 to p1 through control point c. */
export const Trajectory: React.FC<{
  p0: Pt;
  c: Pt;
  p1: Pt;
  start?: number;
  duration?: number;
  color?: string;
  dots?: number;
  /** Frames the finished trail lingers before fading out. */
  hold?: number;
}> = ({ p0, c, p1, start = 0, duration = 30, color = cine.eye, dots = 28, hold = 12 }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [start + duration + hold, start + duration + hold + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (fade <= 0) return null;
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (progress <= 0) return null;
  const pts = [];
  for (let i = 0; i <= dots; i++) {
    const t = i / dots;
    if (t > progress) break;
    const p = quad(p0, c, p1, t);
    pts.push(<circle key={i} cx={p.x} cy={p.y} r={4} fill={color} opacity={0.35 + 0.5 * t} />);
  }
  return (
    <svg width={1920} height={1080} style={{ ...svgFill, opacity: fade }}>
      {pts}
    </svg>
  );
};

/** Renders `children` at the current position plus fading copies at earlier frames. */
export const Ghosts: React.FC<{
  at: (frame: number) => Pt;
  count?: number;
  gap?: number;
  children: React.ReactNode;
}> = ({ at, count = 4, gap = 2, children }) => {
  const frame = useCurrentFrame();
  const copies = [];
  for (let k = count; k >= 0; k--) {
    const p = at(frame - k * gap);
    copies.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: p.x,
          top: p.y,
          opacity: k === 0 ? 1 : 0.35 * (1 - k / (count + 1)),
          scale: String(k === 0 ? 1 : 1 - k * 0.05),
        }}
      >
        {children}
      </div>,
    );
  }
  return <>{copies}</>;
};

/** Radial speed lines bursting out of an impact point over ~10 frames. */
export const SpeedBurst: React.FC<{ x: number; y: number; at: number; color?: string; lines?: number }> = ({
  x,
  y,
  at,
  color = cine.rim,
  lines = 18,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 12;
  if (t < 0 || t > 1) return null;
  const e = Easing.out(Easing.cubic)(t);
  return (
    <svg width={1920} height={1080} style={svgFill}>
      {Array.from({ length: lines }, (_, i) => {
        const a = (i / lines) * Math.PI * 2 + (i % 2) * 0.12;
        const r0 = 40 + e * 120;
        const r1 = r0 + 60 + (i % 3) * 30 - e * 40;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * r1}
            y2={y + Math.sin(a) * r1}
            stroke={color}
            strokeWidth={6 - e * 4}
            strokeLinecap="round"
            opacity={1 - t}
          />
        );
      })}
    </svg>
  );
};

/** Crisp uppercase badge for numbers, timers and labels. Use instead of subtitles. */
export const Badge: React.FC<{
  text: string;
  x: number;
  y: number;
  start?: number;
  color?: string;
  size?: number;
  mono?: boolean;
  /** Anchor: the point (x, y) is this badge's centre (default) or left edge. */
  anchor?: "center" | "left";
}> = ({ text, x, y, start = 0, color = cine.badge, size = 44, mono: useMono = false, anchor = "center" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: springs.pop });
  if (frame < start) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: anchor === "center" ? "-50% -50%" : "0 -50%",
        scale: String(interpolate(s, [0, 1], [0.4, 1])),
        opacity: interpolate(s, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        padding: `${size * 0.22}px ${size * 0.5}px`,
        border: `3px solid ${color}`,
        borderRadius: size * 0.3,
        background: "rgba(10,14,26,0.72)",
        color,
        fontFamily: useMono ? mono : sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: useMono ? 0 : size * 0.08,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        boxShadow: `0 0 24px ${color}44`,
      }}
    >
      {text}
    </div>
  );
};
