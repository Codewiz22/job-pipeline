"use client";
// JobPanel.js
// Full job view: description, why it scored what it did, pipeline stage,
// notes, and the Apply kit (cover note plus copyable details).

import { useEffect, useState } from "react";
import { PROFILES, PROFILE_KEYS } from "../lib/profiles";
import { HOME_LABEL } from "../lib/config";
import { FOLLOW_UP_DAYS, fill, followUpDue, shortDate, shortLocation, timeAgo } from "../lib/format";
import { CopyButton, Logo, Modal, ScorePill } from "./ui";

const STAGES = [
  ["saved", "Saved"],
  ["applied", "Applied"],
  ["interview", "Interviewing"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["hidden", "Hidden"],
];

const LOCATION_TEXT = {
  home: `names ${HOME_LABEL || "your region"} (+15)`,
  listed: "names specific places; check you can apply (+0)",
  open: "open worldwide (+12)",
  restricted: "limited to other regions (-25)",
};

const KIT_FIELDS = [
  ["name", "Full name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["portfolio", "Portfolio"],
  ["otherLink", "Other link"],
  ["linkedin", "LinkedIn"],
  ["rightToWork", "Right to work"],
  ["availability", "Availability"],
  ["salary", "Salary expectation"],
];

export default function JobPanel({ job, entry, kit, now, source, onClose, onStatus, onUpdate, onOpenSettings }) {
  const [profile, setProfile] = useState(job.profile);
  const vars = {
    company: job.company || "hiring",
    title: job.title,
    name: kit.name,
    portfolio: kit.portfolio,
    appliedDate: shortDate(entry?.appliedAt),
  };
  const [cover, setCover] = useState(() => fill(kit.pitches[job.profile], vars));

  useEffect(() => {
    setCover(fill(kit.pitches[profile], vars));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, kit]);

  const status = entry?.status;
  const due = followUpDue(entry, now);
  const why = job.why || {};

  function openApplication() {
    window.open(job.link, "_blank", "noopener,noreferrer");
    if (!status) onStatus(job, "saved");
  }

  return (
    <Modal onClose={onClose} wide label={job.title}>
      <header className="panel-head">
        <Logo src={job.logo} name={job.company} size={52} />
        <div className="panel-title">
          <h2>{job.title}</h2>
          <p className="meta">
            <strong>{job.company}</strong>
            <span>{shortLocation(job.location)}</span>
            {job.type && <span>{job.type}</span>}
            {job.salary && <span>{job.salary}</span>}
            {job.postedAt ? <span>Posted {timeAgo(job.postedAt, now)}</span> : null}
          </p>
        </div>
        <ScorePill score={job.score} large />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <div className="panel-actions">
        <button type="button" className="btn btn-primary" onClick={openApplication}>Open application ↗</button>
        {(!status || status === "saved") && (
          <button type="button" className="btn" onClick={() => onStatus(job, "applied")}>Mark applied</button>
        )}
        {!status && <button type="button" className="btn btn-ghost" onClick={() => onStatus(job, "saved")}>Save</button>}
        {status && (
          <label className="stage">
            <span>Stage</span>
            <select value={status} onChange={(e) => onStatus(job, e.target.value)}>
              {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        {status && <button type="button" className="btn btn-ghost" onClick={() => onStatus(job, null)}>Remove from pipeline</button>}
        {!status && <button type="button" className="btn btn-ghost" onClick={() => { onStatus(job, "hidden"); onClose(); }}>Hide</button>}
      </div>

      {entry?.appliedAt && (
        <div className={`notice ${due ? "notice-warn" : ""}`}>
          <div>
            <strong>Applied {shortDate(entry.appliedAt)}</strong> ({timeAgo(entry.appliedAt, now)}).
            {entry.followedUpAt ? ` Followed up ${shortDate(entry.followedUpAt)}.` : due ? " Time to follow up." : ` A follow-up reminder appears after ${FOLLOW_UP_DAYS} days.`}
          </div>
          {status === "applied" && !entry.followedUpAt && (
            <div className="notice-actions">
              <CopyButton text={fill(kit.followUp, vars)} label="Copy follow-up" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onUpdate(job.id, { followedUpAt: Date.now() })}>Mark followed up</button>
            </div>
          )}
        </div>
      )}

      <div className="panel-body">
        <section className="panel-desc">
          <h4>Why it scored {job.score}</h4>
          <ul className="why">
            <li>Title matches <b>{PROFILES[job.profile]?.label}</b> work (+{why.title || 0})</li>
            <li>{why.skills?.length ? <>Mentions {why.skills.join(", ")} (+{Math.min(35, why.skills.length * 5)})</> : "No profile skills mentioned (+0)"}</li>
            <li>Location {LOCATION_TEXT[why.location] || "unknown"}</li>
            {why.fresh ? <li>{why.fresh > 0 ? `Recently posted (+${why.fresh})` : `Older posting (${why.fresh})`}</li> : null}
            {why.seniority ? <li>Director or manager-level title ({why.seniority})</li> : null}
          </ul>

          <h4>About the role</h4>
          <div className="desc">{job.text || "No description in the feed. Open the application to read it."}</div>
          {source && (
            <p className="attribution">
              Listing via <a href={source.site} target="_blank" rel="noopener noreferrer">{source.name}</a>
            </p>
          )}
        </section>

        <aside className="panel-kit">
          <div className="kit-head">
            <h4>Apply kit</h4>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSettings}>Edit details</button>
          </div>

          <div className="segmented" role="tablist" aria-label="Cover note style">
            {PROFILE_KEYS.map((k) => (
              <button key={k} type="button" role="tab" aria-selected={profile === k} className={profile === k ? "on" : ""} onClick={() => setProfile(k)}>
                {PROFILES[k].label}
              </button>
            ))}
          </div>

          <div className="cover">
            <div className="field-head">
              <span>Cover note</span>
              <CopyButton text={cover} />
            </div>
            <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={11} />
          </div>

          <dl className="kit-fields">
            {KIT_FIELDS.map(([key, label]) => (
              <div key={key} className="kit-row">
                <dt>{label}</dt>
                <dd>{kit[key] ? kit[key] : <button type="button" className="link-btn" onClick={onOpenSettings}>Add in Settings</button>}</dd>
                <CopyButton text={kit[key]} />
              </div>
            ))}
          </dl>

          <div className="notes">
            <div className="field-head"><span>Notes</span></div>
            {entry ? (
              <textarea value={entry.note || ""} onChange={(e) => onUpdate(job.id, { note: e.target.value })} rows={3} placeholder="Recruiter name, salary range, interview dates…" />
            ) : (
              <p className="muted">Save the job to keep notes on it.</p>
            )}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
