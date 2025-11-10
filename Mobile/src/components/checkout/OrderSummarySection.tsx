import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Section } from './Section';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants';
import { CartItem } from '../../contexts/CartContext';

interface OrderSummarySectionProps {
  items: CartItem[];
  restaurantName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  items,
  restaurantName,
  subtotal,
  deliveryFee,
  total,
  onUpdateQuantity,
}) => {
  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity === 1) {
      // Se quantidade for 1, mostrar confirmação para remover
      Alert.alert(
        'Remover Item',
        `Deseja remover "${item.menuItem.nome}" do carrinho?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => onUpdateQuantity(item.id, 0),
          },
        ]
      );
    } else {
      // Se quantidade for maior que 1, apenas diminuir
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
  <Section title="Resumo do Pedido" icon="🛒">
    <View style={styles.restaurantInfo}>
      <MaterialIcons name="restaurant" size={20} color={COLORS.primary} />
      <Text style={styles.restaurantName}>{restaurantName}</Text>
    </View>
    
    <View style={styles.itemsList}>
      {items.map((item) => (
        <View key={item.id} style={styles.orderItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.menuItem.nome}</Text>
            
            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <Text style={styles.itemExtras}>
                {`+ ${item.selectedExtras.map(extra => extra.nome).join(', ')}`}
              </Text>
            )}
            
            {item.removedIngredients && item.removedIngredients.length > 0 && (
              <Text style={styles.itemRemoved}>
                {`- ${item.removedIngredients.map(ing => `Sem ${ing}`).join(', ')}`}
              </Text>
            )}
            
            {item.customizations && Object.keys(item.customizations).length > 0 && (
              <Text style={styles.itemCustomizations}>
                {Object.entries(item.customizations).map(([key, value]: [string, any]) => 
                  `${key}: ${value.nome}`
                ).join(', ')}
              </Text>
            )}
            
            {item.observations && (
              <Text style={styles.itemObservations}>
                {`OBS: "${item.observations}"`}
              </Text>
            )}
          </View>
          
          <View style={styles.itemControls}>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleDecreaseQuantity(item)}
              >
                <MaterialIcons name="remove" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                <MaterialIcons name="add" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.itemPrice}>{`€${item.totalPrice.toFixed(2)}`}</Text>
          </View>
        </View>
      ))}
    </View>
    
    <View style={styles.totalsContainer}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{`€${subtotal.toFixed(2)}`}</Text>
      </View>
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Taxa de Entrega</Text>
        <Text style={styles.totalValue}>{`€${deliveryFee.toFixed(2)}`}</Text>
      </View>
      
      <View style={[styles.totalRow, styles.finalTotalRow]}>
        <Text style={styles.finalTotalLabel}>Total</Text>
        <Text style={styles.finalTotalValue}>{`€${total.toFixed(2)}`}</Text>
      </View>
    </View>
  </Section>
  );
};

const styles = StyleSheet.create({
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  restaurantName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  itemsList: {
    marginBottom: SPACING.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  itemControls: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginHorizontal: SPACING.sm,
    minWidth: 20,
    textAlign: 'center',
  },
  itemExtras: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginBottom: SPACING.xs / 2,
  },
  itemRemoved: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginBottom: SPACING.xs / 2,
  },
  itemCustomizations: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  itemObservations: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  finalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
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
});
