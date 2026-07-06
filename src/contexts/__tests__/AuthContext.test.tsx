import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/authService';

type AuthCallback = (user: { id: string } | null) => void;

jest.mock('../../services/authService', () => ({
  authService: {
    onAuthStateChanged: jest.fn(),
    getClient: jest.fn(() => ({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    })),
  },
}));

function Probe() {
  const { state } = useAuth();
  return (
    <>
      <Text testID="isAuthenticated">{String(state.isAuthenticated)}</Text>
      <Text testID="userId">{state.user?.id ?? 'none'}</Text>
      <Text testID="isLoading">{String(state.isLoading)}</Text>
    </>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the user when a later SIGNED_OUT event arrives after the initial resolve', async () => {
    let emit: AuthCallback = () => {};
    (authService.onAuthStateChanged as jest.Mock).mockImplementation((callback: AuthCallback) => {
      emit = callback;
      return jest.fn(); // unsubscribe
    });

    const { getByTestId } = render(
      <AuthProvider><Probe /></AuthProvider>
    );

    // Initial resolve: user is signed in.
    await act(async () => {
      emit({ id: 'u1' });
    });

    await waitFor(() => expect(getByTestId('isAuthenticated').props.children).toBe('true'));
    expect(getByTestId('userId').props.children).toBe('u1');
    expect(getByTestId('isLoading').props.children).toBe('false');

    // A later SIGNED_OUT event (e.g. session expiry, cross-tab sign-out) must
    // still reach the reducer and clear the user — this is the bug: a
    // `hasResolved` guard previously swallowed every event after the first.
    await act(async () => {
      emit(null);
    });

    await waitFor(() => expect(getByTestId('isAuthenticated').props.children).toBe('false'));
    expect(getByTestId('userId').props.children).toBe('none');
  });
});
