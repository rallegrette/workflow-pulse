/**
 * Tests for the /api/github/runs route handler.
 * We mock the underlying fetchAllRecentRuns function to isolate route logic.
 */
import { GET } from "@/app/api/github/runs/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/github", () => ({
  fetchAllRecentRuns: jest.fn(),
}));

import { fetchAllRecentRuns } from "@/lib/github";
const mockFetch = fetchAllRecentRuns as jest.MockedFunction<typeof fetchAllRecentRuns>;

function makeRequest(params: Record<string, string>, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/github/runs");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { headers });
}

describe("GET /api/github/runs", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns 400 when token is missing", async () => {
    const req = makeRequest({ owner: "test", repo: "repo" });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing/);
  });

  it("returns 400 when owner is missing", async () => {
    const req = makeRequest({ repo: "repo" }, { "x-github-token": "tok" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when repo is missing", async () => {
    const req = makeRequest({ owner: "test" }, { "x-github-token": "tok" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns runs on success", async () => {
    const fakeRuns = [{ id: 1, name: "CI" }];
    mockFetch.mockResolvedValue(fakeRuns as never);

    const req = makeRequest(
      { owner: "test", repo: "repo" },
      { "x-github-token": "ghp_token" }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.runs).toEqual(fakeRuns);
    expect(mockFetch).toHaveBeenCalledWith("ghp_token", "test", "repo");
  });

  it("returns 502 when GitHub API throws", async () => {
    mockFetch.mockRejectedValue(new Error("GitHub API error: 403 Forbidden"));

    const req = makeRequest(
      { owner: "test", repo: "repo" },
      { "x-github-token": "ghp_token" }
    );
    const res = await GET(req);
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body.error).toMatch(/403/);
  });
});
