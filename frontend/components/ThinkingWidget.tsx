import { useEffect, useRef } from 'react';

export interface ThinkingMessage {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'tool_error';
  message?: string;
  function?: string;
  args?: Record<string, unknown>;
  success?: boolean;
  error?: string;
  timestamp: number;
}

interface ThinkingWidgetProps {
  messages: ThinkingMessage[];
  isVisible: boolean;
}

export function ThinkingWidget({ messages, isVisible }: ThinkingWidgetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isVisible || messages.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-zinc-400">AI Thinking</span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-48 overflow-y-auto p-3 space-y-2"
      >
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            {msg.type === 'thinking' && (
              <div className="flex items-start gap-2 text-zinc-400">
                <span className="text-violet-400 mt-0.5">*</span>
                <span>{msg.message}</span>
              </div>
            )}

            {msg.type === 'tool_call' && (
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">{'>'}</span>
                <div>
                  <span className="text-blue-400 font-mono">{msg.function}</span>
                  {msg.args && Object.keys(msg.args).length > 0 && (
                    <span className="text-zinc-500 ml-1">
                      ({Object.entries(msg.args).map(([k, v]) =>
                        `${k}: ${JSON.stringify(v)}`
                      ).join(', ')})
                    </span>
                  )}
                </div>
              </div>
            )}

            {msg.type === 'tool_result' && (
              <div className="flex items-center gap-2 text-emerald-400">
                <span>{'<'}</span>
                <span className="font-mono">{msg.function}</span>
                <span className="text-emerald-500">ok</span>
              </div>
            )}

            {msg.type === 'tool_error' && (
              <div className="flex items-start gap-2 text-red-400">
                <span className="mt-0.5">!</span>
                <div>
                  <span className="font-mono">{msg.function}</span>
                  <span className="text-red-500 ml-1">failed: {msg.error}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
