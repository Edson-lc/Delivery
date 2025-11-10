import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { FilterOptions, Restaurant } from '../types';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { usePublicRestaurants, usePublicRestaurantCategories } from '../hooks/useRestaurants';
import RestaurantCard from '../components/RestaurantCard';
import PromotionalSlider from '../components/PromotionalSlider';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { navigateToRestaurantMenu, navigateToLogin } = useNavigation();
  const { user, isAuthenticated, logout } = useAuth();
  
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
    navigateToRestaurantMenu(restaurant);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Logo e Nome do App */}
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.logo} onPress={handleLogoPress}>
          <MaterialIcons name="favorite" size={20} color="white" />
        </TouchableOpacity>
        {!isSearchExpanded && (
          <Text style={styles.headerTitle}>AmaEats</Text>
        )}
      </View>

      {/* Barra de Pesquisa Expansível */}
      {isSearchExpanded ? (
        <View style={styles.searchBarExpanded}>
          <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInputExpanded}
            placeholder="Buscar restaurantes ou pratos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            autoFocus
            returnKeyType="search"
            onBlur={handleSearchBlur}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleSearchPress}>
            <MaterialIcons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconProfile} onPress={isAuthenticated ? () => {
            Alert.alert(
              'Menu do Usuário',
              `Olá, ${user?.fullName || user?.nome}!`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: logout }
              ]
            );
          } : navigateToLogin}>
            {isAuthenticated && user?.fotoUrl ? (
              <Image
                source={{ uri: user.fotoUrl }}
                style={styles.userPhoto}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons name="person" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}

    </View>
  );

  const renderContent = () => {
    if (restaurantsLoading || promotionalLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando restaurantes...</Text>
        </View>
      );
    }

    if (restaurantsError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Erro ao carregar restaurantes</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchRestaurants}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Filtros horizontais no topo - só aparecem quando não há pesquisa */}
            {!activeFilters.search && (
              <View style={styles.mobileFilters}>
                <ScrollView
                  ref={filtersScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScrollContent}
                  onScroll={(event) => {
                    setCurrentScrollPosition(event.nativeEvent.contentOffset.x);
                  }}
                  scrollEventThrottle={16}
                >
                  {/* Botão "Todas" */}
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeFilters.category === 'todas' && styles.activeFilterButton
                    ]}
                    onPress={() => handleFilterChange('category', 'todas')}
                  >
                    <MaterialIcons name="restaurant-menu" size={16} color={activeFilters.category === 'todas' ? 'white' : COLORS.textSecondary} />
                    <Text style={[
                      styles.filterButtonText,
                      activeFilters.category === 'todas' && styles.activeFilterButtonText
                    ]}>
                      Todas
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Categorias dinâmicas */}
                  {restaurantCategories.map(category => {
                    const categoryIconData = getCategoryIcon(category);
                    const categoryColor = getCategoryColor(category);
                    const isActive = activeFilters.category === category;
                    
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterButton,
                          isActive && styles.activeFilterButton
                        ]}
                        onPress={() => handleFilterChange('category', category)}
                      >
                        <MaterialIcons 
                          name={categoryIconData.name} 
                          size={16} 
                          color={isActive ? 'white' : categoryColor} 
                        />
                        <Text style={[
                          styles.filterButtonText,
                          isActive && styles.activeFilterButtonText
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
          <View style={styles.promotionalSection}>
            <PromotionalSlider
              restaurants={promotionalRestaurants}
              onRestaurantPress={handleRestaurantPress}
            />
          </View>
        )}

            {/* Título Dinâmico baseado na pesquisa */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons 
                  name={activeFilters.search ? "search" : "restaurant-menu"} 
                  size={20} 
                  color={COLORS.text} 
                />
                <Text style={styles.sectionTitle}>
                  {activeFilters.search 
                    ? `"${activeFilters.search}"` 
                    : activeFilters.category === 'todas' 
                      ? 'Estabelecimentos' 
                      : `${activeFilters.category.charAt(0).toUpperCase() + activeFilters.category.slice(1)}`
                  }
                </Text>
              </View>
              {activeFilters.search && (
                <TouchableOpacity onPress={handleSearchClear} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>

        {/* Lista vertical de restaurantes */}
        <View style={styles.restaurantsList}>
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={restaurant} 
                onPress={() => handleRestaurantPress(restaurant)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>Nenhum restaurante encontrado</Text>
              <Text style={styles.emptyStateText}>
                Tente ajustar os filtros ou fazer uma nova busca
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderSearchSuggestions = () => {
    if (!isSearchExpanded || searchQuery.length > 0) return null;

    return (
      <View style={styles.searchSuggestionsModal}>
        <View style={styles.searchSuggestionsContent}>
          <Text style={styles.suggestionsTitle}>Sugestões de busca</Text>
          {restaurantCategories.slice(0, 5).map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.suggestionItem}
              onPress={() => {
                setSearchQuery(category);
                handleSearch(category);
                setIsSearchExpanded(false);
              }}
            >
              <MaterialIcons name="restaurant-menu" size={20} color={COLORS.primary} />
              <Text style={styles.suggestionText}>{category}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => {
              setSearchQuery('pizza');
              handleSearch('pizza');
              setIsSearchExpanded(false);
            }}
          >
            <MaterialIcons name="local-pizza" size={20} color={COLORS.primary} />
            <Text style={styles.suggestionText}>Pizza</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => {
              setSearchQuery('hambúrguer');
              handleSearch('hambúrguer');
              setIsSearchExpanded(false);
            }}
          >
            <MaterialIcons name="fastfood" size={20} color={COLORS.primary} />
            <Text style={styles.suggestionText}>Hambúrguer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {renderHeader()}
        {renderSearchSuggestions()}
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 40, // Compensar falta do SafeAreaView
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
      headerIconProfile: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      userPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
      },
  // Search Bar Expanded Styles
  searchBarExpanded: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInputExpanded: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  // Search Suggestions Modal Styles
  searchSuggestionsModal: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  searchSuggestionsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  mobileFilters: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#F9FAFB',
  },
  filtersScrollContent: {
    paddingRight: SPACING.md,
    paddingBottom: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  promotionalSection: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearSearchButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  clearSearchText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
  restaurantsList: {
    paddingHorizontal: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  retryButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONT_SIZES.lg,
  },
  // Search Modal Styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  searchResultCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  noResultsText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noResultsSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  suggestionsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  suggestionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  // Matching Items Styles
  matchingItemsContainer: {
    marginTop: SPACING.xs,
  },
  matchingItemsText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  matchingItemsList: {
    gap: SPACING.xs,
  },
  matchingItemName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});