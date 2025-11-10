import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { Restaurant, MenuItem } from '../types';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import FloatingCart from '../components/FloatingCart';

export default function RestaurantMenuScreen() {
  const { goBack, selectedRestaurant } = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const restaurant = selectedRestaurant!;
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');


  // Processar dados do restaurante para garantir tipos corretos
  const processedRestaurant = {
    ...restaurant,
    rating: typeof restaurant.rating === 'string' ? parseFloat(restaurant.rating) : restaurant.rating,
    tempoPreparo: typeof restaurant.tempoPreparo === 'string' ? parseInt(restaurant.tempoPreparo) : restaurant.tempoPreparo,
    taxaEntrega: typeof restaurant.taxaEntrega === 'string' ? parseFloat(restaurant.taxaEntrega) : restaurant.taxaEntrega,
  };

  // Usar o hook para buscar dados reais do menu
  const { menuItems, isLoading, error, refetch } = useRestaurantMenu(processedRestaurant.id);

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
    goBack();
  };

  const handleMenuItemPress = (menuItem: MenuItem) => {
    Alert.alert("Item do Menu", `Você clicou em ${menuItem.nome}`);
  };


  const renderDebugInfo = () => {
    const filteredItems = getFilteredMenuItems();
    
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🔍 DEBUG - DADOS DO MENU:</Text>
        <Text style={styles.debugText}>✅ Restaurante: {processedRestaurant.nome}</Text>
        <Text style={styles.debugText}>📊 Total de itens: {menuItems.length}</Text>
        <Text style={styles.debugText}>🔍 Categoria: {selectedCategory}</Text>
        <Text style={styles.debugText}>📋 Itens filtrados: {filteredItems.length}</Text>
        <Text style={styles.debugText}>⏳ Carregando: {isLoading ? 'SIM' : 'NÃO'}</Text>
        <Text style={styles.debugText}>❌ Erro: {error ? error.message : 'Nenhum'}</Text>
        
        {menuItems.length > 0 ? (
          <View style={styles.debugItems}>
            <Text style={styles.debugText}>🍽️ Primeiros itens encontrados:</Text>
            {menuItems.slice(0, 2).map((item, index) => (
              <Text key={index} style={styles.debugItemText}>
                {`• ${item.nome} - €${item.preco} (${item.categoria})`}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.debugText}>⚠️ NENHUM ITEM ENCONTRADO!</Text>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Botão Voltar */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      {/* Nome do Restaurante */}
      <Text style={styles.headerTitle}>{processedRestaurant.nome}</Text>

      {/* Foto do Usuário ou Ícone */}
      <TouchableOpacity style={styles.headerIconProfile}>
        {isAuthenticated && user?.fotoUrl ? (
          <Image
            source={{ uri: user.fotoUrl }}
            style={styles.userAvatar}
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons name="person" size={24} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRestaurantInfo = () => (
    <View style={styles.restaurantInfo}>
      <Image
        source={{ uri: processedRestaurant.imagemUrl || processedRestaurant.imagem_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop' }}
        style={styles.restaurantImage}
        resizeMode="cover"
      />
      <View style={styles.imageOverlay} />
      <View style={styles.restaurantCard}>
        <Text style={styles.restaurantName}>{processedRestaurant.nome}</Text>
        <View style={styles.restaurantStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="thumb-up" size={16} color="#6c757d" />
            <Text style={styles.statText}>{`${processedRestaurant.rating?.toFixed(1) || '4.5'} (500+)`}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="access-time" size={16} color="#6c757d" />
            <Text style={styles.statText}>{`${processedRestaurant.tempoPreparo || 30}-45 min`}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="pedal-bike" size={16} color="#6c757d" />
            <Text style={styles.statText}>{`€${(processedRestaurant.taxaEntrega || 2.50).toFixed(2)}`}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder={`Procurar em ${processedRestaurant.nome}`}
        placeholderTextColor={COLORS.textSecondary}
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
      <View style={styles.categoryFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {getCategories().map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilter,
                selectedCategory === category && styles.activeCategoryFilter
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <MaterialIcons
                name="restaurant-menu"
                size={16}
                color={selectedCategory === category ? 'white' : COLORS.textSecondary}
              />
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === category && styles.activeCategoryFilterText
              ]}>
                {formatCategoryName(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuItemPress(item)}
    >
      <Image
        source={{ uri: item.imagemUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' }}
        style={styles.menuItemImage}
        resizeMode="cover"
      />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.descricao}
        </Text>
        {item.alergenos && item.alergenos.length > 0 && (
          <View style={styles.allergenTag}>
            <Text style={styles.allergenText}>
              {`alergias ${item.alergenos.join(', ')}`}
            </Text>
          </View>
        )}
        <Text style={styles.menuItemPrice}>{`€${item.preco.toFixed(2)}`}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
    <View key={categoryName} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <MaterialIcons name="restaurant-menu" size={20} color={COLORS.primary} />
        <Text style={styles.categoryTitle}>
          {formatCategoryName(categoryName)}
        </Text>
      </View>
      {items.map(renderMenuItem)}
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando cardápio...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Erro ao carregar cardápio</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const menuItemsByCategory = getMenuItemsByCategory();
    const hasItems = Object.values(menuItemsByCategory).some(items => items.length > 0);

    return (
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {renderRestaurantInfo()}
        {renderSearchBar()}
        {renderCategoryFilters()}
        
        <View style={styles.menuItemsContainer}>
          {hasItems ? (
            Object.entries(menuItemsByCategory).map(([categoryName, items]) => 
              renderCategorySection(categoryName, items)
            )
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant-menu" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>Nenhum item encontrado</Text>
              <Text style={styles.emptyStateText}>
                Não há itens disponíveis nesta categoria
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
      <FloatingCart visible={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 40, // Compensar falta do SafeAreaView
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  restaurantInfo: {
    position: 'relative',
    height: 150,
    marginBottom: SPACING.lg + 10,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
    restaurantCard: {
      position: 'absolute',
      bottom: -20,
      left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 1.0)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  restaurantName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: SPACING.md,
  },
  restaurantStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    color: '#6c757d',
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: 0,
    gap: SPACING.sm,
  },
  searchPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
  },
  categoryFilters: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginTop: 0,
    backgroundColor: '#F9FAFB',
  },
  filtersScrollContent: {
    paddingRight: SPACING.md,
    paddingBottom: SPACING.md,
  },
  categoryFilter: {
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
  activeCategoryFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryFilterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  activeCategoryFilterText: {
    color: 'white',
  },
  menuItemsContainer: {
    paddingHorizontal: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  menuItemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuItemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  menuItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.sm * 1.4,
    marginBottom: SPACING.sm,
  },
  menuItemPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  allergenTag: {
    backgroundColor: '#f3f4f6',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  allergenText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
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
  // Debug Styles
  debugContainer: {
    backgroundColor: '#ffeb3b', // Amarelo bem visível
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 3,
    borderColor: '#ff9800', // Laranja
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  debugTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: '#d32f2f', // Vermelho escuro
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  debugText: {
    fontSize: FONT_SIZES.md,
    color: '#1976d2', // Azul escuro
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  debugItems: {
    marginTop: SPACING.sm,
    backgroundColor: '#fff3e0',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  debugItemText: {
    fontSize: FONT_SIZES.sm,
    color: '#388e3c', // Verde escuro
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
});
