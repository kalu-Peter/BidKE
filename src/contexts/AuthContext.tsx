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
  isLoading: boolean; // Add loading state
  login: (username: string, password: string, preferredRole?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check for existing authentication on mount
    const checkExistingAuth = async () => {
      const savedUser = localStorage.getItem('bidlode_user');
      const sessionToken = localStorage.getItem('bidlode_session_token');

      if (savedUser && sessionToken) {
        try {
          // Validate the session token with the server
          apiService.setSessionToken(sessionToken);
          const profileResult = await apiService.getUserProfile();

          if (profileResult.success && profileResult.data) {
            const userData = JSON.parse(savedUser);
            // Update with fresh data from server, but keep roles from login
            const updatedUserData = {
              ...userData,
              ...profileResult.data,
              // Keep the role and roles from login, don't overwrite with profile data
              role: userData.role || 'buyer',
              name: profileResult.data.username || userData.name || userData.username,
              roles: userData.roles // Keep roles from login
            };

            setUser(updatedUserData);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear local storage
            console.warn('Session token invalid, clearing authentication');
            localStorage.removeItem('bidlode_user');
            localStorage.removeItem('bidlode_session_token');
            apiService.setSessionToken(null);
          }
        } catch (error) {
          console.error('Failed to validate session:', error);
          // Clear invalid session data
          localStorage.removeItem('bidlode_user');
          localStorage.removeItem('bidlode_session_token');
          apiService.setSessionToken(null);
        }
      }

      setIsLoading(false); // Set loading to false after validation
    };

    checkExistingAuth();
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
    isLoading,
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
