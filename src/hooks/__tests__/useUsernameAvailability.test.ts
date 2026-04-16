// src/hooks/__tests__/useUsernameAvailability.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useUsernameAvailability } from '../useUsernameAvailability';
import { profileService } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  profileService: { checkUsernameAvailable: jest.fn() },
}));

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns idle for empty input', () => {
    const { result } = renderHook(() => useUsernameAvailability(''));
    expect(result.current).toEqual({ state: 'idle' });
  });

  it('returns invalid when too short', () => {
    const { result } = renderHook(() => useUsernameAvailability('ab'));
    expect(result.current.state).toBe('invalid');
  });

  it('returns invalid for uppercase or illegal characters', () => {
    const { result } = renderHook(() => useUsernameAvailability('No!'));
    expect(result.current.state).toBe('invalid');
  });

  it('returns checking immediately and available after debounce when free', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useUsernameAvailability('jesse'));
    expect(result.current.state).toBe('checking');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.state).toBe('available');
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledWith('jesse');
  });

  it('returns taken when the service reports the name is in use', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(false);
    const { result } = renderHook(() => useUsernameAvailability('jesse'));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.state).toBe('taken');
  });

  it('cancels an in-flight check when the input changes before the debounce fires', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ value }) => useUsernameAvailability(value),
      { initialProps: { value: 'jesse' } },
    );
    expect(result.current.state).toBe('checking');
    rerender({ value: 'jesseb' });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledTimes(1);
    expect(profileService.checkUsernameAvailable).toHaveBeenCalledWith('jesseb');
  });

  it('returns idle on network error', async () => {
    (profileService.checkUsernameAvailable as jest.Mock).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useUsernameAvailability('jesse'));
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.state).toBe('idle');
  });
});
