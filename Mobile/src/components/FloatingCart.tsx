import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Modal, 
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../hooks/useColors';

interface FloatingCartProps {
  visible: boolean;
}

export default function FloatingCart({ visible }: FloatingCartProps) {
  const router = useRouter();
  const { items, itemCount, subtotal, deliveryFee, total, restaurant, isCartEmpty, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!visible || isCartEmpty) {
    return null;
  }

  const handlePress = () => {
    setIsModalVisible(true);
  };

  const handleFinalize = () => {
    setIsModalVisible(false);
    if (!isAuthenticated) {
      router.push('/login?redirectTo=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleIncreaseQuantity = (itemId: string, currentQuantity: number) => {
    updateQuantity(itemId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (itemId: string, currentQuantity: number) => {
    // updateQuantity já remove automaticamente quando quantidade <= 0
    updateQuantity(itemId, currentQuantity - 1);
  };

  return (
    <>
      <Animated.View style={styles.container}>
        <TouchableOpacity style={styles.cartButton} onPress={handlePress} activeOpacity={0.8}>
          <View style={styles.cartContent}>
            <View style={styles.cartInfo}>
              <View style={styles.itemCountContainer}>
                <MaterialIcons name="shopping-cart" size={20} color="white" />
                <Text style={styles.itemCount}>{itemCount}</Text>
              </View>
              <View style={styles.cartDetails}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant?.nome || 'Carrinho'}
                </Text>
                <Text style={styles.totalPrice}>{`€${total.toFixed(2)}`}</Text>
              </View>
            </View>
            <View style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Ver Carrinho</Text>
              <MaterialIcons name="chevron-right" size={16} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal do Carrinho */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: colors.background, borderWidth: 0 }]}
              onPress={() => setIsModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Meu Carrinho</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          {/* Lista de Itens */}
          <ScrollView style={[styles.itemsContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              // Calcular preço unitário base (sem extras e customizações)
              const baseUnitPrice = item.menuItem.preco;
              
              return (
                <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Nome do item com preço unitário à direita */}
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.menuItem.nome}</Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{`€${baseUnitPrice.toFixed(2)}`}</Text>
                  </View>

                  {/* Modificações com preços à direita */}
                  <View style={styles.modificationsContainer}>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <>
                        {Object.entries(item.customizations).map(([groupName, selection], idx) => {
                          let optionName = '';
                          let additionalPrice = 0;
                          
                          if (typeof selection === 'object' && selection !== null && !Array.isArray(selection)) {
                            optionName = (selection as any).nome || '';
                            additionalPrice = (selection as any).preco_adicional || 0;
                          } else if (Array.isArray(selection) && selection.length > 0) {
                            optionName = selection[0];
                          } else if (typeof selection === 'string') {
                            optionName = selection;
                          }
                          
                          // Verificar se é grupo de tamanho/porção (considerando variações)
                          const groupNameLower = groupName.toLowerCase();
                          const isSizeGroup = groupNameLower.includes('tamanho') || 
                                            groupNameLower.includes('porção') ||
                                            groupNameLower.includes('porcao') ||
                                            groupNameLower.includes('porçao') ||
                                            groupNameLower.includes('size') ||
                                            groupNameLower.includes('portion');
                          
                          // Se for grupo de tamanho/porção, mostrar com título
                          if (isSizeGroup && optionName) {
                            // Para porções/tamanhos, buscar o preço do grupo se não tiver em additionalPrice
                            if (additionalPrice === 0) {
                              // Tentar encontrar o grupo original - o groupName no carrinho pode estar normalizado
                              const group = item.menuItem.opcoes_personalizacao?.find(g => {
                                // Normalizar o nome do grupo para comparação (igual ao que é feito no MenuItemModal)
                                const normalized = g.nome_grupo
                                  .replace(/^_/, '')
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, l => l.toUpperCase());
                                return normalized.toLowerCase() === groupNameLower || 
                                       g.nome_grupo.toLowerCase() === groupNameLower;
                              });
                              const option = group?.opcoes.find(o => o.nome === optionName);
                              additionalPrice = option?.preco_adicional || 0;
                            }
                            
                            // Mostrar apenas uma vez com o título do grupo
                            return (
                              <View key={`size-${idx}`} style={styles.modificationRow}>
                                <Text style={[styles.modificationText, { color: colors.text }]}>
                                  {`• ${groupName}: ${optionName}`}
                                </Text>
                                {additionalPrice > 0 && (
                                  <Text style={[styles.modificationPrice, { color: colors.primary }]}>
                                    {`+€${additionalPrice.toFixed(2)}`}
                                  </Text>
                                )}
                              </View>
                            );
                          }
                          
                          // Se não for grupo de tamanho/porção, será processado abaixo
                          return null;
                        })}

                        {/* Outras customizações (sem título, apenas o nome da opção) */}
                        {Object.entries(item.customizations).map(([groupName, selection], idx) => {
                          // Verificar se é grupo de tamanho/porção (considerando variações) - já foi mostrado acima
                          const groupNameLower = groupName.toLowerCase();
                          const isSizeGroup = groupNameLower.includes('tamanho') || 
                                            groupNameLower.includes('porção') ||
                                            groupNameLower.includes('porcao') ||
                                            groupNameLower.includes('porçao') ||
                                            groupNameLower.includes('size') ||
                                            groupNameLower.includes('portion');
                          
                          // Pular grupos de tamanho/porção pois já foram mostrados acima
                          if (isSizeGroup) return null;
                          
                          let options: Array<{nome: string, preco?: number}> = [];
                          if (typeof selection === 'object' && selection !== null && !Array.isArray(selection)) {
                            options = [{
                              nome: (selection as any).nome || '',
                              preco: (selection as any).preco_adicional || 0
                            }];
                          } else if (Array.isArray(selection)) {
                            // Tentar pegar o preço das opções do menuItem
                            const group = item.menuItem.opcoes_personalizacao?.find(g => 
                              g.nome_grupo.toLowerCase() === groupName.toLowerCase()
                            );
                            options = selection.map(optName => {
                              const option = group?.opcoes.find(o => o.nome === optName);
                              return {
                                nome: optName,
                                preco: option?.preco_adicional || 0
                              };
                            });
                          } else if (typeof selection === 'string') {
                            const group = item.menuItem.opcoes_personalizacao?.find(g => 
                              g.nome_grupo.toLowerCase() === groupName.toLowerCase()
                            );
                            const option = group?.opcoes.find(o => o.nome === selection);
                            options = [{
                              nome: selection,
                              preco: option?.preco_adicional || 0
                            }];
                          }
                          
                          // Mostrar apenas o nome da opção, sem o título do grupo
                          return options.map((option, optIdx) => (
                            <View key={`${idx}-${optIdx}`} style={styles.modificationRow}>
                              <Text style={[styles.modificationText, { color: colors.text }]}>
                                {`+ ${option.nome}`}
                              </Text>
                              {option.preco > 0 && (
                                <Text style={[styles.modificationPrice, { color: colors.primary }]}>
                                  {`€${option.preco.toFixed(2)}`}
                                </Text>
                              )}
                            </View>
                          ));
                        })}
                      </>
                    )}

                    {/* Extras */}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <>
                        {item.selectedExtras.map((extra, index) => {
                          const quantidade = extra.quantidade || 1;
                          const totalExtra = extra.preco * quantidade;
                          return (
                            <View key={index} style={styles.modificationRow}>
                              <Text style={[styles.modificationText, { color: colors.text }]}>
                                {`+ ${quantidade}x ${extra.nome}`}
                              </Text>
                              <Text style={[styles.modificationPrice, { color: colors.primary }]}>
                                {`€${totalExtra.toFixed(2)}`}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    )}

                    {/* Ingredientes removidos (em vermelho, sem preço) */}
                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                      <>
                        {item.removedIngredients.map((ingredient, index) => (
                          <View key={index} style={styles.modificationRow}>
                            <Text style={[styles.removedIngredient, { color: colors.error }]}>
                              {`- Sem ${ingredient}`}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    {/* Observações */}
                    {item.observations && (
                      <View style={styles.modificationRow}>
                        <Text style={[styles.observationsText, { color: colors.textSecondary }]}>
                          {`💬 "${item.observations}"`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Controles de quantidade */}
                  <View style={styles.quantityWrapper}>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={[styles.quantityButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => handleDecreaseQuantity(item.id, item.quantity)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="remove" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.quantityButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => handleIncreaseQuantity(item.id, item.quantity)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="add" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Resumo e Botão Finalizar */}
          <View style={[styles.summaryContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{`€${subtotal.toFixed(2)}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxa de Entrega</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{`€${deliveryFee.toFixed(2)}`}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{`€${total.toFixed(2)}`}</Text>
            </View>

            <TouchableOpacity
              style={styles.finalizeButton}
              onPress={handleFinalize}
              activeOpacity={0.8}
            >
              <Text style={styles.finalizeButtonText}>
                {isAuthenticated ? 'Finalizar Pedido' : 'Fazer Login para Finalizar'}
              </Text>
              <MaterialIcons 
                name={isAuthenticated ? "arrow-forward" : "login"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20 + 40, // 20px de espaçamento + 40px para área segura
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
  },
  cartButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  itemCount: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  cartDetails: {
    flex: 1,
  },
  restaurantName: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  totalPrice: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  checkoutText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  modalHeaderRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modificationsContainer: {
    marginBottom: SPACING.md,
  },
  modificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modificationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  modificationPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  removedIngredient: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  observationsText: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  quantityWrapper: {
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: SPACING.xs,
  },
  extrasContainer: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  extrasLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  extrasText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.lg,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  finalizeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: 'white',
  },
});
