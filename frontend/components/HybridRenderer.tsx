'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import DOMPurify from 'dompurify';
import morphdom from 'morphdom';
import { motion } from 'framer-motion';
import { COMPONENT_REGISTRY } from './registry';
import type {
  ComponentConfig,
  ComponentProps,
  ComponentData,
  DataContext,
  HydrationLog,
  InteractionPayload,
} from './types';

interface HybridRendererProps {
  htmlContent: string;
  dataContext: DataContext;
  onInteraction: (type: string, payload: InteractionPayload) => void;
  onLog?: (log: HydrationLog) => void;
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

function generateSlotId(slot: Element): string {
  const type = slot.getAttribute('type') || 'unknown';
  const dataSource = slot.getAttribute('data-source') || '';
  return `${type}::${dataSource}`;
}

function resolveDataSource(
  dataContext: DataContext,
  dataSource: string | null
): ComponentData {
  if (!dataSource) return null;

  const parts = dataSource.split('::');
  if (parts.length !== 2) return null;

  const [namespace, key] = parts;
  const namespaceData = dataContext[namespace];
  if (!namespaceData) return null;

  return namespaceData[key] ?? null;
}

function parseConfig(configString: string | null): ComponentConfig {
  if (!configString) return {};
  try {
    return JSON.parse(configString) as ComponentConfig;
  } catch {
    return {};
  }
}

const DOMPURIFY_CONFIG = {
  ADD_TAGS: ['component-slot'],
  ADD_ATTR: ['type', 'data-source', 'config', 'interaction'],
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: /^component-slot$/i,
    attributeNameCheck: /^(type|data-source|config|interaction)$/i,
    allowCustomizedBuiltInElements: true,
  },
};

export function HybridRenderer({
  htmlContent,
  dataContext,
  onInteraction,
  onLog,
}: HybridRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());
  const mountedSlotsRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<MutationObserver | null>(null);
  const lastClosingTagCountRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  const onLogRef = useRef(onLog);
  onLogRef.current = onLog;

  const onInteractionRef = useRef(onInteraction);
  onInteractionRef.current = onInteraction;

  const dataContextRef = useRef(dataContext);
  dataContextRef.current = dataContext;

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
      const interaction = slot.getAttribute('interaction');

      log('resolve', `Data resolved for ${componentType}`, {
        componentType,
        dataResolved: data !== null,
      });

      const handleInteraction = (
        type: string,
        payload: Omit<InteractionPayload, 'componentType' | 'interaction'>
      ) => {
        onInteractionRef.current(type, {
          componentType,
          interaction,
          ...payload,
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
        onInteraction: handleInteraction,
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
          // Root already unmounted
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          const element = node as Element;

          if (element.nodeName === 'COMPONENT-SLOT') {
            const slotId = generateSlotId(element);

            if (!mountedSlotsRef.current.has(slotId)) {
              mountComponent(element, slotId);
              mountedSlotsRef.current.add(slotId);
            }
          }

          const nestedSlots = element.querySelectorAll('component-slot');
          nestedSlots.forEach((slot) => {
            const slotId = generateSlotId(slot);

            if (!mountedSlotsRef.current.has(slotId)) {
              mountComponent(slot, slotId);
              mountedSlotsRef.current.add(slotId);
            }
          });
        }
      }

      if (mountedSlotsRef.current.size > 0) {
        setIsReady(true);
      }
    });

    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      cleanupRoots();
    };
  }, [mountComponent, cleanupRoots]);

  useEffect(() => {
    if (!containerRef.current || !htmlContent) return;

    const closingTagCount = (htmlContent.match(/<\/component-slot>/g) || []).length;

    if (closingTagCount === lastClosingTagCountRef.current && mountedSlotsRef.current.size > 0) {
      return;
    }

    lastClosingTagCountRef.current = closingTagCount;

    log('parse', 'Processing HTML');
    log('sanitize', 'Sanitizing HTML');

    const sanitized = DOMPurify.sanitize(htmlContent, DOMPURIFY_CONFIG);
    const container = containerRef.current;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;

    const existingWrappers = new Map<string, Element>();
    container.querySelectorAll('.hybrid-slot[data-slot-id]').forEach(wrapper => {
      const id = wrapper.getAttribute('data-slot-id');
      if (id) existingWrappers.set(id, wrapper);
    });

    tempDiv.querySelectorAll('component-slot').forEach((slot) => {
      const slotId = generateSlotId(slot);
      const existingWrapper = existingWrappers.get(slotId);
      if (existingWrapper) {
        slot.replaceWith(existingWrapper.cloneNode(true));
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
      onBeforeElUpdated: (fromEl, toEl) => {
        if (fromEl.hasAttribute('data-slot-id')) {
          return false;
        }
        return true;
      },
      onBeforeNodeDiscarded: (node) => {
        if (node instanceof Element && node.hasAttribute('data-slot-id')) {
          return false;
        }
        return true;
      },
    });

    log('detect', `Processing complete, ${mountedSlotsRef.current.size} slot(s) mounted`, {
      slotCount: mountedSlotsRef.current.size,
    });

  }, [htmlContent, log]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className="hybrid-renderer"
    />
  );
}
