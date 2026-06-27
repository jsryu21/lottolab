"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface UserSession {
  id: string;
  email: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  isLocalMode: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ success: boolean; requiresOtp?: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLocalMode = !isSupabaseConfigured;

  useEffect(() => {
    if (isLocalMode) {
      const savedSession = localStorage.getItem("lottolab_session");
      if (savedSession) {
        try {
          const u = JSON.parse(savedSession) as UserSession;
          setUser(u);
        } catch {
          localStorage.removeItem("lottolab_session");
        }
      }
      setIsLoading(false);
    } else {
      const getInitialSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || "" });
          }
        } catch (error) {
          console.error("Supabase session restore error:", error);
        } finally {
          setIsLoading(false);
        }
      };

      getInitialSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || "" });
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      return () => { subscription.unsubscribe(); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalMode]);

  const login = async (email: string, pass: string) => {
    if (isLocalMode) {
      const mockUser: UserSession = { id: "mock-user-uuid-12345", email };
      localStorage.setItem("lottolab_session", JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  };

  const signUp = async (email: string, pass: string) => {
    if (isLocalMode) {
      const mockUser: UserSession = { id: "mock-user-uuid-12345", email };
      localStorage.setItem("lottolab_session", JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass });
      if (error) return { success: false, error: error.message };
      return { success: true, requiresOtp: true };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    if (isLocalMode) return { success: true };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const resendOtp = async (email: string) => {
    if (isLocalMode) return { success: true };
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    if (isLocalMode) {
      localStorage.removeItem("lottolab_session");
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isLocalMode, login, signUp, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
