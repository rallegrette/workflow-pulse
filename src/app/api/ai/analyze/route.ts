import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface FailedRun {
  name: string;
  branch: string;
  event: string;
  created_at: string;
  conclusion: string;
  run_number: number;
  logs?: string | null;
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

  const hasLogs = failedRuns.some((r) => r.logs);

  const runSummaries = failedRuns.slice(0, 20).map((r) => {
    let entry = `- "${r.name}" #${r.run_number} on branch "${r.branch}" (trigger: ${r.event}, date: ${r.created_at})`;
    if (r.logs) {
      entry += `\n  Log output (last ~12KB):\n  \`\`\`\n${r.logs.slice(0, 6000)}\n  \`\`\``;
    }
    return entry;
  }).join("\n");

  const systemPrompt = hasLogs
    ? `You are a senior DevOps engineer analyzing CI/CD pipeline failures for "${repoFullName}". You have access to the actual workflow log output. Analyze the logs to identify the exact errors, stack traces, and root causes. Be specific — reference exact error messages, file names, and line numbers from the logs. Use markdown formatting.`
    : `You are a senior DevOps engineer analyzing CI/CD pipeline failures for the GitHub repository "${repoFullName}". Provide actionable, concise analysis. Use markdown formatting. Be specific about patterns you see.`;

  const userPrompt = hasLogs
    ? `Analyze these GitHub Actions failures using the attached log output:\n\n${runSummaries}\n\nProvide:\n1. **Exact Errors Found** — Quote the specific error messages and stack traces from the logs\n2. **Root Cause Analysis** — What exactly is failing and why, based on the log evidence\n3. **Fix Recommendations** — Specific, actionable steps to fix each failure, referencing the exact errors\n4. **Pattern Analysis** — Are the same errors repeating across runs? Is it a flaky test, dependency issue, config problem, etc.?`
    : `Analyze these recent GitHub Actions failures and provide insights:\n\n${runSummaries}\n\nProvide:\n1. **Pattern Analysis** — Are failures clustered on specific workflows, branches, or trigger events? What patterns do you see?\n2. **Root Cause Hypotheses** — Based on the failure patterns (workflow names, branches, timing), what are the most likely root causes?\n3. **Actionable Recommendations** — Specific steps to investigate and fix these failures, ordered by priority.\n4. **Risk Assessment** — How critical is the current failure pattern? Is it getting worse?`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return NextResponse.json({
      analysis: completion.choices[0]?.message?.content || "No analysis generated",
      model: completion.model,
      usage: completion.usage,
      hasLogs,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "OpenAI API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
