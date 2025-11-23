import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'thinking' | 'status' | 'error';
  timestamp: number;
}

interface ToastStore {
  messages: ToastMessage[];
  addToast: (text: string, type: ToastMessage['type']) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  messages: [],

  addToast: (text, type) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const message: ToastMessage = {
      id,
      text,
      type,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [message, ...state.messages].slice(0, 5),
    }));

    if (type !== 'thinking') {
      setTimeout(() => {
        get().removeToast(id);
      }, 3000);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },

  clearAll: () => {
    set({ messages: [] });
  },
}));
