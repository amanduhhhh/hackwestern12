import { render, screen, waitFor } from '@testing-library/react';
import { HybridRenderer } from './HybridRenderer';
import type { DataContext, HydrationLog, InteractionPayload, ListItem, CardData } from './types';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, string>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('dompurify', () => ({
  sanitize: (html: string) => html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
}));

const mockDataContext: DataContext = {
  music: {
    top_tracks: [
      { id: '1', title: 'Track One', artist: 'Artist A' },
      { id: '2', title: 'Track Two', artist: 'Artist B' },
    ] as ListItem[],
  },
  user: {
    profile: {
      title: 'John Doe',
      description: 'Software Engineer',
    } as CardData,
  },
};

describe('HybridRenderer', () => {
  const mockOnInteraction = jest.fn<void, [string, InteractionPayload]>();
  const mockOnLog = jest.fn<void, [HydrationLog]>();

  beforeEach(() => {
    mockOnInteraction.mockClear();
    mockOnLog.mockClear();
  });

  it('renders sanitized HTML content', async () => {
    const htmlContent = '<div data-testid="test-div">Hello World</div>';

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={{}}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-div')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    expect(logs.some(log => log.stage === 'parse')).toBe(true);
    expect(logs.some(log => log.stage === 'sanitize')).toBe(true);
    expect(logs.some(log => log.stage === 'complete')).toBe(true);

    console.log('✓ Logs received:', logs.length);
    console.log('✓ Stages covered:', [...new Set(logs.map(l => l.stage))].join(', '));
  });

  it('mounts List component and logs props correctly', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
          config='{"template": {"primary": "title", "secondary": "artist"}}'
          interaction="smart"
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
      expect(screen.getByText('Artist A')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const mountLog = logs.find(log =>
      log.stage === 'mount' &&
      log.message.includes('Mounting List')
    );

    expect(mountLog).toBeDefined();
    expect(mountLog?.data?.componentType).toBe('List');
    expect(mountLog?.data?.dataResolved).toBe(true);
    expect(mountLog?.data?.props).toBeDefined();
    expect(mountLog?.data?.props?.data).toEqual(mockDataContext.music.top_tracks);
    expect(mountLog?.data?.props?.config).toEqual({
      template: { primary: 'title', secondary: 'artist' }
    });

    console.log('✓ List component mounted successfully');
    console.log('✓ Props verified:', JSON.stringify(mountLog?.data?.props?.config));
    console.log('✓ Data items:', (mountLog?.data?.props?.data as ListItem[])?.length);
  });

  it('handles multiple component-slots and logs each', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
          config='{"template": {"primary": "title", "secondary": "artist"}}'
        ></component-slot>
        <component-slot
          type="Card"
          data-source="user::profile"
          config='{"template": {"primary": "title", "secondary": "description"}}'
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const detectLog = logs.find(log => log.stage === 'detect');
    expect(detectLog?.data?.slotCount).toBe(2);

    const listMountLog = logs.find(log =>
      log.message.includes('Mounting List')
    );
    const cardMountLog = logs.find(log =>
      log.message.includes('Mounting Card')
    );

    expect(listMountLog).toBeDefined();
    expect(cardMountLog).toBeDefined();
    expect(cardMountLog?.data?.props?.data).toEqual(mockDataContext.user.profile);

    console.log('✓ Detected slots:', detectLog?.data?.slotCount);
    console.log('✓ List mounted with', (listMountLog?.data?.props?.data as ListItem[])?.length, 'items');
    console.log('✓ Card mounted with title:', (cardMountLog?.data?.props?.data as CardData)?.title);
  });

  it('handles invalid JSON in config and logs it', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
          config='invalid json'
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const mountLog = logs.find(log => log.message.includes('Mounting List'));

    expect(mountLog?.data?.props?.config).toEqual({});

    console.log('✓ Invalid JSON handled gracefully');
    console.log('✓ Config defaulted to empty object');
  });

  it('logs unknown component type', async () => {
    const htmlContent = `
      <div data-testid="container">
        <component-slot
          type="UnknownComponent"
          data-source="music::top_tracks"
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      const container = screen.getByTestId('container');
      expect(container.querySelector('.h-8')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const errorLog = logs.find(log =>
      log.message.includes('Unknown component type')
    );

    expect(errorLog).toBeDefined();
    console.log('✓ Unknown component logged:', errorLog?.message);
  });

  it('handles missing data-source and logs null data', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const resolveLog = logs.find(log =>
      log.stage === 'resolve' &&
      log.message.includes('Data resolved')
    );

    expect(resolveLog?.data?.dataResolved).toBe(false);
    console.log('✓ Missing data-source handled, dataResolved:', resolveLog?.data?.dataResolved);
  });

  it('handles missing namespace in data-source', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="nonexistent::data"
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const resolveLog = logs.find(log =>
      log.stage === 'resolve' &&
      log.message.includes('Data resolved')
    );

    expect(resolveLog?.data?.dataResolved).toBe(false);
    console.log('✓ Nonexistent namespace handled');
  });

  it('sanitizes malicious HTML', async () => {
    const htmlContent = `
      <div>
        <script>alert('xss')</script>
        <div data-testid="safe">Safe content</div>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={{}}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('safe')).toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    expect(logs.some(log => log.stage === 'sanitize')).toBe(true);
    console.log('✓ XSS script removed');
  });

  it('calls onInteraction with correct typed payload', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
          config='{"template": {"primary": "title", "secondary": "artist"}}'
          interaction="smart"
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    screen.getByText('Track One').click();

    expect(mockOnInteraction).toHaveBeenCalledWith('select', expect.objectContaining({
      componentType: 'List',
      interaction: 'smart',
      item: expect.objectContaining({ id: '1', title: 'Track One' }),
      index: 0,
    }));

    const payload = mockOnInteraction.mock.calls[0][1];
    console.log('✓ Interaction type:', mockOnInteraction.mock.calls[0][0]);
    console.log('✓ Payload componentType:', payload.componentType);
    console.log('✓ Payload item:', JSON.stringify(payload.item));
  });

  it('logs complete hydration lifecycle', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
          config='{"template": {"primary": "title"}}'
        ></component-slot>
      </div>
    `;

    render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    const logs = mockOnLog.mock.calls.map(call => call[0]);
    const stages = logs.map(l => l.stage);

    expect(stages).toContain('parse');
    expect(stages).toContain('sanitize');
    expect(stages).toContain('detect');
    expect(stages).toContain('resolve');
    expect(stages).toContain('mount');
    expect(stages).toContain('complete');

    console.log('✓ Complete lifecycle logged:');
    logs.forEach(log => {
      console.log(`  [${log.stage}] ${log.message}`);
    });
  });

  it('cleans up roots on unmount', async () => {
    const htmlContent = `
      <div>
        <component-slot
          type="List"
          data-source="music::top_tracks"
        ></component-slot>
      </div>
    `;

    const { unmount } = render(
      <HybridRenderer
        htmlContent={htmlContent}
        dataContext={mockDataContext}
        onInteraction={mockOnInteraction}
        onLog={mockOnLog}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Track One')).toBeInTheDocument();
    });

    unmount();

    expect(screen.queryByText('Track One')).not.toBeInTheDocument();
    console.log('✓ Component unmounted and cleaned up');
  });
});
