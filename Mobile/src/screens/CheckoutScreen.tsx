import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigation } from '../contexts/NavigationContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';

export const CheckoutScreen: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { items, restaurant, subtotal, deliveryFee, total, isCartEmpty } = useCart();
  const { navigateToLogin, navigateToHome } = useNavigation();

  // Verificar se o usuário está logado
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Necessário',
        'Você precisa fazer login para finalizar o pedido.',
        [
          {
            text: 'Cancelar',
            onPress: () => navigateToHome(),
          },
          {
            text: 'Fazer Login',
            onPress: () => navigateToLogin(),
          },
        ]
      );
    }
  }, [isAuthenticated, navigateToLogin, navigateToHome]);

  // Se não estiver logado, mostrar tela de carregamento
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="lock" size={48} color={COLORS.textSecondary} />
          <Text style={styles.loadingText}>Verificando autenticação...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Se o carrinho estiver vazio
  if (isCartEmpty || !restaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Carrinho Vazio</Text>
          <Text style={styles.emptySubtitle}>
            Adicione itens do cardápio para continuar com o pedido
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      'Confirmar Pedido',
      `Restaurante: ${restaurant.nome}\nTotal: ${formatPrice(total)}\n\nDeseja confirmar este pedido?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            Alert.alert(
              'Pedido Confirmado! 🎉',
              `Seu pedido foi realizado com sucesso!\n\nRestaurante: ${restaurant.nome}\nTotal: ${formatPrice(total)}\n\nVocê receberá uma confirmação por email.`,
              [
                {
                  text: 'OK',
                  onPress: () => navigateToHome(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finalizar Pedido</Text>
          <Text style={styles.headerSubtitle}>
            Revise seus itens e complete as informações
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <MaterialIcons name="person" size={20} color={COLORS.primary} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.fullName || user?.full_name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>{restaurant.nome}</Text>
            <Text style={styles.restaurantSubtext}>Restaurante selecionado</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          {items.map((item, index) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.nome}</Text>
                <Text style={styles.itemQuantity}>{`Quantidade: ${item.quantity}`}</Text>
                {item.selectedExtras && item.selectedExtras.length > 0 && (
                  <Text style={styles.itemExtras}>
                    {`+ ${item.selectedExtras.map(extra => extra.nome).join(', ')}`}
                  </Text>
                )}
                {item.observations && (
                  <Text style={styles.itemObservations}>
                    {`OBS: "${item.observations}"`}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{`Subtotal (${items.length} ${items.length === 1 ? 'item' : 'itens'})`}</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
            <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Total</Text>
            <Text style={styles.finalTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <View 
            style={styles.orderButton}
            onTouchEnd={handlePlaceOrder}
          >
            <MaterialIcons name="shopping-cart-checkout" size={24} color={COLORS.white} />
            <Text style={styles.orderButtonText}>Finalizar Pedido</Text>
            <Text style={styles.orderButtonSubtext}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restaurantDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  restaurantName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  restaurantSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  itemsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemQuantity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemExtras: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  itemObservations: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summarySection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalTotalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  finalTotalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionContainer: {
    marginTop: SPACING.lg,
  },
  orderButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  orderButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
  },
  orderButtonSubtext: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    opacity: 0.9,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
