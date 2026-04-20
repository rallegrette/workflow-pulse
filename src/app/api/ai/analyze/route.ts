import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface FailedRun {
  name: string;
  branch: string;
  event: string;
  created_at: string;
  conclusion: string;
  run_number: number;
}

interface AnalysisRequest {
  failedRuns: FailedRun[];
  repoFullName: string;
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-openai-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key" },
      { status: 400 }
    );
  }

  const body: AnalysisRequest = await req.json();
  const { failedRuns, repoFullName } = body;

  if (!failedRuns?.length) {
    return NextResponse.json(
      { error: "No failed runs to analyze" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const runSummaries = failedRuns.slice(0, 20).map((r) =>
    `- "${r.name}" #${r.run_number} on branch "${r.branch}" (trigger: ${r.event}, date: ${r.created_at})`
  ).join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a senior DevOps engineer analyzing CI/CD pipeline failures for the GitHub repository "${repoFullName}". Provide actionable, concise analysis. Use markdown formatting. Be specific about patterns you see.`,
        },
        {
          role: "user",
          content: `Analyze these recent GitHub Actions failures and provide insights:\n\n${runSummaries}\n\nProvide:\n1. **Pattern Analysis** — Are failures clustered on specific workflows, branches, or trigger events? What patterns do you see?\n2. **Root Cause Hypotheses** — Based on the failure patterns (workflow names, branches, timing), what are the most likely root causes?\n3. **Actionable Recommendations** — Specific steps to investigate and fix these failures, ordered by priority.\n4. **Risk Assessment** — How critical is the current failure pattern? Is it getting worse?`,
        },
      ],
    });

    return NextResponse.json({
      analysis: completion.choices[0]?.message?.content || "No analysis generated",
      model: completion.model,
      usage: completion.usage,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "OpenAI API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
