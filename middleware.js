// middleware.js
// When login is switched on (see lib/auth.js), every page and API request
// needs a valid session. Pages redirect to /login; API calls get a 401.

import { NextResponse } from "next/server";
import { SESSION_COOKIE, authConfig, verifySession } from "./lib/auth";

export async function middleware(request) {
  const cfg = authConfig();
  if (!cfg) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signedIn = await verifySession(cfg, request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (pathname === "/api/login" || signedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

// Everything except Next's static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
