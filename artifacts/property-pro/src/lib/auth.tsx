import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { User, useGetMe } from "@workspace/api-client-react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("property_pro_token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Configure fetch defaults to include the token
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const currentToken = localStorage.getItem("property_pro_token");
      if (currentToken) {
        init = {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${currentToken}`,
          },
        };
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      // Token likely invalid or expired
      logout();
    }
  }, [error]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("property_pro_token", newToken);
    setToken(newToken);
    queryClient.setQueryData([`/api/auth/me`], newUser);
    
    // Route based on role
    switch (newUser.role) {
      case 'owner': setLocation('/dashboard/owner'); break;
      case 'admin': setLocation('/dashboard/admin'); break;
      case 'tenant': setLocation('/dashboard/tenant'); break;
      case 'vendor': setLocation('/dashboard/vendor'); break;
      default: setLocation('/');
    }
  };

  const logout = () => {
    localStorage.removeItem("property_pro_token");
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading: isLoading && !!token,
      login,
      logout,
      isAuthenticated: !!user
    }}>
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
