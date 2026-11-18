// Categorical palette tuned for the NDO Midnight Blue + Jade + Champagne theme.
export const CHART_COLORS = [
  "oklch(0.52 0.085 245)",  // midnight steel blue
  "oklch(0.57 0.105 180)",  // jade teal
  "oklch(0.72 0.105 82)",   // champagne gold
  "oklch(0.62 0.13 25)",    // muted coral
  "oklch(0.64 0.09 150)",   // sage green
  "oklch(0.62 0.075 305)",  // soft plum
  "oklch(0.68 0.075 240)",  // dusty blue
  "oklch(0.66 0.105 55)",   // burnt orange
];

export const AXIS_PROPS = {
  stroke: "currentColor",
  strokeOpacity: 0.18,
  tick: {
    fontSize: 11,
    fill: "currentColor",
    fillOpacity: 0.7,
  },
  tickLine: false,
  axisLine: false,
};

export const GRID_PROPS = {
  stroke: "currentColor",
  strokeOpacity: 0.09,
  vertical: false,
};
