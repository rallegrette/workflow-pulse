export interface RepoConfig {
  owner: string;
  repo: string;
}

export interface AppConfig {
  token: string;
  repos: RepoConfig[];
  activeRepo: RepoConfig | null;
}
