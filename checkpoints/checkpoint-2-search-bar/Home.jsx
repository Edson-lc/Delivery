
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  SlidersHorizontal,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Clock,
  Truck,
  Filter,
  X
} from "lucide-react";

import RestaurantCard from "../components/public/RestaurantCard";
import FilterSidebar from "../components/public/FilterSidebar";
import PromotionalSlider from "../components/public/PromotionalSlider";
import SearchBar from "../components/public/SearchBar";
import { usePublicRestaurants, usePublicRestaurantCategories } from "../hooks/usePublicRestaurants";

export default function HomePage() {
  const [activeFilters, setActiveFilters] = useState({
    sortBy: "avaliacao",
    category: "todas",
    search: ""
  });

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

  // Filtrar e ordenar restaurantes
  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    // Ordenar
    switch (activeFilters.sortBy) {
      case "avaliacao":
        filtered.sort((a, b) => (b.avaliacao || 0) - (a.avaliacao || 0));
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
  };

  const handleSearch = (searchTerm) => {
    setActiveFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const isLoading = restaurantsLoading || promotionalLoading;

  // Debug: verificar se os dados estão chegando
  console.log('Restaurants data:', restaurants);
  console.log('Promotional restaurants:', promotionalRestaurants);
  console.log('Is loading:', isLoading);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* O cabeçalho foi removido daqui e será gerenciado pelo Layout.jsx */}

      {/* Hero Section com Barra de Pesquisa */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 sm:py-12 lg:py-16">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Encontre os melhores 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500"> restaurantes</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Descubra pratos deliciosos, promoções especiais e entregas rápidas na sua região
            </p>
          </div>

          {/* Barra de Pesquisa Principal */}
          <div className="mb-6 sm:mb-8">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Buscar restaurantes, pratos ou categorias..."
            />
          </div>

          {/* Indicadores de Resultados */}
          {activeFilters.search && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200">
                <Search className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">
                  Pesquisando por: <strong>"{activeFilters.search}"</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content - Otimizado para mobile */}
      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
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
            {/* Mobile Filters - Melhorado */}
            <div className="lg:hidden mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Filter className="w-4 h-4" />
                  Ordenar
                </Button>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => handleFilterChange('category', 'todas')}
                  className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeFilters.category === 'todas' 
                      ? 'bg-orange-100 text-orange-700 font-semibold' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {restaurantCategories.slice(0, 5).map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleFilterChange('category', cat)}
                    className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap capitalize transition-colors ${
                      activeFilters.category === cat 
                        ? 'bg-orange-100 text-orange-700 font-semibold' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Promotional Slider */}
            {promotionalRestaurants.length > 0 && (
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
                  "Todos os estabelecimentos"
                )}
              </h2>
              
              {/* Botão para limpar filtros */}
              {(activeFilters.search || activeFilters.category !== 'todas') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveFilters({
                      sortBy: "avaliacao",
                      category: "todas",
                      search: ""
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {/* Grid responsivo para todos os restaurantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))
              ) : (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-12 sm:py-16">
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
                      onClick={() => {
                        setActiveFilters({
                          sortBy: "avaliacao",
                          category: "todas",
                          search: ""
                        });
                      }}
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
