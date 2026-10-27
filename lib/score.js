// score.js
// Keyword scoring. Each job gets a 0-100 score for each profile in
// career.config.js and is filed under its best one.
//
//   title match   up to 50  (first matching title rule for the profile)
//   skills        up to 35  (5 per profile skill found in the description)
//   location      +15 names your home region, +12 worldwide,
//                 -25 names only other places (0 if no home region is set)
//   freshness     +5 posted within 2 days, +2 within a week, -10 over a month
//   seniority     -10 for any word in penaliseTitles

import config, { PROFILE_KEYS, ruleMatcher, wordsMatcher } from "./config.js";

const PROFILES = PROFILE_KEYS.map((key) => ({
  key,
  titles: config.profiles[key].titles.map(([pattern, points]) => [ruleMatcher(pattern), points]),
  skills: config.profiles[key].skills.map((s) => [s, wordsMatcher([s])]),
}));

const INCLUDE = wordsMatcher(config.titles.include);
const EXCLUDE = wordsMatcher(config.titles.exclude);
const SENIOR = wordsMatcher(config.penaliseTitles);
const HOME = wordsMatcher(config.home?.keywords);
const OPEN_WORDS = /(anywhere in the world|anywhere|worldwide|world ?wide|global(ly)?|international|fully remote|remote|100%|in the world|any ?where|only|\(|\)|-|,|\/|\|)/gi;

export function isWantedTitle(title = "") {
  return (!INCLUDE || INCLUDE.test(title)) && !(EXCLUDE && EXCLUDE.test(title));
}

// "home": your home region is named. "open": worldwide or no restriction.
// "restricted": only other places are named, so you probably can't apply.
// "listed": places are named but no home region is set, so it can't be judged.
export function eligibility(location = "") {
  const t = String(location).trim();
  if (!t) return "open";
  if (HOME && HOME.test(t)) return "home";
  const leftover = t.replace(OPEN_WORDS, "").replace(/[^a-z]/gi, "");
  if (!leftover) return "open";
  return HOME ? "restricted" : "listed";
}

const LOCATION_POINTS = { home: 15, open: 12, restricted: -25, listed: 0 };
const DAY = 86400000;

export function scoreJob(job, text, now = Date.now()) {
  const title = job.title;
  const body = `${title} ${text}`;
  const elig = eligibility(job.location);

  let fresh = 0;
  if (job.postedAt) {
    const age = now - job.postedAt;
    if (age <= 2 * DAY) fresh = 5;
    else if (age <= 7 * DAY) fresh = 2;
    else if (age > 30 * DAY) fresh = -10;
  }
  const seniority = SENIOR && SENIOR.test(title) ? -10 : 0;
  const shared = LOCATION_POINTS[elig] + fresh + seniority;

  let best = null;
  const scores = {};
  for (const p of PROFILES) {
    const rule = p.titles.find(([re]) => re && re.test(title));
    const titlePts = rule ? rule[1] : 0;
    const skills = p.skills.filter(([, re]) => re && re.test(body)).map(([s]) => s);
    const skillPts = Math.min(35, skills.length * 5);
    const score = Math.max(0, Math.min(100, Math.round(titlePts + skillPts + shared)));
    scores[p.key] = score;
    if (!best || score > best.score) {
      best = { profile: p.key, score, why: { title: titlePts, skills, location: elig, fresh, seniority } };
    }
  }
  return { ...best, eligibility: elig, scores };
}
