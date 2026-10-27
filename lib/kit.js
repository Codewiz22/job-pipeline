// kit.js
// Default Apply kit from career.config.js. Changes made in Settings are
// saved in the browser, not in the config.
// Templates fill in {company}, {title}, {name}, {portfolio} and {appliedDate}.

import config, { PROFILE_KEYS } from "./config.js";

export const DEFAULT_KIT = {
  ...config.kit,
  pitches: Object.fromEntries(PROFILE_KEYS.map((k) => [k, config.profiles[k].pitch || ""])),
};

export function reviveKit(saved) {
  return { ...DEFAULT_KIT, ...saved, pitches: { ...DEFAULT_KIT.pitches, ...(saved?.pitches || {}) } };
}
