// POST /api/login  { email, password }
// Checks the credentials from the environment and sets the session cookie.

import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_DAYS, SIGNED_IN_COOKIE, authConfig, createSession, safeEqual } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const cfg = authConfig();
  if (!cfg) return NextResponse.json({ ok: true });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // treated as empty credentials below
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  // Check both, so a wrong email takes as long as a wrong password.
  const emailOk = safeEqual(email, cfg.email);
  const passwordOk = safeEqual(password, cfg.password);
  if (!emailOk || !passwordOk) {
    // A short pause makes guessing slower.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const cookie = { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_DAYS * 86400 };
  res.cookies.set(SESSION_COOKIE, await createSession(cfg), { ...cookie, httpOnly: true });
  res.cookies.set(SIGNED_IN_COOKIE, "1", cookie);
  return res;
}
