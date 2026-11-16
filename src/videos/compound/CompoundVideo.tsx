import React from "react";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, staticFile, useVideoConfig } from "remotion";
import { Background } from "../../components/Background";
import { Character } from "../../components/Character";
import { Counter } from "../../components/Counter";
import { KineticText } from "../../components/KineticText";
import { LineChart } from "../../components/LineChart";
import { colors } from "../../theme";
import { balances, DEPOSITED, deposits, FINAL, VO_FILES, YEARS } from "./data";

export const FPS = 30;
/** Frames of silence before the voice starts in each scene. */
const LEAD = 8;
/** Frames held after the voice ends; must exceed TRANSITION so voices never overlap. */
const TAIL = 22;
const TRANSITION = 12;

export type CompoundProps = { voFrames: number[] };

export const calculateCompoundMetadata: CalculateMetadataFunction<CompoundProps> = async () => {
  const voFrames = await Promise.all(
    VO_FILES.map(async (f) => {
      const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(staticFile(f)) });
      return Math.ceil((await input.computeDuration()) * FPS);
    }),
  );
  const scenes = voFrames.reduce((sum, v) => sum + LEAD + v + TAIL, 0);
  return {
    durationInFrames: scenes - TRANSITION * (voFrames.length - 1),
    props: { voFrames },
  };
};

const Sfx: React.FC<{ at: number; name: string; volume?: number }> = ({ at, name, volume = 0.35 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const Voice: React.FC<{ file: string }> = ({ file }) => (
  <Sequence from={LEAD} layout="none">
    <Audio src={staticFile(file)} />
  </Sequence>
);

/** The host stays put across fades (see vector-explainer-studio layout rules). */
const HOST = { x: 1600, y: 920, scale: 1.15, flip: true } as const;

const k = (n: number) => `$${Math.round(n / 1000)}k`;

export const CompoundVideo: React.FC<CompoundProps> = ({ voFrames }) => {
  const { fps } = useVideoConfig();
  const len = (i: number) => LEAD + voFrames[i] + TAIL;
  const talk = (i: number): [number, number][] => [[LEAD, LEAD + voFrames[i]]];

  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {/* 1. Hook */}
        <TransitionSeries.Sequence name="Hook" durationInFrames={len(0)}>
          <Voice file={VO_FILES[0]} />
          <Sfx at={0} name="pop" />
          <KineticText
            text="What if you saved just $100 a month?"
            highlight={["$100"]}
            x={140}
            y={300}
            width={1000}
            size={104}
            start={LEAD}
            stagger={4}
          />
          <Character
            {...HOST}
            poses={[
              { at: 0, value: "think" },
              { at: Math.round(voFrames[0] * 0.7), value: "point" },
            ]}
            talking={talk(0)}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        {/* 2. What you put in */}
        <TransitionSeries.Sequence name="Deposits" durationInFrames={len(1)}>
          <Voice file={VO_FILES[1]} />
          <Sfx at={0} name="whoosh" volume={0.25} />
          <Character
            {...HOST}
            poses={[
              { at: 0, value: "idle" },
              { at: LEAD + Math.round(voFrames[1] * 0.45), value: "point" },
            ]}
            talking={talk(1)}
          />
          <Counter
            label={`You put in over ${YEARS} years`}
            to={DEPOSITED}
            start={LEAD + Math.round(voFrames[1] * 0.45)}
            duration={Math.round(1.2 * fps)}
            color={colors.cyan}
            x={140}
            y={380}
            size={150}
          />
          <Sfx at={LEAD + Math.round(voFrames[1] * 0.45) + Math.round(1.2 * fps)} name="ding" volume={0.25} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        {/* 3. What it grows to */}
        <TransitionSeries.Sequence name="Growth" durationInFrames={len(2)}>
          <Voice file={VO_FILES[2]} />
          <Sfx at={0} name="whoosh" volume={0.25} />
          <LineChart
            series={[
              { name: `Invested: ${k(FINAL)}`, color: colors.emerald, values: balances },
              { name: `Deposited: ${k(DEPOSITED)}`, color: colors.cyan, values: deposits },
            ]}
            xLabels={["Year 0", "10", "20", "Year 30"]}
            x={100}
            y={120}
            width={1280}
            height={820}
            drawStart={LEAD + 6}
            drawDuration={Math.max(30, voFrames[2] - 20)}
          />
          <Character
            {...HOST}
            poses={[
              { at: 0, value: "idle" },
              { at: LEAD + voFrames[2] - 10, value: "shrug" },
            ]}
            moods={[
              { at: 0, value: "neutral" },
              { at: LEAD + voFrames[2] - 10, value: "surprised" },
            ]}
            talking={talk(2)}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />

        {/* 4. Payoff */}
        <TransitionSeries.Sequence name="Payoff" durationInFrames={len(3)}>
          <Voice file={VO_FILES[3]} />
          <Sfx at={LEAD} name="pop" />
          <KineticText
            text="That gap is compound interest"
            highlight={["compound", "interest"]}
            accent={colors.emerald}
            x={120}
            y={200}
            width={1100}
            size={110}
            start={LEAD}
          />
          <Counter
            label="Earned, not deposited"
            to={FINAL - DEPOSITED}
            start={LEAD + 20}
            duration={Math.round(1.1 * fps)}
            color={colors.emerald}
            x={130}
            y={620}
            size={120}
          />
          <Character
            {...HOST}
            poses={[
              { at: 0, value: "idle" },
              { at: LEAD + 20, value: "cheer" },
            ]}
            moods={[{ at: 0, value: "happy" }]}
            talking={talk(3)}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
