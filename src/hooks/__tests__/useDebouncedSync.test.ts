// src/hooks/__tests__/useDebouncedSync.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useDebouncedSync } from '../useDebouncedSync';

function fireAppStateChange(nextState: string) {
  const mockFn = AppState.addEventListener as jest.Mock;
  // Grab the most recently registered 'change' handler and invoke it.
  const call = [...mockFn.mock.calls].reverse().find(([event]) => event === 'change');
  expect(call).toBeDefined();
  const handler = call![1] as (state: string) => void;
  act(() => {
    handler(nextState);
  });
}

describe('useDebouncedSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not sync before the trailing delay elapses', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
    });
    act(() => {
      jest.advanceTimersByTime(29999);
    });

    expect(syncFn).not.toHaveBeenCalled();
  });

  it('syncs exactly once after the trailing delay elapses', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
    });
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('coalesces multiple rapid changes into a single sync', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
      jest.advanceTimersByTime(10000);
      result.current.schedule();
      jest.advanceTimersByTime(10000);
      result.current.schedule();
    });
    act(() => {
      jest.advanceTimersByTime(29999);
    });
    expect(syncFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('flush() fires immediately when a sync is pending', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
      result.current.flush();
    });

    expect(syncFn).toHaveBeenCalledTimes(1);

    // The pending timer should have been cancelled by flush — advancing
    // time must not trigger a second call.
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('flush() is a no-op when nothing is pending', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.flush();
    });

    expect(syncFn).not.toHaveBeenCalled();
  });

  it('flushes immediately when the app backgrounds', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
    });
    expect(syncFn).not.toHaveBeenCalled();

    fireAppStateChange('background');

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('flushes immediately when the app becomes inactive', () => {
    const syncFn = jest.fn();
    const { result } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
    });
    fireAppStateChange('inactive');

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('does not sync on backgrounding when nothing is pending', () => {
    const syncFn = jest.fn();
    renderHook(() => useDebouncedSync(syncFn, 30000));

    fireAppStateChange('background');

    expect(syncFn).not.toHaveBeenCalled();
  });

  it('flushes a pending sync on unmount', () => {
    const syncFn = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedSync(syncFn, 30000));

    act(() => {
      result.current.schedule();
    });
    expect(syncFn).not.toHaveBeenCalled();

    unmount();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('does not sync on unmount when nothing is pending', () => {
    const syncFn = jest.fn();
    const { unmount } = renderHook(() => useDebouncedSync(syncFn, 30000));

    unmount();

    expect(syncFn).not.toHaveBeenCalled();
  });

  it('always calls the latest sync function, avoiding stale closures', () => {
    let counter = 0;
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSync(() => { counter += value; }, 30000),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 5 });

    act(() => {
      result.current.schedule();
      jest.advanceTimersByTime(30000);
    });

    expect(counter).toBe(5);
  });
});
