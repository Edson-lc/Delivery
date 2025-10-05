
import React, { useState, useEffect, useCallback } from "react";
import { Cart, Order, Customer, User } from "@/api/entities";
import { usePublicRestaurant } from "@/hooks/usePublicRestaurants";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import AddressSelector from "@/components/checkout/AddressSelector";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Phone, 
  User as UserIcon, // Renamed to avoid conflict with User entity
  ShoppingBag,
  Clock,
  CheckCircle,
  Loader2 // Added for loading indicator
} from "lucide-react";

export default function CheckoutPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [customerData, setCustomerData] = useState({
    nome: "",
    telefone: "",
    email: "",
    observacoes: ""
  });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const urlRestaurantId = urlParams.get('restaurant');
  const cartId = urlParams.get('cart');

  // Hook para buscar dados do restaurante usando rota pública
  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = usePublicRestaurant(restaurantId);

  // Função para normalizar nomes de grupos de personalização
  const normalizeGroupName = (groupName) => {
    return groupName
      .replace(/^_/, '') // Remove underscore do início
      .replace(/_/g, ' ') // Substitui underscores por espaços
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza primeira letra de cada palavra
  };

  // Função para normalizar dados do carrinho
  const normalizeCartData = (cartData) => {
    if (!cartData || !cartData.itens) return cartData;

    const normalizedItems = cartData.itens.map(item => {
      if (!item.personalizacoes) return item;

      const normalizedPersonalizacoes = {};
      Object.entries(item.personalizacoes).forEach(([grupo, opcao]) => {
        const nomeGrupoNormalizado = normalizeGroupName(grupo);
        normalizedPersonalizacoes[nomeGrupoNormalizado] = opcao;
      });

      return {
        ...item,
        personalizacoes: normalizedPersonalizacoes
      };
    });

    return {
      ...cartData,
      itens: normalizedItems
    };
  };

  // Callback to load cart data
  const loadCheckoutData = useCallback(async () => {
    if (!urlRestaurantId && !cartId) {
      setError("Dados do carrinho não encontrados. Redirecionando para a página inicial.");
      setTimeout(() => {
        window.location.href = createPageUrl("Home");
      }, 2000);
      return;
    }
    
    try {
      let fetchedCartData = null;
      
      if (cartId) {
        fetchedCartData = await Cart.get(cartId);
      } else if (urlRestaurantId) {
        const sessionId = localStorage.getItem('delivery_session_id');
        const carts = await Cart.filter({ session_id: sessionId, restaurant_id: urlRestaurantId });
        fetchedCartData = carts.length > 0 ? carts[0] : null;
      }

      if (!fetchedCartData || !fetchedCartData.itens || fetchedCartData.itens.length === 0) {
        setError("Seu carrinho está vazio. Redirecionando para a página inicial.");
        setTimeout(() => {
          window.location.href = createPageUrl("Home");
        }, 2000);
        return;
      }

      // Normalizar dados do carrinho para corrigir nomes de grupos
      const normalizedCartData = normalizeCartData(fetchedCartData);
      setCart(normalizedCartData);
      setRestaurantId(normalizedCartData.restaurant_id);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados do checkout. Tente novamente ou volte para a página inicial.");
      setTimeout(() => {
        window.location.href = createPageUrl("Home");
      }, 3000);
    }
  }, [urlRestaurantId, cartId]);

  // Verificar autenticação e carregar dados
  useEffect(() => {
    const loadData = async () => {
      // Se ainda está carregando a autenticação, aguarda
      if (authLoading) {
        return;
      }

      // Se não há usuário logado, redireciona para login
      if (!currentUser) {
        const currentUrl = window.location.href;
        const loginUrl = `${window.location.origin}/Login?redirect=${encodeURIComponent(currentUrl)}`;
        window.location.href = loginUrl;
        return;
      }

      // Se há usuário logado, carrega os dados
      setIsLoading(true);
      
      try {
        // Update customerData with logged-in user's info
        setCustomerData(prev => ({
          ...prev,
          nome: currentUser.fullName || currentUser.full_name || prev.nome,
          email: currentUser.email || prev.email,
          telefone: currentUser.telefone || prev.telefone,
        }));

        await loadCheckoutData();
      } catch (error) {
        console.error("Erro ao carregar dados do checkout:", error);
        setError("Erro ao carregar dados do checkout. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, authLoading, loadCheckoutData]);

  // Helper function to calculate total for a single item
  const calculateItemTotal = (item) => {
    let total = item.preco_unitario * item.quantidade;
    
    if (item.adicionais_selecionados && item.adicionais_selecionados.length > 0) {
      const adicionaisTotal = item.adicionais_selecionados.reduce((sum, add) => sum + (add.preco || 0), 0);
      total += adicionaisTotal * item.quantidade;
    }

    // Adicionar preço das personalizações
    if (item.preco_personalizacoes) {
      total += item.preco_personalizacoes * item.quantidade;
    }

    return total;
  };

  const calculateTotal = () => {
    if (!cart || !restaurant || !cart.itens) return 0;
    
    // Calculate subtotal by summing up calculateItemTotal for all items
    const subtotal = cart.itens.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const taxaEntrega = restaurant.taxa_entrega || 0;
    const taxaServico = subtotal * 0.02; // 2% taxa de serviço
    
    return subtotal + taxaEntrega + taxaServico;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const processOrder = async () => {
    // Verificar se o usuário está logado antes de processar o pedido
    if (!currentUser) {
      const currentUrl = window.location.href;
      const loginUrl = `${window.location.origin}/Login?redirect=${encodeURIComponent(currentUrl)}`;
      window.location.href = loginUrl;
      return;
    }

    setIsProcessing(true);
    setError("");

    // Validação básica
    if (!customerData.nome || !customerData.telefone || !selectedAddress || !selectedPaymentMethod) {
      setError("Por favor, preencha todos os campos obrigatórios e selecione endereço e forma de pagamento.");
      setIsProcessing(false);
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    const attemptOrder = async () => {
      try {
      // 1. Criar ou atualizar cliente
      let customer;
      const existingCustomers = await Customer.filter({ telefone: customerData.telefone });
      
      if (existingCustomers.length > 0) {
        customer = existingCustomers[0];
        await Customer.update(customer.id, {
          nome: customerData.nome,
          email: customerData.email,
          endereco_principal: `${selectedAddress.rua}, ${selectedAddress.numero}`,
          data_ultimo_pedido: new Date().toISOString()
        });
      } else {
        customer = await Customer.create({
          nome: customerData.nome,
          telefone: customerData.telefone,
          email: customerData.email,
          endereco_principal: `${selectedAddress.rua}, ${selectedAddress.numero}`,
          total_pedidos: 1,
          valor_gasto_total: calculateTotal(),
          data_ultimo_pedido: new Date().toISOString()
        });
      }

      // 2. Criar pedido
      const numeroWer = `#${Date.now().toString().slice(-8)}`;
      
      // Calculate subtotal from item totals for the order object
      const orderSubtotal = cart.itens.reduce((sum, item) => sum + calculateItemTotal(item), 0);

      const orderData = {
        customerId: customer.id,
        restaurantId: cart.restaurant_id,
        numeroPedido: numeroWer,
        clienteNome: customerData.nome,
        clienteTelefone: customerData.telefone,
        clienteEmail: customerData.email,
        enderecoEntrega: selectedAddress,
        itens: cart.itens.map(item => ({
          itemId: item.item_id,
          nome: item.nome,
          precoUnitario: item.preco_unitario,
          quantidade: item.quantidade,
          observacoes: item.observacoes,
          adicionais_selecionados: item.adicionais_selecionados || [],
          personalizacoes: item.personalizacoes || {},
          ingredientes_removidos: item.ingredientes_removidos || [],
          preco_personalizacoes: item.preco_personalizacoes || 0,
          subtotal: calculateItemTotal(item)
        })),
        subtotal: orderSubtotal,
        taxaEntrega: restaurant.taxa_entrega || 0,
        taxaServico: orderSubtotal * 0.02,
        total: calculateTotal(),
        formaPagamento: selectedPaymentMethod.tipo,
        observacoesCliente: customerData.observacoes,
        status: "confirmado",
        tempoEstimadoPreparo: restaurant.tempo_preparo || 30,
        tempoEstimadoEntrega: (restaurant.tempo_preparo || 30) + 30
      };

      // Debug: Log completo do selectedPaymentMethod
      console.log("=== DEBUG PAGAMENTO COMPLETO ===");
      console.log("selectedPaymentMethod:", selectedPaymentMethod);
      console.log("selectedPaymentMethod.tipo:", selectedPaymentMethod?.tipo);
      
      // Adicionar informações específicas de pagamento
      if (selectedPaymentMethod?.tipo === 'dinheiro') {
        orderData.valorPago = selectedPaymentMethod.valor_pago;
        orderData.troco = selectedPaymentMethod.troco;
        
        // Debug: Log dos dados de pagamento
        console.log("=== DEBUG PAGAMENTO DINHEIRO ===");
        console.log("selectedPaymentMethod:", selectedPaymentMethod);
        console.log("valorPago enviado:", orderData.valorPago);
        console.log("troco enviado:", orderData.troco);
        console.log("orderData completo:", orderData);
      } else if (selectedPaymentMethod?.tipo === 'cartao_credito') {
        orderData.cartaoInfo = {
          bandeira: selectedPaymentMethod.bandeira,
          final_cartao: selectedPaymentMethod.final_cartao,
          nome_titular: selectedPaymentMethod.nome_titular
        };
      }

      const newOrder = await Order.create(orderData);
      
      // 3. Limpar carrinho
      const sessionId = localStorage.getItem('delivery_session_id');
      await Cart.update(cart.id, { 
        itens: [], 
        subtotal: 0,
        sessionId: sessionId 
      });

      setOrderId(numeroWer);
      setOrderComplete(true);
      
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      
      // Se for erro de rede e ainda temos tentativas, tentar novamente
      if ((error?.message?.includes('Failed to fetch') || error?.message?.includes('429')) && retryCount < maxRetries) {
        retryCount++;
        console.log(`Tentativa ${retryCount} de ${maxRetries} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Delay progressivo
        return attemptOrder();
      }
      
      // Tratamento específico de erros
      let errorMessage = "Erro ao processar pedido. Tente novamente.";
      
      if (error?.message?.includes('Failed to fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error?.message?.includes('429') || error?.status === 429) {
        errorMessage = "Muitas tentativas. Aguarde um momento e tente novamente.";
      } else if (error?.message?.includes('CORS')) {
        errorMessage = "Erro de configuração. Tente novamente.";
      } else if (error?.message?.includes('VALIDATION_ERROR')) {
        errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
      } else if (error?.message?.includes('CART_EMPTY')) {
        errorMessage = "Seu carrinho está vazio.";
      } else if (error?.message?.includes('RESTAURANT_NOT_FOUND')) {
        errorMessage = "Restaurante não encontrado.";
      } else if (error?.message?.includes('UNAUTHENTICATED')) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      setError(errorMessage);
    }
    
    setIsProcessing(false);
  };

  // Executar a tentativa inicial
  attemptOrder();
};

  if (isLoading || authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
        <p className="ml-4 text-gray-600">Verificando sua sessão...</p>
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar restaurante</h2>
          <p className="text-gray-600 mb-6">Não foi possível carregar os dados do restaurante.</p>
          <Button onClick={() => window.location.href = createPageUrl("Home")}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido Confirmado!
            </h2>
            
            <p className="text-gray-600 mb-4">
              Seu pedido {orderId} foi confirmado e está sendo preparado.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4" />
                <span>Tempo estimado: {(restaurant?.tempo_preparo || 30) + 30} minutos</span>
              </div>
              <p className="text-xs text-gray-500">
                Você receberá atualizações no número {customerData.telefone}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = createPageUrl("Home")}
                className="w-full"
              >
                Fazer Novo Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cart || !restaurant || !cart.itens || cart.itens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrinho Vazio</h2>
          <p className="text-gray-600 mb-6">Adicione itens ao seu carrinho para continuar.</p>
          <Button onClick={() => window.location.href = createPageUrl("Home")}>
            Ver Restaurantes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = createPageUrl(`RestaurantMenu?id=${restaurant.id}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Menu
            </Button>
            <h1 className="text-xl font-bold">Finalizar Pedido</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" /> {/* Using UserIcon */}
                  Seus Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={customerData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label>Telefone *</Label>
                    <Input
                      value={customerData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(91) 99999-9999"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <AddressSelector
              user={currentUser}
              selectedAddress={selectedAddress}
              onAddressSelect={setSelectedAddress}
            />

            {/* Forma de Pagamento */}
            <PaymentMethodSelector
              user={currentUser}
              selectedPaymentMethod={selectedPaymentMethod}
              onPaymentMethodSelect={setSelectedPaymentMethod}
              totalAmount={calculateTotal()}
            />

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customerData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Alguma observação especial? (Portão azul, interfone quebrado, etc.)"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
                <p className="text-sm text-gray-600">{restaurant?.nome}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Itens detalhados */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {cart.itens.map((item, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3">
                      {/* Nome e preço */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.quantidade}x {item.nome}</h4>
                        </div>
                        
                        <div className="text-right ml-3">
                          <p className="font-semibold text-sm">€{calculateItemTotal(item).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Personalizações */}
                      {item.personalizacoes && Object.keys(item.personalizacoes).length > 0 && (
                        <div className="text-xs text-gray-600 space-y-1">
                          {Object.entries(item.personalizacoes).map(([grupo, opcao]) => (
                            <div key={grupo} className="flex justify-between items-center">
                              <span className="text-gray-600">• {grupo}: {opcao.nome || opcao}</span>
                              {opcao.preco_adicional > 0 && (
                                <span className="font-medium text-gray-800">+€{opcao.preco_adicional.toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Adicionais */}
                      {item.adicionais_selecionados && item.adicionais_selecionados.length > 0 && (
                        <div className="text-xs text-gray-600 space-y-1 mt-1">
                          {item.adicionais_selecionados.map((adicional, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-gray-600">+ {adicional.nome}</span>
                              <span className="font-medium text-gray-800">€{adicional.preco.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ingredientes Removidos */}
                      {item.ingredientes_removidos && item.ingredientes_removidos.length > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {Array.isArray(item.ingredientes_removidos) ? 
                            item.ingredientes_removidos.map((ingrediente, idx) => (
                              <div key={idx}>- Sem {ingrediente}</div>
                            )) : 
                            <div>- Sem {String(item.ingredientes_removidos)}</div>
                          }
                        </div>
                      )}

                      {/* Observações */}
                      {item.observacoes && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          <span className="font-bold">OBS:</span> "{item.observacoes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>€{cart.itens.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span>€{(restaurant?.taxa_entrega || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Taxa de Serviço (2%)</span>
                    <span>€{(cart.itens.reduce((sum, item) => sum + calculateItemTotal(item), 0) * 0.02).toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>€{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 text-center">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tempo estimado: {(restaurant?.tempo_preparo || 30) + 30} min
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  onClick={processOrder}
                  disabled={isProcessing || !customerData.nome || !customerData.telefone || !selectedAddress || !selectedPaymentMethod}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    `Confirmar Pedido • €${calculateTotal().toFixed(2)}`
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Ao confirmar, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
