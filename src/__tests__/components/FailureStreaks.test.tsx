import { render, screen } from "@testing-library/react";
import FailureStreaks from "@/components/FailureStreaks";
import type { FailureStreak } from "@/lib/analytics";

describe("FailureStreaks", () => {
  it("renders nothing when there are no streaks", () => {
    const { container } = render(<FailureStreaks streaks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders streak details", () => {
    const streaks: FailureStreak[] = [
      {
        workflow: "Deploy",
        branch: "main",
        consecutiveFailures: 5,
        since: "2026-04-10T10:00:00Z",
        runs: [
          { id: 1, created_at: "2026-04-14T10:00:00Z", html_url: "https://github.com/test/1" },
        ],
      },
    ];

    render(<FailureStreaks streaks={streaks} />);
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("consecutive")).toBeInTheDocument();
  });
});
