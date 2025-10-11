import React from 'react';
import MenuManagement from '@/components/dashboard/MenuManagement';
import { createPageUrl } from '@/utils';

export default function MenuOnlyMode({
  menuItems,
  isLoadingCardapio,
  onDeleteMenuItem,
  onUpdateMenuItem,
  restaurant
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <MenuManagement
        menuItems={menuItems}
        isLoadingCardapio={isLoadingCardapio}
        showCardapioSection={true}
        onToggleCardapio={() => {
          // Se estiver no modo cardápio apenas, voltar para o dashboard normal
          window.location.href = createPageUrl("restaurantedashboard");
        }}
        onDeleteMenuItem={onDeleteMenuItem}
        onUpdateMenuItem={onUpdateMenuItem}
        restaurant={restaurant}
        cardapioOnlyMode={true}
      />
    </div>
  );
}
