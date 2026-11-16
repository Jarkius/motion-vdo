import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono, sans, springs } from "../theme";

export type Series = { name: string; color: string; values: number[] };

export type LineChartProps = {
  series: Series[];
  /** Labels under the first and last points, and optionally in between. */
  xLabels: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  /** Frames, relative to this component. */
  drawStart?: number;
  drawDuration?: number;
  formatY?: (n: number) => string;
};

const PAD_L = 110;
const PAD_B = 60;

/** Lines draw left to right; the area under the first series fills in; end labels pop. */
export const LineChart: React.FC<LineChartProps> = ({
  series,
  xLabels,
  x,
  y,
  width,
  height,
  drawStart = 0,
  drawDuration = 60,
  formatY = (n) => `$${Math.round(n / 1000)}k`,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - drawStart + 10, fps, config: springs.smooth });
  const progress = interpolate(frame, [drawStart, drawStart + drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const plotW = width - PAD_L - 40;
  const plotH = height - PAD_B - 20;
  // Round tick step (1, 2 or 5 x 10^k) so the axis reads $25k, $50k... not $34k, $67k.
  const peak = Math.max(...series.flatMap((s) => s.values));
  const rough = peak / 4;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag;
  const max = Math.ceil((peak * 1.05) / step) * step;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const n = series[0].values.length;
  const px = (i: number) => PAD_L + (i / (n - 1)) * plotW;
  const py = (v: number) => 20 + plotH - (v / max) * plotH;

  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`).join(" ");
  const clipW = PAD_L + progress * plotW;

  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: enter }}>
      <svg width={width} height={height}>
        <defs>
          <clipPath id="reveal">
            <rect x={0} y={0} width={clipW} height={height} />
          </clipPath>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0].color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={series[0].color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={PAD_L + plotW} y1={py(t)} y2={py(t)} stroke={colors.grid} strokeWidth={2} />
            <text x={PAD_L - 16} y={py(t) + 9} textAnchor="end" fill={colors.muted} fontFamily={mono} fontSize={26}>
              {formatY(t)}
            </text>
          </g>
        ))}
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={PAD_L + (i / (xLabels.length - 1)) * plotW}
            y={height - 14}
            // Edge labels anchor inward so they never clip at the chart border.
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fill={colors.muted}
            fontFamily={sans}
            fontWeight={600}
            fontSize={28}
          >
            {label}
          </text>
        ))}
        <g clipPath="url(#reveal)">
          <path
            d={`${path(series[0].values)} L ${px(n - 1)} ${py(0)} L ${px(0)} ${py(0)} Z`}
            fill="url(#area)"
          />
          {series.map((s) => (
            <path
              key={s.name}
              d={path(s.values)}
              stroke={s.color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ filter: `drop-shadow(0 0 10px ${s.color}88)` }}
            />
          ))}
        </g>
        {series.map((s) => {
          const idx = Math.min(n - 1, Math.floor(progress * (n - 1)));
          const pop = spring({ frame: frame - drawStart - drawDuration, fps, config: springs.pop });
          return (
            <g key={`${s.name}-end`}>
              <circle cx={px(idx)} cy={py(s.values[idx])} r={12} fill={s.color} />
              <text
                x={px(n - 1) - 20}
                y={py(s.values[n - 1]) - 26}
                textAnchor="end"
                fill={s.color}
                fontFamily={sans}
                fontWeight={800}
                fontSize={34}
                opacity={pop}
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
