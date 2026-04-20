import { render, screen } from "@testing-library/react";
import BranchComparison from "@/components/BranchComparison";
import type { BranchBreakdown } from "@/lib/stats";

describe("BranchComparison", () => {
  it("renders nothing when there are no branches", () => {
    const { container } = render(<BranchComparison branches={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders branch names and success rates", () => {
    const branches: BranchBreakdown[] = [
      { branch: "main", totalRuns: 50, successRate: 96 },
      { branch: "develop", totalRuns: 30, successRate: 80 },
    ];

    render(<BranchComparison branches={branches} />);
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("96.0%")).toBeInTheDocument();
    expect(screen.getByText("50 runs")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument();
  });

  it("only shows top 12 branches", () => {
    const branches: BranchBreakdown[] = Array.from({ length: 15 }, (_, i) => ({
      branch: `branch-${i}`,
      totalRuns: 15 - i,
      successRate: 90,
    }));

    render(<BranchComparison branches={branches} />);
    expect(screen.getByText("branch-0")).toBeInTheDocument();
    expect(screen.getByText("branch-11")).toBeInTheDocument();
    expect(screen.queryByText("branch-12")).not.toBeInTheDocument();
  });
});
