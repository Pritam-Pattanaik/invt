import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'FRANCHISE_MANAGER' | 'COUNTER_OPERATOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log('Checking authentication state...');
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        console.log('Auth check:', {
          hasToken: !!token,
          hasUserData: !!userData,
          tokenLength: token?.length || 0
        });

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Setting user from localStorage:', {
            email: parsedUser.email,
            role: parsedUser.role
          });
          setUser(parsedUser);
        } else {
          // If either token or user data is missing, clear everything
          console.log('Missing auth data, clearing localStorage');
          setUser(null);
          if (!token || !userData) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('authToken'); // Remove old key for backward compatibility
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authToken'); // Remove old key for backward compatibility
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        console.log('Auth check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Attempting login with email:', email);

      // Use the proper API service that handles environment detection
      const response = await authAPI.login({ email, password });
      const data = response.data;

      console.log('Login response received:', {
        hasUser: !!data.user,
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken
      });

      // Store tokens and user data
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update user state
      setUser(data.user);
      toast.success('Login successful!');
      console.log('Login successful, user state updated');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          error.message ||
                          'Invalid email or password';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authToken'); // Remove old key for backward compatibility
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };

  const checkAuthState = () => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      // Authentication state is inconsistent, clear everything
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } else {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
