import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para atualizar o estado do usuário
  const refreshUser = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Função para fazer login
  const login = useCallback(async (credentials) => {
    try {
      const user = await User.login(credentials);
      if (user) {
        setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  }, []);

  // Função para fazer logout
  const logout = useCallback(async () => {
    try {
      await User.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }, []);

  // Verificar autenticação na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function useCurrentUser() {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  return { currentUser, isLoading, isAuthenticated };
}

export function useAuthActions() {
  const { login, logout, refreshUser } = useAuth();
  return { login, logout, refreshUser };
}