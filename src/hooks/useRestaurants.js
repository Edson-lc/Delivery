import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Restaurant } from '@/api/entities';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';

// Hook para listar restaurantes
export function useRestaurants(filters = {}) {
  return useQuery({
    queryKey: [...queryKeys.restaurants, filters],
    queryFn: () => Restaurant.filter(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar restaurante específico
export function useRestaurant(id) {
  return useQuery({
    queryKey: queryKeys.restaurant(id),
    queryFn: () => Restaurant.get(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para menu do restaurante
export function useRestaurantMenu(restaurantId) {
  return useQuery({
    queryKey: queryKeys.restaurantMenu(restaurantId),
    queryFn: () => Restaurant.getMenu(restaurantId),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para criar restaurante
export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => Restaurant.create(data),
    onSuccess: (newRestaurant) => {
      // Invalidar lista de restaurantes
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants });
      
      // Adicionar novo restaurante ao cache
      queryClient.setQueryData(queryKeys.restaurant(newRestaurant.id), newRestaurant);
    },
  });
}

// Hook para atualizar restaurante
export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => Restaurant.update(id, data),
    onSuccess: (updatedRestaurant) => {
      // Atualizar cache do restaurante
      queryClient.setQueryData(queryKeys.restaurant(updatedRestaurant.id), updatedRestaurant);
      
      // Invalidar queries relacionadas
      invalidateQueries.restaurant(updatedRestaurant.id);
    },
  });
}

// Hook para deletar restaurante
export function useDeleteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => Restaurant.delete(id),
    onSuccess: (_, restaurantId) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: queryKeys.restaurant(restaurantId) });
      
      // Invalidar lista de restaurantes
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants });
    },
  });
}
