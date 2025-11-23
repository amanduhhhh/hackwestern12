'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '@/stores/toast';

export function Toast() {
  const messages = useToastStore((state) => state.messages);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-auto"
          >
            <div
              onClick={() => removeToast(message.id)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded
                bg-zinc-900/90 backdrop-blur-sm border border-zinc-800
                shadow-xl shadow-black/20 cursor-pointer
                hover:bg-zinc-800/90 transition-colors
                max-w-xs
                ${message.type === 'error' ? 'border-red-500/30' : ''}
              `}
            >
              {message.type === 'thinking' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
              )}
              {message.type === 'status' && (
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              )}
              {message.type === 'error' && (
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
              )}
              <span className={`text-sm ${message.type === 'error' ? 'text-red-300' : 'text-zinc-300'}`}>
                {message.text}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
