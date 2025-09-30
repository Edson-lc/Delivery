import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000,
      // Manter dados em cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: (failureCount, error) => {
        // Não retry para erros 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry até 3 vezes para outros erros
        return failureCount < 3;
      },
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations apenas uma vez
      retry: 1,
    },
  },
});

// Configurações específicas para diferentes tipos de dados
export const queryKeys = {
  // Usuários
  users: ['users'],
  user: (id) => ['users', id],
  currentUser: ['users', 'me'],
  
  // Restaurantes
  restaurants: ['restaurants'],
  restaurant: (id) => ['restaurants', id],
  restaurantMenu: (id) => ['restaurants', id, 'menu'],
  
  // Itens de menu
  menuItems: ['menuItems'],
  menuItem: (id) => ['menuItems', id],
  
  // Pedidos
  orders: ['orders'],
  order: (id) => ['orders', id],
  userOrders: (userId) => ['orders', 'user', userId],
  restaurantOrders: (restaurantId) => ['orders', 'restaurant', restaurantId],
  
  // Carrinhos
  carts: ['carts'],
  cart: (id) => ['carts', id],
  userCart: (sessionId) => ['carts', 'session', sessionId],
  
  // Entregadores
  entregadores: ['entregadores'],
  entregador: (id) => ['entregadores', id],
  availableEntregadores: ['entregadores', 'available'],
  
  // Entregas
  deliveries: ['deliveries'],
  delivery: (id) => ['deliveries', id],
  entregadorDeliveries: (entregadorId) => ['deliveries', 'entregador', entregadorId],
  
  // Clientes
  customers: ['customers'],
  customer: (id) => ['customers', id],
};

// Função helper para invalidar queries relacionadas
export const invalidateQueries = {
  // Invalidar todos os dados de usuário
  user: (userId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
  },
  
  // Invalidar dados de restaurante
  restaurant: (restaurantId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurant(restaurantId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurantMenu(restaurantId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurantOrders(restaurantId) });
  },
  
  // Invalidar dados de pedido
  order: (orderId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.orders });
  },
  
  // Invalidar dados de entregador
  entregador: (entregadorId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.entregador(entregadorId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.entregadorDeliveries(entregadorId) });
  },
};
