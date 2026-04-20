import { render, screen } from "@testing-library/react";
import AnomalyAlerts from "@/components/AnomalyAlerts";
import type { Anomaly } from "@/lib/analytics";

describe("AnomalyAlerts", () => {
  it("renders nothing when there are no anomalies", () => {
    const { container } = render(<AnomalyAlerts anomalies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a warning anomaly", () => {
    const anomalies: Anomaly[] = [
      {
        type: "failure_spike",
        severity: "warning",
        message: "Failure rate spike detected",
        detail: "Recent failure rate is 25%",
        metric: 25,
        baseline: 5,
      },
    ];

    render(<AnomalyAlerts anomalies={anomalies} />);
    expect(screen.getByText("Failure rate spike detected")).toBeInTheDocument();
    expect(screen.getByText("Recent failure rate is 25%")).toBeInTheDocument();
    expect(screen.getByText("warning")).toBeInTheDocument();
  });

  it("renders a critical anomaly", () => {
    const anomalies: Anomaly[] = [
      {
        type: "duration_regression",
        severity: "critical",
        message: "Build duration regression",
        detail: "Builds are 3x slower",
        metric: 300,
        baseline: 100,
      },
    ];

    render(<AnomalyAlerts anomalies={anomalies} />);
    expect(screen.getByText("Build duration regression")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("renders multiple anomalies", () => {
    const anomalies: Anomaly[] = [
      {
        type: "failure_spike",
        severity: "warning",
        message: "Spike 1",
        detail: "detail 1",
        metric: 25,
        baseline: 5,
      },
      {
        type: "duration_regression",
        severity: "critical",
        message: "Regression 1",
        detail: "detail 2",
        metric: 300,
        baseline: 100,
      },
    ];

    render(<AnomalyAlerts anomalies={anomalies} />);
    expect(screen.getByText("Spike 1")).toBeInTheDocument();
    expect(screen.getByText("Regression 1")).toBeInTheDocument();
  });
});
