import { render, screen } from "@testing-library/react";
import FlakyWorkflows from "@/components/FlakyWorkflows";
import type { FlakyWorkflow } from "@/lib/analytics";

describe("FlakyWorkflows", () => {
  it("renders nothing when there are no flaky workflows", () => {
    const { container } = render(<FlakyWorkflows workflows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders flaky workflow details", () => {
    const workflows: FlakyWorkflow[] = [
      {
        name: "Flaky CI",
        workflowId: 1,
        flakinessScore: 0.8,
        alternations: 8,
        totalRuns: 11,
        recentPattern: ["pass", "fail", "pass", "fail"],
      },
    ];

    render(<FlakyWorkflows workflows={workflows} />);
    expect(screen.getByText("Flaky CI")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("8 flips in 11 runs")).toBeInTheDocument();
    expect(screen.getByText("1 detected")).toBeInTheDocument();
  });

  it("renders multiple flaky workflows", () => {
    const workflows: FlakyWorkflow[] = [
      {
        name: "WF A",
        workflowId: 1,
        flakinessScore: 0.9,
        alternations: 9,
        totalRuns: 11,
        recentPattern: ["pass", "fail"],
      },
      {
        name: "WF B",
        workflowId: 2,
        flakinessScore: 0.5,
        alternations: 5,
        totalRuns: 11,
        recentPattern: ["fail", "pass"],
      },
    ];

    render(<FlakyWorkflows workflows={workflows} />);
    expect(screen.getByText("WF A")).toBeInTheDocument();
    expect(screen.getByText("WF B")).toBeInTheDocument();
    expect(screen.getByText("2 detected")).toBeInTheDocument();
  });
});
