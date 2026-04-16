import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../ProfileContext';
import { profileService } from '../../services/profileService';

jest.mock('../../services/profileService', () => ({
  profileService: { getUserProfile: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function Probe() {
  const { needsProfileSetup, isProfileLoading, profile } = useProfile();
  return (
    <>
      <Text testID="loading">{String(isProfileLoading)}</Text>
      <Text testID="needs">{String(needsProfileSetup)}</Text>
      <Text testID="username">{profile?.username ?? 'none'}</Text>
    </>
  );
}

describe('ProfileContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports needsProfileSetup=true when the user has no row', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('true');
    expect(getByTestId('username').props.children).toBe('none');
  });

  it('reports needsProfileSetup=false when a row exists', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockResolvedValue({
      id: 'u1',
      username: 'jesse',
      display_name: null,
      is_public: false,
      profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
      created_at: '2026-04-15T00:00:00Z',
      updated_at: '2026-04-15T00:00:00Z',
    });

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
    expect(getByTestId('username').props.children).toBe('jesse');
  });

  it('reports needsProfileSetup=false on a transient fetch error (fall through)', async () => {
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error('network'));

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
  });

  it('clears state and does not fetch when no user is signed in', async () => {
    mockUseAuth.mockReturnValue({ state: { user: null, isAuthenticated: false } });

    const { getByTestId } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(getByTestId('needs').props.children).toBe('false');
    expect(profileService.getUserProfile).not.toHaveBeenCalled();
  });

  it("ignores a stale load result after the auth user changes", async () => {
    // First render: user 'u1', getUserProfile promise is held open
    let resolveU1!: (value: any) => void;
    const u1Promise = new Promise((resolve) => { resolveU1 = resolve; });

    (profileService.getUserProfile as jest.Mock).mockImplementationOnce(() => u1Promise);

    mockUseAuth.mockReturnValue({ state: { user: { id: 'u1' }, isAuthenticated: true } });
    const { getByTestId, rerender } = render(
      <ProfileProvider><Probe /></ProfileProvider>
    );

    // User switches to 'u2' before u1's fetch resolves.
    (profileService.getUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'u2',
      username: 'userb',
      display_name: null,
      is_public: false,
      profile_setup_dismissed_at: '2026-04-15T00:00:00Z',
      created_at: '2026-04-15T00:00:00Z',
      updated_at: '2026-04-15T00:00:00Z',
    });
    mockUseAuth.mockReturnValue({ state: { user: { id: 'u2' }, isAuthenticated: true } });
    rerender(<ProfileProvider><Probe /></ProfileProvider>);

    // Wait for u2's fetch to complete.
    await waitFor(() => expect(getByTestId('username').props.children).toBe('userb'));

    // Now u1's delayed response resolves. It must NOT overwrite u2's profile.
    await act(async () => {
      resolveU1(null); // A null response for u1 would have forced needsProfileSetup=true
      await Promise.resolve();
    });
    expect(getByTestId('username').props.children).toBe('userb');
    expect(getByTestId('needs').props.children).toBe('false');
  });
});
