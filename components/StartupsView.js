"use client";
// StartupsView.js
// Startups to cold DM: a ranked list from /api/startups, links for finding
// the founders, a filled-in DM, and tracking (contacted, replied, follow-up).
// Outreach state is kept in this browser by the dashboard (djp.outreach.v1).

import { useCallback, useEffect, useMemo, useState } from "react";
import { DAY, FOLLOW_UP_DAYS, fill, shortDate, timeAgo } from "../lib/format";
import { HOME_LABEL } from "../lib/config";
import { CopyButton, Logo, Modal, ScorePill } from "./ui";

const TABS = [
  { key: "new", label: "To contact" },
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "skipped", label: "Skipped" },
];

function dmDue(entry, now) {
  return Boolean(entry && entry.status === "contacted" && entry.contactedAt && !entry.followedUpAt && now - entry.contactedAt >= FOLLOW_UP_DAYS * DAY);
}

function message(template, startup, kit) {
  let t = String(template || "");
  if (!startup.oneLiner) t = t.replace(/\s*\(\{oneLiner\}\)/g, "");
  return fill(t, { company: startup.name, oneLiner: startup.oneLiner, name: kit.name, portfolio: kit.portfolio });
}

function contactLinks(s) {
  const q = encodeURIComponent;
  return [
    ["Founders on YC", s.ycUrl, "Profile lists the founders, often with their LinkedIn and X"],
    ["Find founders on LinkedIn", `https://www.linkedin.com/search/results/people/?keywords=${q(`${s.name} founder`)}`, "People search for the founders"],
    ["Find them on X", `https://x.com/search?q=${q(s.name)}&f=user`, "Company and founder accounts"],
    ["Website", s.website, "Look for a contact or careers page"],
    ["Open roles on YC", `${s.ycUrl}/jobs`, "Their YC job posts, if any"],
  ];
}

