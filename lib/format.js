// format.js
// Small display helpers shared by the dashboard components.

import config, { HOME_LABEL } from "./config";

export const DAY = 86400000;
export const FOLLOW_UP_DAYS = config.followUpDays || 7;

export function timeAgo(ts, now = Date.now()) {
  if (!ts) return "";
  const s = Math.max(0, (now - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / (86400 * 7))}w ago`;
}

export function shortDate(ts) {
  return ts ? new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
}

export function followUpDue(entry, now = Date.now()) {
  return Boolean(entry && entry.status === "applied" && entry.appliedAt && !entry.followedUpAt && now - entry.appliedAt >= FOLLOW_UP_DAYS * DAY);
}

export function scoreTone(score) {
  return score >= 75 ? "high" : score >= 55 ? "mid" : "low";
}

// Himalayas lists every allowed country; collapse long lists.
export function shortLocation(location = "") {
  if (location.length <= 40) return location;
  const parts = location.split(/,\s*/);
  const home = HOME_LABEL && parts.some((p) => p.toLowerCase() === HOME_LABEL.toLowerCase());
  return `${parts.length} countries${home ? ` incl. ${HOME_LABEL}` : ""}`;
}

export function fill(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? vars[k] : m));
}

export function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}
