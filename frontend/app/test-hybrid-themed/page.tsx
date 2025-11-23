'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HybridRenderer } from '@/components/HybridRenderer';
import { useThemeStore } from '@/store/useThemeStore';
import type { DataContext, HydrationLog, InteractionPayload, CardData, ChartDataPoint, GridItem, TimelineEvent, ThemeName } from '@/components/types';

const mockDataContext: DataContext = {
  music: {
    top_tracks: [
      { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen' },
      { id: '2', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
      { id: '3', title: 'Hotel California', artist: 'Eagles' },
      { id: '4', title: 'Comfortably Numb', artist: 'Pink Floyd' },
    ],
    total_minutes: 87234,
    total_tracks: 1247,
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
<div class="p-6 flex flex-col gap-8">
  <div>
    <p class="m-0 text-sm text-muted-foreground uppercase tracking-widest">Your Music</p>
    <p class="mt-2 text-5xl font-black text-foreground"><data-value data-source="music::total_minutes"></data-value> minutes</p>
    <p class="mt-1 text-base text-muted-foreground"><data-value data-source="music::total_tracks"></data-value> tracks played</p>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div>
      <h3 class="mb-4 text-base font-medium text-foreground">Top Tracks</h3>
      <component-slot
        type="List"
        data-source="music::top_tracks"
        config='{"template": {"primary": "title", "secondary": "artist"}, "layout": "ranked"}'
        interaction="smart"
      ></component-slot>
    </div>

    <div>
      <h3 class="mb-4 text-base font-medium text-foreground">Profile</h3>
      <component-slot
        type="Card"
        data-source="user::profile"
        config='{"template": {"primary": "title", "secondary": "description"}}'
        interaction="click"
      ></component-slot>
    </div>
  </div>

  <div>
    <h3 class="mb-4 text-base font-medium text-foreground">Weekly Listening</h3>
    <component-slot
      type="Chart"
      data-source="stats::weekly"
      config='{}'
      interaction="hover"
    ></component-slot>
  </div>

  <div>
    <h3 class="mb-4 text-base font-medium text-foreground">Recent Albums</h3>
    <component-slot
      type="Grid"
      data-source="albums::recent"
      config='{"columns": 3}'
      interaction="select"
    ></component-slot>
  </div>

  <div>
    <h3 class="mb-4 text-base font-medium text-foreground">Activity</h3>
    <component-slot
      type="Timeline"
      data-source="activity::timeline"
      config='{}'
      interaction="expand"
    ></component-slot>
  </div>
</div>
`;

const editedLLMResponse = `
<div class="p-6 flex flex-col gap-8">
  <div class="grid grid-cols-3 gap-4">
    <div>
      <p class="m-0 text-xs text-muted-foreground uppercase tracking-widest">Total Time</p>
      <p class="mt-1 text-3xl font-black text-foreground"><data-value data-source="music::total_minutes"></data-value></p>
      <p class="text-sm text-muted-foreground">minutes</p>
    </div>
    <div>
      <p class="m-0 text-xs text-muted-foreground uppercase tracking-widest">Tracks</p>
      <p class="mt-1 text-3xl font-black text-foreground"><data-value data-source="music::total_tracks"></data-value></p>
      <p class="text-sm text-muted-foreground">played</p>
    </div>
    <div>
      <h3 class="mb-2 text-xs font-medium text-muted-foreground uppercase">Profile</h3>
      <component-slot
        type="Card"
        data-source="user::profile"
        config='{"template": {"primary": "title", "secondary": "description"}}'
        interaction="click"
      ></component-slot>
    </div>
  </div>

  <div>
    <h3 class="mb-4 text-base font-medium text-primary">Weekly Activity</h3>
    <component-slot
      type="Chart"
      data-source="stats::weekly"
      config='{}'
      interaction="hover"
    ></component-slot>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div>
      <h3 class="mb-4 text-base font-medium text-foreground">Top Tracks</h3>
      <component-slot
        type="List"
        data-source="music::top_tracks"
        config='{"template": {"primary": "title", "secondary": "artist"}, "layout": "ranked"}'
        interaction="smart"
      ></component-slot>
    </div>

    <div>
      <h3 class="mb-4 text-base font-medium text-foreground">Activity Timeline</h3>
      <component-slot
        type="Timeline"
        data-source="activity::timeline"
        config='{}'
        interaction="expand"
      ></component-slot>
    </div>
  </div>

  <div>
    <h3 class="mb-4 text-base font-medium text-accent-foreground">Album Gallery</h3>
    <component-slot
      type="Grid"
      data-source="albums::recent"
      config='{"columns": 6}'
      interaction="select"
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

export default function TestHybridThemedPage() {
  const { currentTheme, setTheme } = useThemeStore();
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

  const simulateEdit = async () => {
    if (!htmlContent) {
      loadInstantly();
      return;
    }

    setLogs([]);
    setIsStreaming(true);
    setStreamProgress(0);

    const chunks = editedLLMResponse.match(/.{1,100}/g) || [];
    let accumulated = '';

    for (let i = 0; i < chunks.length; i++) {
      accumulated += chunks[i];
      setHtmlContent(accumulated);
      setStreamProgress(((i + 1) / chunks.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsStreaming(false);
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
    <div className="min-h-screen bg-background">
      <div className="bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            HybridRenderer Demo - Themed Components
          </h1>
          
          <div className="flex gap-2">
            {(['tokyo-night', 'impact', 'elegant', 'neobrutalism'] as ThemeName[]).map((theme) => (
              <button
                key={theme}
                onClick={() => setTheme(theme)}
                className={`px-4 py-2 text-sm font-semibold transition-all ${
                  theme === 'impact' || theme === 'neobrutalism' ? '' : 'rounded-lg'
                } ${
                  currentTheme === theme
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-card hover:bg-card/80 text-foreground'
                }`}
              >
                {theme === 'tokyo-night' && 'Tokyo Night'}
                {theme === 'impact' && 'Impact'}
                {theme === 'elegant' && 'Elegant'}
                {theme === 'neobrutalism' && 'Neobrutalism'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={simulateStream}
            disabled={isStreaming}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isStreaming ? 'Streaming...' : 'Simulate Stream'}
          </button>
          <button
            onClick={loadInstantly}
            disabled={isStreaming}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            Load Instantly
          </button>
          <button
            onClick={simulateEdit}
            disabled={isStreaming}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            Simulate Edit
          </button>
          <button
            onClick={reset}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
          >
            Reset
          </button>
        </div>

        {streamProgress > 0 && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Stream Progress</span>
              <span>{Math.round(streamProgress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
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
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  currentStages.includes(stage as HydrationLog['stage'])
                    ? 'bg-white'
                    : 'bg-muted-foreground/50'
                }`}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid h-[calc(100vh-200px)] grid-cols-1 lg:grid-cols-3">
        <div className="overflow-auto bg-background p-4 lg:col-span-2">
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
                className="flex h-64 items-center justify-center text-muted-foreground"
              >
                Click &quot;Simulate Stream&quot; or &quot;Load Instantly&quot; to start
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col overflow-hidden bg-card">
          <div className="p-3">
            <h2 className="text-sm font-semibold text-foreground">Hydration Logs</h2>
            <p className="text-xs text-muted-foreground">{logs.length} events</p>
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
                    className="rounded bg-muted/50 p-2"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${stageColors[log.stage]} text-white`}>
                        {log.stage}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">{log.message}</p>
                    {log.data && (
                      <pre className="mt-1 overflow-x-auto text-[10px] text-muted-foreground">
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
            <div className="p-3">
              <h3 className="mb-2 text-xs font-semibold text-foreground">Recent Interactions</h3>
              <div className="space-y-1">
                {interactions.map((payload, index) => (
                  <div key={index} className="rounded bg-muted/50 p-2 text-xs">
                    <span className="font-medium text-primary">{payload.componentType}</span>
                    <span className="text-muted-foreground"> • </span>
                    <span className="text-foreground">{payload.interaction}</span>
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

