import { render, screen } from "@testing-library/react";
import StatCard from "@/components/StatCard";
import { Activity } from "lucide-react";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(
      <StatCard
        title="Total Runs"
        value={42}
        icon={<Activity data-testid="icon" />}
      />
    );

    expect(screen.getByText("Total Runs")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string values", () => {
    render(
      <StatCard
        title="Success Rate"
        value="95.2%"
        icon={<Activity />}
      />
    );

    expect(screen.getByText("95.2%")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <StatCard
        title="MTTR"
        value="5m 30s"
        subtitle="3 recoveries"
        icon={<Activity />}
      />
    );

    expect(screen.getByText("3 recoveries")).toBeInTheDocument();
  });

  it("renders trend when provided", () => {
    render(
      <StatCard
        title="Success Rate"
        value="95%"
        icon={<Activity />}
        trend={{ value: 5.2, label: "vs last week" }}
        color="emerald"
      />
    );

    expect(screen.getByText("+5.2%")).toBeInTheDocument();
    expect(screen.getByText("vs last week")).toBeInTheDocument();
  });

  it("shows negative trend without plus sign", () => {
    render(
      <StatCard
        title="Failures"
        value={10}
        icon={<Activity />}
        trend={{ value: -3.1, label: "vs last week" }}
        color="red"
      />
    );

    expect(screen.getByText("-3.1%")).toBeInTheDocument();
  });
});
