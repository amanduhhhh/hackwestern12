import { create } from 'zustand';
import type { DataContext } from '@/components/types';

interface StreamState {
  isStreaming: boolean;
  dataContext: DataContext;
  htmlContent: string;
  rawResponse: string;
  error: string | null;
  currentQuery: string;

  startStream: (query: string) => void;
  refineStream: (query: string) => void;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useStreamStore = create<StreamState>((set, get) => ({
  isStreaming: false,
  dataContext: {},
  htmlContent: '',
  rawResponse: '',
  error: null,
  currentQuery: '',

  startStream: async (query: string) => {
    set({
      isStreaming: true,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
    });

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const state = get();

            switch (currentEvent) {
              case 'data':
                set({ dataContext: data });
                break;
              case 'ui':
                set({
                  htmlContent: state.htmlContent + data.content,
                  rawResponse: state.rawResponse + data.content,
                });
                break;
              case 'error':
                set({ error: data.message, isStreaming: false });
                break;
              case 'done':
                set({ isStreaming: false });
                break;
            }

            currentEvent = '';
          }
        }
      }

      set({ isStreaming: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isStreaming: false,
      });
    }
  },

  reset: () => {
    set({
      isStreaming: false,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: '',
    });
  },

  refineStream: async (query: string) => {
    const state = get();
    
    if (!state.rawResponse) {
      set({ error: 'No UI to refine' });
      return;
    }

    set({
      isStreaming: true,
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
    });

    try {
      const response = await fetch(`${API_URL}/api/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          currentHtml: state.rawResponse,
          dataContext: state.dataContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const currentState = get();

            switch (currentEvent) {
              case 'data':
                set({ dataContext: data });
                break;
              case 'ui':
                set({
                  htmlContent: currentState.htmlContent + data.content,
                  rawResponse: currentState.rawResponse + data.content,
                });
                break;
              case 'error':
                set({ error: data.message, isStreaming: false });
                break;
              case 'done':
                set({ isStreaming: false });
                break;
            }

            currentEvent = '';
          }
        }
      }

      set({ isStreaming: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isStreaming: false,
      });
    }
  },
}));
