"use client";
// storage.js
// State that lives in this browser's localStorage. Reads and writes are
// wrapped so the app still works when storage is blocked (private windows).

import { useEffect, useState } from "react";

export function useStored(key, initial, revive = (v) => v) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(revive(JSON.parse(raw)));
    } catch {
      // unreadable or blocked: keep the initial value
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // full or blocked: the value still lives for this session
    }
  }, [key, value, ready]);

  return [value, setValue, ready];
}
