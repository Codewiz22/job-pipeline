// auth.js
// Optional login. Set LOGIN_EMAIL and LOGIN_PASSWORD (and ideally a long
// random AUTH_SECRET) in the environment to switch it on; without them the
// app stays open. Sessions are signed cookies, checked by middleware.js.
// Uses Web Crypto so it runs in Edge middleware as well as Node.

export const SESSION_COOKIE = "jp_session";
export const SIGNED_IN_COOKIE = "jp_signed_in"; // readable by the page, only shows the Log out button
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

export function authConfig() {
  const email = (process.env.LOGIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.LOGIN_PASSWORD || "").trim();
  if (!email || !password) return null;
  // Without AUTH_SECRET the key comes from the credentials, so changing the
  // password also signs everyone out.
  const secret = (process.env.AUTH_SECRET || "").trim() || `${email}:${password}`;
  return { email, password, secret };
}

export function safeEqual(a = "", b = "") {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createSession(cfg) {
  const expires = Date.now() + SESSION_DAYS * 86400000;
  return `${expires}.${await sign(cfg.secret, `${cfg.email}|${expires}`)}`;
}

export async function verifySession(cfg, token) {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!sig || !(Number(expires) > Date.now())) return false;
  return safeEqual(sig, await sign(cfg.secret, `${cfg.email}|${expires}`));
}
