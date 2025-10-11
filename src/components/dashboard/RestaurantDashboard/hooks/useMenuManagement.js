import { useState, useCallback } from 'react';
import { MenuItem } from '@/api/entities';

export function useMenuManagement(restaurantId) {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingCardapio, setIsLoadingCardapio] = useState(false);

  const loadMenuItems = useCallback(async () => {
    if (!restaurantId) return;

    console.log("🔍 Carregando itens do cardápio para restaurante:", restaurantId);
    console.log("🔍 Tipo do restaurantId:", typeof restaurantId);
    
    setIsLoadingCardapio(true);
    try {
      // Primeiro, tentar listar todos os itens para ver o que existe
      console.log("📋 Listando todos os itens primeiro...");
      const allItems = await MenuItem.list();
      console.log("📋 Todos os itens na base de dados:", allItems);
      console.log("📋 Quantidade total de itens:", allItems.length);
      
      if (allItems.length > 0) {
        console.log("📋 Primeiro item como exemplo:", allItems[0]);
        console.log("📋 Campos do primeiro item:", Object.keys(allItems[0]));
        console.log("📋 restaurantId do primeiro item:", allItems[0].restaurantId);
        console.log("📋 Tipo do restaurantId do primeiro item:", typeof allItems[0].restaurantId);
      }
      
      // Agora tentar filtrar usando camelCase
      console.log("🔍 Tentando filtrar por restaurantId (camelCase)...");
      const items = await MenuItem.filter({ restaurantId: restaurantId });
      console.log("📋 Itens filtrados:", items);
      console.log("📋 Quantidade de itens filtrados:", items.length);
      
      setMenuItems(items);
      console.log("🍽️ Cardápio carregado:", items.length, "itens");
    } catch (error) {
      console.error("❌ Erro ao carregar cardápio:", error);
      console.error("❌ Detalhes do erro:", error.message);
      console.error("❌ Stack trace:", error.stack);
      
      try {
        // Fallback: listar todos e filtrar localmente
        console.log("🔄 Tentando fallback...");
        const allItems = await MenuItem.list();
        console.log("📋 Todos os itens para fallback:", allItems);
        
        const filteredItems = allItems.filter(item => {
          console.log(`🔍 Comparando: ${item.restaurantId} === ${restaurantId} ?`, item.restaurantId === restaurantId);
          return item.restaurantId === restaurantId;
        });
        
        console.log("📋 Itens filtrados no fallback:", filteredItems);
        setMenuItems(filteredItems);
        console.log("🍽️ Cardápio carregado via fallback:", filteredItems.length, "itens");
      } catch (fallbackError) {
        console.error("❌ Erro no fallback:", fallbackError);
        setMenuItems([]);
        throw error;
      }
    } finally {
      setIsLoadingCardapio(false);
    }
  }, [restaurantId]);

  const handleDeleteMenuItem = useCallback(async (itemId) => {
    if (!confirm("Tem certeza que deseja excluir este item do cardápio?")) {
      return;
    }

    try {
      await MenuItem.delete(itemId);
      await loadMenuItems();
      console.log("✅ Item excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      throw new Error("Erro ao excluir item. Tente novamente.");
    }
  }, [loadMenuItems]);

  const handleUpdateMenuItem = useCallback(async (itemId, itemData) => {
    try {
      if (itemId) {
        // Atualizar item existente
        await MenuItem.update(itemId, itemData);
        console.log("✅ Item atualizado com sucesso");
      } else {
        // Criar novo item
        const payload = { ...itemData, restaurant_id: restaurantId };
        await MenuItem.create(payload);
        console.log("✅ Item criado com sucesso");
      }
      
      await loadMenuItems();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      throw new Error("Erro ao salvar item. Tente novamente.");
    }
  }, [restaurantId, loadMenuItems]);

  const handleToggleMenuItemAvailability = useCallback(async (itemId, isAvailable) => {
    try {
      await MenuItem.update(itemId, { disponivel: isAvailable });
      await loadMenuItems();
      console.log(`✅ Item ${isAvailable ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error("Erro ao alterar disponibilidade do item:", error);
      throw new Error("Erro ao alterar disponibilidade. Tente novamente.");
    }
  }, [loadMenuItems]);

  const getMenuItemsByCategory = useCallback((category) => {
    return menuItems.filter(item => item.categoria === category);
  }, [menuItems]);

  const getMenuCategories = useCallback(() => {
    const categories = [...new Set(menuItems.map(item => item.categoria))];
    return categories.filter(Boolean).sort();
  }, [menuItems]);

  const getAvailableMenuItems = useCallback(() => {
    return menuItems.filter(item => item.disponivel);
  }, [menuItems]);

  const getUnavailableMenuItems = useCallback(() => {
    return menuItems.filter(item => !item.disponivel);
  }, [menuItems]);

  return {
    menuItems,
    isLoadingCardapio,
    loadMenuItems,
    handleDeleteMenuItem,
    handleUpdateMenuItem,
    handleToggleMenuItemAvailability,
    getMenuItemsByCategory,
    getMenuCategories,
    getAvailableMenuItems,
    getUnavailableMenuItems
  };
}
