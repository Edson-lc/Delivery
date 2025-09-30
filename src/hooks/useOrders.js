import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/api/entities';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';

// Hook para listar pedidos
export function useOrders(filters = {}) {
  return useQuery({
    queryKey: [...queryKeys.orders, filters],
    queryFn: () => Order.filter(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos (dados mais dinâmicos)
  });
}

// Hook para buscar pedido específico
export function useOrder(id) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => Order.get(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// Hook para pedidos do usuário
export function useUserOrders(userId) {
  return useQuery({
    queryKey: queryKeys.userOrders(userId),
    queryFn: () => Order.filter({ customerId: userId }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook para pedidos do restaurante
export function useRestaurantOrders(restaurantId) {
  return useQuery({
    queryKey: queryKeys.restaurantOrders(restaurantId),
    queryFn: () => Order.filter({ restaurantId }),
    enabled: !!restaurantId,
    staleTime: 1 * 60 * 1000, // 1 minuto (dados muito dinâmicos)
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
  });
}

// Hook para criar pedido
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => Order.create(data),
    onSuccess: (newOrder) => {
      // Invalidar listas de pedidos
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.userOrders(newOrder.customerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurantOrders(newOrder.restaurantId) });
      
      // Adicionar novo pedido ao cache
      queryClient.setQueryData(queryKeys.order(newOrder.id), newOrder);
    },
  });
}

// Hook para atualizar pedido
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => Order.update(id, data),
    onSuccess: (updatedOrder) => {
      // Atualizar cache do pedido
      queryClient.setQueryData(queryKeys.order(updatedOrder.id), updatedOrder);
      
      // Invalidar queries relacionadas
      invalidateQueries.order(updatedOrder.id);
    },
  });
}

// Hook para atualizar status do pedido
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, note }) => Order.updateStatus(id, status, note),
    onSuccess: (updatedOrder) => {
      // Atualizar cache do pedido
      queryClient.setQueryData(queryKeys.order(updatedOrder.id), updatedOrder);
      
      // Invalidar queries relacionadas
      invalidateQueries.order(updatedOrder.id);
      
      // Invalidar listas que podem conter este pedido
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurantOrders(updatedOrder.restaurantId) });
    },
  });
}
