import { useState, useCallback } from 'react';
import { Order } from '@/api/entities';

const RESTAURANT_ACTION_STATUSES = new Set(["pendente", "confirmado", "preparando", "pronto"]);

export function useOrderManagement(restaurantId, restaurant) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [lastProcessedOrderId, setLastProcessedOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const ordersData = await Order.filter({ restaurant_id: restaurantId }, "-created_date", 100);
      
      console.log("🔍 Carregando pedidos:", ordersData.length);
      
      // Debug: verificar campos de tempo de preparo
      if (ordersData.length > 0) {
        console.log("🔍 DEBUG - Primeiro pedido:", {
          id: ordersData[0].id,
          tempoPreparo: ordersData[0].tempoPreparo,
          tempoPreparoAlterado: ordersData[0].tempoPreparoAlterado,
          camposDisponiveis: Object.keys(ordersData[0])
        });
      }
      
      // Detectar novos pedidos que precisam de ação do restaurante
      const pendingOrders = ordersData.filter(order => 
        order.status === 'pendente'
      );
      
      console.log("🔍 DEBUG - Pedidos pendentes encontrados:", pendingOrders.length);
      console.log("🔍 DEBUG - Último processado:", lastProcessedOrderId);
      
      const newestPendingOrder = pendingOrders[0];
      
      if (newestPendingOrder) {
        console.log("🔍 DEBUG - Pedido mais recente:", {
          id: newestPendingOrder.id,
          cliente: newestPendingOrder.clienteNome,
          status: newestPendingOrder.status,
          isNew: newestPendingOrder.id !== lastProcessedOrderId
        });
      }
      
      if (newestPendingOrder && newestPendingOrder.id !== lastProcessedOrderId) {
        console.log("🚨 NOVO PEDIDO DETECTADO!");
        console.log("🚨 DEBUG - Detalhes:", {
          id: newestPendingOrder.id,
          cliente: newestPendingOrder.clienteNome,
          total: newestPendingOrder.total,
          status: newestPendingOrder.status
        });
        setLastProcessedOrderId(newestPendingOrder.id);
        return newestPendingOrder; // Retornar para que o componente pai possa lidar com o modal
      } else if (newestPendingOrder) {
        console.log("ℹ️ Pedido pendente encontrado, mas já foi processado:", newestPendingOrder.id);
      } else {
        console.log("ℹ️ Nenhum pedido pendente encontrado");
      }
      
      setOrders(ordersData);
      return null;
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      throw error;
    }
  }, [restaurantId, lastProcessedOrderId]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      console.log(`🔄 Atualizando status do pedido ${orderId} para ${newStatus}`);
      
      await Order.update(orderId, { status: newStatus });
      console.log(`✅ Status atualizado com sucesso para ${newStatus}`);
      
      // Recarregar pedidos após atualização
      await loadOrders();
    } catch (error) {
      console.error("❌ Erro ao atualizar status do pedido:", error);
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
  }, [loadOrders]);

  const updatePreparationTime = useCallback(async (orderId, preparationTime) => {
    try {
      console.log(`🔄 Atualizando tempo de preparo do pedido ${orderId} para ${preparationTime} minutos`);
      
      // Verificar se o tempo já foi alterado antes
      const currentOrder = orders.find(order => order.id === orderId);
      const isAlreadyChanged = currentOrder && (
        currentOrder.tempoPreparoAlterado || 
        currentOrder.tempo_preparo_alterado
      );
      if (isAlreadyChanged) {
        throw new Error('O tempo de preparo deste pedido já foi alterado anteriormente. Apenas uma alteração é permitida por pedido.');
      }

      // Calcular tempo adicional baseado no tempo atual do pedido
      const currentOrderPrepTime = currentOrder.tempoPreparo || restaurant?.tempoPreparo || restaurant?.tempo_preparo || 30;
      const additionalTime = Math.max(0, preparationTime - currentOrderPrepTime);

      console.log(`🕐 Calculando tempo adicional:`, {
        currentTime: currentOrderPrepTime,
        newTime: preparationTime,
        additionalTime
      });
      
      await Order.update(orderId, { 
        tempoPreparo: preparationTime,
        tempoPreparoAlterado: true,
        tempoAdicional: additionalTime
      });
      console.log(`✅ Tempo de preparo atualizado com sucesso para ${preparationTime} minutos, tempo adicional: ${additionalTime} minutos`);
      
      // Atualizar o estado local dos pedidos
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                tempoPreparo: preparationTime,
                tempoPreparoAlterado: true,
                tempoAdicional: additionalTime
              }
            : order
        )
      );
      
      // Recarregar pedidos após atualização para sincronizar com o banco
      await loadOrders();
    } catch (error) {
      console.error("❌ Erro ao atualizar tempo de preparo:", error);
      throw new Error(`Erro ao atualizar tempo de preparo: ${error.message}`);
    }
  }, [orders, restaurant, loadOrders]);

  const handleStatusCardClick = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  const getFilteredOrders = useCallback(() => {
    if (statusFilter === 'todos') {
      return orders.filter(order => order.status === 'entregue' || order.status === 'cancelado');
    }
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  const getOrdersByStatus = useCallback((status) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getOrderStats = useCallback(() => {
    return {
      total: orders.length,
      pendente: getOrdersByStatus('pendente').length,
      confirmado: getOrdersByStatus('confirmado').length,
      preparando: getOrdersByStatus('preparando').length,
      pronto: getOrdersByStatus('pronto').length,
      saiu_entrega: getOrdersByStatus('saiu_entrega').length,
      entregue: getOrdersByStatus('entregue').length,
      cancelado: getOrdersByStatus('cancelado').length,
      rejeitado: getOrdersByStatus('rejeitado').length
    };
  }, [orders, getOrdersByStatus]);

  return {
    orders,
    statusFilter,
    setStatusFilter,
    loadOrders,
    updateOrderStatus,
    updatePreparationTime,
    handleStatusCardClick,
    getFilteredOrders,
    getOrdersByStatus,
    getOrderStats,
    lastProcessedOrderId,
    setLastProcessedOrderId
  };
}
