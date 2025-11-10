import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants';
import { FilterOptions, Restaurant } from '../src/types';
import { useAuth } from '../src/contexts/AuthContext';
import { useColors } from '../src/hooks/useColors';
import { usePublicRestaurants, usePublicRestaurantCategories } from '../src/hooks/useRestaurants';
import { RestaurantCard } from '../src/components/RestaurantCard';
import PromotionalSlider from '../src/components/PromotionalSlider';
import { getCategoryIcon, getCategoryColor } from '../src/utils/categoryIcons';
import { homeStyles } from '../src/styles/homeStyles';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const colors = useColors();
  
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    sortBy: 'rating',
    category: 'todas',
    search: ''
  });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filtersScrollRef = useRef<ScrollView>(null);
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);

  // Fetch restaurants for the slider (always the first 4, no filters)
  const {
    data: promotionalRestaurants = [],
    isLoading: promotionalLoading
  } = usePublicRestaurants({
    limit: 4,
    includeMenuItems: true
  });

  // Fetch filtered restaurants for the main list
  const {
    data: restaurants = [],
    isLoading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants
  } = usePublicRestaurants({
    category: activeFilters.category !== "todas" ? activeFilters.category : undefined,
    search: activeFilters.search || undefined,
    includeMenuItems: true
  });

  // Fetch categories
  const {
    data: restaurantCategories = [],
    isLoading: categoriesLoading
  } = usePublicRestaurantCategories();

  // Fazer scroll para a categoria selecionada quando a tela for montada
  useEffect(() => {
    if (filtersScrollRef.current && restaurantCategories.length > 0) {
      setTimeout(() => {
        if (filtersScrollRef.current) {
          const categoryIndex = ['todas', ...restaurantCategories].indexOf(activeFilters.category);
          if (categoryIndex > 0) {
            // Calcular posição aproximada baseada no índice
            const buttonWidth = 120; // Largura aproximada do botão + margem
            const scrollPosition = (categoryIndex - 1) * buttonWidth;
            filtersScrollRef.current.scrollTo({
              x: scrollPosition,
              animated: true
            });
          }
        }
      }, 200);
    }
  }, [restaurantCategories, activeFilters.category]);

  // Filter restaurants based on active filters
  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    // Apply category filter
    if (activeFilters.category !== 'todas') {
      filtered = filtered.filter(restaurant => 
        restaurant.categoria.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }

    // Apply search filter (including menu items)
    if (activeFilters.search) {
      const searchTerm = activeFilters.search.toLowerCase();
      filtered = filtered.filter(restaurant => {
        // Search in restaurant name and category
        const restaurantMatch = 
          restaurant.nome.toLowerCase().includes(searchTerm) ||
          restaurant.categoria.toLowerCase().includes(searchTerm);
        
        // Search in menu items if available
        const menuMatch = restaurant.menuItems && restaurant.menuItems.some((item: any) =>
          item.nome.toLowerCase().includes(searchTerm) ||
          item.descricao?.toLowerCase().includes(searchTerm) ||
          item.categoria?.toLowerCase().includes(searchTerm)
        );
        
        return restaurantMatch || menuMatch;
      });
    }

    // Apply sorting
    switch (activeFilters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'deliveryTime':
        filtered.sort((a, b) => (a.tempoPreparo || 30) - (b.tempoPreparo || 30));
        break;
    }

    return filtered;
  }, [restaurants, activeFilters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Fazer scroll inteligente para a categoria selecionada
    if (key === 'category' && filtersScrollRef.current) {
      setTimeout(() => {
        if (filtersScrollRef.current) {
          const allCategories = ['todas', ...restaurantCategories];
          const currentIndex = allCategories.indexOf(activeFilters.category);
          const newIndex = allCategories.indexOf(value);
          
          if (newIndex !== currentIndex) {
            // Calcular posição aproximada baseada no índice
            const buttonWidth = 120; // Largura aproximada do botão + margem
            
            // Para "Todas" (índice 0), sempre scroll para o início
            if (newIndex === 0) {
              filtersScrollRef.current.scrollTo({
                x: 0,
                animated: true
              });
            } else {
              // Para outras categorias, calcular posição baseada no índice
              const scrollPosition = (newIndex - 1) * buttonWidth;
              
              // Scroll baseado na posição atual
              filtersScrollRef.current.scrollTo({
                x: scrollPosition,
                animated: true
              });
            }
          }
        }
      }, 100);
    }
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
    setSearchQuery(searchTerm);
  };

  const handleSearchPress = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
    setIsSearchExpanded(false);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    handleSearch('');
    setIsSearchExpanded(false);
  };

  const handleSearchBlur = () => {
    if (searchQuery.length === 0) {
      setIsSearchExpanded(false);
    }
  };

  const handleLogoPress = () => {
    // Voltar para o estado inicial da home
    setActiveFilters({
      sortBy: 'rating',
      category: 'todas',
      search: ''
    });
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  const handleLoginPress = () => {
    router.push('/login');
  };

  const renderHeader = () => (
    <View 
      style={[homeStyles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
    >
      <View style={[homeStyles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Logo e Nome do App */}
        <View style={homeStyles.headerLeft}>
          <TouchableOpacity style={homeStyles.logo} onPress={handleLogoPress}>
            <Image
              source={require('../assets/logo-amaeats.png')}
              style={homeStyles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {!isSearchExpanded && (
            <Text style={[homeStyles.headerTitle, { color: colors.text }]}>AmaEats</Text>
          )}
        </View>

        {/* Barra de Pesquisa Expansível */}
        {isSearchExpanded ? (
          <View style={[homeStyles.searchBarExpanded, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[homeStyles.searchInputExpanded, { color: colors.text }]}
              placeholder="Buscar restaurantes ou pratos..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
              returnKeyType="search"
              onBlur={handleSearchBlur}
            />
            <TouchableOpacity onPress={() => setIsSearchExpanded(false)}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={homeStyles.headerRight}>
            <TouchableOpacity 
              style={[homeStyles.headerIcon, { backgroundColor: colors.background }]} 
              onPress={handleSearchPress}
            >
              <MaterialIcons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={homeStyles.headerIconProfile} onPress={isAuthenticated ? () => {
              router.push('/profile');
            } : handleLoginPress}>
              {isAuthenticated && user?.fotoUrl ? (
                <Image
                  source={{ uri: user.fotoUrl }}
                  style={homeStyles.userPhoto}
                  resizeMode="cover"
                />
              ) : (
                <MaterialIcons name="person" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Modal de Sugestões - Renderizado logo após o header */}
      {renderSearchSuggestions()}
    </View>
  );

  const renderContent = () => {
    if (restaurantsLoading || promotionalLoading) {
      return (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[homeStyles.loadingText, { color: colors.textSecondary }]}>Carregando restaurantes...</Text>
        </View>
      );
    }

    if (restaurantsError) {
      return (
        <View style={homeStyles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[homeStyles.errorText, { color: colors.text }]}>Erro ao carregar restaurantes</Text>
          <TouchableOpacity style={homeStyles.retryButton} onPress={refetchRestaurants}>
            <Text style={homeStyles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView 
        style={homeStyles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.scrollContent}
      >
            {/* Filtros horizontais no topo - só aparecem quando não há pesquisa */}
            {!activeFilters.search && (
              <View style={[homeStyles.mobileFilters, { backgroundColor: colors.background }]}>
                <ScrollView
                  ref={filtersScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={homeStyles.filtersScrollContent}
                  onScroll={(event) => {
                    setCurrentScrollPosition(event.nativeEvent.contentOffset.x);
                  }}
                  scrollEventThrottle={16}
                >
                  {/* Botão "Todas" */}
                  <TouchableOpacity
                    style={[
                      homeStyles.filterButton,
                      activeFilters.category === 'todas' && homeStyles.activeFilterButton,
                      activeFilters.category !== 'todas' && { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => handleFilterChange('category', 'todas')}
                  >
                    <MaterialIcons name="restaurant-menu" size={16} color={activeFilters.category === 'todas' ? 'white' : colors.textSecondary} />
                    <Text style={[
                      homeStyles.filterButtonText,
                      activeFilters.category === 'todas' && homeStyles.activeFilterButtonText,
                      activeFilters.category !== 'todas' && { color: colors.textSecondary }
                    ]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Categorias dinâmicas */}
                  {restaurantCategories.map(category => {
                    const categoryIcon = getCategoryIcon(category);
                    const categoryColor = getCategoryColor(category);
                    const isActive = activeFilters.category === category;
                    
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          homeStyles.filterButton,
                          isActive && homeStyles.activeFilterButton,
                          !isActive && { backgroundColor: colors.surface, borderColor: colors.border }
                        ]}
                        onPress={() => handleFilterChange('category', category)}
                      >
                        <MaterialIcons 
                          name={categoryIcon.name} 
                          size={16} 
                          color={isActive ? 'white' : categoryColor} 
                        />
                        <Text style={[
                          homeStyles.filterButtonText,
                          isActive && homeStyles.activeFilterButtonText,
                          !isActive && { color: colors.textSecondary }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

        {/* Promotional Slider - Só aparece quando não há filtros aplicados */}
        {!activeFilters.search && activeFilters.category === 'todas' && promotionalRestaurants.length > 0 && (
          <View style={homeStyles.promotionalSection}>
            <PromotionalSlider
              restaurants={promotionalRestaurants}
              onRestaurantPress={handleRestaurantPress}
            />
          </View>
        )}

            {/* Título Dinâmico baseado na pesquisa */}
            <View style={homeStyles.sectionHeader}>
              <View style={homeStyles.sectionTitleContainer}>
                <MaterialIcons 
                  name={activeFilters.search ? "search" : "restaurant-menu"} 
                  size={20} 
                  color={colors.text} 
                />
                <Text style={[homeStyles.sectionTitle, { color: colors.text }]}>
                  {activeFilters.search 
                    ? `"${activeFilters.search}"` 
                    : activeFilters.category === 'todas' 
                      ? 'Estabelecimentos' 
                      : `${activeFilters.category.charAt(0).toUpperCase() + activeFilters.category.slice(1)}`
                  }
                </Text>
              </View>
              {activeFilters.search && (
                <TouchableOpacity onPress={handleSearchClear} style={homeStyles.clearSearchButton}>
                  <Text style={homeStyles.clearSearchText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>

        {/* Lista vertical de restaurantes */}
        <View style={homeStyles.restaurantsList}>
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={restaurant} 
                onPress={() => handleRestaurantPress(restaurant)}
              />
            ))
          ) : (
            <View style={homeStyles.emptyState}>
              <MaterialIcons name="restaurant" size={64} color={colors.textSecondary} />
              <Text style={[homeStyles.emptyStateTitle, { color: colors.text }]}>Nenhum restaurante encontrado</Text>
              <Text style={[homeStyles.emptyStateText, { color: colors.textSecondary }]}>
                Tente ajustar os filtros ou fazer uma nova busca
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderSearchSuggestions = () => {
    if (!isSearchExpanded) return null;

    return (
      <View style={[
        homeStyles.searchSuggestionsModal, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
        }
      ]}>
        <View style={homeStyles.searchSuggestionsContent}>
          <Text style={[homeStyles.suggestionsTitle, { color: colors.text }]}>Sugestões de busca</Text>
          {restaurantCategories.slice(0, 5).map((category) => (
            <TouchableOpacity
              key={category}
              style={[homeStyles.suggestionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setSearchQuery(category);
                handleSearch(category);
                setIsSearchExpanded(false);
              }}
            >
              <MaterialIcons name="restaurant-menu" size={20} color={colors.primary} />
              <Text style={[homeStyles.suggestionText, { color: colors.text }]}>{category}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[homeStyles.suggestionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              setSearchQuery('pizza');
              handleSearch('pizza');
              setIsSearchExpanded(false);
            }}
          >
            <MaterialIcons name="local-pizza" size={20} color={colors.primary} />
            <Text style={[homeStyles.suggestionText, { color: colors.text }]}>Pizza</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[homeStyles.suggestionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              setSearchQuery('hambúrguer');
              handleSearch('hambúrguer');
              setIsSearchExpanded(false);
            }}
          >
            <MaterialIcons name="fastfood" size={20} color={colors.primary} />
            <Text style={[homeStyles.suggestionText, { color: colors.text }]}>Hambúrguer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[homeStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={colors.background === '#111827' ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
}