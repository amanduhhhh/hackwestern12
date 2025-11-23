import { create } from 'zustand';
import type { DataContext, InteractionPayload } from '@/components/types';
import type { ThinkingMessage } from '@/components/ThinkingWidget';

interface ViewState {
  htmlContent: string;
  rawResponse: string;
  dataContext: DataContext;
  query: string;
}

interface StreamState {
  isStreaming: boolean;
  dataContext: DataContext;
  htmlContent: string;
  rawResponse: string;
  error: string | null;
  currentQuery: string;
  viewStack: ViewState[];
  thinkingMessages: ThinkingMessage[];

  startStream: (query: string) => void;
  refineStream: (query: string) => void;
  handleInteraction: (type: string, payload: InteractionPayload) => void;
  goBack: () => void;
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
  viewStack: [],
  thinkingMessages: [],

  startStream: async (query: string) => {
    set({
      isStreaming: true,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
      currentQuery: query,
      thinkingMessages: [],
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
                // Sanitize markdown code fences
                let content = data.content;
                content = content.replace(/```html\n?/g, '');
                content = content.replace(/```\n?/g, '');
                set({
                  htmlContent: state.htmlContent + content,
                  rawResponse: state.rawResponse + content,
                });
                break;
              case 'thinking':
                set({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'thinking',
                    message: data.message,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_call':
                set({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'tool_call',
                    function: data.function,
                    args: data.args,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_result':
                set({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'tool_result',
                    function: data.function,
                    success: data.success,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_error':
                set({
                  thinkingMessages: [...state.thinkingMessages, {
                    type: 'tool_error',
                    function: data.function,
                    error: data.error,
                    timestamp: Date.now(),
                  }],
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: message,
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
      viewStack: [],
      thinkingMessages: [],
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
      thinkingMessages: [{
        type: 'thinking',
        message: 'Refining UI...',
        timestamp: Date.now(),
      }],
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
                // Sanitize markdown code fences
                let refineContent = data.content;
                refineContent = refineContent.replace(/```html\n?/g, '');
                refineContent = refineContent.replace(/```\n?/g, '');
                set({
                  htmlContent: currentState.htmlContent + refineContent,
                  rawResponse: currentState.rawResponse + refineContent,
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: message,
        isStreaming: false,
      });
    }
  },

  handleInteraction: async (_type: string, payload: InteractionPayload) => {
    if (!payload.clickPrompt) {
      return;
    }

    const state = get();

    const currentView: ViewState = {
      htmlContent: state.htmlContent,
      rawResponse: state.rawResponse,
      dataContext: state.dataContext,
      query: state.currentQuery,
    };

    set({
      isStreaming: true,
      error: null,
      viewStack: [...state.viewStack, currentView],
      thinkingMessages: [],
    });

    try {
      const response = await fetch(`${API_URL}/api/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clickPrompt: payload.clickPrompt,
          clickedData: payload.clickedData,
          currentHtml: state.rawResponse,
          dataContext: state.dataContext,
          componentType: payload.componentType,
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
      let firstUiChunk = true;

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
                // Sanitize markdown code fences
                let uiContent = data.content;
                uiContent = uiContent.replace(/```html\n?/g, '');
                uiContent = uiContent.replace(/```\n?/g, '');
                
                if (firstUiChunk) {
                  set({
                    htmlContent: uiContent,
                    rawResponse: uiContent,
                  });
                  firstUiChunk = false;
                } else {
                  set({
                    htmlContent: currentState.htmlContent + uiContent,
                    rawResponse: currentState.rawResponse + uiContent,
                  });
                }
                break;
              case 'thinking':
                set({
                  thinkingMessages: [...currentState.thinkingMessages, {
                    type: 'thinking',
                    message: data.message,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_call':
                set({
                  thinkingMessages: [...currentState.thinkingMessages, {
                    type: 'tool_call',
                    function: data.function,
                    args: data.args,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_result':
                set({
                  thinkingMessages: [...currentState.thinkingMessages, {
                    type: 'tool_result',
                    function: data.function,
                    success: data.success,
                    timestamp: Date.now(),
                  }],
                });
                break;
              case 'tool_error':
                set({
                  thinkingMessages: [...currentState.thinkingMessages, {
                    type: 'tool_error',
                    function: data.function,
                    error: data.error,
                    timestamp: Date.now(),
                  }],
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      const currentState = get();
      const prevStack = currentState.viewStack;

      if (prevStack.length > 0) {
        const prev = prevStack[prevStack.length - 1];
        set({
          error: message,
          isStreaming: false,
          htmlContent: prev.htmlContent,
          rawResponse: prev.rawResponse,
          dataContext: prev.dataContext,
          viewStack: prevStack.slice(0, -1),
        });
      } else {
        set({
          error: message,
          isStreaming: false,
        });
      }
    }
  },

  goBack: () => {
    const state = get();
    const stack = state.viewStack;

    if (stack.length === 0) {
      return;
    }

    const prev = stack[stack.length - 1];
    set({
      htmlContent: prev.htmlContent,
      rawResponse: prev.rawResponse,
      dataContext: prev.dataContext,
      currentQuery: prev.query,
      viewStack: stack.slice(0, -1),
    });
  },
}));
