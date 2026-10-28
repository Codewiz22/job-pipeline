// GET /api/startups
// Ranked startups for cold outreach. The trimmed list is cached for 6 hours;
// the full directory is too big for Next's fetch cache.

import { unstable_cache } from "next/cache";
import { buildStartups } from "../../../lib/startups.js";

const cachedStartups = unstable_cache(buildStartups, ["startups-v1"], { revalidate: 21600 });

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return Response.json(await cachedStartups());
}
