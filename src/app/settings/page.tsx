"use client";

import { useState } from "react";
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function SettingsPage() {
  const {
    token,
    openaiKey,
    repos,
    activeRepo,
    setToken,
    setOpenaiKey,
    addRepo,
    removeRepo,
    setActiveRepo,
  } = useDashboard();

  const [tokenInput, setTokenInput] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [aiKeyInput, setAiKeyInput] = useState(openaiKey);
  const [showAiKey, setShowAiKey] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");

  function handleSaveToken() {
    setToken(tokenInput.trim());
  }

  function handleSaveAiKey() {
    setOpenaiKey(aiKeyInput.trim());
  }

  function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parts = repoInput.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Enter a repo in owner/repo format (e.g. facebook/react)");
      return;
    }
    addRepo({ owner: parts[0], repo: parts[1] });
    setRepoInput("");
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your API keys and repositories
        </p>
      </div>

      {/* GitHub Token */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-gray-200">
            GitHub Token
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Generate a{" "}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,workflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
          >
            personal access token
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          with <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">repo</code>{" "}
          and <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">workflow</code>{" "}
          scopes.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showToken ? "text" : "password"}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 pr-10 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleSaveToken}
            disabled={!tokenInput.trim() || tokenInput.trim() === token}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </section>

      {/* OpenAI Key */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-gray-200">
            OpenAI API Key
          </h2>
          <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
            Optional
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Enables AI-powered failure analysis and pipeline health summaries.
          Get a key from{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
          >
            platform.openai.com
            <ExternalLink className="h-3 w-3" />
          </a>
          . Uses <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">gpt-4o-mini</code> for
          cost efficiency.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showAiKey ? "text" : "password"}
              value={aiKeyInput}
              onChange={(e) => setAiKeyInput(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 pr-10 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowAiKey(!showAiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleSaveAiKey}
            disabled={!aiKeyInput.trim() || aiKeyInput.trim() === openaiKey}
            className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </section>

      {/* Repos */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-200">Repositories</h2>
        <form onSubmit={handleAddRepo} className="flex gap-2">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo"
            className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 font-mono"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {repos.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">
            No repositories added yet
          </p>
        ) : (
          <ul className="space-y-2">
            {repos.map((repo) => {
              const isActive =
                activeRepo?.owner === repo.owner &&
                activeRepo?.repo === repo.repo;
              return (
                <li
                  key={`${repo.owner}/${repo.repo}`}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-gray-800 hover:border-gray-700 bg-gray-800/30"
                  }`}
                  onClick={() => setActiveRepo(repo)}
                >
                  <div className="flex items-center gap-3">
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    <span className="text-sm font-mono text-gray-300">
                      {repo.owner}/{repo.repo}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRepo(repo);
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {repos.length > 0 && (
          <p className="text-xs text-gray-600">
            Click a repository to make it active. The active repo is shown in the sidebar.
          </p>
        )}
      </section>
    </div>
  );
}
