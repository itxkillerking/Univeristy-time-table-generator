import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../lib/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'Admin' | 'Student';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      let res = await apiClient('/api/auth/user/');
      
      // If unauthorized, attempt to refresh token
      if (res.status === 401) {
        const refreshRes = await apiClient('/api/auth/token/refresh/', { method: 'POST' });
        if (refreshRes.ok) {
          // Retry fetching user profile
          res = await apiClient('/api/auth/user/');
        }
      }

      if (res.ok) {
        const data = await res.json();
        setState({ user: data, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    } catch (err: any) {
      // Network errors when Django is offline
      setState({ user: null, loading: false, error: "Unable to connect to the Django server." });
    }
  };

  const login = async (credentials: any) => {
    try {
      const res = await apiClient('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, user: data.user, error: null }));
      } else if (res.status === 401 || res.status === 400) {
        throw new Error("Invalid username or password.");
      } else if (res.status === 500) {
        throw new Error("Server error. Please try again.");
      } else {
        throw new Error("Login failed");
      }
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error("Unable to connect to the Django server.");
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient('/api/auth/logout/', { method: 'POST' });
    } catch (e) {
      console.error('Logout request failed', e);
    }
    setState({ user: null, loading: false, error: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
