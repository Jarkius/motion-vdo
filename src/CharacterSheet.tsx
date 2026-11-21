import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "./components/Background";
import { Character, Mood, PoseName } from "./components/Character";
import { colors, sans } from "./theme";

const POSES: PoseName[] = ["idle", "point", "shrug", "cheer", "think"];
const MOODS: Mood[] = ["neutral", "happy", "worried", "surprised"];

/**
 * Still contact sheet of every pose and mood. Render it to approve a style
 * before building scenes:  npx remotion still CharacterSheet out/sheet.png --frame=40
 */
export const CharacterSheet: React.FC = () => (
  <AbsoluteFill>
    <Background drift={0} />
    {POSES.map((pose, i) => (
      <React.Fragment key={pose}>
        <Character x={200 + i * 380} y={500} scale={0.85} poses={[{ at: 0, value: pose }]} seed={i} />
        <div style={label(200 + i * 380, 520)}>{pose}</div>
      </React.Fragment>
    ))}
    {MOODS.map((mood, i) => (
      <React.Fragment key={mood}>
        <Character
          x={300 + i * 440}
          y={1000}
          scale={0.85}
          moods={[{ at: 0, value: mood }]}
          shirt={[colors.cyan, colors.amber, colors.coral, colors.emerald][i]}
          seed={i + 5}
        />
        <div style={label(300 + i * 440, 1020)}>{mood}</div>
      </React.Fragment>
    ))}
  </AbsoluteFill>
);

const label = (x: number, y: number): React.CSSProperties => ({
  position: "absolute",
  left: x - 150,
  top: y,
  width: 300,
  textAlign: "center",
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 30,
  color: colors.muted,
});
