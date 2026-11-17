import React from "react";
import { interpolate } from "remotion";
import { cine } from "../theme";
import { active, HIP_Y, Keyframe, LIMB, PoseName, SHOULDER_X, useRig } from "./rig";

export type Expression = "neutral" | "happy_arcs" | "wide_shock" | "focused_glint" | "determined";
export type Prop = "none" | "cap" | "scarf";

export type SilhouetteProps = {
  poses?: Keyframe<PoseName>[];
  expressions?: Keyframe<Expression>[];
  talking?: [number, number][];
  x: number;
  y: number;
  scale?: number;
  enterAt?: number;
  flip?: boolean;
  seed?: number;
  /** Direction the light comes FROM, in degrees: 0 = right, 90 = below, 180 = left, -90 = above. */
  light?: number;
  /** Rim thickness in px (before scale). */
  rimWidth?: number;
  jacket?: string;
  prop?: Prop;
  propColor?: string;
};

type Brow = [inner: number, outer: number];
const BROWS: Record<Expression, Brow> = {
  neutral: [-367, -367],
  happy_arcs: [-372, -371],
  wide_shock: [-378, -376],
  focused_glint: [-361, -363],
  determined: [-359, -369],
};

const Eye: React.FC<{ cx: number; expr: Expression; blink: number }> = ({ cx, expr, blink }) => {
  const y = -350;
  switch (expr) {
    case "happy_arcs":
      return (
        <path d={`M ${cx - 8} ${y + 2} Q ${cx} ${y - 9} ${cx + 8} ${y + 2}`} stroke={cine.eye} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      );
    case "wide_shock":
      return (
        <g>
          <circle cx={cx} cy={y} r={10} fill={cine.eye} />
          <circle cx={cx} cy={y} r={3.5} fill={cine.core} />
        </g>
      );
    case "focused_glint":
      return (
        <g>
          <ellipse cx={cx} cy={y} rx={8} ry={3.2 * blink} fill={cine.eye} />
          <circle cx={cx + 4} cy={y - 4} r={2.4} fill={cine.rim} />
        </g>
      );
    case "determined":
      return <ellipse cx={cx} cy={y} rx={6.5} ry={5 * blink} fill={cine.eye} />;
    default:
      return <ellipse cx={cx} cy={y} rx={5.5} ry={7.5 * blink} fill={cine.eye} />;
  }
};

