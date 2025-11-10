import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';

export interface PaymentMethod {
  id: string;
  tipo: 'dinheiro' | 'cartao_credito' | 'stripe_new' | 'stripe_saved';
  valor_pago?: number;
  troco?: number;
  bandeira?: string;
  numero_cartao?: string;
  final_cartao?: string;
  cvc?: string;
  nome_titular?: string;
  validade?: string;
  paymentMethodId?: string;
}

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: PaymentMethod | null;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  totalAmount: number;
  userPaymentMethods?: PaymentMethod[];
}

export default function PaymentMethodSelector({
  selectedPaymentMethod,
  onPaymentMethodSelect,
  totalAmount,
  userPaymentMethods = [],
}: PaymentMethodSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [newCard, setNewCard] = useState<Partial<PaymentMethod>>({
    bandeira: 'Visa',
    numero_cartao: '',
    final_cartao: '',
    cvc: '',
    nome_titular: '',
    validade: '',
  });

  // Limite máximo para pagamento em dinheiro
  const CASH_PAYMENT_LIMIT = 30;

  // Função para formatar valor monetário
  const formatCurrencyValue = (value: string) => {
    if (!value || value.trim() === '') return '';
    
    // Remove tudo que não é número, vírgula ou ponto
    const cleanValue = value.replace(/[^\d,.]/g, '');
    
    // Se termina com ponto ou vírgula sem dígitos após, remover todos os separadores finais
    const trimmedValue = cleanValue.replace(/[,.]*$/, '');
    
    // Se ficou vazio após limpeza, retornar vazio
    if (!trimmedValue) return '';
    
    // Se tem vírgula e ponto, manter apenas o último
    const parts = trimmedValue.split(/[,.]/);
    if (parts.length > 2) {
      // Se tem mais de 2 partes, manter apenas as duas primeiras
      return parts[0] + ',' + parts[1];
    }
    
    return trimmedValue;
  };

  // Função para converter valor formatado para número
  const parseCurrencyValue = (value: string) => {
    if (!value || value.trim() === '') return 0;
    
    // Converter vírgula para ponto
    const normalizedValue = value.replace(',', '.');
    const amount = parseFloat(normalizedValue);
    
    return isNaN(amount) ? 0 : amount;
  };

  // Verificar se o valor é uma nota não permitida
  const isForbiddenNote = (amount: number) => {
    return amount >= 100;
  };

  const handleCashAmountChange = (value: string) => {
    // Formatar o valor automaticamente
    const formattedValue = formatCurrencyValue(value);
    setCashAmount(formattedValue);
    
    // Se o campo estiver vazio, assumir valor exato
    if (!value || value.trim() === '') {
      onPaymentMethodSelect({ 
        id: 'dinheiro',
        tipo: 'dinheiro', 
        valor_pago: totalAmount, 
        troco: 0 
      });
      return;
    }
    
    // Converter valor formatado para número
    const amount = parseCurrencyValue(formattedValue);
    
    // Verificar se é uma nota não permitida (acima de €100)
    if (isForbiddenNote(amount)) {
      Alert.alert(
        'Valor não aceito',
        'Valores acima de €100 não são aceitos. Use valores menores.',
        [{ text: 'OK' }]
      );
      onPaymentMethodSelect({ id: 'dinheiro', tipo: 'dinheiro', valor_pago: 0, troco: 0 });
      return;
    }
    
    // Verificar se valor é suficiente
    if (amount >= totalAmount) {
      const paymentData = {
        id: 'dinheiro',
        tipo: 'dinheiro' as const,
        valor_pago: amount,
        troco: amount - totalAmount
      };
      
      onPaymentMethodSelect(paymentData);
    } else {
      // Se valor for menor que o mínimo, mostrar erro
      Alert.alert(
        'Valor insuficiente',
        `Valor mínimo necessário: €${totalAmount.toFixed(2)}`,
        [{ text: 'OK' }]
      );
      onPaymentMethodSelect({ id: 'dinheiro', tipo: 'dinheiro', valor_pago: 0, troco: 0 });
    }
  };

  const handleSaveNewCard = () => {
    if (!newCard.numero_cartao || !newCard.cvc || !newCard.nome_titular || !newCard.validade) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const card: PaymentMethod = {
      id: `card_${Date.now()}`,
      tipo: 'cartao_credito',
      bandeira: newCard.bandeira!,
      numero_cartao: newCard.numero_cartao!,
      final_cartao: newCard.final_cartao!,
      cvc: newCard.cvc!,
      nome_titular: newCard.nome_titular!,
      validade: newCard.validade!,
    };

    onPaymentMethodSelect(card);
    setIsAddingNew(false);
    setNewCard({
      bandeira: 'Visa',
      numero_cartao: '',
      final_cartao: '',
      cvc: '',
      nome_titular: '',
      validade: '',
    });
  };

  const getCardIcon = (bandeira: string) => {
    switch (bandeira?.toLowerCase()) {
      case 'visa':
        return <MaterialIcons name="credit-card" size={20} color="#1A1F71" />;
      case 'mastercard':
        return <MaterialIcons name="credit-card" size={20} color="#EB001B" />;
      case 'american express':
        return <MaterialIcons name="credit-card" size={20} color="#006FCF" />;
      default:
        return <MaterialIcons name="credit-card" size={20} color={COLORS.primary} />;
    }
  };

  const renderPaymentMethodItem = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentItem,
        selectedPaymentMethod?.id === method.id && styles.selectedPaymentItem,
      ]}
      onPress={() => onPaymentMethodSelect(method)}
    >
      <View style={styles.paymentIcon}>
        {method.tipo === 'dinheiro' ? (
          <MaterialIcons name="money" size={20} color={COLORS.success} />
        ) : (
          getCardIcon(method.bandeira || '')
        )}
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentName}>
          {method.tipo === 'dinheiro' ? 'Dinheiro (Pagar na entrega)' : 
           method.tipo === 'stripe_new' ? 'Novo Cartão de Crédito' :
           `${method.bandeira} •••• ${method.final_cartao}`}
        </Text>
        {method.tipo === 'dinheiro' ? (
          <Text style={styles.paymentSubtext}>Pague com dinheiro na entrega</Text>
        ) : method.tipo === 'stripe_new' ? (
          <Text style={styles.paymentSubtext}>Pagamento seguro com Stripe</Text>
        ) : (
          <Text style={styles.paymentSubtext}>{method.nome_titular}</Text>
        )}
      </View>
      <View style={styles.radioButton}>
        <MaterialIcons
          name={selectedPaymentMethod?.id === method.id ? 'radio-button-checked' : 'radio-button-unchecked'}
          size={24}
          color={selectedPaymentMethod?.id === method.id ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderCashPaymentDetails = () => {
    if (selectedPaymentMethod?.tipo !== 'dinheiro') return null;

    return (
      <View style={styles.cashPaymentContainer}>
        <View style={styles.cashPaymentHeader}>
          <MaterialIcons name="money" size={20} color={COLORS.success} />
          <Text style={styles.cashPaymentTitle}>Valor em Dinheiro</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Valor que você vai pagar:</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Valor total: €${totalAmount.toFixed(2)}`}
            value={cashAmount}
            onChangeText={handleCashAmountChange}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {selectedPaymentMethod.valor_pago && selectedPaymentMethod.valor_pago > 0 && (
          <View style={styles.cashPaymentInfo}>
            <View style={styles.cashInfoRow}>
              <Text style={styles.cashInfoLabel}>Valor a pagar:</Text>
              <Text style={styles.cashInfoValue}>{`€${selectedPaymentMethod.valor_pago.toFixed(2)}`}</Text>
            </View>
            <View style={styles.cashInfoRow}>
              <Text style={styles.cashInfoLabel}>Troco:</Text>
              <Text style={styles.cashInfoValue}>{`€${(selectedPaymentMethod.troco || 0).toFixed(2)}`}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAddCardModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddingNew}
      onRequestClose={() => setIsAddingNew(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Novo Cartão</Text>
            <TouchableOpacity onPress={() => setIsAddingNew(false)}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bandeira do Cartão</Text>
              <View style={styles.cardBrandSelector}>
                {['Visa', 'Mastercard', 'American Express', 'Multibanco'].map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[
                      styles.brandOption,
                      newCard.bandeira === brand && styles.selectedBrandOption,
                    ]}
                    onPress={() => setNewCard(prev => ({ ...prev, bandeira: brand }))}
                  >
                    <Text style={[
                      styles.brandText,
                      newCard.bandeira === brand && styles.selectedBrandText,
                    ]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número do Cartão</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1234 5678 9012 3456"
                value={newCard.numero_cartao}
                onChangeText={(text) => {
                  let value = text.replace(/\D/g, '');
                  // Formatar com espaços a cada 4 dígitos
                  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  setNewCard(prev => ({ 
                    ...prev, 
                    numero_cartao: value,
                    final_cartao: value.replace(/\s/g, '').slice(-4) // Últimos 4 dígitos
                  }));
                }}
                maxLength={19} // 16 dígitos + 3 espaços
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>CVC</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="123"
                  value={newCard.cvc}
                  onChangeText={(text) => {
                    const value = text.replace(/\D/g, '').slice(0, 4);
                    setNewCard(prev => ({ ...prev, cvc: value }));
                  }}
                  maxLength={4}
                  keyboardType="numeric"
                  secureTextEntry
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Validade</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="MM/AA"
                  value={newCard.validade}
                  onChangeText={(text) => {
                    let value = text.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setNewCard(prev => ({ ...prev, validade: value }));
                  }}
                  maxLength={5}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome no Cartão</Text>
              <TextInput
                style={styles.textInput}
                placeholder="João Silva"
                value={newCard.nome_titular}
                onChangeText={(text) => setNewCard(prev => ({ ...prev, nome_titular: text }))}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsAddingNew(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newCard.numero_cartao || !newCard.cvc || !newCard.nome_titular || !newCard.validade) && styles.disabledButton,
              ]}
              onPress={handleSaveNewCard}
              disabled={!newCard.numero_cartao || !newCard.cvc || !newCard.nome_titular || !newCard.validade}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="credit-card" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Forma de Pagamento</Text>
      </View>

      <View style={styles.paymentMethodsList}>
        {/* Cartões Salvos */}
        {userPaymentMethods.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Cartões Salvos:</Text>
            {userPaymentMethods.map(renderPaymentMethodItem)}
          </>
        )}

        {/* Pagamento em Dinheiro */}
        <TouchableOpacity
          style={[
            styles.paymentItem,
            totalAmount > CASH_PAYMENT_LIMIT && styles.disabledPaymentItem,
            selectedPaymentMethod?.tipo === 'dinheiro' && styles.selectedPaymentItem,
          ]}
          onPress={() => {
            if (totalAmount > CASH_PAYMENT_LIMIT) {
              Alert.alert(
                'Pagamento em dinheiro não disponível',
                `Valor excede o limite de €${CASH_PAYMENT_LIMIT}. Use cartão ou outro método.`
              );
              return;
            }
            onPaymentMethodSelect({ 
              id: 'dinheiro',
              tipo: 'dinheiro', 
              valor_pago: totalAmount, 
              troco: 0 
            });
          }}
          disabled={totalAmount > CASH_PAYMENT_LIMIT}
        >
          <View style={[
            styles.paymentIcon,
            totalAmount > CASH_PAYMENT_LIMIT && styles.disabledPaymentIcon,
          ]}>
            <MaterialIcons 
              name="money" 
              size={20} 
              color={totalAmount > CASH_PAYMENT_LIMIT ? COLORS.error : COLORS.success} 
            />
          </View>
          <View style={styles.paymentDetails}>
            <Text style={[
              styles.paymentName,
              totalAmount > CASH_PAYMENT_LIMIT && styles.disabledPaymentText,
            ]}>
              Dinheiro (Pagar na entrega)
              {totalAmount > CASH_PAYMENT_LIMIT && ' - Não disponível'}
            </Text>
            <Text style={[
              styles.paymentSubtext,
              totalAmount > CASH_PAYMENT_LIMIT && styles.disabledPaymentText,
            ]}>
              {totalAmount > CASH_PAYMENT_LIMIT 
                ? `Valor excede o limite de €${CASH_PAYMENT_LIMIT}`
                : 'Pague com dinheiro na entrega'
              }
            </Text>
          </View>
          <View style={styles.radioButton}>
            <MaterialIcons
              name={selectedPaymentMethod?.tipo === 'dinheiro' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedPaymentMethod?.tipo === 'dinheiro' ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Novo Cartão Stripe */}
        <TouchableOpacity
          style={[
            styles.paymentItem,
            selectedPaymentMethod?.tipo === 'stripe_new' && styles.selectedPaymentItem,
          ]}
          onPress={() => onPaymentMethodSelect({ 
            id: 'stripe_new',
            tipo: 'stripe_new' 
          })}
        >
          <View style={styles.paymentIcon}>
            <MaterialIcons name="credit-card" size={20} color="#006FCF" />
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.paymentName}>Novo Cartão de Crédito</Text>
            <Text style={styles.paymentSubtext}>Pagamento seguro com Stripe</Text>
          </View>
          <View style={styles.radioButton}>
            <MaterialIcons
              name={selectedPaymentMethod?.tipo === 'stripe_new' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={24}
              color={selectedPaymentMethod?.tipo === 'stripe_new' ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {renderCashPaymentDetails()}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddingNew(true)}
      >
        <MaterialIcons name="add" size={20} color={COLORS.primary} />
        <Text style={styles.addButtonText}>Adicionar Novo Cartão</Text>
      </TouchableOpacity>

      {renderAddCardModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  paymentMethodsList: {
    marginBottom: SPACING.md,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#ffffff',
  },
  selectedPaymentItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  disabledPaymentItem: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.error,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  disabledPaymentIcon: {
    backgroundColor: COLORS.errorLight,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  paymentSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  disabledPaymentText: {
    color: COLORS.error,
  },
  radioButton: {
    marginLeft: SPACING.sm,
  },
  cashPaymentContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cashPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cashPaymentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputGroupFlex: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: '#ffffff',
  },
  cashPaymentInfo: {
    marginTop: SPACING.sm,
  },
  cashInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  cashInfoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  cashInfoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: SPACING.md,
    maxHeight: '70%',
  },
  cardBrandSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  brandOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#ffffff',
  },
  selectedBrandOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  brandText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  selectedBrandText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
