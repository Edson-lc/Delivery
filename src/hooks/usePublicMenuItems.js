import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/httpClient';

export function usePublicMenuItems(options = {}) {
  const {
    restaurantId,
    category,
    search,
    limit,
    skip
  } = options;

  return useQuery({
    queryKey: ['public-menu-items', { restaurantId, category, search, limit, skip }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (restaurantId) params.append('restaurantId', restaurantId);
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (limit) params.append('limit', limit.toString());
      if (skip) params.append('skip', skip.toString());

      const data = await apiRequest(`/public/menu-items?${params.toString()}`, { method: 'GET' });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function usePublicMenuItem(id) {
  return useQuery({
    queryKey: ['public-menu-item', id],
    queryFn: async () => {
      const data = await apiRequest(`/public/menu-items/${id}`, { method: 'GET' });
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

export function usePublicMenuItemCategories() {
  return useQuery({
    queryKey: ['public-menu-item-categories'],
    queryFn: async () => {
      const data = await apiRequest('/public/menu-items/categories', { method: 'GET' });
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
  });
}
