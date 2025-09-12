import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, type User as ApiUser } from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  status: string;
  is_verified: boolean;
  phone: string;
  created_at: string;
  role?: string; // Add role for dashboard layout
  name?: string; // Add name for display
  roles?: Array<{
    role_name: string;
    role_display_name: string;
    is_primary: boolean;
    role_status: string;
    can_login: boolean;
  }>; // Roles array as returned by API
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, preferredRole?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
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
        // Ensure role and name are set for backward compatibility
        if (!userData.role) userData.role = 'buyer';
        if (!userData.name) userData.name = userData.username;
        
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

  const login = async (username: string, password: string, preferredRole?: string) => {
    setIsSubmitting(true);
    
    try {
      const result = await apiService.login(username, password);
      
      if (result.success && result.data) {
        // Check if user has the preferred role, otherwise use primary role
        let selectedRole = result.data.roles?.[0]?.role_name || 'buyer';
        
        if (preferredRole && result.data.roles) {
          const hasPreferredRole = result.data.roles.some(role => role.role_name === preferredRole);
          if (hasPreferredRole) {
            selectedRole = preferredRole;
          }
        }
        
        const userData = {
          ...result.data.user,
          role: selectedRole, // Use the selected role for dashboard routing
          name: result.data.user.username, // Use username as display name
          roles: result.data.roles // Keep full roles array as returned by API
        };
        
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
