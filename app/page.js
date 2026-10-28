"use client";
// page.js
// The dashboard. The job feed comes from /api/jobs; everything you do with a
// job (save, apply, notes, follow-ups) is kept in this browser.

import { useCallback, useEffect, useMemo, useState } from "react";
import { PROFILES, PROFILE_KEYS } from "../lib/profiles";
import { DEFAULT_KIT, reviveKit } from "../lib/kit";
import { useStored } from "../lib/storage";
import config from "../lib/config";
import { DAY, FOLLOW_UP_DAYS, followUpDue, timeAgo } from "../lib/format";
import JobCard from "../components/JobCard";
import JobPanel from "../components/JobPanel";
import SettingsPanel from "../components/SettingsPanel";
import StartupsView from "../components/StartupsView";

const OUTREACH_ON = Boolean(config.outreach?.enabled);

const TABS = [
  { key: "matches", label: "Matches" },
  { key: "saved", label: "Saved", statuses: ["saved"] },
  { key: "applied", label: "Applied", statuses: ["applied"] },
  { key: "interview", label: "Interviewing", statuses: ["interview", "offer"] },
  { key: "archive", label: "Archive", statuses: ["rejected", "hidden"] },
];

const SCORE_STEPS = [0, 40, 55, 70];

// What gets kept in the pipeline, so applied jobs survive leaving the feed.
function snapshot(job) {
  const { entry, ...rest } = job;
  return rest;
}

