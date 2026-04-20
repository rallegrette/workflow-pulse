import { GET } from "@/app/api/github/workflows/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/github", () => ({
  fetchWorkflows: jest.fn(),
}));

import { fetchWorkflows } from "@/lib/github";
const mockFetch = fetchWorkflows as jest.MockedFunction<typeof fetchWorkflows>;

function makeRequest(params: Record<string, string>, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/github/workflows");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { headers });
}

describe("GET /api/github/workflows", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns 400 when params are missing", async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns workflows on success", async () => {
    const fakeWorkflows = [{ id: 1, name: "CI", path: ".github/workflows/ci.yml", state: "active" }];
    mockFetch.mockResolvedValue(fakeWorkflows);

    const req = makeRequest(
      { owner: "test", repo: "repo" },
      { "x-github-token": "ghp_token" }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.workflows).toEqual(fakeWorkflows);
  });

  it("returns 502 on upstream error", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));
    const req = makeRequest(
      { owner: "test", repo: "repo" },
      { "x-github-token": "ghp_token" }
    );
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
