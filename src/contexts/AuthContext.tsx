import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  | { type: 'LOGOUT' }
  | { type: 'SKIP_LOGIN' }
  | { type: 'UNSKIP_LOGIN' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasSkippedLogin: false,
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
  logout: () => Promise<void>;
  skipLogin: () => Promise<void>;
  showLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      dispatch({ type: 'AUTH_STATE_CHANGED', user });
    });

    return unsubscribe;
  }, []);

  // Check if user previously skipped login
  useEffect(() => {
    const checkSkipStatus = async () => {
      const skipped = await AsyncStorage.getItem('@auth_skipped');
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
      await AsyncStorage.removeItem('@auth_skipped');
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
      await AsyncStorage.removeItem('@auth_skipped');
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
      await AsyncStorage.removeItem('@auth_skipped');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      await AsyncStorage.removeItem('@auth_skipped');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  };

  const skipLogin = async () => {
    await AsyncStorage.setItem('@auth_skipped', 'true');
    dispatch({ type: 'SKIP_LOGIN' });
  };

  const showLogin = async () => {
    await AsyncStorage.removeItem('@auth_skipped');
    dispatch({ type: 'UNSKIP_LOGIN' });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        skipLogin,
        showLogin,
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