const Mouth: React.FC<{ expr: Expression; open: number }> = ({ expr, open }) => {
  const y = -322;
  const stroke = { stroke: cine.eye, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none", opacity: 0.85 };
  if (open > 0.05) return <ellipse cx={0} cy={y} rx={9} ry={2 + open * 7} fill={cine.eye} opacity={0.85} />;
  if (expr === "wide_shock") return <ellipse cx={0} cy={y} rx={7} ry={9} fill={cine.eye} opacity={0.85} />;
  if (expr === "happy_arcs") return <path d={`M -13 ${y - 2} Q 0 ${y + 10} 13 ${y - 2}`} {...stroke} />;
  if (expr === "determined") return <path d={`M -11 ${y} L 11 ${y}`} {...stroke} />;
  return <path d={`M -9 ${y} Q 0 ${y + 3} 9 ${y}`} {...stroke} />;
};

/**
 * Dark silhouette character with a warm rim light on the side facing `light`.
 * Every body part is drawn twice: once in the rim colour offset toward the light,
 * then the core on top, leaving a crisp edge only on the lit side.
 */
export const Silhouette: React.FC<SilhouetteProps> = ({
  poses = [{ at: 0, value: "idle" }],
  expressions = [{ at: 0, value: "neutral" }],
  talking = [],
  x,
  y,
  scale = 1,
  enterAt = 0,
  flip = false,
  seed = 0,
  light = 0,
  rimWidth = 3,
  jacket = cine.core,
  prop = "none",
  propColor = "#B45309",
}) => {
  const { frame, pose, enter, breath, open, eyeScale, shoulderY, L, R, footSpread } = useRig({
    poses,
    talking,
    enterAt,
    seed,
  });
  const expr = expressions[active(expressions, frame)].value;
  const [bi, bo] = BROWS[expr];

  // Light direction in this component's local space (the flip mirrors x).
  const lx = Math.cos((light * Math.PI) / 180) * rimWidth * (flip ? -1 : 1);
  const ly = Math.sin((light * Math.PI) / 180) * rimWidth;
  // Face the prop's brim toward the side the character faces on screen.
  const facing = 1;

  const body = (rim: boolean) => {
    const c = rim ? cine.rim : cine.core;
    const limb = { stroke: c, strokeWidth: LIMB, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
    return (
      <g>
        <path d={`M -18 ${HIP_Y} L ${-footSpread} 0`} {...limb} />
        <path d={`M 18 ${HIP_Y} L ${footSpread} 0`} {...limb} />
        <path d={`M ${-SHOULDER_X} ${shoulderY} L ${L.ex} ${L.ey} L ${L.hx} ${L.hy}`} {...limb} />
        <rect x={-52} y={-292 + breath} width={104} height={150 - breath} rx={34} fill={rim ? c : jacket} />
        {rim ? null : (
          // Jacket opening: a slightly lighter centre seam reads as clothing, not a blob.
          <path d={`M 0 ${-286 + breath} L 0 -150`} stroke={cine.far} strokeWidth={4} />
        )}
        <path d={`M ${SHOULDER_X} ${shoulderY} L ${R.ex} ${R.ey} L ${R.hx} ${R.hy}`} {...limb} />
        <circle cx={R.hx} cy={R.hy} r={11} fill={c} />
        <circle cx={L.hx} cy={L.hy} r={11} fill={c} />
        <g transform={`translate(0 ${breath * 0.6})`}>
          <circle cx={0} cy={-345} r={50} fill={c} />
          {/* Cap sits above the brow line so eyes and brows stay on the face. */}
          {prop === "cap" ? (
            <path
              d={`M -42 -372 A 50 50 0 0 1 42 -372 L ${facing * 84} -372 L ${facing * 84} -364 L -42 -364 Z`}
              fill={rim ? c : propColor}
            />
          ) : null}
        </g>
        {prop === "scarf" ? (
          <g fill={rim ? c : propColor}>
            <rect x={-40} y={-300 + breath} width={80} height={22} rx={11} />
            <rect x={12} y={-290 + breath} width={20} height={70} rx={8} />
          </g>
        ) : null}
      </g>
    );
  };

  const s = scale * interpolate(enter, [0, 1], [0.6, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        scale: `${(flip ? -1 : 1) * s} ${s}`,
        translate: `0px ${interpolate(enter, [0, 1], [80, 0])}px`,
      }}
    >
      <svg
        width={420}
        height={460}
        viewBox="-210 -430 420 460"
        style={{ position: "absolute", left: -210, top: -430, overflow: "visible" }}
      >
        <ellipse cx={0} cy={6} rx={90 - pose.hop} ry={12} fill="#000" opacity={0.5} />
        <g transform={`translate(0 ${-pose.hop}) rotate(${pose.lean} 0 -150)`}>
          <g transform={`translate(${lx} ${ly})`} style={{ filter: `drop-shadow(0 0 6px ${cine.rim})` }}>
            {body(true)}
          </g>
          {body(false)}
          <g transform={`translate(0 ${breath * 0.6})`}>
            {[-1, 1].map((side) => (
              <g key={side}>
                <Eye cx={side * 17} expr={expr} blink={eyeScale} />
                <path
                  d={`M ${side * 9} ${bi} L ${side * 26} ${bo}`}
                  stroke={cine.eye}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0.9}
                />
              </g>
            ))}
            <Mouth expr={expr} open={open} />
          </g>
        </g>
      </svg>
    </div>
  );
};
