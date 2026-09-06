// FxSound preset definitions
// Effects scale 0-10, EQ boost in dB (-12..12), master gain in dB, vol leveling 0-4, Q 1-3

const EQ_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_LABELS = ["31", "62", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];

const EFFECTS = [
  {
    id: "fidelity",
    nameKey: "effect.clarity.name",
    descKey: "effect.clarity.desc",
    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6m11-11h-6M7 12H1m15.07-7.07l-4.24 4.24M8.17 15.83l-4.24 4.24m0-14.14l4.24 4.24m7.66 7.66l4.24 4.24"/></svg>'
  },
  {
    id: "ambience",
    nameKey: "effect.ambience.name",
    descKey: "effect.ambience.desc",
    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
  },
  {
    id: "surround",
    nameKey: "effect.surround.name",
    descKey: "effect.surround.desc",
    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>'
  },
  {
    id: "dynamicBoost",
    nameKey: "effect.dynamicBoost.name",
    descKey: "effect.dynamicBoost.desc",
    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
  },
  {
    id: "bass",
    nameKey: "effect.bass.name",
    descKey: "effect.bass.desc",
    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2l2-7 4 14 3-9 2 5h7"/></svg>'
  }
];

const MASTER_CONTROLS = [
  { id: "masterGain", nameKey: "master.masterGain.name", descKey: "master.masterGain.desc", min: -12, max: 12, step: 1, unit: "dB", default: 0 },
  { id: "volumeLeveling", nameKey: "master.volumeLeveling.name", descKey: "master.volumeLeveling.desc", min: 0, max: 4, step: 0.5, unit: "dB", default: 0 },
  { id: "filterQ", nameKey: "master.filterQ.name", descKey: "master.filterQ.desc", min: 1, max: 3, step: 0.5, unit: "x", default: 1 },
  { id: "balance", nameKey: "master.balance.name", descKey: "master.balance.desc", min: -1, max: 1, step: 0.05, unit: "", default: 0 }
];

const PRESETS = [
  {
    nameKey: "preset.standard",
    effects: { fidelity: 5, ambience: 3, surround: 4, dynamicBoost: 4, bass: 5 },
    eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.bassBoost",
    effects: { fidelity: 3, ambience: 2, surround: 3, dynamicBoost: 5, bass: 10 },
    eq: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1.5, balance: 0 }
  },
  {
    nameKey: "preset.vocalBoost",
    effects: { fidelity: 7, ambience: 2, surround: 3, dynamicBoost: 5, bass: 3 },
    eq: [-2, -1, 0, 1, 3, 5, 4, 2, 0, -1],
    master: { masterGain: 0, volumeLeveling: 1, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.trebleBoost",
    effects: { fidelity: 10, ambience: 2, surround: 4, dynamicBoost: 4, bass: 2 },
    eq: [0, 0, 0, 0, 0, 0, 2, 5, 7, 8],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.ambience",
    effects: { fidelity: 4, ambience: 10, surround: 6, dynamicBoost: 3, bass: 4 },
    eq: [2, 1, 0, -1, -1, 0, 1, 2, 3, 4],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.surround3d",
    effects: { fidelity: 6, ambience: 5, surround: 10, dynamicBoost: 4, bass: 5 },
    eq: [3, 2, 1, 0, -1, -1, 0, 2, 4, 5],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1.5, balance: 0 }
  },
  {
    nameKey: "preset.jazz",
    effects: { fidelity: 6, ambience: 4, surround: 5, dynamicBoost: 4, bass: 4 },
    eq: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.classical",
    effects: { fidelity: 5, ambience: 6, surround: 5, dynamicBoost: 3, bass: 3 },
    eq: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.rock",
    effects: { fidelity: 7, ambience: 3, surround: 5, dynamicBoost: 6, bass: 7 },
    eq: [5, 4, 2, -1, -2, 1, 3, 4, 4, 3],
    master: { masterGain: 0, volumeLeveling: 1, filterQ: 1.5, balance: 0 }
  },
  {
    nameKey: "preset.pop",
    effects: { fidelity: 6, ambience: 3, surround: 4, dynamicBoost: 6, bass: 6 },
    eq: [2, 3, 4, 3, 0, -1, 0, 2, 3, 2],
    master: { masterGain: 0, volumeLeveling: 1, filterQ: 1, balance: 0 }
  },
  {
    nameKey: "preset.electronic",
    effects: { fidelity: 6, ambience: 4, surround: 7, dynamicBoost: 7, bass: 9 },
    eq: [6, 5, 3, 0, -2, -1, 0, 3, 5, 6],
    master: { masterGain: 0, volumeLeveling: 1.5, filterQ: 1.5, balance: 0 }
  },
  {
    nameKey: "preset.country",
    effects: { fidelity: 5, ambience: 3, surround: 4, dynamicBoost: 4, bass: 4 },
    eq: [1, 2, 3, 2, 0, -1, 1, 2, 1, 0],
    master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
  }
];
