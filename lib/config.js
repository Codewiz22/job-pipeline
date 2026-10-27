// config.js
// Reads career.config.local.js if you have one, else career.config.js (see
// next.config.mjs), and turns its word lists into matchers.

import config from "@career-config";

export default config;

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matches any of the words or phrases as whole words, ignoring case.
// Returns null for an empty list.
export function wordsMatcher(words = []) {
  const list = words.filter(Boolean);
  if (!list.length) return null;
  return new RegExp(`(?<![a-z0-9])(${list.map(escape).join("|")})(?![a-z0-9])`, "i");
}

// A title rule is a phrase (whole words) or a RegExp.
export function ruleMatcher(pattern) {
  return pattern instanceof RegExp ? new RegExp(pattern.source, "i") : wordsMatcher([pattern]);
}

export const PROFILE_KEYS = Object.keys(config.profiles);
export const HOME_LABEL = config.home?.keywords?.length ? config.home.label || "Your region" : "";
