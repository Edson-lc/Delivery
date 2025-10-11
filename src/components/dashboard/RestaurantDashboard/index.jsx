import React from 'react';
import { useRestaurantDashboard } from './hooks/useRestaurantDashboard';
import { useOrderManagement } from './hooks/useOrderManagement';
import { useMenuManagement } from './hooks/useMenuManagement';
import { useModalManagement } from './hooks/useModalManagement';
import { useNotificationSound } from './hooks/useNotificationSound';

// Componentes
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import DashboardContent from './components/DashboardContent';
import MenuOnlyMode from './components/MenuOnlyMode';

// Modais
import FullScreenNewOrderModal from './modals/FullScreenNewOrderModal';
import NewOrderModal from './modals/NewOrderModal';
import OrderDetailsModal from './modals/OrderDetailsModal';

export default function RestaurantDashboard() {
  // Hooks customizados
  const {
    restaurant,
    isLoading,
    error,
    cardapioOnlyMode,
    initializeDashboard
  } = useRestaurantDashboard();

  const {
    orders,
    statusFilter,
    setStatusFilter,
    loadOrders,
    updateOrderStatus,
    updatePreparationTime,
    handleStatusCardClick
  } = useOrderManagement(restaurant?.id, restaurant);

  const {
    menuItems,
    isLoadingCardapio,
    loadMenuItems,
    handleDeleteMenuItem,
    handleUpdateMenuItem
  } = useMenuManagement(restaurant?.id);

  // Hook de som de notificação (deve vir antes do useModalManagement)
  const {
    soundEnabled,
    soundType,
    playNotificationSound,
    startContinuousAlert,
    stopContinuousAlert
  } = useNotificationSound();

  const {
    pendingOrder,
    selectedOrderForDetails,
    showOrderModal,
    showFullScreenModal,
    showOrderDetailsModal,
    setPendingOrder,
    setShowOrderModal,
    setShowFullScreenModal,
    setShowOrderDetailsModal,
    setSelectedOrderForDetails,
    handleAcceptOrder,
    handleRejectOrder,
    handleCloseModal,
    handleViewOrderDetails,
    handleCloseOrderDetailsModal,
    handlePrintReceipt,
    handleUpdatePreparationTime
  } = useModalManagement({
    updateOrderStatus,
    setStatusFilter,
    updatePreparationTime,
    stopContinuousAlert
  });

  // Inicializar dashboard
  React.useEffect(() => {
    console.log("🚀 Inicializando RestaurantDashboard...");
    initializeDashboard();
  }, [initializeDashboard]);

  // Carregar itens do cardápio quando o restaurante estiver disponível
  React.useEffect(() => {
    if (restaurant?.id) {
      console.log("🍽️ Restaurante disponível, carregando cardápio...");
      console.log("🍽️ ID do restaurante:", restaurant.id);
      loadMenuItems();
    }
  }, [restaurant?.id, loadMenuItems]);

  // Atualizar pedidos periodicamente e detectar novos pedidos
  React.useEffect(() => {
    if (!restaurant?.id) return;
    
    const checkForNewOrders = async () => {
      try {
        console.log("🔍 Verificando novos pedidos...");
        console.log("🔍 Modal aberto:", showFullScreenModal);
        console.log("🔍 Som habilitado:", soundEnabled);
        
        const newOrder = await loadOrders();
        console.log("🔍 Resultado do loadOrders:", newOrder ? `Pedido #${newOrder.id.slice(-6)}` : 'Nenhum pedido novo');
        
        if (newOrder && !showFullScreenModal) {
          console.log("🚨 NOVO PEDIDO DETECTADO! Abrindo modal de tela cheia...");
          console.log("🚨 Detalhes do pedido:", {
            id: newOrder.id,
            cliente: newOrder.clienteNome,
            total: newOrder.total,
            status: newOrder.status
          });
          
          setPendingOrder(newOrder);
          setShowFullScreenModal(true);
          
          // Tocar som de notificação
          if (soundEnabled) {
            console.log("🔊 Tocando som de notificação...");
            playNotificationSound();
            
            console.log("🔊 Iniciando som de alerta contínuo...");
            startContinuousAlert();
          } else {
            console.log("🔇 Som desabilitado - não tocando notificação");
          }
        } else if (newOrder && showFullScreenModal) {
          console.log("ℹ️ Pedido novo detectado, mas modal já está aberto");
        } else {
          console.log("ℹ️ Nenhum pedido novo detectado");
        }
      } catch (error) {
        console.error("❌ Erro ao verificar novos pedidos:", error);
      }
    };

    // Verificar imediatamente
    checkForNewOrders();
    
    // Verificar a cada 60 segundos para reduzir rate limiting
    const interval = setInterval(checkForNewOrders, 60000);

    return () => clearInterval(interval);
  }, [restaurant?.id, loadOrders, showFullScreenModal, soundEnabled, playNotificationSound, startContinuousAlert]);


  // Estados de loading e erro
  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !restaurant) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modais */}
      <FullScreenNewOrderModal 
        isOpen={showFullScreenModal}
        onClose={handleCloseModal}
        order={pendingOrder}
        onViewDetails={handleViewOrderDetails}
      />

      <NewOrderModal
        order={pendingOrder}
        isOpen={showOrderModal}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={handleCloseModal}
      />

      <OrderDetailsModal
        order={selectedOrderForDetails}
        restaurant={restaurant}
        isOpen={showOrderDetailsModal}
        onClose={handleCloseOrderDetailsModal}
        onPrintReceipt={handlePrintReceipt}
        onUpdatePreparationTime={handleUpdatePreparationTime}
      />

      {/* Conteúdo Principal */}
      <div className="p-6">
        {cardapioOnlyMode ? (
          <MenuOnlyMode
            menuItems={menuItems}
            isLoadingCardapio={isLoadingCardapio}
            onDeleteMenuItem={handleDeleteMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            restaurant={restaurant}
          />
        ) : (
          <DashboardContent
            orders={orders}
            restaurant={restaurant}
            statusFilter={statusFilter}
            onStatusCardClick={handleStatusCardClick}
            onStatusFilterChange={setStatusFilter}
            onRefreshOrders={loadOrders}
            onUpdateOrderStatus={updateOrderStatus}
            onViewOrderDetails={handleViewOrderDetails}
          />
        )}
      </div>
    </div>
  );
}
