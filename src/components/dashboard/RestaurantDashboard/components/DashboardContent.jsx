import React from 'react';
import OrderStatusCards from '@/components/dashboard/OrderStatusCards';
import OrderList from '@/components/dashboard/OrderList';

export default function DashboardContent({
  orders,
  restaurant,
  statusFilter,
  onStatusCardClick,
  onStatusFilterChange,
  onRefreshOrders,
  onUpdateOrderStatus,
  onViewOrderDetails
}) {
  return (
    <>


      {/* Cards de Status */}
      <OrderStatusCards
        orders={orders}
        statusFilter={statusFilter}
        onStatusCardClick={onStatusCardClick}
      />

      {/* Lista de Pedidos */}
      <OrderList
        orders={orders}
        restaurant={restaurant}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onRefreshOrders={onRefreshOrders}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onViewOrderDetails={onViewOrderDetails}
      />
    </>
  );
}
