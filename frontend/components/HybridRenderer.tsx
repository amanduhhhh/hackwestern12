'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import DOMPurify from 'dompurify';
import morphdom from 'morphdom';
import { motion } from 'framer-motion';
import { COMPONENT_REGISTRY } from './registry';
import type {
  ComponentProps,
  DataContext,
  HydrationLog,
  InteractionPayload,
} from './types';
import { generateSlotId, resolveDataSource, parseConfig, resolveDataValue } from './utils';

interface HybridRendererProps {
  htmlContent: string;
  dataContext: DataContext;
  onInteraction: (type: string, payload: InteractionPayload) => void;
  onLog?: (log: HydrationLog) => void;
  isInteracting?: boolean;
}

interface SlotErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

class SlotErrorBoundary extends React.Component<
  SlotErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: SlotErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return <div className="h-8" />;
    }
    return this.props.children;
  }
}

const DOMPURIFY_CONFIG = {
  ADD_TAGS: ['component-slot', 'data-value'],
  ADD_ATTR: ['type', 'data-source', 'config', 'click-prompt', 'slot-id'],
};

export function HybridRenderer({
  htmlContent,
  dataContext,
  onInteraction,
  onLog,
  isInteracting = false,
}: HybridRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const mountedSlotsRef = useRef<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  const onLogRef = useRef(onLog);
  const onInteractionRef = useRef(onInteraction);
  const dataContextRef = useRef(dataContext);
  const isInteractingRef = useRef(isInteracting);

  useEffect(() => {
    onLogRef.current = onLog;
    onInteractionRef.current = onInteraction;
    dataContextRef.current = dataContext;
    isInteractingRef.current = isInteracting;
  });

  const log = useCallback((
    stage: HydrationLog['stage'],
    message: string,
    data?: HydrationLog['data']
  ) => {
    onLogRef.current?.({
      timestamp: Date.now(),
      stage,
      message,
      data,
    });
  }, []);

  const mountComponent = useCallback(
    (slot: Element, slotId: string) => {
      const componentType = slot.getAttribute('type');
      if (!componentType) {
        log('mount', 'Skipping slot: no component type specified');
        return;
      }

      const Component = COMPONENT_REGISTRY[componentType];
      if (!Component) {
        log('mount', `Unknown component type: ${componentType}`);
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'h-8';
        slot.replaceWith(emptyDiv);
        return;
      }

      const dataSource = slot.getAttribute('data-source');
      const data = resolveDataSource(dataContextRef.current, dataSource);
      const config = parseConfig(slot.getAttribute('config'));
      const clickPrompt = slot.getAttribute('click-prompt');

      log('resolve', `Data resolved for ${componentType}`, {
        componentType,
        dataResolved: data !== null,
      });

      const handleInteraction = (payload: { clickedData: unknown }) => {
        if (isInteractingRef.current) return;
        
        onInteractionRef.current('click', {
          componentType,
          clickPrompt,
          slotId,
          clickedData: payload.clickedData,
        });
      };

      const wrapper = document.createElement('div');
      wrapper.className = 'hybrid-slot';
      wrapper.setAttribute('data-slot-id', slotId);
      slot.replaceWith(wrapper);

      const root = createRoot(wrapper);
      rootsRef.current.set(slotId, root);

      const componentProps: ComponentProps = {
        data,
        config,
        clickPrompt: clickPrompt || undefined,
        slotId,
        onInteraction: clickPrompt ? handleInteraction : undefined,
      };

      log('mount', `Mounting ${componentType}`, {
        componentType,
        dataResolved: data !== null,
        props: componentProps,
      });

      root.render(
        <SlotErrorBoundary onError={(error) => {
          log('mount', `Error in ${componentType}: ${error.message}`);
        }}>
          <Component {...componentProps} />
        </SlotErrorBoundary>
      );
    },
    [log]
  );

  const cleanupRoots = useCallback(() => {
    const roots = Array.from(rootsRef.current.values());
    rootsRef.current.clear();
    mountedSlotsRef.current.clear();

    queueMicrotask(() => {
      roots.forEach((root) => {
        try {
          root.unmount();
        } catch {
          // Already unmounted
        }
      });
    });
  }, []);

  useEffect(() => {
    return () => cleanupRoots();
  }, [cleanupRoots]);

  const prevHtmlRef = useRef<string>('');

  useEffect(() => {
    if (!htmlContent) {
      cleanupRoots();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReady(false);
      prevHtmlRef.current = '';
    } else {
      // Detect fresh render vs streaming append
      const isStreaming = htmlContent.startsWith(prevHtmlRef.current) && htmlContent.length > prevHtmlRef.current.length;

      if (prevHtmlRef.current && !isStreaming) {
        // Content replaced entirely - clear old state
        cleanupRoots();
      }
      prevHtmlRef.current = htmlContent;
    }
  }, [htmlContent, cleanupRoots]);

  useEffect(() => {
    if (!containerRef.current || !htmlContent) return;

    log('parse', 'Processing HTML');
    log('sanitize', 'Sanitizing HTML');

    const sanitized = DOMPurify.sanitize(htmlContent, DOMPURIFY_CONFIG);
    const container = containerRef.current;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;

    // Convert component-slots to placeholders only if they have active React roots
    tempDiv.querySelectorAll('component-slot').forEach((slot) => {
      const slotId = generateSlotId(slot);
      if (rootsRef.current.has(slotId)) {
        const placeholder = document.createElement('div');
        placeholder.className = 'hybrid-slot';
        placeholder.setAttribute('data-slot-id', slotId);
        slot.replaceWith(placeholder);
      }
    });

    morphdom(container, tempDiv, {
      childrenOnly: true,
      getNodeKey: (node) => {
        if (node.nodeType !== 1) return undefined;
        const el = node as Element;
        if (el.hasAttribute('data-slot-id')) {
          return el.getAttribute('data-slot-id');
        }
        return undefined;
      },
      onBeforeElUpdated: (fromEl) => {
        return !fromEl.hasAttribute('data-slot-id');
      },
      onBeforeNodeDiscarded: (node) => {
        return !(node instanceof Element && node.hasAttribute('data-slot-id'));
      },
    });

    container.querySelectorAll('data-value[data-source]').forEach((el) => {
      const source = el.getAttribute('data-source');
      if (!source) return;

      const value = resolveDataValue(dataContextRef.current, source);
      if (value !== null) {
        el.textContent = String(value);
        log('resolve', `Set ${source} = ${value}`);
      }
    });

    container.querySelectorAll('component-slot').forEach((slot) => {
      const slotId = generateSlotId(slot);
      if (!mountedSlotsRef.current.has(slotId)) {
        mountComponent(slot, slotId);
        mountedSlotsRef.current.add(slotId);
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);

    log('detect', `Processing complete, ${mountedSlotsRef.current.size} slot(s) mounted`, {
      slotCount: mountedSlotsRef.current.size,
    });

  }, [htmlContent, log, mountComponent]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? (isInteracting ? 0.5 : 1) : 0 }}
      transition={{ duration: 0.2 }}
      className="hybrid-renderer"
      style={{
        pointerEvents: isInteracting ? 'none' : 'auto',
      }}
    />
  );
}
