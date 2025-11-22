'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HybridRenderer } from '@/components/HybridRenderer';
import type { DataContext, HydrationLog, InteractionPayload, ListItem, CardData, ChartDataPoint, GridItem, TimelineEvent } from '@/components/types';

const mockDataContext: DataContext = {
  music: {
    top_tracks: [
      { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen' },
      { id: '2', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
      { id: '3', title: 'Hotel California', artist: 'Eagles' },
      { id: '4', title: 'Comfortably Numb', artist: 'Pink Floyd' },
    ] as ListItem[],
  },
  user: {
    profile: {
      title: 'John Doe',
      description: 'Music enthusiast and playlist curator',
      image: 'https://picsum.photos/400/200',
    } as CardData,
  },
  stats: {
    weekly: [
      { label: 'Mon', value: 45 },
      { label: 'Tue', value: 72 },
      { label: 'Wed', value: 58 },
      { label: 'Thu', value: 90 },
      { label: 'Fri', value: 85 },
    ] as ChartDataPoint[],
  },
  albums: {
    recent: [
      { id: '1', title: 'Dark Side of the Moon', image: 'https://picsum.photos/200/200?1' },
      { id: '2', title: 'Abbey Road', image: 'https://picsum.photos/200/200?2' },
      { id: '3', title: 'Rumours', image: 'https://picsum.photos/200/200?3' },
      { id: '4', title: 'Thriller', image: 'https://picsum.photos/200/200?4' },
      { id: '5', title: 'Back in Black', image: 'https://picsum.photos/200/200?5' },
      { id: '6', title: 'The Wall', image: 'https://picsum.photos/200/200?6' },
    ] as GridItem[],
  },
  activity: {
    timeline: [
      { id: '1', title: 'Added new playlist', description: 'Classic Rock Essentials', timestamp: '2 hours ago' },
      { id: '2', title: 'Liked an album', description: 'Dark Side of the Moon', timestamp: '5 hours ago' },
      { id: '3', title: 'Followed artist', description: 'Pink Floyd', timestamp: '1 day ago' },
    ] as TimelineEvent[],
  },
};

const simulatedLLMResponse = `
<div style="padding: 24px; display: flex; flex-direction: column; gap: 32px;">
  <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">Music Dashboard</h2>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
    <div>
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #3f3f46;">Top Tracks</h3>
      <component-slot
        type="List"
        data-source="music::top_tracks"
        config='{"template": {"primary": "title", "secondary": "artist"}}'
        interaction="smart"
      ></component-slot>
    </div>

    <div>
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #3f3f46;">Profile</h3>
      <component-slot
        type="Card"
        data-source="user::profile"
        config='{"template": {"primary": "title", "secondary": "description"}}'
        interaction="click"
      ></component-slot>
    </div>
  </div>

  <div>
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #3f3f46;">Weekly Listening</h3>
    <component-slot
      type="Chart"
      data-source="stats::weekly"
      config='{}'
      interaction="hover"
    ></component-slot>
  </div>

  <div>
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #3f3f46;">Recent Albums</h3>
    <component-slot
      type="Grid"
      data-source="albums::recent"
      config='{"columns": 3}'
      interaction="select"
    ></component-slot>
  </div>

  <div>
    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #3f3f46;">Activity</h3>
    <component-slot
      type="Timeline"
      data-source="activity::timeline"
      config='{}'
      interaction="expand"
    ></component-slot>
  </div>
</div>
`;

const stageColors: Record<string, string> = {
  parse: 'bg-yellow-500',
  sanitize: 'bg-orange-500',
  detect: 'bg-blue-500',
  resolve: 'bg-purple-500',
  mount: 'bg-green-500',
  complete: 'bg-emerald-500',
};

const stageLabels: Record<string, string> = {
  parse: 'Parse',
  sanitize: 'Sanitize',
  detect: 'Detect',
  resolve: 'Resolve',
  mount: 'Mount',
  complete: 'Complete',
};

export default function TestHybridPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [interactions, setInteractions] = useState<InteractionPayload[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleLog = (log: HydrationLog) => {
    setLogs(prev => [...prev, log]);
  };

  const handleInteraction = (type: string, payload: InteractionPayload) => {
    setInteractions(prev => [...prev.slice(-4), payload]);
    console.log('Interaction:', type, payload);
  };

  const simulateStream = async () => {
    setLogs([]);
    setInteractions([]);
    setHtmlContent('');
    setIsStreaming(true);
    setStreamProgress(0);

    const chunks = simulatedLLMResponse.match(/.{1,100}/g) || [];
    let accumulated = '';

    for (let i = 0; i < chunks.length; i++) {
      accumulated += chunks[i];
      setHtmlContent(accumulated);
      setStreamProgress(((i + 1) / chunks.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsStreaming(false);
  };

  const loadInstantly = () => {
    setLogs([]);
    setInteractions([]);
    setHtmlContent(simulatedLLMResponse);
    setStreamProgress(100);
  };

  const reset = () => {
    setHtmlContent('');
    setLogs([]);
    setInteractions([]);
    setStreamProgress(0);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const currentStages = [...new Set(logs.map(l => l.stage))];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          HybridRenderer Demo - Hydration Stages
        </h1>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={simulateStream}
            disabled={isStreaming}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {isStreaming ? 'Streaming...' : 'Simulate Stream'}
          </button>
          <button
            onClick={loadInstantly}
            disabled={isStreaming}
            className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          >
            Load Instantly
          </button>
          <button
            onClick={reset}
            className="rounded-md bg-zinc-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
          >
            Reset
          </button>
        </div>

        {streamProgress > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Stream Progress</span>
              <span>{Math.round(streamProgress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${streamProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {Object.entries(stageLabels).map(([stage, label]) => (
            <div
              key={stage}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                currentStages.includes(stage as HydrationLog['stage'])
                  ? `${stageColors[stage]} text-white`
                  : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStages.includes(stage as HydrationLog['stage'])
                    ? 'bg-white'
                    : 'bg-zinc-400'
                }`}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid h-[calc(100vh-200px)] grid-cols-1 lg:grid-cols-3">
        <div className="overflow-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <AnimatePresence mode="wait">
            {htmlContent ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HybridRenderer
                  htmlContent={htmlContent}
                  dataContext={mockDataContext}
                  onInteraction={handleInteraction}
                  onLog={handleLog}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-64 items-center justify-center text-zinc-400"
              >
                Click &quot;Simulate Stream&quot; or &quot;Load Instantly&quot; to start
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col overflow-hidden bg-zinc-900">
          <div className="border-b border-zinc-700 p-3">
            <h2 className="text-sm font-semibold text-zinc-100">Hydration Logs</h2>
            <p className="text-xs text-zinc-500">{logs.length} events</p>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="space-y-2">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded bg-zinc-800 p-2"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${stageColors[log.stage]} text-white`}>
                        {log.stage}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{log.message}</p>
                    {log.data && (
                      <pre className="mt-1 overflow-x-auto text-[10px] text-zinc-500">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>

          {interactions.length > 0 && (
            <div className="border-t border-zinc-700 p-3">
              <h3 className="mb-2 text-xs font-semibold text-zinc-100">Recent Interactions</h3>
              <div className="space-y-1">
                {interactions.map((payload, index) => (
                  <div key={index} className="rounded bg-zinc-800 p-2 text-xs">
                    <span className="font-medium text-blue-400">{payload.componentType}</span>
                    <span className="text-zinc-500"> • </span>
                    <span className="text-zinc-400">{payload.interaction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
