import { useState, useCallback, useEffect } from 'react';
import { User, Restaurant } from '@/api/entities';
import { createPageUrl } from '@/utils';

export function useRestaurantDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardapioOnlyMode, setCardapioOnlyMode] = useState(false);

  const initializeDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await User.me();

      // Verificar permissões
      if (user.tipo_usuario !== "restaurante" && user.role !== "admin") {
        window.location.href = createPageUrl("Home");
        return;
      }

      // Buscar dados do restaurante
      let restaurantData;
      if (user.restaurant_id) {
        restaurantData = await Restaurant.get(user.restaurant_id);
      } else if (user.role === "admin") {
        const restaurants = await Restaurant.list();
        restaurantData = restaurants?.[0];
      }

      if (!restaurantData) {
        setError("Restaurante não encontrado. Entre em contato com o suporte.");
        return;
      }

      setRestaurant(restaurantData);

      // Verificar se deve mostrar apenas a seção de cardápio
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('showCardapio') === 'true') {
        setCardapioOnlyMode(true);
      }

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Erro ao carregar dashboard. Tente novamente.");
      window.location.href = createPageUrl("Home");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    restaurant,
    isLoading,
    error,
    cardapioOnlyMode,
    setCardapioOnlyMode,
    initializeDashboard
  };
}
