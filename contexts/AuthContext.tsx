import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@/types';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: (callback?: () => void) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>; // Add refresh function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const authUser = await AuthService.getCurrentUser();
      setUser(authUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    AuthService.getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password);
    
    if (result.user) {
      // Get the full user data including profile
      const authUser = await AuthService.getCurrentUser();
      setUser(authUser);
      return { success: true, error: null };
    }
    
    return { success: false, error: result.error };
  };

  const signUp = async (email: string, password: string) => {
    await AuthService.signUp(email, password);
  };

  const signOut = async (callback?: () => void) => {
    await AuthService.signOut();
    callback?.();
    setUser(null);
    
    // Clear all queries from the cache when signing out
    queryClient.clear();
  };

  const updateProfile = async (updates: any) => {
    const updatedProfile = await AuthService.updateProfile(updates);
    if (user) {
      setUser({ ...user, profile: updatedProfile });
    }
  };

  const completeOnboarding = async (data: any) => {
    await AuthService.completeOnboarding(data);
    // Refresh user data
    const updatedUser = await AuthService.getCurrentUser();
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        completeOnboarding,
        refreshUser,
      }}
    >
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