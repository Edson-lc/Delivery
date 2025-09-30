import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/httpClient';

export function usePublicRestaurants(options = {}) {
  const {
    category,
    search,
    includeMenuItems = false,
    limit,
    skip
  } = options;

  return useQuery({
    queryKey: ['public-restaurants', { category, search, includeMenuItems, limit, skip }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        if (includeMenuItems) params.append('includeMenuItems', 'true');
        if (limit) params.append('limit', limit.toString());
        if (skip) params.append('skip', skip.toString());

        const data = await apiRequest(`/public/restaurants?${params.toString()}`, { method: 'GET' });
        console.log('API Response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3, // Tentar 3 vezes em caso de erro
  });
}

export function usePublicRestaurant(id) {
  return useQuery({
    queryKey: ['public-restaurant', id],
    queryFn: async () => {
      const data = await apiRequest(`/public/restaurants/${id}`, { method: 'GET' });
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function usePublicRestaurantCategories() {
  return useQuery({
    queryKey: ['public-restaurant-categories'],
    queryFn: async () => {
      const data = await apiRequest('/public/restaurants/categories', { method: 'GET' });
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
  });
}
