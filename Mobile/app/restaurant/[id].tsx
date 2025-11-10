import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../src/constants';
import { Restaurant, MenuItem } from '../../src/types';
import { useRestaurantMenu } from '../../src/hooks/useRestaurantMenu';
import { usePublicRestaurant } from '../../src/hooks/useRestaurants';
import { useCart } from '../../src/contexts/CartContext';
import { useColors } from '../../src/hooks/useColors';
import { restaurantStyles } from '../../src/styles/restaurantStyles';
import MenuItemModal from '../../src/components/MenuItemModal';
import AddToCartAnimation from '../../src/components/AddToCartAnimation';
import FloatingCart from '../../src/components/FloatingCart';
import { RestaurantHeader } from '../../src/components/RestaurantHeader';

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setRestaurant, addItem } = useCart();
  const colors = useColors();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isMenuItemModalVisible, setIsMenuItemModalVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ x: 0, y: 0 });
  const [animationEndPos, setAnimationEndPos] = useState({ x: 0, y: 0 });

  // Buscar dados do restaurante pelo ID
  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = usePublicRestaurant(id!);
  
  // Usar o hook para buscar dados reais do menu
  const { menuItems, isLoading, error, refetch } = useRestaurantMenu(id!);

  // Processar dados do restaurante para garantir tipos corretos
  const processedRestaurant = useMemo(() => {
    if (!restaurant) return null;
    
    return {
      ...restaurant,
      rating: typeof restaurant.rating === 'string' ? parseFloat(restaurant.rating) : restaurant.rating,
      tempoPreparo: typeof restaurant.tempoPreparo === 'string' ? parseInt(restaurant.tempoPreparo) : restaurant.tempoPreparo,
      taxaEntrega: typeof restaurant.taxaEntrega === 'string' ? parseFloat(restaurant.taxaEntrega) : restaurant.taxaEntrega,
    };
  }, [restaurant]);

  // Definir restaurante no carrinho quando carregar
  React.useEffect(() => {
    if (processedRestaurant) {
      setRestaurant(processedRestaurant);
    }
  }, [processedRestaurant]); // Removido setRestaurant das dependências

  console.log('🍽️ RestaurantMenuScreen - ID:', id);
  console.log('🍽️ RestaurantMenuScreen - Dados do restaurante:', processedRestaurant);
  console.log('🍽️ RestaurantMenuScreen - Menu items:', menuItems);
  console.log('🍽️ RestaurantMenuScreen - Loading:', isLoading);
  console.log('🍽️ RestaurantMenuScreen - Error:', error);

  const getCategories = () => {
    const uniqueCategories = [...new Set(menuItems.map(item => item.categoria))];
    
    // Se temos "Prato_principal" nas categorias, usar apenas "todas"
    // Caso contrário, mostrar todas as categorias individuais
    if (uniqueCategories.includes('Prato_principal')) {
      return ['todas'];
    }
    
    return ['todas', ...uniqueCategories];
  };

  const getFilteredMenuItems = () => {
    console.log('🔍 getFilteredMenuItems - selectedCategory:', selectedCategory);
    console.log('🔍 getFilteredMenuItems - searchQuery:', searchQuery);
    console.log('🔍 getFilteredMenuItems - menuItems.length:', menuItems.length);
    
    let filtered = [...menuItems];
    
    // Aplicar filtro de categoria
    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(item => item.categoria === selectedCategory);
      console.log('🔍 Itens filtrados por categoria:', filtered.length);
    }
    
    // Aplicar filtro de pesquisa
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.nome.toLowerCase().includes(searchTerm) ||
        item.descricao?.toLowerCase().includes(searchTerm) ||
        item.ingredientes?.some(ingredient => 
          ingredient && typeof ingredient === 'string' && 
          ingredient.toLowerCase().includes(searchTerm)
        )
      );
      console.log('🔍 Itens filtrados por pesquisa:', filtered.length);
    }
    
    return filtered;
  };

  const getMenuItemsByCategory = () => {
    const items = getFilteredMenuItems();
    
    // Se há pesquisa ativa, mostrar todos os itens filtrados sem agrupamento
    if (searchQuery.trim()) {
      return { 'Resultados': items };
    }
    
    if (selectedCategory === 'todas') {
      // Agrupar por categoria quando mostrar todas
      const grouped = items.reduce((acc, item) => {
        // Normalizar categoria para agrupamento
        const normalizedCategory = item.categoria === 'Prato_principal' ? 'Prato Principal' : item.categoria;
        
        if (!acc[normalizedCategory]) {
          acc[normalizedCategory] = [];
        }
        acc[normalizedCategory].push(item);
        return acc;
      }, {} as Record<string, MenuItem[]>);
      
      return grouped;
    } else {
      // Mostrar apenas a categoria selecionada
      return { [selectedCategory]: items };
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleMenuItemPress = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setIsMenuItemModalVisible(true);
  };

  const handleCloseMenuItemModal = () => {
    setIsMenuItemModalVisible(false);
    setSelectedMenuItem(null);
  };

  const handleAddToCart = (item: any, quantity: number, observacoes: string, adicionais: any[], ingredientesRemovidos: string[], personalizacoes: any) => {
    try {
      addItem(
        item,
        quantity,
        adicionais,
        ingredientesRemovidos,
        personalizacoes,
        observacoes
      );
    } catch (error) {
      Alert.alert('Erro', 'Não é possível adicionar itens de restaurantes diferentes');
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  const renderHeader = () => (
    <RestaurantHeader
      title={processedRestaurant?.nome || 'Carregando...'}
      onBackPress={handleBackPress}
      onProfilePress={() => {
        router.push('/profile');
      }}
    />
  );

  const renderRestaurantInfo = () => {
    if (!processedRestaurant) return null;
    
    return (
      <View style={restaurantStyles.restaurantInfo}>
        <Image
          source={{ uri: processedRestaurant.imagemUrl || processedRestaurant.imagem_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop' }}
          style={restaurantStyles.restaurantImage}
          resizeMode="cover"
        />
        <View style={restaurantStyles.imageOverlay} />
        <View style={[restaurantStyles.restaurantCard, { backgroundColor: colors.surface }]}>
          <Text style={[restaurantStyles.restaurantName, { color: colors.text }]}>{processedRestaurant.nome}</Text>
          <View style={restaurantStyles.restaurantStats}>
            <View style={restaurantStyles.statItem}>
              <MaterialIcons name="thumb-up" size={16} color={colors.textSecondary} />
              <Text style={[restaurantStyles.statText, { color: colors.textSecondary }]}>{`${processedRestaurant.rating?.toFixed(1) || '4.5'} (500+)`}</Text>
            </View>
            <View style={restaurantStyles.statItem}>
              <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
              <Text style={[restaurantStyles.statText, { color: colors.textSecondary }]}>{`${processedRestaurant.tempoPreparo || 30}-45 min`}</Text>
            </View>
            <View style={restaurantStyles.statItem}>
              <MaterialIcons name="pedal-bike" size={16} color={colors.textSecondary} />
              <Text style={[restaurantStyles.statText, { color: colors.textSecondary }]}>{`€${(processedRestaurant.taxaEntrega || 2.50).toFixed(2)}`}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSearchBar = () => (
    <View style={[restaurantStyles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MaterialIcons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        style={[restaurantStyles.searchInput, { color: colors.text }]}
        placeholder={`Procurar em ${processedRestaurant?.nome || 'restaurante'}`}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );

  const renderCategoryFilters = () => {
    // Não mostrar filtros quando há pesquisa ativa
    if (searchQuery.trim()) {
      return null;
    }
    
    return (
      <View style={[restaurantStyles.categoryFilters, { backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={restaurantStyles.filtersScrollContent}
        >
          {getCategories().map(category => {
            const isActive = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  restaurantStyles.categoryFilter,
                  isActive && restaurantStyles.activeCategoryFilter,
                  !isActive && { backgroundColor: colors.surface, borderColor: colors.border }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <MaterialIcons
                  name="restaurant-menu"
                  size={16}
                  color={isActive ? 'white' : colors.textSecondary}
                />
                <Text style={[
                  restaurantStyles.categoryFilterText,
                  isActive && restaurantStyles.activeCategoryFilterText,
                  !isActive && { color: colors.textSecondary }
                ]}>
                  {formatCategoryName(category)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    
    // Verificar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    // Verificar se a imagem não falhou ao carregar
    return !imageErrors.has(url);
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  const renderMenuItem = (item: MenuItem) => {
    const handleAddButtonPress = (event: any) => {
      // Medir a posição do botão clicado
      event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const startX = pageX + width / 2;
        const startY = pageY + height / 2;
        
        // Posição do ícone do carrinho dentro do FloatingCart
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const endX = SPACING.md + 30;
        const endY = screenHeight - 60 - 30;
        
        setAnimationStartPos({ x: startX, y: startY });
        setAnimationEndPos({ x: endX, y: endY });
        setIsAnimating(true);
      });
      
      // Adicionar item ao carrinho
      try {
        addItem(
          item,
          1, // quantidade padrão
          [], // sem adicionais
          [], // sem ingredientes removidos
          {}, // sem personalizações
          '' // sem observações
        );
      } catch (error) {
        Alert.alert('Erro', 'Não é possível adicionar itens de restaurantes diferentes');
      }
    };
    
    const hasValidImage = isValidImageUrl(item.imagemUrl) || isValidImageUrl(item.imagem_url);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          restaurantStyles.menuItem,
          !hasValidImage && restaurantStyles.menuItemWithoutImage,
          { backgroundColor: colors.surface, borderColor: colors.border }
        ]}
        onPress={() => handleMenuItemPress(item)}
      >
        {hasValidImage && (
          <Image
            source={{ uri: item.imagemUrl || item.imagem_url }}
            style={restaurantStyles.menuItemImage}
            resizeMode="cover"
            onError={() => handleImageError(item.imagemUrl || item.imagem_url || '')}
          />
        )}
        <View style={restaurantStyles.menuItemContent}>
          <Text style={[restaurantStyles.menuItemName, { color: colors.text }]} numberOfLines={1}>{item.nome}</Text>
          <Text style={[restaurantStyles.menuItemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.descricao}
          </Text>
          <Text style={[restaurantStyles.menuItemPrice, { color: colors.primary }]}>{`€${item.preco.toFixed(2)}`}</Text>
        </View>
        <TouchableOpacity 
          style={restaurantStyles.addButton}
          onPress={handleAddButtonPress}
        >
          <MaterialIcons name="add" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const formatCategoryName = (categoryName: string) => {
    if (categoryName === 'todas') return 'Todas';
    
    // Substituir underscores por espaços e capitalizar
    return categoryName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderCategorySection = (categoryName: string, items: MenuItem[]) => (
    <View key={categoryName} style={restaurantStyles.categorySection}>
      <View style={restaurantStyles.categoryHeader}>
        <MaterialIcons name="restaurant-menu" size={20} color={colors.primary} />
        <Text style={[restaurantStyles.categoryTitle, { color: colors.text }]}>
          {formatCategoryName(categoryName)}
        </Text>
      </View>
      {items.map(renderMenuItem)}
    </View>
  );

  const renderContent = () => {
    if (restaurantLoading || isLoading) {
      return (
        <View style={restaurantStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[restaurantStyles.loadingText, { color: colors.textSecondary }]}>Carregando cardápio...</Text>
        </View>
      );
    }

    if (restaurantError || error) {
      return (
        <View style={restaurantStyles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[restaurantStyles.errorText, { color: colors.error }]}>Erro ao carregar cardápio</Text>
          <TouchableOpacity style={restaurantStyles.retryButton} onPress={refetch}>
            <Text style={restaurantStyles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!processedRestaurant) {
      return (
        <View style={restaurantStyles.errorContainer}>
          <MaterialIcons name="restaurant" size={48} color={colors.error} />
          <Text style={[restaurantStyles.errorText, { color: colors.error }]}>Restaurante não encontrado</Text>
          <TouchableOpacity style={restaurantStyles.retryButton} onPress={handleBackPress}>
            <Text style={restaurantStyles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const menuItemsByCategory = getMenuItemsByCategory();
    const hasItems = Object.values(menuItemsByCategory).some(items => items.length > 0);

    return (
      <ScrollView 
        style={restaurantStyles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={restaurantStyles.scrollContent}
      >
        {renderRestaurantInfo()}
        {renderSearchBar()}
        {renderCategoryFilters()}
        
        <View style={restaurantStyles.menuItemsContainer}>
          {hasItems ? (
            Object.entries(menuItemsByCategory).map(([categoryName, items]) => 
              renderCategorySection(categoryName, items)
            )
          ) : (
            <View style={restaurantStyles.emptyState}>
              <MaterialIcons name="restaurant-menu" size={64} color={colors.textSecondary} />
              <Text style={[restaurantStyles.emptyStateTitle, { color: colors.text }]}>Nenhum item encontrado</Text>
              <Text style={[restaurantStyles.emptyStateText, { color: colors.textSecondary }]}>
                Não há itens disponíveis nesta categoria
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[restaurantStyles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {renderContent()}
      
      {/* Carrinho flutuante */}
      <FloatingCart visible={menuItems.length > 0} />
      
      {/* Animação de adicionar ao carrinho */}
      <AddToCartAnimation
        visible={isAnimating}
        onComplete={handleAnimationComplete}
        startPosition={animationStartPos}
        endPosition={animationEndPos}
      />
      
      {/* Modal de detalhes do item */}
      <MenuItemModal
        visible={isMenuItemModalVisible}
        menuItem={selectedMenuItem}
        onClose={handleCloseMenuItemModal}
        onAddToCart={handleAddToCart}
      />
    </View>
  );
}