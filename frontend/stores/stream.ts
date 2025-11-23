import { create } from 'zustand';
import type { DataContext, InteractionPayload } from '@/components/types';

interface StreamState {
  isStreaming: boolean;
  dataContext: DataContext;
  htmlContent: string;
  rawResponse: string;
  error: string | null;
  currentQuery: string;
  thinkingMessages: Array<{ type: string; message: string; timestamp: number }>;
  toolCalls: Array<{ name: string; args?: any; result?: string; statusCode?: number; detail?: string; timestamp: number }>;

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
  thinkingMessages: [],
  toolCalls: [],

  startStream: async (query: string) => {
    set({
      isStreaming: true,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
      thinkingMessages: [],
      toolCalls: [],
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
              case 'thinking':
                set((state) => ({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: data.type || 'thinking',
                    message: data.message || data.content || '',
                    timestamp: Date.now()
                  }]
                }));
                break;
              case 'tool_call':
                set((state) => ({
                  toolCalls: [...state.toolCalls, {
                    name: data.name || '',
                    args: data.args,
                    result: undefined,
                    timestamp: Date.now()
                  }]
                }));
                break;
              case 'tool_result':
                set((state) => {
                  const toolCalls = [...state.toolCalls];
                  const lastCall = toolCalls[toolCalls.length - 1];
                  if (lastCall) {
                    const statusCode = data.status_code || data.statusCode || data.status;
                    const resultMessage = data.message || data.result || data.detail || 'ok';
                    
                    let displayMessage = resultMessage;
                    if (statusCode === 200) {
                      displayMessage = `${lastCall.name} ok`;
                    } else if (statusCode === 401 || statusCode === 403) {
                      displayMessage = `unauthorized, using sample data`;
                    } else if (statusCode && statusCode >= 400) {
                      displayMessage = `${resultMessage} (${statusCode})`;
                    }
                    
                    lastCall.result = displayMessage;
                    lastCall.statusCode = statusCode;
                    lastCall.detail = data.detail || data.message || resultMessage;
                  }
                  return { toolCalls };
                });
                break;
              case 'ui':
                const wasEmpty = state.htmlContent === '';
                set({
                  htmlContent: state.htmlContent + data.content,
                  rawResponse: state.rawResponse + data.content,
                });
                if (wasEmpty && data.content) {
                  set((s) => ({
                    thinkingMessages: [...s.thinkingMessages, {
                      type: 'status',
                      message: 'Generating UI...',
                      timestamp: Date.now()
                    }]
                  }));
                }
                break;
              case 'status':
                set((state) => ({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'status',
                    message: data.message,
                    timestamp: Date.now()
                  }]
                }));
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
      thinkingMessages: [],
      toolCalls: [],
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
      thinkingMessages: [],
      toolCalls: [],
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
              case 'thinking':
                set((state) => ({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: data.type || 'thinking',
                    message: data.message || data.content || '',
                    timestamp: Date.now()
                  }]
                }));
                break;
              case 'tool_call':
                set((state) => ({
                  toolCalls: [...state.toolCalls, {
                    name: data.name || '',
                    args: data.args,
                    result: undefined,
                    statusCode: undefined,
                    detail: undefined,
                    timestamp: Date.now()
                  }]
                }));
                break;
              case 'tool_result':
                set((state) => {
                  const toolCalls = [...state.toolCalls];
                  const lastCall = toolCalls[toolCalls.length - 1];
                  if (lastCall) {
                    const statusCode = data.status_code || data.statusCode || data.status;
                    const resultMessage = data.message || data.result || data.detail || 'ok';
                    
                    let displayMessage = resultMessage;
                    if (statusCode === 200) {
                      displayMessage = `${lastCall.name} ok`;
                    } else if (statusCode === 401 || statusCode === 403) {
                      displayMessage = `unauthorized, using sample data`;
                    } else if (statusCode && statusCode >= 400) {
                      displayMessage = `${resultMessage} (${statusCode})`;
                    }
                    
                    lastCall.result = displayMessage;
                    lastCall.statusCode = statusCode;
                    lastCall.detail = data.detail || data.message || resultMessage;
                  }
                  return { toolCalls };
                });
                break;
              case 'ui':
                const wasEmpty = currentState.htmlContent === '';
                set({
                  htmlContent: currentState.htmlContent + data.content,
                  rawResponse: currentState.rawResponse + data.content,
                });
                if (wasEmpty && data.content) {
                  set((s) => ({
                    thinkingMessages: [...s.thinkingMessages, {
                      type: 'status',
                      message: 'Generating UI...',
                      timestamp: Date.now()
                    }]
                  }));
                }
                break;
              case 'status':
                set((state) => ({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'status',
                    message: data.message,
                    timestamp: Date.now()
                  }]
                }));
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: message,
        isStreaming: false,
      });
    }
  },

  handleInteraction: (_type: string, payload: InteractionPayload) => {
    if (!payload.clickPrompt) {
      return;
    }

    console.log('Interaction:', {
      slotId: payload.slotId,
      clickPrompt: payload.clickPrompt,
      clickedData: payload.clickedData,
      componentType: payload.componentType,
    });
  },
}));
