import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Plus, Edit, Trash2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import MenuItemModal from "./MenuItemModal";

export default function MenuManagement({ 
  menuItems, 
  isLoadingCardapio, 
  showCardapioSection, 
  onToggleCardapio,
  onDeleteMenuItem,
  onUpdateMenuItem,
  restaurant,
  cardapioOnlyMode = false
}) {
  console.log("🍽️ MenuManagement renderizado!");
  console.log("🍽️ menuItems recebidos:", menuItems);
  console.log("🍽️ Quantidade de menuItems:", menuItems?.length || 0);
  console.log("🍽️ isLoadingCardapio:", isLoadingCardapio);
  console.log("🍽️ showCardapioSection:", showCardapioSection);
  console.log("🍽️ cardapioOnlyMode:", cardapioOnlyMode);
  console.log("🍽️ restaurant:", restaurant);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSubmit = async (itemData) => {
    try {
      if (editingItem) {
        await onUpdateMenuItem(editingItem.id, itemData);
      } else {
        await onUpdateMenuItem(null, itemData);
      }
      handleModalClose();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert("Erro ao salvar item. Tente novamente.");
    }
  };

  if (!showCardapioSection) {
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  Gerenciar Cardápio
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie os itens do seu cardápio
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateNew}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Item
                </Button>
                <Button
                  onClick={onToggleCardapio}
                  variant="outline"
                  size="sm"
                >
                  Mostrar Cardápio
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Modal de Edição/Criação */}
        <MenuItemModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          item={editingItem}
          restaurant={restaurant}
        />
      </>
    );
  }

  return (
    <>
      <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              Gerenciar Cardápio
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie os itens do seu cardápio
            </p>
          </div>
          <Button
            onClick={onToggleCardapio}
            variant="outline"
            size="sm"
          >
            {cardapioOnlyMode ? 'Voltar ao Dashboard' : 'Ocultar Cardápio'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoadingCardapio ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Carregando cardápio...</p>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhum item no cardápio</p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {menuItems.length} {menuItems.length === 1 ? 'item' : 'itens'} no cardápio
              </p>
                    <Button
                      onClick={handleCreateNew}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Item
                    </Button>
            </div>
            
            <div className="grid gap-3">
              {menuItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    {item.imagem_url && (
                      <img
                        src={item.imagem_url}
                        alt={item.nome}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop";
                        }}
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{item.nome}</h4>
                      <p className="text-sm text-gray-600">{item.descricao}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">€{item.preco?.toFixed(2)}</span>
                      <Badge variant={item.disponivel ? "default" : "secondary"}>
                        {item.disponivel ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleEdit(item)}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                      <Button
                        onClick={() => onDeleteMenuItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {menuItems.length > 5 && (
                <div className="text-center pt-2">
                        <Button
                          onClick={handleCreateNew}
                          variant="outline"
                          size="sm"
                        >
                          Ver Todos os {menuItems.length} Itens
                        </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Modal de Edição/Criação */}
    <MenuItemModal
      isOpen={isModalOpen}
      onClose={handleModalClose}
      onSubmit={handleModalSubmit}
      item={editingItem}
      restaurant={restaurant}
    />
    </>
  );
}
