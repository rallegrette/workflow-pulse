"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { WorkflowRun } from "@/lib/github";
import type { RepoConfig } from "@/lib/types";

interface DashboardState {
  token: string;
  repos: RepoConfig[];
  activeRepo: RepoConfig | null;
  runs: WorkflowRun[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

interface DashboardContextValue extends DashboardState {
  setToken: (token: string) => void;
  addRepo: (repo: RepoConfig) => void;
  removeRepo: (repo: RepoConfig) => void;
  setActiveRepo: (repo: RepoConfig) => void;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const STORAGE_KEY = "workflow-pulse-config";

function loadConfig(): { token: string; repos: RepoConfig[] } {
  if (typeof window === "undefined") return { token: "", repos: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: "", repos: [] };
    return JSON.parse(raw);
  } catch {
    return { token: "", repos: [] };
  }
}

function saveConfig(token: string, repos: RepoConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, repos }));
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>({
    token: "",
    repos: [],
    activeRepo: null,
    runs: [],
    loading: false,
    error: null,
    lastFetched: null,
  });

  useEffect(() => {
    const config = loadConfig();
    setState((s) => ({
      ...s,
      token: config.token,
      repos: config.repos,
      activeRepo: config.repos[0] || null,
    }));
  }, []);

  const setToken = useCallback((token: string) => {
    setState((s) => {
      saveConfig(token, s.repos);
      return { ...s, token };
    });
  }, []);

  const addRepo = useCallback((repo: RepoConfig) => {
    setState((s) => {
      const exists = s.repos.some(
        (r) => r.owner === repo.owner && r.repo === repo.repo
      );
      if (exists) return s;
      const repos = [...s.repos, repo];
      saveConfig(s.token, repos);
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
      saveConfig(s.token, repos);
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

  useEffect(() => {
    if (state.token && state.activeRepo) {
      refresh();
    }
  }, [state.token, state.activeRepo, refresh]);

  return (
    <DashboardContext.Provider
      value={{
        ...state,
        setToken,
        addRepo,
        removeRepo,
        setActiveRepo,
        refresh,
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
