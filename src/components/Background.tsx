import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

const SPACING = 80;

/** Dark canvas with a slowly drifting grid and a vignette. */
export const Background: React.FC<{ drift?: number }> = ({ drift = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const offset = (frame * drift) % SPACING;

  const vertical = [];
  for (let x = -SPACING; x <= width + SPACING; x += SPACING) {
    vertical.push(
      <line key={`v${x}`} x1={x + offset} y1={0} x2={x + offset} y2={height} />,
    );
  }
  const horizontal = [];
  for (let y = -SPACING; y <= height + SPACING; y += SPACING) {
    horizontal.push(
      <line key={`h${y}`} x1={0} y1={y + offset / 2} x2={width} y2={y + offset / 2} />,
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <svg width={width} height={height} style={{ opacity: 0.35 }}>
        <g stroke={colors.grid} strokeWidth={2}>
          {vertical}
          {horizontal}
        </g>
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(11,13,18,0) 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
