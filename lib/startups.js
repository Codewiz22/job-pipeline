// startups.js
// Startups worth a cold DM: Y Combinator companies that are hiring, from the
// open YC directory at yc-oss.github.io (no key needed), ranked by how likely
// they are to need you. Settings are under `outreach` in career.config.js.
//
//   team size     +25 up to 10 people, +18 up to 25, +10 up to maxTeamSize
//   recent batch  +20 this year or last, +12 two years ago, +6 three
//   location      +20 names your home region, +12 hires remotely
//   industry      +10 in one of your industries
//   keywords      +5 per keyword in the pitch or tags, up to 20

import config, { wordsMatcher } from "./config.js";

const SOURCE = "https://yc-oss.github.io/api/companies/hiring.json";
const KEEP = 300;

const outreach = config.outreach || {};
const HOME = wordsMatcher(config.home?.keywords);
const INDUSTRIES = new Set((outreach.industries || []).map((s) => s.toLowerCase()));
const KEYWORDS = (outreach.keywords || []).map((k) => [k, wordsMatcher([k])]);

function batchYear(batch = "") {
  const m = batch.match(/(\d{4})/);
  return m ? Number(m[1]) : 0;
}

function scoreStartup(c, year) {
  const size = c.team_size || 0;
  const teamPts = size <= 10 ? 25 : size <= 25 ? 18 : 10;

  const age = year - batchYear(c.batch);
  const batchPts = age <= 1 ? 20 : age === 2 ? 12 : age === 3 ? 6 : 0;

  // YC files the Middle East under "Middle East and North Africa"; leave that
  // out so it doesn't match an "africa" home keyword.
  const where = `${(c.regions || []).join("; ")}; ${c.all_locations || ""}`;
  const home = Boolean(HOME && HOME.test(where.replace(/middle east and north africa/gi, "")));
  const remote = /\bremote\b/i.test(where);
  const locationPts = home ? 20 : remote ? 12 : 0;

  const industries = [c.industry, ...(c.industries || [])].filter(Boolean).map((s) => s.toLowerCase());
  const industryPts = industries.some((i) => INDUSTRIES.has(i)) ? 10 : 0;

  const text = `${c.one_liner || ""} ${(c.tags || []).join(" ")}`;
  const keywords = KEYWORDS.filter(([, re]) => re && re.test(text)).map(([k]) => k);
  const keywordPts = Math.min(20, keywords.length * 5);

  const score = Math.min(100, teamPts + batchPts + locationPts + industryPts + keywordPts);
  return { score, why: { team: teamPts, batch: batchPts, home, remote, industry: industryPts, keywords } };
}

export async function buildStartups() {
  const now = Date.now();
  if (!outreach.enabled) return { fetchedAt: now, startups: [], enabled: false };

  // The directory is ~2.5 MB, over Next's per-fetch cache limit, so the route
  // caches the trimmed result instead (see app/api/startups/route.js).
  // A failed fetch throws, so a bad response is never cached.
  const res = await fetch(SOURCE, { cache: "no-store", signal: AbortSignal.timeout(30000), headers: { "User-Agent": "Mozilla/5.0 (compatible; job-pipeline/1.0)" } });
  if (!res.ok) throw new Error(`YC directory returned ${res.status}`);
  const all = await res.json();

  const year = new Date(now).getFullYear();
  const max = outreach.maxTeamSize || 50;
  const ranked = all
    .filter((c) => c.status === "Active" && c.website && c.team_size && c.team_size <= max)
    .map((c) => ({
      id: c.slug,
      name: c.name,
      logo: c.small_logo_thumb_url || "",
      website: c.website,
      oneLiner: (c.one_liner || "").trim(),
      description: (c.long_description || "").slice(0, 900),
      teamSize: c.team_size,
      batch: c.batch || "",
      location: c.all_locations || "",
      remote: (c.regions || []).some((r) => /remote/i.test(r)),
      industry: c.industry || "",
      tags: (c.tags || []).slice(0, 6),
      ycUrl: c.url,
      ...scoreStartup(c, year),
    }))
    .sort((a, b) => b.score - a.score || a.teamSize - b.teamSize);

  // Keep the best KEEP, plus every startup in your home region.
  const startups = ranked.filter((s, i) => i < KEEP || s.why.home);

  return { fetchedAt: now, startups, enabled: true };
}
