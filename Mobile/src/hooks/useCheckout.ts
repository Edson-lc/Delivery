import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../components/AddressSelector';
import { PaymentMethod } from '../components/PaymentMethodSelector';

export interface CustomerData {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
}

export interface OrderData {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    selectedExtras: any[];
    removedIngredients: string[];
    customizations: any;
    observations: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  customerData: CustomerData;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
}

export const useCheckout = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, restaurant, subtotal, deliveryFee, total, clearCart, isCartEmpty, updateQuantity } = useCart();

  const [customerData, setCustomerData] = useState<CustomerData>({
    nome: user?.fullName || user?.full_name || '',
    telefone: user?.telefone || '',
    email: user?.email || '',
    observacoes: '',
  });
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateCustomerData = useCallback((field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!isAuthenticated) {
      return 'Login Necessário';
    }

    if (!items || items.length === 0) {
      return 'Seu carrinho está vazio';
    }

    if (!restaurant) {
      return 'Informações do restaurante não encontradas';
    }

    if (!customerData.nome.trim()) {
      return 'Por favor, informe seu nome completo';
    }

    if (!customerData.telefone.trim()) {
      return 'Por favor, informe seu número de telefone';
    }

    if (!selectedAddress) {
      return 'Por favor, selecione um endereço de entrega';
    }

    if (!selectedPaymentMethod) {
      return 'Por favor, selecione uma forma de pagamento';
    }

    return null;
  }, [isAuthenticated, items, restaurant, customerData, selectedAddress, selectedPaymentMethod]);

  const createOrderData = useCallback((): OrderData => {
    return {
      id: `order_${Date.now()}`,
      restaurantId: restaurant!.id,
      restaurantName: restaurant!.nome,
      items: items!.map(item => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.nome,
        quantity: item.quantity,
        selectedExtras: item.selectedExtras,
        removedIngredients: item.removedIngredients,
        customizations: item.customizations,
        observations: item.observations,
        unitPrice: item.menuItem.preco,
        totalPrice: item.totalPrice,
      })),
      customerData: {
        nome: customerData.nome.trim(),
        telefone: customerData.telefone.trim(),
        email: customerData.email.trim(),
        observacoes: customerData.observacoes.trim(),
      },
      deliveryAddress: {
        nome: selectedAddress!.nome,
        rua: selectedAddress!.rua,
        numero: selectedAddress!.numero,
        complemento: selectedAddress!.complemento || '',
        bairro: selectedAddress!.bairro,
        cidade: selectedAddress!.cidade,
        cep: selectedAddress!.cep || '',
        referencia: selectedAddress!.referencia || '',
      },
      paymentMethod: selectedPaymentMethod!,
      subtotal,
      deliveryFee,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }, [restaurant, items, customerData, selectedAddress, selectedPaymentMethod, subtotal, deliveryFee, total]);

  const handlePlaceOrder = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Erro', validationError);
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Login Necessário',
        'Você precisa fazer login para finalizar o pedido.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = createOrderData();

      // Simular processamento do pedido
      Alert.alert(
        'Confirmar Pedido',
        `Restaurante: ${restaurant!.nome}\nTotal: €${total.toFixed(2)}\nEndereço: ${selectedAddress!.rua}, ${selectedAddress!.numero}\nPagamento: ${selectedPaymentMethod!.tipo === 'dinheiro' ? 'Dinheiro' : 'Cartão'}\n\nDeseja confirmar este pedido?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Confirmar', 
            onPress: async () => {
              try {
                // Aqui você pode enviar o pedido para a API
                console.log('Pedido criado:', orderData);
                
                Alert.alert(
                  'Pedido Confirmado! 🎉',
                  `Seu pedido foi realizado com sucesso!\n\nNúmero do pedido: ${orderData.id}\nRestaurante: ${restaurant!.nome}\nTotal: €${total.toFixed(2)}\n\nVocê receberá uma confirmação por email.`,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      clearCart();
                      router.replace('/');
                    } 
                  }]
                );
              } catch (error) {
                console.error('Erro ao processar pedido:', error);
                Alert.alert('Erro', 'Não foi possível processar o pedido. Tente novamente.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      Alert.alert('Erro', 'Não foi possível criar o pedido. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  }, [validateForm, isAuthenticated, router, createOrderData, restaurant, total, selectedAddress, selectedPaymentMethod, clearCart]);

  const isFormValid = useCallback(() => {
    return !!(
      customerData.nome.trim() &&
      customerData.telefone.trim() &&
      selectedAddress &&
      selectedPaymentMethod
    );
  }, [customerData, selectedAddress, selectedPaymentMethod]);

  return {
    // State
    customerData,
    selectedAddress,
    selectedPaymentMethod,
    isProcessing,
    isCartEmpty,
    
    // Cart data
    items,
    restaurant,
    subtotal,
    deliveryFee,
    total,
    
    // Actions
    updateCustomerData,
    setSelectedAddress,
    setSelectedPaymentMethod,
    handlePlaceOrder,
    isFormValid,
    updateQuantity,
  };
};
