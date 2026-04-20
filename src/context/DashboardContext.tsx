"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { WorkflowRun } from "@/lib/github";
import type { RepoConfig } from "@/lib/types";

export type DateRange = "7d" | "30d" | "90d" | "all";

interface DashboardState {
  token: string;
  openaiKey: string;
  repos: RepoConfig[];
  activeRepo: RepoConfig | null;
  runs: WorkflowRun[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  streaming: boolean;
  dateRange: DateRange;
}

interface DashboardContextValue extends DashboardState {
  setToken: (token: string) => void;
  setOpenaiKey: (key: string) => void;
  addRepo: (repo: RepoConfig) => void;
  removeRepo: (repo: RepoConfig) => void;
  setActiveRepo: (repo: RepoConfig) => void;
  setDateRange: (range: DateRange) => void;
  filteredRuns: WorkflowRun[];
  refresh: () => Promise<void>;
  toggleStreaming: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const STORAGE_KEY = "workflow-pulse-config";

function loadConfig(): { token: string; openaiKey: string; repos: RepoConfig[] } {
  if (typeof window === "undefined") return { token: "", openaiKey: "", repos: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", openaiKey: "", repos: [] };
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || "",
      openaiKey: parsed.openaiKey || "",
      repos: parsed.repos || [],
    };
  } catch {
    return { token: "", openaiKey: "", repos: [] };
  }
}

function saveConfig(token: string, openaiKey: string, repos: RepoConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, openaiKey, repos }));
}

function filterByDateRange(runs: WorkflowRun[], range: DateRange): WorkflowRun[] {
  if (range === "all") return runs;
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range] || 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return runs.filter((r) => new Date(r.created_at) >= cutoff);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>(() => {
    const config = loadConfig();
    return {
      token: config.token,
      openaiKey: config.openaiKey,
      repos: config.repos,
      activeRepo: config.repos[0] || null,
      runs: [],
      loading: false,
      error: null,
      lastFetched: null,
      streaming: false,
      dateRange: "all" as DateRange,
    };
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const setToken = useCallback((token: string) => {
    setState((s) => {
      saveConfig(token, s.openaiKey, s.repos);
      return { ...s, token };
    });
  }, []);

  const setOpenaiKey = useCallback((openaiKey: string) => {
    setState((s) => {
      saveConfig(s.token, openaiKey, s.repos);
      return { ...s, openaiKey };
    });
  }, []);

  const addRepo = useCallback((repo: RepoConfig) => {
    setState((s) => {
      const exists = s.repos.some(
        (r) => r.owner === repo.owner && r.repo === repo.repo
      );
      if (exists) return s;
      const repos = [...s.repos, repo];
      saveConfig(s.token, s.openaiKey, repos);
      return {
        ...s,
        repos,
        activeRepo: s.activeRepo || repo,
      };
    });
  }, []);

  const removeRepo = useCallback((repo: RepoConfig) => {
    setState((s) => {
      const repos = s.repos.filter(
        (r) => !(r.owner === repo.owner && r.repo === repo.repo)
      );
      saveConfig(s.token, s.openaiKey, repos);
      const activeRepo =
        s.activeRepo?.owner === repo.owner && s.activeRepo?.repo === repo.repo
          ? repos[0] || null
          : s.activeRepo;
      return { ...s, repos, activeRepo };
    });
  }, []);

  const setActiveRepo = useCallback((repo: RepoConfig) => {
    setState((s) => ({ ...s, activeRepo: repo }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRange) => {
    setState((s) => ({ ...s, dateRange }));
  }, []);

  const refresh = useCallback(async () => {
    setState((s) => {
      if (!s.token || !s.activeRepo) return s;
      return { ...s, loading: true, error: null };
    });

    const currentState = await new Promise<DashboardState>((resolve) => {
      setState((s) => {
        resolve(s);
        return s;
      });
    });

    if (!currentState.token || !currentState.activeRepo) return;

    try {
      const params = new URLSearchParams({
        owner: currentState.activeRepo.owner,
        repo: currentState.activeRepo.repo,
      });
      const res = await fetch(`/api/github/runs?${params}`, {
        headers: { "x-github-token": currentState.token },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const { runs } = await res.json();
      setState((s) => ({
        ...s,
        runs,
        loading: false,
        lastFetched: new Date(),
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to fetch";
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((s) => ({ ...s, streaming: false }));
  }, []);

  const startStreaming = useCallback(() => {
    setState((s) => {
      if (!s.token || !s.activeRepo) return s;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const params = new URLSearchParams({
        owner: s.activeRepo.owner,
        repo: s.activeRepo.repo,
        interval: "60000",
      });

      const es = new EventSource(`/api/stream?${params}`);

      es.addEventListener("runs", (event) => {
        const { runs, timestamp } = JSON.parse(event.data);
        setState((prev) => ({
          ...prev,
          runs,
          lastFetched: new Date(timestamp),
        }));
      });

      es.addEventListener("error", () => {
        stopStreaming();
      });

      eventSourceRef.current = es;
      return { ...s, streaming: true };
    });
  }, [stopStreaming]);

  const toggleStreaming = useCallback(() => {
    setState((s) => {
      if (s.streaming) {
        stopStreaming();
      } else {
        startStreaming();
      }
      return s;
    });
  }, [startStreaming, stopStreaming]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (state.token && state.activeRepo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount / config change
      refresh();
    }
  }, [state.token, state.activeRepo, refresh]);

  const filteredRuns = filterByDateRange(state.runs, state.dateRange);

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        filteredRuns,
        setToken,
        setOpenaiKey,
        addRepo,
        removeRepo,
        setActiveRepo,
        setDateRange,
        refresh,
        toggleStreaming,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
