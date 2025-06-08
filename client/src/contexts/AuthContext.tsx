import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'FRANCHISE_MANAGER' | 'COUNTER_OPERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  hasMinRole: (minRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleHierarchy = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  FRANCHISE_MANAGER: 2,
  COUNTER_OPERATOR: 1,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      const { user: userData, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const hasMinRole = (minRole: string): boolean => {
    if (!user) return false;
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const minRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;
    return userRoleLevel >= minRoleLevel;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
    hasMinRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
