// profiles.js
// Profile labels from career.config.js, for the dashboard.

import config, { PROFILE_KEYS } from "./config.js";

export const PROFILES = Object.fromEntries(PROFILE_KEYS.map((k) => [k, { label: config.profiles[k].label }]));

export { PROFILE_KEYS };
