// src/hooks/__tests__/useSyncErrorToast.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useSyncErrorToast } from '../useSyncErrorToast';
import { useToast } from '../../contexts/ToastContext';

jest.mock('../../contexts/ToastContext', () => ({
  useToast: jest.fn(),
}));

describe('useSyncErrorToast', () => {
  const showToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useToast as jest.Mock).mockReturnValue({ showToast });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the given message as an error toast', () => {
    const { result } = renderHook(() => useSyncErrorToast('Failed to sync.'));

    act(() => {
      result.current();
    });

    expect(showToast).toHaveBeenCalledWith('Failed to sync.', 'error');
  });

  it('rate-limits repeated calls within the 30s cooldown', () => {
    const { result } = renderHook(() => useSyncErrorToast('Failed to sync.'));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it('allows another toast after the 30s cooldown elapses', () => {
    const { result } = renderHook(() => useSyncErrorToast('Failed to sync.'));

    act(() => {
      result.current();
    });
    act(() => {
      jest.advanceTimersByTime(30001);
    });
    act(() => {
      result.current();
    });

    expect(showToast).toHaveBeenCalledTimes(2);
  });

  it('does not show another toast right at the cooldown boundary', () => {
    const { result } = renderHook(() => useSyncErrorToast('Failed to sync.'));

    act(() => {
      result.current();
    });
    act(() => {
      jest.advanceTimersByTime(29999);
    });
    act(() => {
      result.current();
    });

    expect(showToast).toHaveBeenCalledTimes(1);
  });
});
