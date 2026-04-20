import { NextRequest, NextResponse } from "next/server";
import { fetchWorkflows } from "@/lib/github";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-github-token");
  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: "Missing token, owner, or repo" },
      { status: 400 }
    );
  }

  try {
    const workflows = await fetchWorkflows(token, owner, repo);
    return NextResponse.json({ workflows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
