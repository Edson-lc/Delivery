import React, { useState, useEffect } from "react";
import { User, Restaurant, MenuItem } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ChefHat,
  Clock,
  Euro,
  ArrowLeft
} from "lucide-react";

console.log("📦 IMPORTS CARREGADOS para GerirCardapio!");

export default function GerirCardapio() {
  console.log("🎯 COMPONENTE GerirCardapio RENDERIZADO!");
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Debug: Log do estado dos menuItems
  React.useEffect(() => {
    console.log("🔄 Estado dos menuItems atualizado:", menuItems);
    console.log("🔄 Quantidade de menuItems:", menuItems.length);
  }, [menuItems]);

  const categories = [
    { value: "todos", label: "Todas as Categorias" },
    { value: "entrada", label: "Entradas" },
    { value: "prato_principal", label: "Pratos Principais" },
    { value: "sobremesa", label: "Sobremesas" },
    { value: "bebida", label: "Bebidas" },
    { value: "lanche", label: "Lanches" },
    { value: "acompanhamento", label: "Acompanhamentos" }
  ];

  useEffect(() => {
    console.log("🔄 useEffect executado!");
    const initializePage = async () => {
      try {
        console.log("🚀 Iniciando página GerirCardapio...");
        const user = await User.me();
        console.log("👤 Usuário carregado:", user);

        if (user.tipo_usuario !== "restaurante" && user.role !== "admin") {
          console.log("❌ Usuário não autorizado:", user.tipo_usuario, user.role);
          window.location.href = createPageUrl("Home");
          return;
        }

        console.log("✅ Usuário autorizado, buscando restaurante...");
        let restaurantData;
        if (user.restaurant_id) {
          console.log("🏪 Buscando restaurante por restaurant_id:", user.restaurant_id);
          restaurantData = await Restaurant.get(user.restaurant_id);
        } else if (user.role === "admin") {
          console.log("🏪 Usuário admin, listando restaurantes...");
          const restaurants = await Restaurant.list();
          console.log("🏪 Restaurantes encontrados:", restaurants);
          restaurantData = restaurants?.[0];
        }

        if (!restaurantData) {
          console.log("❌ Restaurante não encontrado!");
          alert("Restaurante não encontrado. Entre em contato com o suporte.");
          return;
        }

        console.log("🏪 Dados do restaurante:", restaurantData);
        console.log("🏪 ID do restaurante:", restaurantData.id);
        console.log("🏪 Tipo do ID:", typeof restaurantData.id);
        setRestaurant(restaurantData);
        
        console.log("📋 Chamando loadMenuItems...");
        await loadMenuItems(restaurantData.id);
        console.log("✅ loadMenuItems concluído");
      } catch (error) {
        console.error("❌ Erro ao carregar página:", error);
        console.error("❌ Detalhes do erro:", error.message);
        console.error("❌ Stack trace:", error.stack);
        window.location.href = createPageUrl("Home");
      } finally {
        console.log("🏁 Finalizando inicialização da página");
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  const loadMenuItems = async (restaurantId) => {
    try {
      console.log("🔍 Carregando itens do cardápio para restaurante:", restaurantId);
      console.log("🔍 Tipo do restaurantId:", typeof restaurantId);
      
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
      
      // Agora tentar filtrar
      console.log("🔍 Tentando filtrar por restaurantId...");
      const items = await MenuItem.filter({ restaurantId: restaurantId });
      console.log("📋 Itens filtrados:", items);
      console.log("📋 Quantidade de itens filtrados:", items.length);
      
      setMenuItems(items);
    } catch (error) {
      console.error("❌ Erro ao carregar itens do cardápio:", error);
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
      } catch (fallbackError) {
        console.error("❌ Erro no fallback:", fallbackError);
        setMenuItems([]);
      }
    }
  };

  const toggleItemAvailability = async (itemId, currentStatus) => {
    try {
      await MenuItem.update(itemId, { disponivel: !currentStatus });
      setMenuItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, disponivel: !currentStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao alterar disponibilidade:", error);
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm("Tem certeza que deseja excluir este item do cardápio?")) {
      return;
    }

    try {
      await MenuItem.delete(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "todos" || item.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      entrada: "bg-green-100 text-green-800",
      prato_principal: "bg-blue-100 text-blue-800",
      sobremesa: "bg-pink-100 text-pink-800",
      bebida: "bg-purple-100 text-purple-800",
      lanche: "bg-orange-100 text-orange-800",
      acompanhamento: "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h2>
        <p className="text-gray-600 mb-4">Entre em contato com o suporte.</p>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  console.log("🎨 RENDERIZANDO COMPONENTE GerirCardapio!");
  console.log("🎨 Estado atual - isLoading:", isLoading);
  console.log("🎨 Estado atual - restaurant:", restaurant);
  console.log("🎨 Estado atual - menuItems:", menuItems);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = createPageUrl("restaurantedashboard")}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gerir Cardápio - {restaurant.nome}
                </h1>
                <p className="text-sm text-gray-500">
                  {menuItems.length} itens no cardápio
                </p>
              </div>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Info:</h3>
          <p className="text-sm text-blue-700">Total de menuItems: {menuItems.length}</p>
          <p className="text-sm text-blue-700">Total de filteredItems: {filteredItems.length}</p>
          <p className="text-sm text-blue-700">Search Term: "{searchTerm}"</p>
          <p className="text-sm text-blue-700">Selected Category: {selectedCategory}</p>
          {menuItems.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-blue-700">Primeiro item:</p>
              <pre className="text-xs text-blue-600 bg-blue-100 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(menuItems[0], null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {item.imagem_url ? (
                  <img
                    src={item.imagem_url}
                    alt={item.nome}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <ChefHat className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {item.nome}
                  </h3>
                  <Badge className={`${getCategoryColor(item.categoria)} text-xs`}>
                    {getCategoryLabel(item.categoria)}
                  </Badge>
                </div>

                {item.descricao && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.descricao}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-1" />
                      <span className="font-semibold text-gray-900">
                        €{item.preco.toFixed(2)}
                      </span>
                    </div>
                    {item.tempo_preparo && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{item.tempo_preparo}min</span>
                      </div>
                    )}
                  </div>
                  
                  <Badge 
                    className={item.disponivel 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                    }
                  >
                    {item.disponivel ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleItemAvailability(item.id, item.disponivel)}
                    className="flex-1"
                  >
                    {item.disponivel ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Mostrar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== "todos" 
                  ? "Tente ajustar os filtros de pesquisa"
                  : "Adicione itens ao seu cardápio para começar"
                }
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
