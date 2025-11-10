// Cliente HTTP personalizado para comunicação com a API do AmaDelivery
// Gerencia requisições, autenticação e tratamento de erros
import { API_URLS, APP_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Interface para opções de requisição HTTP
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';  // Método HTTP
  headers?: Record<string, string>;                       // Headers personalizados
  body?: any;                                             // Corpo da requisição
}

/**
 * Interface para erros da API
 */
interface ApiError {
  code: string;        // Código do erro
  message: string;      // Mensagem de erro
  details?: any;       // Detalhes adicionais do erro
}

/**
 * Classe HttpClient para gerenciar comunicação com a API
 * 
 * Funcionalidades:
 * - Gerenciamento automático de tokens JWT
 * - Interceptação de requisições para adicionar autenticação
 * - Tratamento padronizado de erros
 * - Suporte a todos os métodos HTTP
 * - Persistência de token no armazenamento local
 */
class HttpClient {
  private baseURL: string;                    // URL base da API
  private token: string | null = null;        // Token JWT atual

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();  // Carregar token salvo ao inicializar
  }

  /**
   * Carrega o token JWT do armazenamento local
   * Chamado automaticamente no construtor
   */
  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('@amadelivery_token');
    } catch (error) {
      // Silenciar erro de carregamento de token
    }
  }

  /**
   * Define o token JWT e o salva no armazenamento local
   * 
   * @param token - Token JWT ou null para remover
   */
  public async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('@amadelivery_token', token);
    } else {
      await AsyncStorage.removeItem('@amadelivery_token');
    }
  }

  /**
   * Método interno para fazer requisições HTTP
   * 
   * @param endpoint - Endpoint da API (ex: '/restaurants')
   * @param options - Opções da requisição
   * @returns Promise<T> - Dados da resposta
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { method = 'GET', headers = {}, body } = options;

    // Carregar token atualizado se necessário
    if (!this.token) {
      await this.loadToken();
    }

    // Configurar headers da requisição
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),  // Adicionar token se existir
        ...headers,
      },
    };

    // Adicionar corpo da requisição se não for GET
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          code: errorData.error?.code || 'UNKNOWN_ERROR',
          message: errorData.error?.message || `HTTP ${response.status}`,
          details: errorData.error?.details,
        };
        throw error;
      }

      // Tentar fazer parse do JSON, mas não falhar se não for JSON válido
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON, retornar texto da resposta
        const text = await response.text();
        return text as T;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método GET para buscar dados
   * 
   * @param endpoint - Endpoint da API
   * @param params - Parâmetros de query (opcional)
   * @returns Promise<T> - Dados da resposta
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            searchParams.append(key, value ? 'true' : 'false');
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Método POST para criar dados
   * 
   * @param endpoint - Endpoint da API
   * @param body - Dados para enviar
   * @returns Promise<T> - Dados da resposta
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  /**
   * Método PUT para atualizar dados
   * 
   * @param endpoint - Endpoint da API
   * @param body - Dados para enviar
   * @returns Promise<T> - Dados da resposta
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  /**
   * Método DELETE para remover dados
   * 
   * @param endpoint - Endpoint da API
   * @returns Promise<T> - Dados da resposta
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Método PATCH para atualização parcial
   * 
   * @param endpoint - Endpoint da API
   * @param body - Dados para enviar
   * @returns Promise<T> - Dados da resposta
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
}

// Instância global do cliente HTTP configurada com a URL base da API
export const httpClient = new HttpClient(API_URLS.BASE_URL);
export default httpClient;
