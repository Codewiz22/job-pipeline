"use client";
// SettingsPanel.js
// Edit the Apply kit, and back up or restore everything saved in this browser.

import { useRef, useState } from "react";
import { PROFILES, PROFILE_KEYS } from "../lib/profiles";
import { DEFAULT_KIT, reviveKit } from "../lib/kit";
import { Modal } from "./ui";

const FIELDS = [
  ["name", "Full name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["portfolio", "Portfolio URL"],
  ["otherLink", "Other link (Behance, GitHub…)"],
  ["linkedin", "LinkedIn URL"],
  ["salary", "Salary expectation"],
  ["rightToWork", "Right to work", true],
  ["availability", "Availability", true],
];

export default function SettingsPanel({ kit, setKit, pipeline, setPipeline, onClose }) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");

  const set = (key, value) => setKit((k) => ({ ...k, [key]: value }));
  const setPitch = (key, value) => setKit((k) => ({ ...k, pitches: { ...k.pitches, [key]: value } }));

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), kit, pipeline }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `job-pipeline-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.pipeline && typeof data.pipeline === "object") setPipeline(data.pipeline);
      if (data.kit && typeof data.kit === "object") setKit(reviveKit(data.kit));
      setMessage(`Restored ${Object.keys(data.pipeline || {}).length} pipeline jobs from ${file.name}.`);
    } catch {
      setMessage("That file isn't a backup from this app.");
    }
  }

  return (
    <Modal onClose={onClose} wide label="Settings">
      <header className="panel-head">
        <div className="panel-title">
          <h2>Settings</h2>
          <p className="meta"><span>Your Apply kit. Saved in this browser as you type.</span></p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </header>

      <div className="settings">
        <section>
          <h4>Your details</h4>
          <div className="form-grid">
            {FIELDS.map(([key, label, long]) => (
              <label key={key} className={long ? "span-2" : ""}>
                <span>{label}</span>
                <input value={kit[key] || ""} onChange={(e) => set(key, e.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4>Cover notes</h4>
          <p className="muted">Use {"{company}"}, {"{title}"}, {"{name}"} and {"{portfolio}"}. They're filled in for each job.</p>
          {PROFILE_KEYS.map((key) => (
            <label key={key} className="block">
              <span>{PROFILES[key].label}</span>
              <textarea rows={8} value={kit.pitches[key]} onChange={(e) => setPitch(key, e.target.value)} />
            </label>
          ))}
          <label className="block">
            <span>Follow-up message (also takes {"{appliedDate}"})</span>
            <textarea rows={6} value={kit.followUp} onChange={(e) => set("followUp", e.target.value)} />
          </label>
        </section>

        <section>
          <h4>Backup</h4>
          <p className="muted">Your pipeline is stored in this browser only. Export a backup to move it to another device or keep it safe.</p>
          <div className="row-gap">
            <button type="button" className="btn" onClick={exportBackup}>Export backup</button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Import backup</button>
            <button type="button" className="btn btn-ghost" onClick={() => { if (confirm("Reset your details and cover notes to the defaults?")) setKit(DEFAULT_KIT); }}>Reset kit to defaults</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          </div>
          {message && <p className="muted">{message}</p>}
        </section>
      </div>
    </Modal>
  );
}