export default function StartupsView({ kit, outreach, setOutreach, onOpenSettings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState("new");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [nearOnly, setNearOnly] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/startups");
      if (res.status === 401) {
        window.location.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`The startup list returned ${res.status}.`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || "Couldn't load startups.");
    } finally {
      setNow(Date.now());
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const liveById = useMemo(() => new Map((data?.startups || []).map((s) => [s.id, s])), [data]);

  const lists = useMemo(() => {
    const out = { new: (data?.startups || []).filter((s) => !outreach[s.id]) };
    for (const key of ["contacted", "replied", "skipped"]) {
      out[key] = Object.entries(outreach)
        .filter(([, e]) => e.status === key)
        .map(([id, e]) => ({ ...e.startup, ...(liveById.get(id) || {}), id }))
        .sort((a, b) => Number(dmDue(outreach[b.id], now)) - Number(dmDue(outreach[a.id], now)) || outreach[b.id].updatedAt - outreach[a.id].updatedAt);
    }
    return out;
  }, [data, outreach, liveById, now]);

  const industries = useMemo(() => [...new Set((data?.startups || []).map((s) => s.industry).filter(Boolean))].sort(), [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists[tab].filter((s) => {
      if (industry !== "all" && s.industry !== industry) return false;
      if (nearOnly && !s.remote && !s.why?.home) return false;
      if (q && !`${s.name} ${s.oneLiner} ${s.location} ${(s.tags || []).join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lists, tab, industry, nearOnly, query]);

  const stats = useMemo(() => {
    const entries = Object.values(outreach);
    return {
      toContact: lists.new.length,
      week: entries.filter((e) => e.contactedAt && now - e.contactedAt < 7 * DAY).length,
      contacted: entries.filter((e) => e.contactedAt).length,
      due: entries.filter((e) => dmDue(e, now)).length,
      replied: entries.filter((e) => e.status === "replied").length,
    };
  }, [outreach, lists, now]);

  const setStatus = useCallback((startup, status) => {
    setOutreach((prev) => {
      if (!status) {
        const { [startup.id]: _removed, ...rest } = prev;
        return rest;
      }
      const cur = prev[startup.id];
      const t = Date.now();
      return {
        ...prev,
        [startup.id]: {
          ...cur,
          startup,
          status,
          contactedAt: status === "skipped" ? cur?.contactedAt : cur?.contactedAt ?? t,
          updatedAt: t,
        },
      };
    });
  }, [setOutreach]);

  const update = useCallback((id, patch) => {
    setOutreach((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch, updatedAt: Date.now() } } : prev));
  }, [setOutreach]);

  const open = openId ? liveById.get(openId) || outreach[openId]?.startup : null;

  return (
    <>
      <section className="stats stats-5" aria-label="Outreach summary">
        <Stat label="To contact" value={stats.toContact} hint="hiring startups, best fit first" onClick={() => setTab("new")} />
        <Stat label="DMs sent" value={stats.contacted} hint={`${stats.week} this week`} onClick={() => setTab("contacted")} />
        <Stat label="Follow-ups due" value={stats.due} hint={`no reply after ${FOLLOW_UP_DAYS}+ days`} tone={stats.due ? "warn" : ""} onClick={() => setTab("contacted")} />
        <Stat label="Replied" value={stats.replied} hint="conversations started" onClick={() => setTab("replied")} />
        <Stat label="Updated" value={data ? timeAgo(data.fetchedAt, now) : "…"} hint="YC directory, refreshed every 6h" onClick={load} />
      </section>

      <nav className="tabs" aria-label="Outreach stages">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
            {t.label} <span className="count">{lists[t.key].length}</span>
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <input className="search" type="search" placeholder="Search name, product or tag" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Industry">
          <option value="all">All industries</option>
          {industries.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={nearOnly} onChange={(e) => setNearOnly(e.target.checked)} />
          {HOME_LABEL ? `Remote or ${HOME_LABEL} only` : "Remote only"}
        </label>
      </div>

      {error && <div className="notice notice-warn">{error} <button type="button" className="link-btn" onClick={load}>Try again</button></div>}

      <main className="list">
        {loading && !data && Array.from({ length: 5 }, (_, i) => <div key={i} className="card skeleton" />)}
        {visible.map((s) => (
          <StartupCard key={s.id} startup={s} entry={outreach[s.id]} now={now} onOpen={setOpenId} onStatus={setStatus} />
        ))}
        {data && visible.length === 0 && (
          <div className="empty">
            {lists[tab].length ? "Nothing matches your search." : tab === "new" ? "You've been through the whole list. New startups appear as the directory updates." : "Nothing here yet."}
          </div>
        )}
      </main>

      <footer className="foot">
        <p>
          Startups from the open <a href="https://yc-oss.github.io/api/" target="_blank" rel="noopener noreferrer">Y Combinator directory</a>, limited to active, hiring teams.
          Your outreach is saved in this browser; export a backup from Settings.
        </p>
      </footer>

      {open && (
        <StartupPanel
          key={open.id}
          startup={open}
          entry={outreach[open.id]}
          kit={kit}
          now={now}
          onClose={() => setOpenId(null)}
          onStatus={setStatus}
          onUpdate={update}
          onOpenSettings={onOpenSettings}
        />
      )}
    </>
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

const QUICK = {
  none: [["contacted", "Mark DM sent"], ["skipped", "Skip"]],
  contacted: [["replied", "Replied"], ["skipped", "No reply"]],
  replied: [[null, "Remove"]],
  skipped: [[null, "Restore"]],
};

function StartupCard({ startup: s, entry, now, onOpen, onStatus }) {
  const status = entry?.status || "none";
  const due = dmDue(entry, now);
  return (
    <article className={`card ${due ? "card-due" : ""}`} onClick={() => onOpen(s.id)}>
      <Logo src={s.logo} name={s.name} />
      <div className="card-main">
        <div className="card-top">
          <h3>
            <button type="button" className="link-reset" onClick={(e) => { e.stopPropagation(); onOpen(s.id); }}>{s.name}</button>
          </h3>
          {due && <span className="badge badge-warn">Follow-up due</span>}
          {status === "replied" && <span className="badge badge-good">Replied</span>}
        </div>
        <p className="meta"><span>{s.oneLiner || s.industry}</span></p>
        <div className="chips">
          <span className="chip chip-profile">{s.teamSize} {s.teamSize === 1 ? "person" : "people"}</span>
          {s.batch && <span className="chip chip-ghost">YC {s.batch}</span>}
          {s.why?.home && <span className="chip chip-good">{HOME_LABEL}</span>}
          {s.remote && <span className="chip chip-good">Remote</span>}
          {s.location && <span className="chip chip-ghost">{s.location.split(";")[0]}</span>}
          {entry?.contactedAt && status !== "skipped" && <span className="chip chip-ghost">DM sent {timeAgo(entry.contactedAt, now)}</span>}
        </div>
      </div>
      <div className="card-side" onClick={(e) => e.stopPropagation()}>
        <ScorePill score={s.score} />
        <div className="card-actions">
          {QUICK[status].map(([next, label]) => (
            <button key={label} type="button" className="btn btn-ghost btn-sm" onClick={() => onStatus(s, next)}>{label}</button>
          ))}
        </div>
      </div>
    </article>
  );
}

function StartupPanel({ startup: s, entry, kit, now, onClose, onStatus, onUpdate, onOpenSettings }) {
  const [dm, setDm] = useState(() => message(kit.dm, s, kit));
  useEffect(() => { setDm(message(kit.dm, s, kit)); }, [kit, s]);

  const status = entry?.status;
  const due = dmDue(entry, now);
  const why = s.why || {};

  return (
    <Modal onClose={onClose} wide label={s.name}>
      <header className="panel-head">
        <Logo src={s.logo} name={s.name} size={52} />
        <div className="panel-title">
          <h2>{s.name}</h2>
          <p className="meta">
            <span>{s.oneLiner}</span>
          </p>
          <p className="meta">
            <span>{s.teamSize} people</span>
            {s.batch && <span>YC {s.batch}</span>}
            {s.industry && <span>{s.industry}</span>}
            {s.location && <span>{s.location}</span>}
          </p>
        </div>
        <ScorePill score={s.score} large />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <div className="panel-actions">
        <a className="btn btn-primary" href={s.ycUrl} target="_blank" rel="noopener noreferrer">Find the founders ↗</a>
        {(!status || status === "skipped") && <button type="button" className="btn" onClick={() => onStatus(s, "contacted")}>Mark DM sent</button>}
        {status === "contacted" && <button type="button" className="btn" onClick={() => onStatus(s, "replied")}>They replied</button>}
        {!status && <button type="button" className="btn btn-ghost" onClick={() => { onStatus(s, "skipped"); onClose(); }}>Skip</button>}
        {status && <button type="button" className="btn btn-ghost" onClick={() => onStatus(s, null)}>Reset</button>}
      </div>

      {entry?.contactedAt && status !== "skipped" && (
        <div className={`notice ${due ? "notice-warn" : ""}`}>
          <div>
            <strong>DM sent {shortDate(entry.contactedAt)}</strong> ({timeAgo(entry.contactedAt, now)}).
            {status === "replied" ? " They replied. Nice work." : entry.followedUpAt ? ` Followed up ${shortDate(entry.followedUpAt)}.` : due ? " No reply yet: time for one short follow-up." : ` A follow-up reminder appears after ${FOLLOW_UP_DAYS} days.`}
          </div>
          {status === "contacted" && !entry.followedUpAt && (
            <div className="notice-actions">
              <CopyButton text={message(kit.dmFollowUp, s, kit)} label="Copy follow-up" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUpdate(s.id, { followedUpAt: Date.now() })}>Mark followed up</button>
            </div>
          )}
        </div>
      )}

      <div className="panel-body">
        <section className="panel-desc">
          <h4>Why it&apos;s a good fit ({s.score})</h4>
          <ul className="why">
            <li>Team of {s.teamSize} (+{why.team || 0}): small teams often have no designer yet</li>
            {why.batch ? <li>Recent YC batch, {s.batch} (+{why.batch})</li> : null}
            {why.home ? <li>Based in or hiring from {HOME_LABEL} (+20)</li> : why.remote ? <li>Hires remotely (+12)</li> : <li>No remote hiring listed: check before reaching out</li>}
            {why.industry ? <li>{s.industry} is one of your industries (+10)</li> : null}
            {why.keywords?.length ? <li>Product mentions {why.keywords.join(", ")} (+{Math.min(20, why.keywords.length * 5)})</li> : null}
          </ul>

          <h4>About</h4>
          <div className="desc">{s.description || s.oneLiner}</div>

          <h4 className="spaced">Where to reach them</h4>
          <ul className="links">
            {contactLinks(s).map(([label, href, hint]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>
                <span className="muted"> {hint}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="panel-kit">
          <div className="kit-head">
            <h4>Your DM</h4>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSettings}>Edit template</button>
          </div>
          <div className="cover">
            <div className="field-head">
              <span>Message</span>
              <CopyButton text={dm} />
            </div>
            <textarea value={dm} onChange={(e) => setDm(e.target.value)} rows={13} />
          </div>
          <p className="muted tip">
            Tip: send it to a founder on LinkedIn or X, not a generic inbox. Open the YC profile to see who they are, add one detail about their product, and keep it under 100 words.
          </p>
          <div className="notes">
            <div className="field-head"><span>Notes</span></div>
            {entry ? (
              <textarea value={entry.note || ""} onChange={(e) => onUpdate(s.id, { note: e.target.value })} rows={3} placeholder="Founder name, where you messaged them, what they said…" />
            ) : (
              <p className="muted">Mark the DM as sent to keep notes on it.</p>
            )}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
