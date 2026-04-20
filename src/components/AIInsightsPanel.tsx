"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  type: "analysis" | "summary";
  title: string;
  description: string;
  fetchFn: () => Promise<string>;
  openaiKey: string;
}

export default function AIInsightsPanel({ type, title, description, fetchFn, openaiKey }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setContent(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  if (!openaiKey) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        <p className="text-xs text-gray-500">
          Add an OpenAI API key in Settings to enable AI-powered insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <span className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
              AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            {content && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 disabled:text-gray-600 transition-colors bg-violet-500/10 hover:bg-violet-500/20 disabled:bg-gray-800 px-3 py-1.5 rounded-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </>
              ) : content ? (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Generate {type === "analysis" ? "Analysis" : "Summary"}
                </>
              )}
            </button>
          </div>
        </div>
        {!content && !loading && !error && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
      </div>

      {error && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {content && expanded && (
        <div className="border-t border-gray-800 px-5 py-4">
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-gray-200 prose-headings:font-semibold prose-headings:text-sm
              prose-p:text-gray-400 prose-p:text-sm prose-p:leading-relaxed
              prose-li:text-gray-400 prose-li:text-sm
              prose-strong:text-gray-300
              prose-code:text-violet-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
              prose-ul:my-2 prose-ol:my-2
              prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
          />
        </div>
      )}
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return `<ul>${match}</ul>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[hulo])/gm, (line) => line ? `<p>${line}` : '')
    .replace(/<p><(h[1-3]|ul|ol|li)/g, '<$1')
    .replace(/<\/(h[1-3]|ul|ol|li)><\/p>/g, '</$1>');
}
