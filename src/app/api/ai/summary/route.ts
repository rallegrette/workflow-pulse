import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface SummaryRequest {
  repoFullName: string;
  totalRuns: number;
  successRate: number;
  failureRate: number;
  avgDurationSeconds: number;
  p95DurationSeconds: number;
  topFailingWorkflows: { name: string; failureRate: number; totalRuns: number }[];
  anomalies: { type: string; message: string; detail: string }[];
  flakyWorkflows: { name: string; flakinessScore: number }[];
  mttrSeconds: number | null;
  failureStreaks: { workflow: string; branch: string; count: number }[];
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-openai-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key" },
      { status: 400 }
    );
  }

  const body: SummaryRequest = await req.json();
  const openai = new OpenAI({ apiKey });

  const context = `
Repository: ${body.repoFullName}
Total Runs Analyzed: ${body.totalRuns}
Success Rate: ${body.successRate.toFixed(1)}%
Failure Rate: ${body.failureRate.toFixed(1)}%
Average Duration: ${Math.round(body.avgDurationSeconds)}s
P95 Duration: ${Math.round(body.p95DurationSeconds)}s
MTTR: ${body.mttrSeconds ? `${Math.round(body.mttrSeconds / 60)} minutes` : "No recovery events"}

Top Failing Workflows:
${body.topFailingWorkflows.map((w) => `- ${w.name}: ${w.failureRate.toFixed(1)}% failure rate (${w.totalRuns} runs)`).join("\n") || "None"}

Detected Anomalies:
${body.anomalies.map((a) => `- [${a.type}] ${a.message}: ${a.detail}`).join("\n") || "None"}

Flaky Workflows:
${body.flakyWorkflows.map((f) => `- ${f.name}: flakiness score ${(f.flakinessScore * 100).toFixed(0)}%`).join("\n") || "None"}

Active Failure Streaks:
${body.failureStreaks.map((s) => `- ${s.workflow} on ${s.branch}: ${s.count} consecutive failures`).join("\n") || "None"}
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are a CI/CD health advisor providing an executive summary for engineering leadership. Be concise, data-driven, and actionable. Write in a professional but approachable tone. Use markdown. Include a health grade (A through F) at the top.`,
        },
        {
          role: "user",
          content: `Generate a pipeline health summary based on this data:\n\n${context}\n\nStructure your response as:\n1. **Health Grade** — A single letter grade with a one-line justification\n2. **Executive Summary** — 2-3 sentences on the overall state of CI/CD\n3. **Key Concerns** — Bullet list of the most important issues (if any)\n4. **What's Working Well** — Positive signals worth noting\n5. **Recommended Actions** — Top 3 prioritized next steps`,
        },
      ],
    });

    return NextResponse.json({
      summary: completion.choices[0]?.message?.content || "No summary generated",
      model: completion.model,
      usage: completion.usage,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "OpenAI API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
