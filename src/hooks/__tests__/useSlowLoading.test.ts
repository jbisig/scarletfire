import { renderHook, act } from '@testing-library/react-native';
import { useSlowLoading } from '../useSlowLoading';

describe('useSlowLoading', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stays false until loading has lasted the full delay', () => {
    const { result } = renderHook(() => useSlowLoading(true, 3000));
    expect(result.current).toBe(false);
    act(() => { jest.advanceTimersByTime(2999); });
    expect(result.current).toBe(false);
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe(true);
  });

  it('resets when loading finishes, and restarts the clock on the next load', () => {
    const { result, rerender } = renderHook(({ loading }) => useSlowLoading(loading, 3000), {
      initialProps: { loading: true },
    });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);

    rerender({ loading: true });
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current).toBe(false);
  });

  it('never fires if loading ends before the delay', () => {
    const { result, rerender } = renderHook(({ loading }) => useSlowLoading(loading, 3000), {
      initialProps: { loading: true },
    });
    act(() => { jest.advanceTimersByTime(1500); });
    rerender({ loading: false });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current).toBe(false);
  });
});
