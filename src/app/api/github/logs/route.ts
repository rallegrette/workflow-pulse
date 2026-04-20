import { NextRequest, NextResponse } from "next/server";
import { fetchRunLogsSafe } from "@/lib/github";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-github-token");
  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");
  const runId = req.nextUrl.searchParams.get("runId");

  if (!token || !owner || !repo || !runId) {
    return NextResponse.json(
      { error: "Missing token, owner, repo, or runId" },
      { status: 400 }
    );
  }

  const logs = await fetchRunLogsSafe(token, owner, repo, Number(runId));
  if (logs === null) {
    return NextResponse.json(
      { error: "Logs unavailable for this run" },
      { status: 404 }
    );
  }

  return NextResponse.json({ logs });
}
