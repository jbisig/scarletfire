import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import { authService } from '../services/authService';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/registry';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSkippedLogin: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_STATE_CHANGED'; user: User | null }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'USER_UPDATED'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'SKIP_LOGIN' }
  | { type: 'UNSKIP_LOGIN' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  // On web, default to skipped login so users land in the app immediately
  hasSkippedLogin: Platform.OS === 'web',
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      return {
        ...state,
        user: action.user,
        isAuthenticated: !!action.user,
        isLoading: false,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.user,
        isAuthenticated: true,
        hasSkippedLogin: false,
        isLoading: false,
        error: null,
      };

    case 'USER_UPDATED':
      return {
        ...state,
        user: action.user,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SKIP_LOGIN':
      return {
        ...state,
        hasSkippedLogin: true,
        isLoading: false,
      };

    case 'UNSKIP_LOGIN':
      return {
        ...state,
        hasSkippedLogin: false,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  skipLogin: () => Promise<void>;
  showLogin: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Supabase auth state changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let hasResolved = false;

    // Set a timeout to prevent infinite loading if auth check hangs
    timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        logger.auth.warn('Auth check timed out after 5 seconds');
        dispatch({ type: 'SET_ERROR', error: 'Authentication check timed out. Some features may be unavailable.' });
        dispatch({ type: 'AUTH_STATE_CHANGED', user: null });
      }
    }, 5000); // 5 second timeout

    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeoutId);
        dispatch({ type: 'AUTH_STATE_CHANGED', user });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // On web, the session user from JWT may lack full metadata (e.g. Google avatar_url).
  // Fetch the complete user from the API to ensure we have all fields.
  useEffect(() => {
    if (Platform.OS === 'web' && state.isAuthenticated && state.user) {
      authService.getClient().auth.getUser().then(({ data }: { data: { user: User | null } }) => {
        if (data.user) {
          dispatch({ type: 'USER_UPDATED', user: data.user });
        }
      }).catch(() => {
        // Non-critical — avatar may be missing but app still works
      });
    }
  }, [state.isAuthenticated]);

  // Check if user previously skipped login
  useEffect(() => {
    const checkSkipStatus = async () => {
      const skipped = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SKIPPED);
      if (skipped === 'true' && !state.user) {
        dispatch({ type: 'SKIP_LOGIN' });
      }
    };
    checkSkipStatus();
  }, [state.user]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const user = await authService.loginWithEmail(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', user });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const user = await authService.signUpWithEmail(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', user });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const user = await authService.loginWithGoogle();
      dispatch({ type: 'LOGIN_SUCCESS', user });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const loginWithApple = async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const user = await authService.loginWithApple();
      dispatch({ type: 'LOGIN_SUCCESS', user });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Apple';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  };

  const deleteAccount = async () => {
    if (!state.user?.id) {
      throw new Error('No user logged in');
    }
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      await authService.deleteAccount(state.user.id);
      dispatch({ type: 'LOGOUT' });
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const skipLogin = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SKIPPED, 'true');
    dispatch({ type: 'SKIP_LOGIN' });
  };

  const showLogin = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SKIPPED);
    dispatch({ type: 'UNSKIP_LOGIN' });
  };

  const refreshUser = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        dispatch({ type: 'USER_UPDATED', user: session.user });
      }
    } catch (error) {
      logger.auth.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        loginWithApple,
        logout,
        deleteAccount,
        skipLogin,
        showLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
