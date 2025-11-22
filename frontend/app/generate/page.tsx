'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useStreamStore } from '@/stores/stream';
import { HybridRenderer } from '@/components/HybridRenderer';
import type { InteractionPayload } from '@/components/types';

const PRESETS = [
  "Show me my year in music",
  "Create a fitness journey dashboard",
  "Visualize my reading progress this year",
  "Display my travel adventures",
  "Give me an overview of all my activities",
];

export default function GeneratePage() {
  const [query, setQuery] = useState('');
  const [refineQuery, setRefineQuery] = useState('');
  const {
    isStreaming,
    dataContext,
    htmlContent,
    rawResponse,
    error,
    startStream,
    reset,
    refineStream
  } = useStreamStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    startStream(query);
  };

  const handleRefine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineQuery.trim() || isStreaming || !rawResponse) return;
    refineStream(refineQuery);
    setRefineQuery('');
  };

  const handleInteraction = (type: string, payload: InteractionPayload) => {
    console.log('Interaction:', type, payload);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

      <div className="border-b border-zinc-800 p-4">
        <h1 className="text-xl font-semibold mb-4">UI Generator</h1>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show me my music listening stats"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isStreaming ? 'Generating...' : 'Generate'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setQuery(preset);
                if (!isStreaming) startStream(preset);
              }}
              disabled={isStreaming}
              className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-140px)]">
        <div className="border-r border-zinc-800 overflow-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-zinc-400">Rendered Output</h2>
              {!isStreaming && htmlContent && (
                <form onSubmit={handleRefine} className="flex gap-2">
                  <input
                    type="text"
                    value={refineQuery}
                    onChange={(e) => setRefineQuery(e.target.value)}
                    placeholder="Refine: e.g., make it more compact"
                    className="text-xs bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-64"
                  />
                  <button
                    type="submit"
                    disabled={!refineQuery.trim()}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    Refine
                  </button>
                </form>
              )}
            </div>
            {htmlContent ? (
              <div className="bg-zinc-900 rounded-lg overflow-hidden">
                <HybridRenderer
                  htmlContent={htmlContent}
                  dataContext={dataContext}
                  onInteraction={handleInteraction}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                Enter a query and click Generate
              </div>
            )}
          </div>
        </div>

        <div className="overflow-auto bg-zinc-900">
          <div className="p-4">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">
              Raw LLM Response
              {rawResponse && (
                <span className="ml-2 text-zinc-600">
                  ({rawResponse.length} chars)
                </span>
              )}
            </h2>
            {rawResponse ? (
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                {rawResponse}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                Raw HTML will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {Object.keys(dataContext).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 max-h-48 overflow-auto">
          <h3 className="text-xs font-medium text-zinc-400 mb-2">Data Context</h3>
          <pre className="text-xs text-zinc-500 font-mono">
            {JSON.stringify(dataContext, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
