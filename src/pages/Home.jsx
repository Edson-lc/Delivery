
import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Sparkles,
  Filter,
  X,
  Flame,
  Pizza,
  Sandwich,
  Fish,
  Beef,
  Utensils,
  Carrot,
  IceCream,
  Shell,
  Wine,
  Coffee,
  Star,
  Clock,
  Percent
} from "lucide-react";

import RestaurantCard from "../components/public/RestaurantCard";
import FilterSidebar from "../components/public/FilterSidebar";
import PromotionalSlider from "../components/public/PromotionalSlider";
import { usePublicRestaurants, usePublicRestaurantCategories } from "../hooks/usePublicRestaurants";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";

export default function HomePage() {
  const location = useLocation();
  const [activeFilters, setActiveFilters] = useState({
    sortBy: "rating",
    category: "todas",
    search: ""
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Mapeamento de categorias para ícones (usando função padronizada)
  const getCategoryIconComponent = (category) => {
    return getCategoryIcon(category);
  };

  // Ler parâmetros da URL sempre que a URL mudar
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    
    setActiveFilters(prev => ({
      ...prev,
      search: searchParam || ""
    }));
  }, [location.search]);

  // Buscar restaurantes para o slider (sempre os primeiros 4, sem filtros)
  const { 
    data: promotionalRestaurants = [], 
    isLoading: promotionalLoading 
  } = usePublicRestaurants({
    limit: 4,
    includeMenuItems: true
  });

  // Buscar restaurantes filtrados para a lista principal
  const { 
    data: restaurants = [], 
    isLoading: restaurantsLoading, 
    error: restaurantsError 
  } = usePublicRestaurants({
    category: activeFilters.category !== "todas" ? activeFilters.category : undefined,
    search: activeFilters.search || undefined,
    includeMenuItems: true
  });

  // Debug: verificar erros
  if (restaurantsError) {
    console.error('Restaurants error:', restaurantsError);
  }

  // Buscar categorias
  const { data: restaurantCategories = [] } = usePublicRestaurantCategories();

  // Adicionar CSS customizado para scrollbar horizontal das categorias móveis
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filtrar e ordenar restaurantes
  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    // Ordenar
    switch (activeFilters.sortBy) {
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "taxa_entrega":
        filtered.sort((a, b) => (a.taxaEntrega || 0) - (b.taxaEntrega || 0));
        break;
      case "tempo_preparo":
        filtered.sort((a, b) => (a.tempoPreparo || 0) - (b.tempoPreparo || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [restaurants, activeFilters.sortBy]);

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
    // Fechar filtros mobile após seleção
    setShowMobileFilters(false);
  };

  const handleSearch = (searchTerm) => {
    setActiveFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      sortBy: "rating",
      category: "todas",
      search: ""
    });
    // Limpar URL também
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleRestaurantClick = () => {
    // Limpar apenas a pesquisa, mantendo outros filtros
    setActiveFilters(prev => ({
      ...prev,
      search: ""
    }));
    // Limpar URL também
    window.history.replaceState({}, '', window.location.pathname);
  };

  const isLoading = restaurantsLoading || promotionalLoading;

  // Debug: verificar se os dados estão chegando
  console.log('Restaurants data:', restaurants);
  console.log('Promotional restaurants:', promotionalRestaurants);
  console.log('Is loading:', isLoading);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Main Content - Otimizado para mobile */}
      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Filter Button - Apenas para ordenação */}
        <div className="lg:hidden mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Ordenar
          </Button>
        </div>

        {/* Mobile Categories Navigation */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {/* Botão "Todas" */}
            <button
              onClick={() => handleFilterChange('category', 'todas')}
              className={`px-4 py-2.5 rounded-full capitalize transition-all duration-200 text-sm font-medium whitespace-nowrap border flex items-center gap-2 ${
                activeFilters.category === 'todas' 
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Utensils className="w-4 h-4" />
              Todas
            </button>
            
            {/* Categorias dinâmicas */}
            {restaurantCategories.map(category => {
              const IconComponent = getCategoryIconComponent(category);
              const categoryColor = getCategoryColor(category);
              return (
                <button
                  key={category}
                  onClick={() => handleFilterChange('category', category)}
                  className={`px-4 py-2.5 rounded-full capitalize transition-all duration-200 text-sm font-medium whitespace-nowrap border flex items-center gap-2 ${
                    activeFilters.category === category 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${activeFilters.category === category ? 'text-white' : categoryColor}`} />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Filters - Apenas ordenação */}
        {showMobileFilters && (
          <div className="lg:hidden mb-6 p-4 bg-white rounded-lg shadow-md">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Ordenar por</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange('sortBy', 'rating')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                    activeFilters.sortBy === 'rating' ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Avaliações</span>
                </button>
                <button
                  onClick={() => handleFilterChange('sortBy', 'tempo_preparo')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                    activeFilters.sortBy === 'tempo_preparo' ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Tempo de Entrega</span>
                </button>
                <button
                  onClick={() => handleFilterChange('sortBy', 'taxa_entrega')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                    activeFilters.sortBy === 'taxa_entrega' ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  <Percent className="w-5 h-5 text-green-500" />
                  <span>Taxa de entrega</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar - Escondido no mobile */}
          <aside className="lg:col-span-1 hidden lg:block">
            <FilterSidebar 
              activeFilters={activeFilters} 
              onFilterChange={handleFilterChange} 
            />
          </aside>

          {/* Restaurants Grid - Otimizado para mobile */}
          <div className="lg:col-span-3">

            {/* Promotional Slider - Só aparece quando não há filtros aplicados */}
            {!activeFilters.search && activeFilters.category === 'todas' && promotionalRestaurants.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  Promoções Especiais
                </h2>
                <PromotionalSlider restaurants={promotionalRestaurants} />
              </div>
            )}


            {/* Título Dinâmico baseado na pesquisa */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                {activeFilters.search ? (
                  <>
                    Resultados para <span className="text-orange-600">"{activeFilters.search}"</span>
                    {filteredRestaurants.length > 0 && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurante' : 'restaurantes'})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Todos os estabelecimentos
                    {filteredRestaurants.length > 0 && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurante' : 'restaurantes'})
                      </span>
                    )}
                  </>
                )}
              </h2>
              
              {/* Botão para limpar filtros */}
              {(activeFilters.search || activeFilters.category !== 'todas') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {/* Grid responsivo para todos os restaurantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-32 sm:h-40 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant} 
                    onRestaurantClick={handleRestaurantClick}
                  />
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 sm:py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeFilters.search ? 'Nenhum resultado encontrado' : 'Nenhum restaurante encontrado'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeFilters.search 
                        ? `Não encontramos restaurantes para "${activeFilters.search}". Tente outros termos.`
                        : 'Tente ajustar seus filtros ou limpar a pesquisa.'
                      }
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
