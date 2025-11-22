import { useStreamStore } from '@/stores/stream';

describe('useStreamStore', () => {
  beforeEach(() => {
    useStreamStore.setState({
      isStreaming: false,
      dataContext: {},
      htmlContent: '',
      rawResponse: '',
      error: null,
    });
  });

  it('should have correct initial state', () => {
    const state = useStreamStore.getState();

    expect(state.isStreaming).toBe(false);
    expect(state.dataContext).toEqual({});
    expect(state.htmlContent).toBe('');
    expect(state.rawResponse).toBe('');
    expect(state.error).toBeNull();
  });

  it('should reset state correctly', () => {
    useStreamStore.setState({
      isStreaming: true,
      dataContext: { test: { value: 123 } },
      htmlContent: '<div>test</div>',
      rawResponse: '<div>test</div>',
      error: 'some error',
    });

    useStreamStore.getState().reset();
    const state = useStreamStore.getState();

    expect(state.isStreaming).toBe(false);
    expect(state.dataContext).toEqual({});
    expect(state.htmlContent).toBe('');
    expect(state.rawResponse).toBe('');
    expect(state.error).toBeNull();
  });
});
