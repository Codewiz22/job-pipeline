// sources.js
// One fetcher per public job board. None need an API key. Each returns jobs in
// the same raw shape; feed.js filters and scores them.
//
// Boards ask for modest polling and a link back, so responses are cached
// (Remotive and Remote OK for 6 hours, the rest hourly) and every job card
// credits its source.
//
// What each board is asked for comes from `sources` in career.config.js.

import Parser from "rss-parser";
import config from "./config.js";

const HOUR = 3600;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; job-pipeline/1.0; personal use)" };
const SEARCH = config.sources || {};
const list = (v) => [].concat(v || []).filter(Boolean);

async function getText(url, revalidate) {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
  return res.text();
}

async function getJson(url, revalidate) {
  return JSON.parse(await getText(url, revalidate));
}

function money(min, max, currency = "USD", period = "") {
  const lo = Number(min) || 0;
  const hi = Number(max) || 0;
  if (!lo && !hi) return "";
  const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
  const sym = { USD: "$", GBP: "£", EUR: "€" }[currency] ?? `${currency} `;
  const range = lo && hi && lo !== hi ? `${sym}${fmt(lo)}–${fmt(hi)}` : `${sym}${fmt(hi || lo)}`;
  const per = /month/i.test(period) ? "/mo" : /hour/i.test(period) ? "/hr" : "";
  return range + per;
}

function toMs(value) {
  if (!value) return 0;
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

// Remotive's free API currently ignores category and search, returning its
// latest handful of jobs; the title filter picks out any wanted roles.
async function remotive() {
  const urls = list(SEARCH.remotive).map((c) => `https://remotive.com/api/remote-jobs?category=${encodeURIComponent(c)}`);
  const lists = await Promise.all(urls.map((u) => getJson(u, 6 * HOUR)));
  return lists.flatMap((d) => d.jobs || []).map((j) => ({
    id: `remotive-${j.id}`,
    title: j.title,
    company: j.company_name,
    logo: j.company_logo_url || j.company_logo || "",
    location: j.candidate_required_location || "Worldwide",
    type: j.job_type || "",
    salary: j.salary || "",
    link: j.url,
    description: j.description,
    postedAt: toMs(j.publication_date),
    source: "remotive",
  }));
}

async function remoteok() {
  const urls = list(SEARCH.remoteok).map((t) => `https://remoteok.com/api?tag=${encodeURIComponent(t)}`);
  const lists = await Promise.all(urls.map((u) => getJson(u, 6 * HOUR)));
  // The first item of each response is the API's legal notice, not a job.
  return lists.flatMap((d) => d.slice(1)).filter((j) => j && j.position).map((j) => ({
    id: `remoteok-${j.id}`,
    title: j.position,
    company: j.company,
    logo: j.company_logo || j.logo || "",
    location: j.location || "Worldwide",
    type: "",
    salary: money(j.salary_min, j.salary_max),
    link: j.url,
    description: j.description,
    postedAt: toMs(j.date || j.epoch),
    source: "remoteok",
  }));
}

async function jobicy() {
  const base = "https://jobicy.com/api/v2/remote-jobs?count=50";
  const urls = [
    ...list(SEARCH.jobicy?.industries).map((i) => `${base}&industry=${encodeURIComponent(i)}`),
    ...list(SEARCH.jobicy?.tags).map((t) => `${base}&tag=${encodeURIComponent(t)}`),
  ];
  const lists = await Promise.all(urls.map((u) => getJson(u, HOUR)));
  return lists.flatMap((d) => d.jobs || []).map((j) => ({
    id: `jobicy-${j.id}`,
    title: j.jobTitle,
    company: j.companyName,
    logo: j.companyLogo || "",
    location: j.jobGeo || "Anywhere",
    type: [].concat(j.jobType || []).join(", "),
    salary: money(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod),
    link: j.url,
    description: j.jobDescription || j.jobExcerpt,
    postedAt: toMs(j.pubDate),
    source: "jobicy",
  }));
}

async function himalayas() {
  const urls = [];
  for (const q of list(SEARCH.himalayas)) {
    for (const page of [1, 2]) {
      urls.push(`https://himalayas.app/jobs/api/search?q=${encodeURIComponent(q)}&page=${page}`);
    }
  }
  const lists = await Promise.allSettled(urls.map((u) => getJson(u, HOUR)));
  const ok = lists.filter((r) => r.status === "fulfilled");
  if (lists.length && !ok.length) throw lists[0].reason;
  return ok.flatMap((r) => r.value.jobs || []).map((j) => ({
    id: `himalayas-${j.guid || j.applicationLink}`,
    title: j.title,
    company: j.companyName,
    logo: j.companyLogo || "",
    location: (j.locationRestrictions || []).join(", ") || "Worldwide",
    type: j.employmentType || "",
    salary: money(j.minSalary, j.maxSalary, j.currency, j.salaryPeriod),
    link: j.applicationLink || j.guid,
    description: j.description || j.excerpt,
    postedAt: toMs(j.pubDate),
    source: "himalayas",
  }));
}

const rss = new Parser({ customFields: { item: ["region", "type"] } });

async function weworkremotely() {
  const urls = list(SEARCH.weworkremotely).map((c) => `https://weworkremotely.com/categories/${c}.rss`);
  const feeds = await Promise.all(urls.map(async (u) => rss.parseString(await getText(u, HOUR))));
  return feeds.flatMap((feed) => feed.items || []).map((item) => {
    // Titles look like "Company: Job title".
    const raw = item.title || "";
    const cut = raw.indexOf(":");
    return {
      id: `wwr-${item.guid || item.link}`,
      title: cut > -1 ? raw.slice(cut + 1).trim() : raw,
      company: cut > -1 ? raw.slice(0, cut).trim() : "",
      logo: "",
      location: item.region || "Anywhere in the World",
      type: item.type || "",
      salary: "",
      link: item.link,
      description: item.content || item.contentSnippet || "",
      postedAt: toMs(item.isoDate || item.pubDate),
      source: "weworkremotely",
    };
  });
}

export const SOURCES = [
  { key: "himalayas", name: "Himalayas", site: "https://himalayas.app", fetch: himalayas },
  { key: "weworkremotely", name: "We Work Remotely", site: "https://weworkremotely.com", fetch: weworkremotely },
  { key: "remotive", name: "Remotive", site: "https://remotive.com", fetch: remotive },
  { key: "jobicy", name: "Jobicy", site: "https://jobicy.com", fetch: jobicy },
  { key: "remoteok", name: "Remote OK", site: "https://remoteok.com", fetch: remoteok },
];

export async function fetchAllSources() {
  // A board is switched off when the config gives it no searches.
  const active = SOURCES.filter((s) => (s.key === "jobicy" ? list(SEARCH.jobicy?.industries).length + list(SEARCH.jobicy?.tags).length : list(SEARCH[s.key]).length));
  const results = await Promise.allSettled(active.map((s) => s.fetch()));
  const jobs = [];
  const status = active.map((s, i) => {
    const r = results[i];
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
      return { key: s.key, name: s.name, site: s.site, ok: true, fetched: r.value.length };
    }
    console.warn(`[sources] ${s.key} failed: ${r.reason?.message}`);
    return { key: s.key, name: s.name, site: s.site, ok: false, fetched: 0, error: r.reason?.message || "failed" };
  });
  return { jobs, status };
}
