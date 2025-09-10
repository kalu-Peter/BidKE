import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, type User as ApiUser } from '@/services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'buyer' | 'seller' | 'admin';
  status: string;
  is_verified: boolean;
  phone: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check for existing authentication on mount
    const savedUser = localStorage.getItem('bidlode_user');
    const sessionToken = localStorage.getItem('bidlode_session_token');
    
    if (savedUser && sessionToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        apiService.setSessionToken(sessionToken);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('bidlode_user');
        localStorage.removeItem('bidlode_session_token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsSubmitting(true);
    
    try {
      const result = await apiService.login(email, password);
      
      if (result.success && result.data) {
        const userData = result.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        
        return {
          success: true,
          user: userData
        };
      } else {
        return {
          success: false,
          error: result.error || 'Login failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    setIsSubmitting(true);
    
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsSubmitting(false);
    }
  };

  const register = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      const result = await apiService.register(data);
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    isSubmitting
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
