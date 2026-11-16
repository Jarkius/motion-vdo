import React from "react";
import { Composition } from "remotion";
import { CharacterSheet } from "./CharacterSheet";
import { calculateCompoundMetadata, CompoundVideo, FPS } from "./videos/compound/CompoundVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Compound"
        component={CompoundVideo}
        durationInFrames={300}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ voFrames: [60, 60, 60, 60] }}
        calculateMetadata={calculateCompoundMetadata}
      />
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={90} fps={FPS} width={1920} height={1080} />
    </>
  );
};
