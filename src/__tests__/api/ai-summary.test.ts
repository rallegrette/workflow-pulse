import { POST } from "@/app/api/ai/summary/route";
import { NextRequest } from "next/server";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "# Health Grade: A\n\nGreat pipeline" } }],
          model: "gpt-4o-mini",
          usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
        }),
      },
    },
  }));
});

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/ai/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  repoFullName: "test/repo",
  totalRuns: 100,
  successRate: 92.5,
  failureRate: 7.5,
  avgDurationSeconds: 120,
  p95DurationSeconds: 300,
  topFailingWorkflows: [],
  anomalies: [],
  flakyWorkflows: [],
  mttrSeconds: 600,
  failureStreaks: [],
};

describe("POST /api/ai/summary", () => {
  it("returns 400 when OpenAI key is missing", async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns summary on success", async () => {
    const req = makeRequest(validBody, { "x-openai-key": "sk-test" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.summary).toContain("Health Grade");
    expect(body.model).toBe("gpt-4o-mini");
  });
});
