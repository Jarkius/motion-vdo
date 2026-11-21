import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, sans, springs } from "../theme";

export type KineticTextProps = {
  text: string;
  /** Words (case-insensitive, punctuation ignored) drawn in the accent colour with an underline swipe. */
  highlight?: string[];
  accent?: string;
  /** Frames between words. */
  stagger?: number;
  start?: number;
  x: number;
  y: number;
  width: number;
  size?: number;
  align?: "left" | "center";
};

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9$%]/g, "");

/** Words spring up one at a time; highlighted words get colour and an underline. */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  highlight = [],
  accent = colors.amber,
  stagger = 3,
  start = 0,
  x,
  y,
  width,
  size = 84,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const marks = new Set(highlight.map(clean));
  const words = text.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.28,
        rowGap: size * 0.1,
        fontFamily: sans,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        color: colors.ink,
      }}
    >
      {words.map((word, i) => {
        const s = spring({ frame: frame - start - i * stagger, fps, config: springs.pop });
        const hot = marks.has(clean(word));
        const underline = spring({ frame: frame - start - i * stagger - 8, fps, config: springs.smooth });
        return (
          <span
            key={`${word}-${i}`}
            style={{
              position: "relative",
              display: "inline-block",
              color: hot ? accent : colors.ink,
              opacity: interpolate(s, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
              translate: `0px ${interpolate(s, [0, 1], [size * 0.5, 0])}px`,
              textShadow: hot ? `0 0 30px ${accent}66` : undefined,
            }}
          >
            {word}
            {hot ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: -size * 0.08,
                  height: size * 0.09,
                  width: `${underline * 100}%`,
                  background: accent,
                  borderRadius: 999,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};
