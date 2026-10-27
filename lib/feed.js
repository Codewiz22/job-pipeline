// feed.js
// Builds the job feed: fetch every source, keep wanted titles posted in the
// last 45 days, score them, drop duplicates, best matches first.

import { fetchAllSources } from "./sources.js";
import { htmlToText } from "./text.js";
import { isWantedTitle, scoreJob } from "./score.js";

const MAX_AGE = 45 * 86400000;
const MAX_TEXT = 5000;

function dedupeKey(job) {
  return `${job.company}|${job.title}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
}

export async function buildFeed() {
  const now = Date.now();
  const { jobs: raw, status } = await fetchAllSources();

  const byKey = new Map();
  for (const job of raw) {
    if (!job.title || !job.link || !isWantedTitle(job.title)) continue;
    if (job.postedAt && now - job.postedAt > MAX_AGE) continue;

    const text = htmlToText(job.description).slice(0, MAX_TEXT);
    const { description, ...rest } = job;
    const scored = { ...rest, title: job.title.trim(), company: (job.company || "").trim(), text, ...scoreJob(job, text, now) };

    // The same job often appears on several boards; keep the first copy, but
    // prefer one that has a description.
    const key = dedupeKey(scored);
    const prev = byKey.get(key);
    if (!prev || (!prev.text && scored.text)) byKey.set(key, scored);
  }

  const jobs = [...byKey.values()].sort((a, b) => b.score - a.score || b.postedAt - a.postedAt);
  const kept = {};
  for (const j of jobs) kept[j.source] = (kept[j.source] || 0) + 1;

  return {
    fetchedAt: now,
    jobs,
    sources: status.map((s) => ({ ...s, kept: kept[s.key] || 0 })),
  };
}
