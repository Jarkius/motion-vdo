import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cine } from "../theme";

export type CloseUp = {
  /** Frame the push-in starts, relative to this component. */
  at: number;
  duration?: number;
  /** Midground zoom at the end of the push-in. */
  zoom: number;
  /** Point (in 1920x1080 canvas px) that stays fixed as the camera pushes in. */
  focusX: number;
  focusY: number;
  /** Background blur at full close-up, px. */
  blur?: number;
};

export type ParallaxStageProps = {
  /** Distant layer: skyline, hills, sun. Moves at 25% of the camera. */
  far?: React.ReactNode;
  /** Action layer: characters, objects, overlays. Moves with the camera. */
  mid: React.ReactNode;
  /** Framing layer: plants, posts, bokeh. Moves at 160% and sits on top. */
  fore?: React.ReactNode;
  /** Horizontal camera move in px over the scene (positive = camera moves right). */
  pan?: number;
  closeUp?: CloseUp;
  sky?: [top: string, mid: string, horizon: string];
};

/**
 * Three-layer parallax stage with a gradient sky. The camera pans across the
 * scene; a close-up pushes the midground in around a focus point and blurs
 * the far and foreground layers like a shallow depth of field.
 */
export const ParallaxStage: React.FC<ParallaxStageProps> = ({
  far,
  mid,
  fore,
  pan = 0,
  closeUp,
  sky = [cine.skyTop, cine.skyMid, cine.skyHorizon],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const camX = interpolate(frame, [0, durationInFrames], [0, pan], { easing: Easing.inOut(Easing.sin) });
  const push = closeUp
    ? interpolate(frame, [closeUp.at, closeUp.at + (closeUp.duration ?? 20)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;
  const zoom = closeUp ? 1 + (closeUp.zoom - 1) * push : 1;
  const blur = (closeUp?.blur ?? 5) * push;
  const origin = closeUp ? `${closeUp.focusX}px ${closeUp.focusY}px` : "50% 50%";

  const layer = (factor: number, z: number, blurPx: number, children: React.ReactNode) => (
    <AbsoluteFill
      style={{
        translate: `${-camX * factor}px 0px`,
        scale: String(z),
        transformOrigin: origin,
        filter: blurPx > 0.05 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 100%)` }}
      />
      {far ? layer(0.25, 1 + (zoom - 1) * 0.3, blur, far) : null}
      {layer(1, zoom, 0, mid)}
      {fore ? layer(1.6, 1 + (zoom - 1) * 1.4, blur * 1.4, fore) : null}
      {/* Vignette keeps the eye on the action. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)`,
          width,
          height,
        }}
      />
    </AbsoluteFill>
  );
};

/** Deterministic city skyline + low sun for the far layer. */
export const Skyline: React.FC<{ seed?: number; horizon?: number; sunX?: number }> = ({
  seed = 3,
  horizon = 820,
  sunX = 1500,
}) => {
  const buildings = [];
  let x = -200;
  let r = seed;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  while (x < 2400) {
    const w = 60 + rand() * 110;
    const h = 90 + rand() * 260;
    buildings.push(<rect key={x} x={x} y={horizon - h} width={w - 6} height={h + 400} fill={cine.far} />);
    x += w;
  }
  return (
    <svg width={2400} height={1080} style={{ position: "absolute", left: -200, top: 0 }}>
      {/* Sun sits just above the rooftops so the rim light has a visible source. */}
      <circle cx={sunX + 200} cy={horizon - 400} r={90} fill="#FDBA74" opacity={0.95} />
      <circle cx={sunX + 200} cy={horizon - 400} r={170} fill="#FDBA74" opacity={0.16} />
      {buildings}
    </svg>
  );
};

/** Ground plane for the midground: characters' feet sit on `y`. */
export const Ground: React.FC<{ y?: number }> = ({ y = 900 }) => (
  <div
    style={{
      position: "absolute",
      left: -400,
      top: y,
      width: 2800,
      height: 600,
      background: `linear-gradient(180deg, #1A1530 0%, ${cine.mid} 30%)`,
      borderTop: `3px solid ${cine.rim}55`,
    }}
  />
);

/** Dark foliage silhouettes in the bottom corners, for the foreground layer. */
export const Foliage: React.FC = () => {
  const blade = (x: number, h: number, lean: number, k: string) => (
    <path key={k} d={`M ${x} 1080 Q ${x + lean * 0.4} ${1080 - h * 0.6} ${x + lean} ${1080 - h} Q ${x + lean * 0.5 + 14} ${1080 - h * 0.5} ${x + 26} 1080 Z`} fill="#05070D" />
  );
  const blades = [];
  for (let i = 0; i < 9; i++) {
    blades.push(blade(-60 + i * 34, 160 + ((i * 53) % 120), 40 - i * 6, `l${i}`));
    blades.push(blade(1700 + i * 34, 140 + ((i * 71) % 140), -30 + i * 7, `r${i}`));
  }
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {blades}
    </svg>
  );
};
