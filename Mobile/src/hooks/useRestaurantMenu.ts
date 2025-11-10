import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import httpClient from '../api/httpClient';
import { API_URLS } from '../constants';

interface UseRestaurantMenuResult {
  menuItems: MenuItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRestaurantMenu(restaurantId: string): UseRestaurantMenuResult {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMenuItems = async () => {
    if (!restaurantId) {
      setMenuItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🍽️ Buscando menu para restaurante: ${restaurantId}`);
      const response = await httpClient.get(`${API_URLS.RESTAURANTS}/${restaurantId}/menu`);
      
      console.log('📋 Resposta da API do menu:', response);
      console.log('📋 Tipo da resposta:', typeof response);
      console.log('📋 É array?', Array.isArray(response));

      // A API pode retornar diretamente um array ou um objeto com data
      let menuData = response;
      if (response && typeof response === 'object' && response.data) {
        menuData = response.data;
      }

      if (Array.isArray(menuData) && menuData.length > 0) {
        console.log(`🍽️ Encontrados ${menuData.length} itens no menu`);
        
        // Converter dados da API para garantir tipos corretos
        const processedMenuItems = menuData.map((item: any, index: number) => {
          console.log(`   ${index + 1}. ${item.nome} - €${item.preco}`);
          
          return {
            ...item,
            disponivel: typeof item.disponivel === 'string' 
              ? item.disponivel === 'true' || item.disponivel === '1'
              : Boolean(item.disponivel),
            preco: typeof item.preco === 'string' ? parseFloat(item.preco) : item.preco,
          };
        });
        
        setMenuItems(processedMenuItems);
      } else {
        console.log('⚠️ Nenhum item encontrado no menu');
        setMenuItems([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar itens do menu:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  return {
    menuItems,
    isLoading,
    error,
    refetch: fetchMenuItems,
  };
}
