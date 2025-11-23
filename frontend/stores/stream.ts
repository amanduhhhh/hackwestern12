import { create } from 'zustand';
import type { DataContext, InteractionPayload } from '@/components/types';
import { useToastStore } from './toast';

interface StreamState {
  isStreaming: boolean;
  dataContext: DataContext;
  htmlContent: string;
  rawResponse: string;
  error: string | null;
  currentQuery: string;

  startStream: (query: string) => void;
  refineStream: (query: string) => void;
  handleInteraction: (type: string, payload: InteractionPayload) => void;
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
    const { addToast, removeToast } = useToastStore.getState();

    set({
      isStreaming: true,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
    });

    const thinkingId = addToast('Generating...', 'thinking');

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
              case 'status':
                addToast(data.message, 'status');
                break;
              case 'error':
                set({ error: data.message, isStreaming: false });
                addToast(data.message, 'error');
                break;
              case 'done':
                set({ isStreaming: false });
                removeToast(thinkingId);
                break;
            }

            currentEvent = '';
          }
        }
      }

      set({ isStreaming: false });
      removeToast(thinkingId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: message,
        isStreaming: false,
      });
      removeToast(thinkingId);
      addToast(message, 'error');
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
    const { addToast, removeToast } = useToastStore.getState();
    const state = get();

    if (!state.rawResponse) {
      set({ error: 'No UI to refine' });
      addToast('No UI to refine', 'error');
      return;
    }

    set({
      isStreaming: true,
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
    });

    const thinkingId = addToast('Refining...', 'thinking');

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
              case 'status':
                addToast(data.message, 'status');
                break;
              case 'error':
                set({ error: data.message, isStreaming: false });
                addToast(data.message, 'error');
                break;
              case 'done':
                set({ isStreaming: false });
                removeToast(thinkingId);
                break;
            }

            currentEvent = '';
          }
        }
      }

      set({ isStreaming: false });
      removeToast(thinkingId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: message,
        isStreaming: false,
      });
      removeToast(thinkingId);
      addToast(message, 'error');
    }
  },

  handleInteraction: (_type: string, payload: InteractionPayload) => {
    const { addToast } = useToastStore.getState();

    if (!payload.clickPrompt) {
      return;
    }

    addToast('Interaction captured', 'status');

    console.log('Interaction:', {
      slotId: payload.slotId,
      clickPrompt: payload.clickPrompt,
      clickedData: payload.clickedData,
      componentType: payload.componentType,
    });
  },
}));
