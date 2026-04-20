import { POST } from "@/app/api/ai/analyze/route";
import { NextRequest } from "next/server";

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "## Analysis\n\nMocked analysis result" } }],
          model: "gpt-4o-mini",
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        }),
      },
    },
  }));
});

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai/analyze", () => {
  it("returns 400 when OpenAI key is missing", async () => {
    const req = makeRequest({ failedRuns: [], repoFullName: "test/repo" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing OpenAI/);
  });

  it("returns 400 when failedRuns is empty", async () => {
    const req = makeRequest(
      { failedRuns: [], repoFullName: "test/repo" },
      { "x-openai-key": "sk-test" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/No failed runs/);
  });

  it("returns analysis on success", async () => {
    const req = makeRequest(
      {
        failedRuns: [
          {
            name: "CI",
            branch: "main",
            event: "push",
            created_at: "2026-04-15T10:00:00Z",
            conclusion: "failure",
            run_number: 42,
          },
        ],
        repoFullName: "test/repo",
      },
      { "x-openai-key": "sk-test" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.analysis).toContain("Analysis");
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.usage).toBeDefined();
  });
});
