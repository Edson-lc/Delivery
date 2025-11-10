// Hook personalizado para gerenciar dados de restaurantes
// Fornece funcionalidades para buscar restaurantes, categorias e dados individuais
import { useState, useEffect, useCallback } from 'react';
import httpClient from '../api/httpClient';
import { Restaurant, RestaurantFilters } from '../types';
import { API_URLS } from '../constants';

/**
 * Interface para o resultado dos hooks de restaurantes
 */
interface UseRestaurantsResult {
  data: Restaurant[];           // Lista de restaurantes
  isLoading: boolean;           // Estado de carregamento
  error: Error | null;          // Erro se houver
  refetch: () => void;          // Função para recarregar dados
}

/**
 * Hook para buscar restaurantes públicos (sem autenticação)
 * 
 * @param options - Filtros e opções para a busca
 * @returns UseRestaurantsResult - Dados, estado de loading, erro e função de refetch
 */
export function usePublicRestaurants(options: RestaurantFilters = {}): UseRestaurantsResult {
  // Estados locais do hook
  const [data, setData] = useState<Restaurant[]>([]);      // Lista de restaurantes
  const [isLoading, setIsLoading] = useState(true);       // Estado de carregamento
  const [error, setError] = useState<Error | null>(null);  // Estado de erro

  // Extrair opções de filtro
  const {
    category,                    // Categoria para filtrar
    search,                      // Termo de busca
    includeMenuItems = false,    // Se deve incluir itens do cardápio
    limit,                       // Limite de resultados
    skip                         // Offset para paginação
  } = options;

  /**
   * Função para buscar dados dos restaurantes - memoizada para evitar recriação
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 usePublicRestaurants: Iniciando requisição com opções:', options);

      // Construir parâmetros da requisição
      const params: Record<string, any> = {};

      if (category) params.category = category;
      if (search) params.search = search;
      if (includeMenuItems) params.includeMenuItems = includeMenuItems;
      if (limit) params.limit = limit.toString();
      if (skip) params.skip = skip.toString();

      // Fazer requisição para a API
      const result = await httpClient.get<Restaurant[]>(API_URLS.RESTAURANTS, params);
      console.log('✅ usePublicRestaurants: Resposta da API:', result);
      console.log('📊 usePublicRestaurants: Tipo dos dados:', typeof result, 'É array?', Array.isArray(result));

      // Verificar se o resultado é um array válido
      if (Array.isArray(result)) {
        console.log('🍽️ usePublicRestaurants: Número de restaurantes:', result.length);
        result.forEach((restaurant, index) => {
          console.log(`   ${index + 1}. ${restaurant.nome} (${restaurant.categoria})`);
        });
        setData(result);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('❌ usePublicRestaurants: Erro ao buscar restaurantes:', err);
      setError(err as Error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, search, includeMenuItems, limit, skip]);

  // Efeito para buscar dados quando as opções mudarem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook para buscar um restaurante específico por ID
 * 
 * @param id - ID do restaurante
 * @returns Objeto com dados do restaurante, estado de loading e erro
 */
export function usePublicRestaurant(id: string) {
  const [data, setData] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await httpClient.get<Restaurant>(`${API_URLS.RESTAURANTS}/${id}`);
        setData(result);
      } catch (err) {
        setError(err as Error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, isLoading, error };
}

/**
 * Hook para buscar categorias de restaurantes disponíveis
 * 
 * @returns Objeto com lista de categorias, estado de loading e erro
 */
export function usePublicRestaurantCategories() {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await httpClient.get<string[]>(API_URLS.CATEGORIES);
        setData(result);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
}
