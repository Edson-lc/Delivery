// Importações necessárias para o contexto de autenticação
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import httpClient from '../api/httpClient';
import { API_URLS } from '../constants';

/**
 * Interface que define a estrutura de dados do usuário
 * Contém todas as informações necessárias para autenticação e perfil
 */
export interface User {
  id: string;                    // ID único do usuário
  email: string;                  // Email do usuário (usado para login)
  fullName: string;               // Nome completo do usuário
  nome?: string;                  // Primeiro nome (opcional)
  sobrenome?: string;             // Sobrenome (opcional)
  fotoUrl?: string;               // URL da foto de perfil (opcional)
  telefone?: string;              // Número de telefone (opcional)
  tipoUsuario?: 'cliente' | 'restaurante' | 'entregador' | 'admin';  // Tipo de usuário no sistema
  role?: 'admin' | 'user';        // Role de permissão (admin ou usuário comum)
  status?: 'ativo' | 'inativo' | 'suspenso';  // Status da conta
  restaurantId?: string;          // ID do restaurante (se for usuário de restaurante)
  consentimentoDados?: boolean;   // Consentimento para uso de dados
  createdDate?: string;           // Data de criação da conta
  updatedDate?: string;           // Data da última atualização
  enderecosSalvos?: any[];        // Endereços salvos do usuário (JSON array)
}

/**
 * Interface para resposta de autenticação da API
 * Contém o token JWT e os dados do usuário
 */
interface AuthResponse {
  token: string;  // Token JWT para autenticação
  user: User;     // Dados completos do usuário
}

/**
 * Interface que define o tipo do contexto de autenticação
 * Contém todas as funções e estados disponíveis para componentes filhos
 */
interface AuthContextType {
  user: User | null;              // Dados do usuário atual (null se não autenticado)
  isAuthenticated: boolean;       // Boolean indicando se o usuário está autenticado
  isLoading: boolean;             // Boolean indicando se está carregando
  login: (email: string, password: string) => Promise<User>;  // Função para fazer login
  register: (fullName: string, email: string, password: string) => Promise<User>;  // Função para cadastro
  logout: () => void;             // Função para fazer logout
  updateUser: (userData: Partial<User>) => void;  // Função para atualizar dados do usuário
  checkAuthStatus: () => Promise<void>;  // Função para verificar status de autenticação
}

// Criação do contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Interface para as props do AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;  // Componentes filhos que terão acesso ao contexto
}

// Chaves para armazenamento local dos dados de autenticação
const TOKEN_KEY = '@amadelivery_token';  // Chave para armazenar o token JWT
const USER_KEY = '@amadelivery_user';    // Chave para armazenar os dados do usuário

