import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts (SIL OFL) so renders work offline and look
// identical everywhere. Add a Thai face (e.g. Noto Sans Thai) here for Thai videos.
export const sans = "Inter";
export const mono = "JetBrains Mono";

for (const weight of ["500", "700", "800"]) {
  loadFont({ family: sans, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight });
}
for (const weight of ["600", "700"]) {
  loadFont({ family: mono, url: staticFile(`fonts/jetbrains-mono-latin-${weight}-normal.woff2`), weight });
}

// Swap these per channel to build your own look. Everything reads from here.
export const colors = {
  bg: "#0B0D12",
  grid: "#1A1F2C",
  ink: "#E8ECF4",
  muted: "#8A93A6",
  face: "#F5F1E8",
  cyan: "#38BDF8",
  amber: "#FACC15",
  coral: "#F43F5E",
  emerald: "#4ADE80",
} as const;

export const springs = {
  // Entrances: quick with a small overshoot.
  pop: { damping: 14, stiffness: 120 },
  // Pose changes and camera moves: settled, no wobble.
  smooth: { damping: 200 },
} as const;
