import React from "react";
import { Audio } from "@remotion/media";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { AbsoluteFill, CalculateMetadataFunction, interpolate, Easing, Sequence, staticFile, useCurrentFrame } from "remotion";
import { HitStop, holdFrames, Shake, videoFrameOf } from "../../components/Acting";
import { Badge, Ghosts, quad, SpeedBurst, TargetRings, Trajectory } from "../../components/Overlays";
import { Foliage, Ground, ParallaxStage, Skyline } from "../../components/ParallaxStage";
import { arm, POSES, SHOULDER_X } from "../../components/rig";
import { Silhouette } from "../../components/Silhouette";
import { cine } from "../../theme";
import { NORMAL_S, VO_FILES, YOU_S } from "./data";

export const FPS = 30;
const LEAD = 8;
const GAP = 10;
const TAIL = 30;

export type ReflexProps = { voFrames: number[] };

/** Every beat time is derived from the voiceover lengths, in one place. */
const timeline = (vo: number[]) => {
  const b1 = LEAD;
  const b2 = LEAD + vo[0] + GAP;
  const throw1 = b1 + Math.round(vo[0] * 0.3);
  const pass1 = throw1 + 11; // ball passes NORMAL at this frame
  const late = Math.round(NORMAL_S * FPS); // NORMAL reacts this many frames later
  const throw2 = b2 + 22; // after the camera push-in settles
  const flight2 = 16;
  const catch2 = throw2 + flight2;
  // The catch lands with a short hit-stop; story time pauses, the video doesn't.
  const hits = [{ at: catch2, hold: 4 }];
  const end = Math.max(b2 + vo[1] + TAIL, catch2 + 45) + holdFrames(hits);
  return { b1, b2, throw1, pass1, late, throw2, flight2, catch2, hits, end };
};

export const calculateReflexMetadata: CalculateMetadataFunction<ReflexProps> = async () => {
  const voFrames = await Promise.all(
    VO_FILES.map(async (f) => {
      const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(f)) });
      return Math.ceil((await input.computeDuration()) * FPS);
    }),
  );
  return { durationInFrames: timeline(voFrames).end, props: { voFrames } };
};

const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.3 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const LIGHT = -15; // low sun, front-right
const NORMAL = { x: 620, y: 900, scale: 1.1 };
const YOU = { x: 1300, y: 900, scale: 1.1 };

// YOU is flipped to face left, so the catch hand mirrors to the left of YOU's x.
const yourHand = (() => {
  const shoulderY = -270;
  const h = arm(SHOULDER_X, shoulderY, POSES.catch.right, 1);
  // Account for the pose's lean (rotation about (0,-150)) before mirroring.
  const a = (POSES.catch.lean * Math.PI) / 180;
  const rx = h.hx * Math.cos(a) - (h.hy + 150) * Math.sin(a);
  const ry = h.hx * Math.sin(a) + (h.hy + 150) * Math.cos(a) - 150;
  return { x: YOU.x - rx * YOU.scale, y: YOU.y + ry * YOU.scale };
})();

const Ball: React.FC = () => (
  <div
    style={{
      width: 38,
      height: 38,
      translate: "-50% -50%",
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, #FFF7ED, ${cine.rim} 60%, #C2410C)`,
      boxShadow: `0 0 30px ${cine.rim}`,
    }}
  />
);

const Action: React.FC<{ voFrames: number[] }> = ({ voFrames }) => {
  const frame = useCurrentFrame();
  const t = timeline(voFrames);

  const p1 = { p0: { x: -80, y: 560 }, c: { x: 600, y: 380 }, p1: { x: 2050, y: 520 } };
  const p2 = { p0: { x: -120, y: 380 }, c: { x: 560, y: 200 }, p1: yourHand };

  const ball1 = (f: number) =>
    quad(p1.p0, p1.c, p1.p1, interpolate(f, [t.throw1, t.throw1 + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const ball2 = (f: number) =>
    f >= t.catch2
      ? yourHand
      : quad(p2.p0, p2.c, p2.p1, interpolate(f, [t.throw2, t.catch2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.quad),
        }));

  return (
    <AbsoluteFill>
      <Ground />
      <Silhouette
        {...NORMAL}
        light={LIGHT}
        prop="scarf"
        propColor="#64748B"
        seed={2}
        poses={[
          { at: 0, value: "idle" },
          { at: t.pass1 + t.late, value: "brace", how: "snap" },
        ]}
        expressions={[
          { at: 0, value: "neutral" },
          { at: t.pass1 + t.late, value: "wide_shock" },
        ]}
      />
      <Silhouette
        {...YOU}
        flip
        light={LIGHT}
        prop="cap"
        propColor="#B45309"
        seed={5}
        poses={[
          { at: 0, value: "idle" },
          { at: t.catch2 - 3, value: "catch", how: "out" },
        ]}
        expressions={[
          { at: 0, value: "neutral" },
          { at: t.b2, value: "focused_glint" },
          { at: t.catch2 + 8, value: "happy_arcs" },
        ]}
      />

      {/* Beat 1: the ball zips past NORMAL; the flinch lands 0.25 s late. */}
      <Trajectory {...p1} start={t.throw1} duration={26} />
      {frame >= t.throw1 && frame < t.throw1 + 26 ? (
        <Ghosts at={ball1}>
          <Ball />
        </Ghosts>
      ) : null}
      <Badge text="Normal" x={NORMAL.x} y={430} start={t.b1 + 4} />
      <Badge text={`${NORMAL_S} s`} x={NORMAL.x} y={340} start={t.pass1 + t.late} mono color={cine.eye} />

      {/* Beat 2: close-up. Rings mark the catch point, the ball streaks in, YOU snaps it. */}
      <TargetRings x={yourHand.x} y={yourHand.y} start={t.b2 + 6} end={t.catch2} radius={80} />
      {frame >= t.throw2 ? (
        <Ghosts at={ball2} count={frame < t.catch2 ? 5 : 0} gap={1}>
          <Ball />
        </Ghosts>
      ) : null}
      <SpeedBurst x={yourHand.x} y={yourHand.y} at={t.catch2} />
      <Badge text="You" x={YOU.x} y={430} start={t.b2 + 4} />
      <Badge text={`${YOU_S} s`} x={YOU.x} y={340} start={t.catch2 + 2} mono color={cine.eye} />
    </AbsoluteFill>
  );
};

export const ReflexVideo: React.FC<ReflexProps> = ({ voFrames }) => {
  const t = timeline(voFrames);
  return (
    <AbsoluteFill>
      <Shake hits={[{ at: videoFrameOf(t.catch2, t.hits), amp: 14, frames: 10 }]}>
        <HitStop hits={t.hits}>
          <ParallaxStage
            far={<Skyline sunX={1550} />}
            mid={<Action voFrames={voFrames} />}
            fore={<Foliage />}
            pan={60}
            closeUp={{ at: t.b2, duration: 20, zoom: 1.55, focusX: 1220, focusY: 620, blur: 5 }}
          />
        </HitStop>
      </Shake>
      <Sequence from={LEAD} layout="none">
        <Audio src={staticFile(VO_FILES[0])} />
      </Sequence>
      <Sequence from={t.b2} layout="none">
        <Audio src={staticFile(VO_FILES[1])} />
      </Sequence>
      <Sfx at={t.throw1} name="whoosh" />
      <Sfx at={t.throw2} name="whoosh" />
      <Sfx at={videoFrameOf(t.catch2, t.hits)} name="pop" volume={0.45} />
      <Sfx at={videoFrameOf(t.catch2, t.hits) + 6} name="ding" volume={0.2} />
    </AbsoluteFill>
  );
};
