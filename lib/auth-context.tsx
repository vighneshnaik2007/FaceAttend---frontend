'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiLogin, apiLogout } from './api';

interface AssignedSubject {
  code: string;
  name: string;
  contactHours?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  department?: string;
  teacherId?: string;
  assignedSubject?: AssignedSubject;
  subject_code?: string;
  section?: string;
  room?: string;
  semester?: string | number;
  usn?: string;
  branch?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: 'teacher' | 'student' | 'admin') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('faceattend_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('faceattend_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: 'teacher' | 'student' | 'admin',
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiLogin(email, password, role);
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('faceattend_user', JSON.stringify(res.user));
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    apiLogout().catch(() => {});
    setUser(null);
    localStorage.removeItem('faceattend_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