export default function Dashboard() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const [pipeline, setPipeline] = useStored("djp.pipeline.v1", {});
  const [kit, setKit] = useStored("djp.kit.v1", DEFAULT_KIT, reviveKit);
  const [seen, setSeen, seenReady] = useStored("djp.seen.v1", {});
  const [outreach, setOutreach] = useStored("djp.outreach.v1", {});
  const [storedView, setView] = useStored("djp.view.v1", "jobs");
  const view = OUTREACH_ON ? storedView : "jobs";

  const [tab, setTab] = useState("matches");
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState("all");
  const [minScore, setMinScore] = useState(40);
  const [showRestricted, setShowRestricted] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs");
      if (res.status === 401) {
        window.location.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`The job feed returned ${res.status}.`);
      setFeed(await res.json());
    } catch (e) {
      setError(e.message || "Couldn't load jobs.");
    } finally {
      setNow(Date.now());
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The Log out button only shows when the login is switched on.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(/(?:^|;\s*)jp_signed_in=1/.test(document.cookie)); }, []);
  async function logOut() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.location.replace("/login");
  }

  // Remember when each job was first seen, to badge new ones for a day. On the
  // very first visit nothing is marked new.
  useEffect(() => {
    if (!feed || !seenReady) return;
    setSeen((prev) => {
      const first = Object.keys(prev).length === 0;
      const t = Date.now();
      const next = {};
      for (const j of feed.jobs) next[j.id] = prev[j.id] ?? (first ? 0 : t);
      return next;
    });
  }, [feed, seenReady, setSeen]);

  const liveById = useMemo(() => new Map((feed?.jobs || []).map((j) => [j.id, j])), [feed]);
  const sourceByKey = useMemo(() => Object.fromEntries((feed?.sources || []).map((s) => [s.key, s])), [feed]);

  const lists = useMemo(() => {
    const out = { matches: (feed?.jobs || []).filter((j) => !pipeline[j.id]) };
    for (const t of TABS.filter((t) => t.statuses)) {
      out[t.key] = Object.entries(pipeline)
        .filter(([, e]) => t.statuses.includes(e.status))
        .map(([id, e]) => ({ ...e.job, ...(liveById.get(id) || {}), id, entry: e }))
        .sort((a, b) => Number(followUpDue(b.entry, now)) - Number(followUpDue(a.entry, now)) || b.entry.updatedAt - a.entry.updatedAt);
    }
    return out;
  }, [feed, pipeline, liveById, now]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists[tab].filter((j) => {
      if (profile !== "all" && j.profile !== profile) return false;
      if (q && !`${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q)) return false;
      if (tab === "matches") {
        if (j.score < minScore) return false;
        if (!showRestricted && j.eligibility === "restricted") return false;
      }
      return true;
    });
  }, [lists, tab, profile, query, minScore, showRestricted]);

  const stats = useMemo(() => {
    const entries = Object.values(pipeline);
    const strong = lists.matches.filter((j) => j.score >= 70 && j.eligibility !== "restricted").length;
    const fresh = lists.matches.filter((j) => seen[j.id] && now - seen[j.id] < DAY).length;
    return {
      strong,
      fresh,
      saved: entries.filter((e) => e.status === "saved").length,
      appliedWeek: entries.filter((e) => e.appliedAt && now - e.appliedAt < 7 * DAY).length,
      applied: entries.filter((e) => e.appliedAt).length,
      due: entries.filter((e) => followUpDue(e, now)).length,
      interviews: entries.filter((e) => e.status === "interview" || e.status === "offer").length,
    };
  }, [pipeline, lists, seen, now]);

  const setStatus = useCallback((job, status) => {
    setPipeline((prev) => {
      if (!status) {
        const { [job.id]: _removed, ...rest } = prev;
        return rest;
      }
      const cur = prev[job.id];
      const t = Date.now();
      return {
        ...prev,
        [job.id]: {
          ...cur,
          job: snapshot(job),
          status,
          savedAt: cur?.savedAt ?? t,
          appliedAt: ["applied", "interview", "offer"].includes(status) ? cur?.appliedAt ?? t : cur?.appliedAt,
          updatedAt: t,
        },
      };
    });
  }, [setPipeline]);

  const updateEntry = useCallback((id, patch) => {
    setPipeline((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch, updatedAt: Date.now() } } : prev));
  }, [setPipeline]);

  const openJob = openId ? liveById.get(openId) || pipeline[openId]?.job : null;
  const counts = Object.fromEntries(TABS.map((t) => [t.key, lists[t.key].length]));
  const failed = (feed?.sources || []).filter((s) => !s.ok);

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">◆</span>
          <div>
            <h1>{config.appName}</h1>
            <p>{config.tagline}</p>
          </div>
        </div>
        <div className="top-actions">
          {view === "jobs" && (
            <>
              <span className="updated">{feed ? `Feed updated ${timeAgo(feed.fetchedAt, now)}` : loading ? "Loading jobs…" : ""}</span>
              <button type="button" className="btn" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
            </>
          )}
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>Settings</button>
          {signedIn && <button type="button" className="btn btn-ghost" onClick={logOut}>Log out</button>}
        </div>
      </header>

      {OUTREACH_ON && (
        <nav className="views segmented" aria-label="Sections">
          <button type="button" className={view === "jobs" ? "on" : ""} onClick={() => setView("jobs")}>Jobs</button>
          <button type="button" className={view === "startups" ? "on" : ""} onClick={() => setView("startups")}>Startups to DM</button>
        </nav>
      )}

      {view === "startups" ? (
        <StartupsView kit={kit} outreach={outreach} setOutreach={setOutreach} onOpenSettings={() => setSettingsOpen(true)} />
      ) : (
      <>
      <section className="stats" aria-label="Summary">
        <Stat label="Strong matches" value={stats.strong} hint="score 70+ you can apply to" onClick={() => { setTab("matches"); setMinScore(70); }} />
        <Stat label="New today" value={stats.fresh} hint="first seen in the last 24h" onClick={() => setTab("matches")} />
        <Stat label="Saved" value={stats.saved} hint="waiting for you to apply" onClick={() => setTab("saved")} />
        <Stat label="Applied" value={stats.applied} hint={`${stats.appliedWeek} this week`} onClick={() => setTab("applied")} />
        <Stat label="Follow-ups due" value={stats.due} hint={`applied ${FOLLOW_UP_DAYS}+ days ago`} tone={stats.due ? "warn" : ""} onClick={() => setTab("applied")} />
        <Stat label="Interviewing" value={stats.interviews} hint="including offers" onClick={() => setTab("interview")} />
      </section>

      <nav className="tabs" aria-label="Pipeline stages">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label} <span className="count">{counts[t.key]}</span>
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <input className="search" type="search" placeholder="Search title, company or location" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={profile} onChange={(e) => setProfile(e.target.value)} aria-label="Profile">
          <option value="all">All profiles</option>
          {PROFILE_KEYS.map((k) => <option key={k} value={k}>{PROFILES[k].label}</option>)}
        </select>
        {tab === "matches" && (
          <>
            <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} aria-label="Minimum score">
              {SCORE_STEPS.map((s) => <option key={s} value={s}>{s ? `Score ${s}+` : "Any score"}</option>)}
            </select>
            <label className="check">
              <input type="checkbox" checked={showRestricted} onChange={(e) => setShowRestricted(e.target.checked)} />
              Show location-restricted
            </label>
          </>
        )}
      </div>

      {error && <div className="notice notice-warn">{error} <button type="button" className="link-btn" onClick={load}>Try again</button></div>}
      {failed.length > 0 && !error && (
        <div className="notice">Couldn&apos;t reach {failed.map((s) => s.name).join(", ")} this time. Showing jobs from the other boards.</div>
      )}

      <main className="list">
        {loading && !feed && Array.from({ length: 5 }, (_, i) => <div key={i} className="card skeleton" />)}
        {!loading || feed ? visible.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            entry={pipeline[job.id]}
            isNew={tab === "matches" && Boolean(seen[job.id]) && now - seen[job.id] < DAY}
            now={now}
            sourceName={sourceByKey[job.source]?.name}
            onOpen={setOpenId}
            onStatus={setStatus}
          />
        )) : null}
        {feed && visible.length === 0 && <Empty tab={tab} filtered={lists[tab].length > 0} />}
      </main>

      <footer className="foot">
        <p>
          Jobs from{" "}
          {(feed?.sources || []).map((s, i, all) => (
            <span key={s.key}>
              <a href={s.site} target="_blank" rel="noopener noreferrer">{s.name}</a>
              <span className="muted"> ({s.ok ? s.kept : "offline"})</span>
              {i < all.length - 2 ? ", " : i === all.length - 2 ? " and " : ""}
            </span>
          ))}
          . Your pipeline is saved in this browser; export a backup from Settings.
        </p>
      </footer>
      </>
      )}

      {openJob && (
        <JobPanel
          key={openJob.id}
          job={openJob}
          entry={pipeline[openJob.id]}
          kit={kit}
          now={now}
          source={sourceByKey[openJob.source]}
          onClose={() => setOpenId(null)}
          onStatus={setStatus}
          onUpdate={updateEntry}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {settingsOpen && (
        <SettingsPanel kit={kit} setKit={setKit} pipeline={pipeline} setPipeline={setPipeline} outreach={outreach} setOutreach={setOutreach} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

function Stat({ label, value, hint, tone = "", onClick }) {
  return (
    <button type="button" className={`stat ${tone ? `stat-${tone}` : ""}`} onClick={onClick}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-hint">{hint}</span>
    </button>
  );
}

const EMPTY = {
  matches: "No matches with these filters. Lower the minimum score or show location-restricted roles.",
  saved: "Nothing saved yet. Save jobs from Matches to shortlist them.",
  applied: "No applications yet. Open a job, apply, then click Mark applied.",
  interview: "No interviews yet. Move a job here from Applied when you hear back.",
  archive: "Hidden and rejected jobs land here. Restore any of them at any time.",
};

function Empty({ tab, filtered }) {
  return <div className="empty">{filtered ? "Nothing matches your search." : EMPTY[tab]}</div>;
}
