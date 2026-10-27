"use client";
// JobCard.js
// One job in the list, with quick actions for its pipeline stage.

import { PROFILES } from "../lib/profiles";
import { HOME_LABEL } from "../lib/config";
import { followUpDue, shortLocation, timeAgo } from "../lib/format";
import { Logo, ScorePill } from "./ui";

const QUICK = {
  none: [["saved", "Save"], ["hidden", "Hide"]],
  saved: [["applied", "Mark applied"], [null, "Remove"]],
  applied: [["interview", "Interviewing"], ["rejected", "Rejected"]],
  interview: [["offer", "Offer"], ["rejected", "Rejected"]],
  offer: [["rejected", "Declined"]],
  rejected: [[null, "Restore"]],
  hidden: [[null, "Restore"]],
};

export default function JobCard({ job, entry, isNew, now, sourceName, onOpen, onStatus }) {
  const status = entry?.status || "none";
  const due = followUpDue(entry, now);

  return (
    <article className={`card ${due ? "card-due" : ""}`} onClick={() => onOpen(job.id)}>
      <Logo src={job.logo} name={job.company} />
      <div className="card-main">
        <div className="card-top">
          <h3>
            <button type="button" className="link-reset" onClick={(e) => { e.stopPropagation(); onOpen(job.id); }}>
              {job.title}
            </button>
          </h3>
          {isNew && <span className="badge badge-new">New</span>}
          {due && <span className="badge badge-warn">Follow-up due</span>}
          {status === "offer" && <span className="badge badge-good">Offer</span>}
        </div>
        <p className="meta">
          <strong>{job.company || "Unknown company"}</strong>
          <span>{shortLocation(job.location)}</span>
          {job.type && <span>{job.type}</span>}
          {job.salary && <span>{job.salary}</span>}
        </p>
        <div className="chips">
          <span className="chip chip-profile">{PROFILES[job.profile]?.label}</span>
          {job.eligibility === "home" && <span className="chip chip-good">{HOME_LABEL} OK</span>}
          {job.eligibility === "restricted" && <span className="chip chip-muted">Location restricted</span>}
          {entry?.appliedAt ? <span className="chip chip-ghost">Applied {timeAgo(entry.appliedAt, now)}</span> : job.postedAt ? <span className="chip chip-ghost">Posted {timeAgo(job.postedAt, now)}</span> : null}
          {sourceName && <span className="chip chip-ghost">via {sourceName}</span>}
        </div>
      </div>
      <div className="card-side" onClick={(e) => e.stopPropagation()}>
        <ScorePill score={job.score} />
        <div className="card-actions">
          {QUICK[status].map(([next, label]) => (
            <button key={label} type="button" className="btn btn-ghost btn-sm" onClick={() => onStatus(job, next)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
