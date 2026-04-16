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
});
