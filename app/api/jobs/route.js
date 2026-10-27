// GET /api/jobs
// The scored feed for the dashboard. Rebuilt at most once an hour.

import { buildFeed } from "../../../lib/feed.js";

export const revalidate = 3600;
export const maxDuration = 60;

export async function GET() {
  const feed = await buildFeed();
  return Response.json(feed);
}
