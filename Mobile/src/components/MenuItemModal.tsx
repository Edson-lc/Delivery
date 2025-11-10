import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { MenuItem } from '../types';
import { useColors } from '../hooks/useColors';

interface MenuItemModalProps {
  visible: boolean;
  menuItem: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: any, quantity: number, observacoes: string, adicionais: any[], ingredientesRemovidos: string[], personalizacoes: any) => void;
}

export default function MenuItemModal({
  visible,
  menuItem,
  onClose,
  onAddToCart,
}: MenuItemModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  // SEMPRE chamar todos os hooks - nunca condicionalmente
  const [quantity, setQuantity] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [customizations, setCustomizations] = useState<{[key: string]: string[]}>({});
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible || !menuItem) {
      return;
    }

    // Initialize customizations for mandatory groups
    const initialCustomizations: {[key: string]: string[]} = {};
    
    if (menuItem.opcoes_personalizacao) {
      menuItem.opcoes_personalizacao.forEach(group => {
        if (group.obrigatorio && group.opcoes && group.opcoes.length > 0) {
          // If mandatory, select first option
          initialCustomizations[group.nome_grupo] = [group.opcoes[0].nome];
        } else if (group.minimo_opcoes && group.minimo_opcoes > 0) {
          // If has minimum defined, select first options until reaching minimum
          const minSelections = Math.min(group.minimo_opcoes, group.opcoes.length);
          initialCustomizations[group.nome_grupo] = group.opcoes.slice(0, minSelections).map(opt => opt.nome);
        } else {
          // Optional group without minimum
          initialCustomizations[group.nome_grupo] = [];
        }
      });
    }
    
    // Reset all states in a single batch
    setQuantity(1);
    setObservacoes('');
    setRemovedIngredients([]);
    setSelectedExtras([]);
    setCustomizations(initialCustomizations);
    setValidationMessages({});
    setImageErrors(new Set()); // Limpar erros de imagem
  }, [visible, menuItem]);

  // Sempre renderizar o Modal, mas com conteúdo condicional

  const handleAddToCart = () => {
    if (!menuItem) return;
    
    // Check if all mandatory customization groups have required selections
    if (menuItem.opcoes_personalizacao) {
      for (const group of menuItem.opcoes_personalizacao) {
        const selectedOptions = customizations[group.nome_grupo] || [];
        
        if (group.obrigatorio && selectedOptions.length === 0) {
          Alert.alert('Erro', `Por favor, selecione uma opção para "${group.nome_grupo}".`);
          return;
        }
        
        if (group.minimo_opcoes && selectedOptions.length < group.minimo_opcoes) {
          Alert.alert('Erro', `Por favor, selecione pelo menos ${group.minimo_opcoes} opção(ões) para "${group.nome_grupo}".`);
          return;
        }
        
        if (group.maximo_opcoes && group.maximo_opcoes > 0 && selectedOptions.length > group.maximo_opcoes) {
          Alert.alert('Erro', `Por favor, selecione no máximo ${group.maximo_opcoes} opção(ões) para "${group.nome_grupo}".`);
          return;
        }
      }
    }

    // Create customizations with prices
    const personalizacoesComPrecos: any = {};
    let precoPersonalizacoes = 0;

    if (menuItem.opcoes_personalizacao) {
      menuItem.opcoes_personalizacao.forEach(group => {
        const selectedOptions = customizations[group.nome_grupo] || [];
        if (selectedOptions.length > 0) {
          selectedOptions.forEach(optionName => {
            const selectedOption = group.opcoes.find(opt => opt.nome === optionName);
            if (selectedOption) {
              // Normalize group name removing underscore and capitalizing
              const nomeGrupoNormalizado = group.nome_grupo
                .replace(/^_/, '') // Remove underscore from start
                .replace(/_/g, ' ') // Replace underscores with spaces
                .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
              
              personalizacoesComPrecos[nomeGrupoNormalizado] = {
                nome: selectedOption.nome,
                preco_adicional: selectedOption.preco_adicional || 0
              };
              precoPersonalizacoes += selectedOption.preco_adicional || 0;
            }
          });
        }
      });
    }

    onAddToCart(
      menuItem,
      quantity,
      observacoes,
      selectedExtras,
      removedIngredients,
      personalizacoesComPrecos
    );
    
    Alert.alert('Sucesso', 'Item adicionado ao carrinho!');
    onClose();
  };

  const toggleIngredientRemoval = (ingredientName: string) => {
    setRemovedIngredients(prev => {
      if (prev.includes(ingredientName)) {
        return prev.filter(ing => ing !== ingredientName);
      } else {
        return [...prev, ingredientName];
      }
    });
  };

  const toggleExtra = (extra: any) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.nome === extra.nome);
      if (exists) {
        // Se já existe, remove
        return prev.filter(e => e.nome !== extra.nome);
      } else {
        // Se não existe, adiciona com quantidade 1
        return [...prev, { ...extra, quantidade: 1 }];
      }
    });
  };

  const increaseExtraQuantity = (extraNome: string) => {
    setSelectedExtras(prev => {
      return prev.map(e => {
        if (e.nome === extraNome) {
          return { ...e, quantidade: (e.quantidade || 1) + 1 };
        }
        return e;
      });
    });
  };

  const decreaseExtraQuantity = (extraNome: string) => {
    setSelectedExtras(prev => {
      return prev.map(e => {
        if (e.nome === extraNome) {
          const newQuantity = Math.max(1, (e.quantidade || 1) - 1);
          if (newQuantity === 1) {
            // Se quantidade chegar a 1, mantém selecionado
            return { ...e, quantidade: 1 };
          }
          return { ...e, quantidade: newQuantity };
        }
        return e;
      });
    });
  };

  const handleCustomizationChange = (groupName: string, optionName: string, checked: boolean) => {
    const currentSelections = customizations[groupName] || [];
    
    if (checked) {
      // If maximum is 1, replace current selection
      if (menuItem.opcoes_personalizacao?.find(g => g.nome_grupo === groupName)?.maximo_opcoes === 1) {
        setCustomizations({
          ...customizations,
          [groupName]: [optionName]
        });
      } else {
        // Check if doesn't exceed maximum
        const group = menuItem.opcoes_personalizacao?.find(g => g.nome_grupo === groupName);
        if (group && group.maximo_opcoes > 0 && currentSelections.length >= group.maximo_opcoes) {
          setValidationMessages({
            ...validationMessages,
            [groupName]: `Você pode selecionar no máximo ${group.maximo_opcoes} opção(ões)`
          });
          return;
        }
        
        // Add to selection
        setCustomizations({
          ...customizations,
          [groupName]: [...currentSelections, optionName]
        });
      }
      
      // Clear error message if exists
      const newMessages = { ...validationMessages };
      delete newMessages[groupName];
      setValidationMessages(newMessages);
    } else {
      // Check if doesn't go below minimum
      const group = menuItem.opcoes_personalizacao?.find(g => g.nome_grupo === groupName);
      if (group && group.minimo_opcoes > 0 && currentSelections.length <= group.minimo_opcoes) {
        setValidationMessages({
          ...validationMessages,
          [groupName]: `Você deve selecionar pelo menos ${group.minimo_opcoes} opção(ões)`
        });
        return;
      }
      
      // Clear error message if exists
      const newMessages = { ...validationMessages };
      delete newMessages[groupName];
      setValidationMessages(newMessages);
      
      // Remove from selection
      const newSelections = currentSelections.filter(name => name !== optionName);
      setCustomizations({
        ...customizations,
        [groupName]: newSelections
      });
    }
  };

  const getTotalPrice = () => {
    if (!menuItem) return 0;
    let total = menuItem.preco;

    // Add price of selected extras (considering quantity)
    selectedExtras.forEach(extra => {
      const quantidade = extra.quantidade || 1;
      total += extra.preco * quantidade;
    });

    // Add price of selected customizations
    if (menuItem.opcoes_personalizacao) {
      menuItem.opcoes_personalizacao.forEach(group => {
        const selectedOptions = customizations[group.nome_grupo] || [];
        selectedOptions.forEach(optionName => {
          const selectedOption = group.opcoes.find(opt => opt.nome === optionName);
          if (selectedOption && selectedOption.preco_adicional) {
            total += selectedOption.preco_adicional;
          }
        });
      });
    }

    return total * quantity;
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        onPress={onClose} 
        style={[styles.closeButton, { backgroundColor: colors.background, borderWidth: 0 }]}
      >
        <MaterialIcons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{menuItem.nome}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderImage = () => {
    if (!menuItem) return null;
    
    const imageUrl = menuItem.imagemUrl || menuItem.imagem_url;
    const hasValidImage = isValidImageUrl(imageUrl);
    
    if (hasValidImage) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
          onError={() => handleImageError(imageUrl || '')}
        />
      );
    }
    return null;
  };

  const renderCustomizations = () => {
    if (!menuItem || !menuItem.opcoes_personalizacao) return null;

    return menuItem.opcoes_personalizacao.map((group, index) => (
      <View key={index} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.nome_grupo}</Text>
          {group.obrigatorio && (
            <Text style={[styles.requiredText, { color: colors.error }]}>* Obrigatório</Text>
          )}
        </View>
        
        {/* Validation message */}
        {validationMessages[group.nome_grupo] && (
          <View style={styles.validationMessage}>
            <MaterialIcons name="warning" size={16} color={colors.error} />
            <Text style={[styles.validationText, { color: colors.error }]}>{validationMessages[group.nome_grupo]}</Text>
          </View>
        )}
        
        <View style={styles.optionsContainer}>
          {group.opcoes.map((option, optIndex) => {
            const isSelected = (customizations[group.nome_grupo] || []).includes(option.nome);
            const isDisabled = group.maximo_opcoes > 1 && 
              (customizations[group.nome_grupo] || []).length >= group.maximo_opcoes && 
              !isSelected;
            
            // Verificar se é grupo de porção/tamanho
            const groupNameLower = group.nome_grupo.toLowerCase();
            const isSizeGroup = groupNameLower.includes('tamanho') || 
                              groupNameLower.includes('porção') ||
                              groupNameLower.includes('porcao') ||
                              groupNameLower.includes('porçao') ||
                              groupNameLower.includes('size') ||
                              groupNameLower.includes('portion') ||
                              (group.maximo_opcoes === 1);
            
            // Usar radio buttons para grupos de porção, checkboxes para outros
            const iconName = isSizeGroup
              ? (isSelected ? 'radio-button-checked' : 'radio-button-unchecked')
              : (isSelected ? 'check-circle' : 'check-circle-outline');
            
            return (
              <TouchableOpacity
                key={optIndex}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  isDisabled && styles.optionItemDisabled,
                  !isSelected && !isDisabled && { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary },
                ]}
                onPress={() => handleCustomizationChange(group.nome_grupo, option.nome, !isSelected)}
                disabled={isDisabled}
              >
                <View style={styles.optionContent}>
                  <MaterialIcons
                    name={iconName as any}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary + '60'}
                  />
                  <Text style={[
                    styles.optionText,
                    !isSelected && !isDisabled && { color: colors.text },
                    isSelected && { color: colors.primary },
                    isDisabled && { color: colors.textSecondary },
                  ]}>
                    {option.nome}
                  </Text>
                </View>
                {option.preco_adicional > 0 && (
                  <Text style={[styles.optionPrice, { color: colors.primary }]}>{`+€${option.preco_adicional.toFixed(2)}`}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ));
  };

  const renderRemovableIngredients = () => {
    if (!menuItem) return null;
    const removableIngredients = menuItem.ingredientes?.filter(
      i => typeof i === 'object' && i.removivel
    );

    if (!removableIngredients || removableIngredients.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Remover ingredientes</Text>
        </View>
        <View style={styles.optionsContainer}>
          {removableIngredients.map((ingredient, index) => {
            const isRemoved = removedIngredients.includes(ingredient.nome);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  isRemoved && styles.optionItemSelected,
                  !isRemoved && { backgroundColor: colors.surface, borderColor: colors.border },
                  isRemoved && { borderColor: colors.primary },
                ]}
                onPress={() => toggleIngredientRemoval(ingredient.nome)}
              >
                <View style={styles.optionContent}>
                  <MaterialIcons
                    name="remove-circle-outline"
                    size={24}
                    color={isRemoved ? colors.primary : colors.textSecondary + '60'}
                  />
                  <Text style={[
                    styles.optionText,
                    !isRemoved && { color: colors.text },
                    isRemoved && { color: colors.primary },
                  ]}>
                    Sem {ingredient.nome}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderExtras = () => {
    if (!menuItem || !menuItem.adicionais || menuItem.adicionais.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Adicionais</Text>
        </View>
        <View style={styles.optionsContainer}>
          {menuItem.adicionais.map((adicional, index) => {
            const selectedExtra = selectedExtras.find(e => e.nome === adicional.nome);
            const isSelected = !!selectedExtra;
            const quantidade = selectedExtra?.quantidade || 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  !isSelected && { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary },
                ]}
                onPress={() => toggleExtra(adicional)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <MaterialIcons
                    name="add-circle-outline"
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary + '60'}
                  />
                  <Text style={[
                    styles.optionText,
                    !isSelected && { color: colors.text },
                    isSelected && { color: colors.primary },
                  ]}>
                    {adicional.nome}
                  </Text>
                </View>
                
                {isSelected ? (
                  <View style={styles.extraQuantityContainerInline}>
                    <Text style={[styles.optionPrice, { color: colors.primary, marginRight: SPACING.sm }]}>{`+€${adicional.preco.toFixed(2)}`}</Text>
                    <TouchableOpacity
                      style={[styles.quantityButtonExtra, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        decreaseExtraQuantity(adicional.nome);
                      }}
                    >
                      <MaterialIcons name="remove" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityTextExtra, { color: colors.text }]}>{quantidade}</Text>
                    <TouchableOpacity
                      style={[styles.quantityButtonExtra, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        increaseExtraQuantity(adicional.nome);
                      }}
                    >
                      <MaterialIcons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.optionPrice, { color: colors.primary }]}>{`+€${adicional.preco.toFixed(2)}`}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuantityAndPrice = () => (
    <View style={[styles.quantitySection, { borderBottomColor: colors.border }]}>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <MaterialIcons name="remove" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
        <TouchableOpacity
          style={[styles.quantityButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
          onPress={() => setQuantity(quantity + 1)}
        >
          <MaterialIcons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total</Text>
        <Text style={[styles.priceValue, { color: colors.primary }]}>{`€${getTotalPrice().toFixed(2)}`}</Text>
      </View>
    </View>
  );

  const renderObservations = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Observações especiais</Text>
      </View>
      <TextInput
        style={[styles.observationsInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Ex: bem passado, sem sal, etc..."
        placeholderTextColor={colors.textSecondary}
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  return (
    <Modal visible={visible && !!menuItem} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {menuItem && renderHeader()}
        
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {menuItem && renderImage()}
          
          {menuItem?.descricao && (
            <View style={styles.section}>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{menuItem.descricao}</Text>
            </View>
          )}
          
          {menuItem && renderCustomizations()}
          {menuItem && renderRemovableIngredients()}
          {menuItem && renderExtras()}
          {renderQuantityAndPrice()}
          {renderObservations()}
        </ScrollView>

        {menuItem && (
          <View style={[styles.footer, { bottom: 20 + insets.bottom }]}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart} activeOpacity={0.8}>
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              <Text style={styles.addButtonText}>Adicionar ao Carrinho</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  scrollContent: {
    paddingBottom: 100, // Espaço para o footer flutuante
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.md,
  },
  section: {
    paddingVertical: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  requiredText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  validationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    flex: 1,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionItemDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  optionTextDisabled: {
    color: COLORS.textSecondary,
  },
  optionPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  extraQuantityContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quantityButtonExtra: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quantityTextExtra: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quantityText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 30,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  footer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
});
