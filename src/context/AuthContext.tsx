'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { verifyMockJwt } from '../lib/jwt';

// Define the shape of our authentication context
interface AuthContextType {
  isLoggedIn: boolean;
  userRole: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component to wrap your application or parts of it
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  // On initial load, check for an existing token in localStorage and validate it.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // --- IMPORTANT CLEANUP ---
      // Remove the old 'isLoggedIn' boolean flag to prevent conflicts
      localStorage.removeItem('isLoggedIn');
      // --- END IMPORTANT CLEANUP ---

      const token = localStorage.getItem('mockAuthToken');
      if (token) {
        const payload = verifyMockJwt(token); // Verify the token
        if (payload) {
          setIsLoggedIn(true);
          setUserRole(payload.role);
          console.log('AuthContext: User re-authenticated from stored token.');
        } else {
          // Token invalid or expired, clear it and force logout
          console.warn('AuthContext: Stored token is invalid or expired. Logging out.');
          localStorage.removeItem('mockAuthToken');
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false); // No token found
        setUserRole(null);
      }
    }
  }, []); // Run once on mount

  // Async login function to call the mock API
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('mockAuthToken', data.token);
        const payload = verifyMockJwt(data.token);
        if (payload) {
            setIsLoggedIn(true);
            setUserRole(payload.role);
            console.log('AuthContext: Login successful and token stored.');
            return true;
        }
      }
      console.warn('AuthContext: Login failed with response:', data.message);
      return false;
    } catch (error) {
      console.error('AuthContext: Login API error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockAuthToken');
      console.log('AuthContext: User logged out and token cleared.');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};