/**
 * Provider de autenticação que gerencia o estado global de autenticação
 * 
 * Este componente:
 * - Gerencia o estado de autenticação do usuário
 * - Fornece funções para login, logout e atualização de dados
 * - Persiste dados de autenticação no armazenamento local
 * - Verifica automaticamente o status de autenticação ao inicializar
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * @returns JSX.Element - Provider com contexto de autenticação
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Estados locais do contexto
  const [user, setUser] = useState<User | null>(null);      // Estado do usuário atual
  const [isLoading, setIsLoading] = useState(true);          // Estado de carregamento

  // Efeito para verificar status de autenticação ao inicializar o app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Verifica o status de autenticação atual
   * 
   * Esta função:
   * - Busca token e dados salvos no armazenamento local
   * - Valida o token fazendo uma chamada para a API
   * - Remove dados inválidos se o token expirou
   * - Atualiza o estado de autenticação
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados salvos no armazenamento local
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      
      if (token && savedUser) {
        // Verificar se o token ainda é válido fazendo uma chamada para /auth/me
        try {
          const response = await httpClient.get('/auth/me');
          const userData = response as User;
          
          // Garantir que enderecosSalvos seja um array
          if (userData.enderecosSalvos && typeof userData.enderecosSalvos === 'string') {
            try {
              userData.enderecosSalvos = JSON.parse(userData.enderecosSalvos);
            } catch (e) {
              console.error('Erro ao fazer parse de enderecosSalvos:', e);
              userData.enderecosSalvos = [];
            }
          }
          
          // Atualizar dados salvos também
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);
          console.log('✅ Dados do usuário atualizados:', {
            telefone: userData.telefone,
            temEnderecos: !!userData.enderecosSalvos && Array.isArray(userData.enderecosSalvos),
            qtdEnderecos: Array.isArray(userData.enderecosSalvos) ? userData.enderecosSalvos.length : 0
          });
        } catch (error) {
          console.error('❌ Erro ao buscar dados do usuário:', error);
          // Token inválido - remover dados salvos
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para realizar login do usuário
   * 
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Promise<User> - Dados do usuário autenticado
   * @throws Error - Erro específico baseado na resposta da API
   */
  const login = async (email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      // Fazer requisição de login para a API
      const response = await httpClient.post<AuthResponse>('/auth/login', {
        email: email.toLowerCase().trim(),  // Normalizar email
        password: password.trim()             // Remover espaços da senha
      });
      
      // Salvar token e dados do usuário no armazenamento local
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Configurar token no cliente HTTP para futuras requisições
      await httpClient.setToken(response.token);
      
      setUser(response.user);
      return response.user;
    } catch (error: any) {
      
      // Tratar erros específicos da API com mensagens em português
      if (error.code === 'INVALID_CREDENTIALS') {
        throw new Error('Email ou senha incorretos');
      } else if (error.code === 'USER_INACTIVE') {
        throw new Error('Usuário inativo');
      } else if (error.code === 'TOO_MANY_REQUESTS') {
        throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erro ao fazer login. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para realizar cadastro do usuário
   * 
   * @param fullName - Nome completo do usuário
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Promise<User> - Dados do usuário cadastrado
   * @throws Error - Erro específico baseado na resposta da API
   */
  const register = async (fullName: string, email: string, password: string): Promise<User> => {
    try {
      setIsLoading(true);
      
      // Fazer requisição de cadastro para a API
      const response = await httpClient.post<AuthResponse>('/auth/register', {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password: password.trim()
      });
      
      // Salvar token e dados do usuário no armazenamento local
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      // Configurar token no cliente HTTP para futuras requisições
      await httpClient.setToken(response.token);
      
      setUser(response.user);
      return response.user;
    } catch (error: any) {
      // Tratar erros específicos da API com mensagens em português
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        throw new Error('Email já cadastrado');
      } else if (error.code === 'INVALID_EMAIL') {
        throw new Error('Email inválido');
      } else if (error.code === 'WEAK_PASSWORD') {
        throw new Error('Senha muito fraca');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erro ao criar conta. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para realizar logout do usuário
   * 
   * Esta função:
   * - Chama o endpoint de logout na API (opcional)
   * - Remove dados do armazenamento local
   * - Limpa o token do cliente HTTP
   * - Atualiza o estado para não autenticado
   */
  const logout = async () => {
    try {
      // Chamar endpoint de logout (opcional) - enviar body vazio para evitar erro de JSON
      await httpClient.post('/auth/logout', {});
    } catch (error) {
      // Silenciar erro de logout no servidor
    } finally {
      // Remover dados locais independentemente do resultado do servidor
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      await httpClient.setToken(null);
      setUser(null);
    }
  };

  /**
   * Função para atualizar dados do usuário
   * 
   * @param userData - Dados parciais do usuário para atualizar
   */
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Salvar dados atualizados no armazenamento local
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  // Retornar o provider com todos os valores do contexto
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,  // Converter para boolean
        isLoading,
        login,
        register,
        logout,
        updateUser,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para usar o contexto de autenticação
 * 
 * @returns AuthContextType - Contexto de autenticação
 * @throws Error - Se usado fora do AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
