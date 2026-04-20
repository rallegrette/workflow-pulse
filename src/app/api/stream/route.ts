import { NextRequest } from "next/server";
import { fetchAllRecentRuns } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-github-token");
  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");
  const intervalParam = req.nextUrl.searchParams.get("interval");

  if (!token || !owner || !repo) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const intervalMs = Math.max(30000, Number(intervalParam) || 60000);
  let lastRunId: number | null = null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const poll = async () => {
        try {
          const runs = await fetchAllRecentRuns(token, owner, repo, 3);
          const latestId = runs[0]?.id ?? null;

          if (lastRunId === null || latestId !== lastRunId) {
            send("runs", { runs, timestamp: new Date().toISOString() });
            lastRunId = latestId;
          } else {
            send("heartbeat", { timestamp: new Date().toISOString() });
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Fetch error";
          send("error", { error: message });
        }
      };

      await poll();

      const timer = setInterval(poll, intervalMs);

      req.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
