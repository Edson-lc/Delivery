
import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles,
  ArrowRight,
  Filter,
  X
} from "lucide-react";

import RestaurantCard from "../components/public/RestaurantCard";
import FilterSidebar from "../components/public/FilterSidebar";
import { usePublicRestaurants, usePublicRestaurantCategories } from "../hooks/usePublicRestaurants";

// Lazy load components for better performance
const PromotionalSlider = lazy(() => import("../components/public/PromotionalSlider"));
const CategoriesGrid = lazy(() => import("../components/public/CategoriesGrid"));

export default function HomePage() {
  const location = useLocation();
  const [activeFilters, setActiveFilters] = useState({
    sortBy: "avaliacao",
    category: "todas",
    search: ""
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  // Calcular contadores de restaurantes por categoria
  const restaurantCounts = useMemo(() => {
    const counts = {};
    restaurantCategories.forEach(category => {
      counts[category] = restaurants.filter(r => r.categoria === category).length;
    });
    return counts;
  }, [restaurants, restaurantCategories]);

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

  const handleFilterChange = useCallback((filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const handleSearch = useCallback((searchTerm) => {
    setActiveFilters(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({
      sortBy: "avaliacao",
      category: "todas",
      search: ""
    });
    // Limpar URL também
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const handleRestaurantClick = useCallback(() => {
    // Limpar apenas a pesquisa, mantendo outros filtros
    setActiveFilters(prev => ({
      ...prev,
      search: ""
    }));
    // Limpar URL também
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const isLoading = restaurantsLoading || promotionalLoading;

  // Debug: verificar se os dados estão chegando
  console.log('Restaurants data:', restaurants);
  console.log('Promotional restaurants:', promotionalRestaurants);
  console.log('Is loading:', isLoading);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Sabores que
                <span className="block text-yellow-300">chegam até você</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed px-4">
                Descubra os melhores restaurantes da sua região e peça sua comida favorita com apenas alguns cliques
              </p>
            </div>
            
            {/* Quick Filters */}
            <div className="max-w-2xl mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-2">
                {['Pizza', 'Hambúrguer', 'Japonesa', 'Brasileira'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleFilterChange('category', category.toLowerCase())}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto pt-6 sm:pt-8 px-4">
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300">
                  {restaurants.length}+
                </div>
                <div className="text-orange-100 text-sm sm:text-base">Restaurantes</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300">
                  15-30
                </div>
                <div className="text-orange-100 text-sm sm:text-base">Min de Entrega</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300">
                  4.8
                </div>
                <div className="text-orange-100 text-sm sm:text-base">Avaliação Média</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-300/20 rounded-full blur-xl"></div>
      </section>

      {/* Main Content - Otimizado para mobile */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros e Ordenação
            </div>
            {showMobileFilters ? <X className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden mb-6 p-4 bg-white rounded-lg shadow-md">
            <FilterSidebar 
              activeFilters={activeFilters} 
              onFilterChange={handleFilterChange} 
            />
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

            {/* Promotional Slider - Só aparece quando não há pesquisa */}
            {!activeFilters.search && promotionalRestaurants.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  Promoções Especiais
                </h2>
                <Suspense fallback={
                  <div className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
                }>
                  <PromotionalSlider restaurants={promotionalRestaurants} />
                </Suspense>
              </div>
            )}

            {/* Categories Grid - Só aparece quando não há pesquisa */}
            {!activeFilters.search && restaurantCategories.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <Suspense fallback={
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                }>
                  <CategoriesGrid 
                    categories={restaurantCategories}
                    activeCategory={activeFilters.category}
                    onCategoryChange={(category) => handleFilterChange('category', category)}
                    restaurantCounts={restaurantCounts}
                  />
                </Suspense>
              </div>
            )}


            {/* Título Dinâmico baseado na pesquisa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {activeFilters.search ? (
                    <>
                      Resultados para <span className="text-orange-600">"{activeFilters.search}"</span>
                    </>
                  ) : (
                    "Restaurantes em Destaque"
                  )}
                </h2>
                {filteredRestaurants.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">{filteredRestaurants.length}</span>
                      {filteredRestaurants.length === 1 ? 'restaurante' : 'restaurantes'}
                    </span>
                    {activeFilters.category !== 'todas' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {activeFilters.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Botão para limpar filtros */}
              {(activeFilters.search || activeFilters.category !== 'todas') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-800 border-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {/* Grid responsivo para todos os restaurantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
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
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 sm:py-20">
                  <div className="max-w-lg mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                      <Search className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {activeFilters.search ? 'Nenhum resultado encontrado' : 'Nenhum restaurante encontrado'}
                    </h3>
                    <p className="text-gray-600 mb-6 text-lg">
                      {activeFilters.search 
                        ? `Não encontramos restaurantes para "${activeFilters.search}". Tente outros termos ou explore nossas categorias.`
                        : 'Tente ajustar seus filtros ou limpar a pesquisa para ver todos os restaurantes disponíveis.'
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpar filtros
                      </Button>
                      {activeFilters.search && (
                        <Button
                          onClick={() => handleSearch('')}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Ver todos os restaurantes
                        </Button>
                      )}
                    </div>
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
