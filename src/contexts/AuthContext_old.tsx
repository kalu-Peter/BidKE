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

// Mock user database
const mockUsers: Record<string, User> = {
  'buyer@test.com': {
    id: '1',
    email: 'buyer@test.com',
    name: 'John Doe',
    role: 'buyer',
    status: 'email_verified'
  },
  'buyer.approved@test.com': {
    id: '2',
    email: 'buyer.approved@test.com',
    name: 'Jane Smith',
    role: 'buyer',
    status: 'approved'
  },
  'seller@test.com': {
    id: '3',
    email: 'seller@test.com',
    name: 'ABC Auctioneers Ltd',
    role: 'seller',
    status: 'email_verified',
    verificationStatus: 'pending'
  },
  'seller.approved@test.com': {
    id: '4',
    email: 'seller.approved@test.com',
    name: 'Kenya Bank Ltd',
    role: 'seller',
    status: 'approved',
    verificationStatus: 'approved'
  },
  'admin@bidlode.com': {
    id: '5',
    email: 'admin@bidlode.com',
    name: 'Admin User',
    role: 'admin',
    status: 'approved'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('bidlode_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('bidlode_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData = mockUsers[email];
    
    if (!userData || password !== 'password') {
      throw new Error('Invalid credentials');
    }

    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('bidlode_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bidlode_user');
  };

  const updateUserStatus = (status: User['status']) => {
    if (user) {
      const updatedUser = { ...user, status };
      setUser(updatedUser);
      localStorage.setItem('bidlode_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      updateUserStatus
    }}>
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
