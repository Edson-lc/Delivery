import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Restaurant, MenuItem, Order } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChefHat, 
  Package,
  TrendingUp,
  Settings,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  ShoppingCart,
  User as UserIcon,
  MapPin,
  Euro,
  Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ORDER_STATUSES = {
  // Estados do fluxo completo
  pendente: { label: "Aguardando Confirmação", color: "bg-yellow-500", textColor: "text-yellow-600", priority: 1 },
  confirmado: { label: "Confirmado", color: "bg-blue-500", textColor: "text-blue-600", priority: 2 },
  preparando: { label: "Preparando", color: "bg-orange-500", textColor: "text-orange-600", priority: 3 },
  pronto: { label: "Pronto para Entrega", color: "bg-purple-500", textColor: "text-purple-600", priority: 4 },
  saiu_entrega: { label: "Saiu para Entrega", color: "bg-indigo-500", textColor: "text-indigo-600", priority: 5 },
  entregue: { label: "Entregue", color: "bg-green-500", textColor: "text-green-600", priority: 6 },
  cancelado: { label: "Cancelado", color: "bg-red-500", textColor: "text-red-600", priority: 7 },
  rejeitado: { label: "Rejeitado", color: "bg-gray-500", textColor: "text-gray-600", priority: 8 }
};

const IN_PROGRESS_STATUSES = new Set(["pendente", "confirmado", "preparando", "pronto", "saiu_entrega"]);
const RESTAURANT_ACTION_STATUSES = new Set(["pendente", "confirmado", "preparando", "pronto"]);

// Função auxiliar para formatar endereço
const formatAddress = (address) => {
  if (!address) return 'Endereço não informado';
  
  if (typeof address === 'string') {
    return address;
  }
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.rua) parts.push(address.rua);
    if (address.numero) parts.push(address.numero);
    if (address.complemento) parts.push(address.complemento);
    if (address.bairro) parts.push(address.bairro);
    if (address.cidade) parts.push(address.cidade);
    if (address.cep) parts.push(address.cep);
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
  }
  
  return 'Endereço não informado';
};

// Função auxiliar para formatar nome do cliente
const formatCustomerName = (user) => {
  if (!user) return 'N/A';
  
  if (typeof user === 'string') {
    return user;
  }
  
  if (typeof user === 'object') {
    return user.full_name || user.name || user.email || 'N/A';
  }
  
  return 'N/A';
};

export default function RestaurantDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('classic'); // classic, bell, chime, beep, custom
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [alertInterval, setAlertInterval] = useState(null);
  const [lastProcessedOrderId, setLastProcessedOrderId] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos'); // Novo estado para filtro de status

  const loadOrders = useCallback(async (restaurantId) => {
    try {
      const ordersData = await Order.filter({ restaurant_id: restaurantId }, "-created_date", 100);
      
      console.log("🔍 Carregando pedidos:", ordersData.length);
      console.log("📋 Todos os pedidos:", ordersData.map(o => ({ id: o.id, status: o.status, created: o.created_date })));
      
      // Debug detalhado do primeiro pedido
      if (ordersData.length > 0) {
        console.log("🔍 DEBUG - Estrutura completa do primeiro pedido:", ordersData[0]);
        console.log("🔍 DEBUG - Campos disponíveis:", Object.keys(ordersData[0]));
        console.log("🔍 DEBUG - Cliente nome:", ordersData[0].clienteNome);
        console.log("🔍 DEBUG - Cliente telefone:", ordersData[0].clienteTelefone);
        console.log("🔍 DEBUG - Total:", ordersData[0].total);
        console.log("🔍 DEBUG - Itens:", ordersData[0].itens);
        console.log("🔍 DEBUG - Itens é array?", Array.isArray(ordersData[0].itens));
        console.log("🔍 DEBUG - Quantidade de itens:", ordersData[0].itens?.length);
        if (ordersData[0].itens && ordersData[0].itens.length > 0) {
          console.log("🔍 DEBUG - Primeiro item:", ordersData[0].itens[0]);
          console.log("🔍 DEBUG - Campos do primeiro item:", Object.keys(ordersData[0].itens[0]));
        }
        console.log("🔍 DEBUG - Método pagamento:", ordersData[0].metodoPagamento);
      }
      
      // Detectar novos pedidos que precisam de ação do restaurante
      const pendingOrders = ordersData.filter(order => 
        order.status === 'pendente' && 
        RESTAURANT_ACTION_STATUSES.has(order.status)
      );
      console.log("📋 Pedidos pendentes encontrados:", pendingOrders.length);
      console.log("📋 IDs dos pedidos pendentes:", pendingOrders.map(o => o.id));
      
      const newestPendingOrder = pendingOrders[0]; // Pega o mais recente
      
      console.log("🆕 Pedido pendente mais recente:", newestPendingOrder?.id);
      console.log("🆔 Último processado:", lastProcessedOrderId);
      console.log("📱 Modal aberto:", showOrderModal);
      console.log("🔍 DEBUG - Itens do pedido pendente:", newestPendingOrder?.itens);
      console.log("🔍 DEBUG - Itens é array?", Array.isArray(newestPendingOrder?.itens));
      console.log("🔍 DEBUG - Quantidade de itens:", newestPendingOrder?.itens?.length);
      if (newestPendingOrder?.itens && newestPendingOrder.itens.length > 0) {
        console.log("🔍 DEBUG - Primeiro item do pedido pendente:", newestPendingOrder.itens[0]);
        console.log("🔍 DEBUG - Campos do primeiro item:", Object.keys(newestPendingOrder.itens[0]));
      }
      console.log("🔍 Comparação de IDs:", newestPendingOrder?.id !== lastProcessedOrderId);
      console.log("🔍 Modal não aberto:", !showFullScreenModal);
      
      if (newestPendingOrder && 
          newestPendingOrder.id !== lastProcessedOrderId && 
          !showFullScreenModal) {
        
        console.log("🚨 NOVO PEDIDO DETECTADO! Abrindo modal de tela cheia...");
        console.log("🚨 Detalhes do pedido:", {
          id: newestPendingOrder.id,
          status: newestPendingOrder.status,
          created: newestPendingOrder.created_date,
          total: newestPendingOrder.total,
          cliente: newestPendingOrder.cliente_nome || newestPendingOrder.clienteNome
        });
        
        setPendingOrder(newestPendingOrder);
        setShowFullScreenModal(true);
        setLastProcessedOrderId(newestPendingOrder.id);
        
        // Tocar som de notificação
        if (soundEnabled) {
          console.log("🔊 Tocando som de notificação...");
          playNotificationSound();
          
          console.log("🔊 Iniciando som de alerta...");
          startContinuousAlert();
        }
      } else {
        console.log("❌ Modal não será aberto porque:");
        if (!newestPendingOrder) console.log("  - Nenhum pedido pendente encontrado");
        if (newestPendingOrder?.id === lastProcessedOrderId) console.log("  - Pedido já foi processado");
        if (showFullScreenModal) console.log("  - Modal já está aberto");
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  }, [lastProcessedOrderId, showFullScreenModal, soundEnabled]);

  const playNotificationSound = () => {
    try {
      console.log(`🔊 Tocando som de notificação: ${soundType}`);
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurações diferentes para cada tipo de som
      switch (soundType) {
        case 'classic':
          // Som clássico (atual)
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'bell':
          // Som de sino
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
          
        case 'chime':
          // Som de carrilhão
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
          
        case 'beep':
          // Som de beep simples
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;
          
        case 'custom':
          // Som personalizado (mais complexo)
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1); // C#5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3); // A5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
          break;
          
        default:
          // Fallback para classic
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
      }
      
      console.log("✅ Som tocado com sucesso!");
    } catch (error) {
      console.log("❌ Erro ao tocar som:", error);
      
      // Fallback: usar beep do sistema
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(() => {});
      } catch (fallbackError) {
        console.log("❌ Fallback também falhou:", fallbackError);
      }
    }
  };

  const startContinuousAlert = () => {
    console.log("🚨 Iniciando alerta contínuo...");
    
    // Limpar intervalo anterior se existir
    if (alertInterval) {
      clearInterval(alertInterval);
    }
    
    // Tocar som imediatamente
    playNotificationSound();
    
    // Configurar intervalo para tocar a cada 3 segundos
    const interval = setInterval(() => {
      console.log("🔔 Tocando som de alerta...");
      playNotificationSound();
    }, 3000);
    
    setAlertInterval(interval);
    console.log("✅ Alerta contínuo configurado!");
  };

  const stopContinuousAlert = () => {
    console.log("🔇 Parando alerta contínuo...");
    if (alertInterval) {
      clearInterval(alertInterval);
      setAlertInterval(null);
      console.log("✅ Alerta contínuo parado!");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Atualizando status do pedido ${orderId} para ${newStatus}`);
      
      // Usar o método Order.update que já funcionava antes
      await Order.update(orderId, { status: newStatus });
      console.log(`✅ Status atualizado com sucesso para ${newStatus}`);
      await loadOrders(restaurant.id);
    } catch (error) {
      console.error("❌ Erro ao atualizar status do pedido:", error);
      alert(`Erro ao atualizar status: ${error.message}`);
    }
  };

  const handleAcceptOrder = async () => {
    if (pendingOrder) {
      console.log("✅ Aceitando pedido:", pendingOrder.id);
      
      // Se for pedido de teste, apenas fechar modal
      if (pendingOrder.id.startsWith('test-')) {
        console.log("🧪 Pedido de teste - apenas fechando modal");
        handleCloseModal();
        return;
      }
      
      try {
        await updateOrderStatus(pendingOrder.id, 'confirmado');
        handleCloseModal();
      } catch (error) {
        console.error("❌ Erro ao aceitar pedido:", error);
        alert("Erro ao aceitar pedido. Tente novamente.");
      }
    }
  };

  const handleRejectOrder = async () => {
    if (pendingOrder) {
      console.log("❌ Rejeitando pedido:", pendingOrder.id);
      
      // Se for pedido de teste, apenas fechar modal
      if (pendingOrder.id.startsWith('test-')) {
        console.log("🧪 Pedido de teste - apenas fechando modal");
        handleCloseModal();
        return;
      }
      
      try {
        await updateOrderStatus(pendingOrder.id, 'rejeitado');
        handleCloseModal();
      } catch (error) {
        console.error("❌ Erro ao rejeitar pedido:", error);
        alert("Erro ao rejeitar pedido. Tente novamente.");
      }
    }
  };

  const handleCloseModal = () => {
    setShowFullScreenModal(false);
    setPendingOrder(null);
    stopContinuousAlert();
    setStatusFilter('pendente'); // Ir para aba de aguardando confirmação
  };

  const handleViewOrderDetails = (order) => {
    console.log("🔍 DEBUG - Dados do pedido selecionado:", order);
    console.log("🔍 DEBUG - Cliente nome:", order.cliente_nome || order.clienteNome);
    console.log("🔍 DEBUG - Cliente telefone:", order.cliente_telefone || order.clienteTelefone);
    console.log("🔍 DEBUG - Total:", order.total);
    console.log("🔍 DEBUG - Itens:", order.itens);
    console.log("🔍 DEBUG - Itens é array?", Array.isArray(order.itens));
    console.log("🔍 DEBUG - Quantidade de itens:", order.itens?.length);
    if (order.itens && order.itens.length > 0) {
      console.log("🔍 DEBUG - Primeiro item:", order.itens[0]);
      console.log("🔍 DEBUG - Campos do primeiro item:", Object.keys(order.itens[0]));
    }
    console.log("🔍 DEBUG - Método pagamento:", order.metodo_pagamento || order.metodoPagamento);
    setSelectedOrderForDetails(order);
    setShowOrderDetailsModal(true);
  };

  const handleCloseOrderDetailsModal = () => {
    setShowOrderDetailsModal(false);
    setSelectedOrderForDetails(null);
  };

  // Função para filtrar pedidos por status
  const getFilteredOrders = () => {
    if (statusFilter === 'todos') {
      return orders;
    }
    return orders.filter(order => order.status === statusFilter);
  };

  // Função para contar pedidos por status
  const getOrderCountByStatus = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  // Função para lidar com clique nos cards de status
  const handleStatusCardClick = (status) => {
    setStatusFilter(status);
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        const user = await User.me();

        if (user.tipo_usuario !== "restaurante" && user.role !== "admin") {
          window.location.href = createPageUrl("Home");
          return;
        }

        let restaurantData;
        if (user.restaurant_id) {
          restaurantData = await Restaurant.get(user.restaurant_id);
        } else if (user.role === "admin") {
          const restaurants = await Restaurant.list();
          restaurantData = restaurants?.[0];
        }

        if (!restaurantData) {
          alert("Restaurante não encontrado. Entre em contato com o suporte.");
          return;
        }

        setRestaurant(restaurantData);
        await loadOrders(restaurantData.id);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        window.location.href = createPageUrl("Home");
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [loadOrders]);

  // Atualizar pedidos a cada 30 segundos para evitar rate limiting
  useEffect(() => {
    if (!restaurant) return;
    
    const interval = setInterval(() => {
      loadOrders(restaurant.id);
    }, 30000); // Aumentado para 30 segundos para evitar rate limiting

    return () => clearInterval(interval);
  }, [restaurant, loadOrders]);

  // Limpar intervalos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (alertInterval) {
        clearInterval(alertInterval);
      }
    };
  }, [alertInterval]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h2>
        <p className="text-gray-600 mb-4">Entre em contato com o suporte.</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const activeOrders = orders.filter(order => IN_PROGRESS_STATUSES.has(order.status));
  const newOrders = orders.filter(order => order.status === 'pendente');
  const preparingOrders = orders.filter(order => order.status === 'preparando');
  const readyOrders = orders.filter(order => order.status === 'pronto');

  return (
    <>
      {/* Estilos CSS para animações */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.6;
          }
        }
        
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        @keyframes energyFlow {
          0% { 
            opacity: 0;
            transform: translateY(-100%);
          }
          50% { 
            opacity: 1;
          }
          100% { 
            opacity: 0;
            transform: translateY(100%);
          }
        }
        
        @keyframes textGlow {
          0%, 100% { 
            text-shadow: 0 0 10px rgba(255,255,255,0.5),
                         0 0 20px rgba(255,255,255,0.3),
                         0 0 30px rgba(255,255,255,0.2);
            transform: scale(1);
          }
          50% { 
            text-shadow: 0 0 20px rgba(255,255,255,0.8),
                         0 0 40px rgba(255,255,255,0.6),
                         0 0 60px rgba(255,255,255,0.4);
            transform: scale(1.05);
          }
        }
        
        @keyframes textBounce {
          0%, 100% { 
            transform: translateY(0px);
          }
          25% { 
            transform: translateY(-5px);
          }
          75% { 
            transform: translateY(5px);
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
      {/* Debug Info - REMOVER EM PRODUÇÃO */}
      <div className="bg-yellow-100 border border-yellow-300 p-2 text-xs">
        <strong>DEBUG:</strong> showFullScreenModal: {showFullScreenModal ? 'true' : 'false'} | 
        pendingOrder: {pendingOrder ? pendingOrder.id : 'null'} | 
        soundEnabled: {soundEnabled ? 'true' : 'false'}
      </div>

      {/* Botões de Teste - REMOVER EM PRODUÇÃO */}
      <div className="flex space-x-2 p-2 bg-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
                console.log("🧪 TESTE: Simulando novo pedido...");
                console.log("🧪 Estado antes:", { showFullScreenModal, pendingOrder: pendingOrder?.id });
                
                const testOrder = {
                  id: 'test-' + Date.now(),
                  status: 'pendente',
                  created_date: new Date().toISOString(),
                  total: 25.50,
                  cliente_nome: 'Cliente Teste',
                  cliente_telefone: '(11) 99999-9999',
                  metodo_pagamento: 'dinheiro',
                  endereco_entrega: 'Rua Teste, 123, Centro',
                  itens: [
                    { quantidade: 2, nome: 'Pizza Margherita', subtotal: 25.00 },
                    { quantidade: 1, nome: 'Coca-Cola', subtotal: 0.50 }
                  ]
                };
                
                console.log("🧪 Definindo estados...");
                setPendingOrder(testOrder);
                setShowFullScreenModal(true);
                setLastProcessedOrderId(testOrder.id);
                
                console.log("🧪 Estados definidos:", { 
                  showFullScreenModal: true, 
                  pendingOrder: testOrder.id 
                });
                
                if (soundEnabled) {
                  console.log("🧪 Iniciando som...");
                  startContinuousAlert();
                }
          }}
        >
          🧪 Teste Modal
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("🔄 RESET: Limpando estados...");
            setShowOrderModal(false);
            setPendingOrder(null);
            setLastProcessedOrderId(null);
            stopContinuousAlert();
            console.log("🔄 Estados resetados");
          }}
        >
          🔄 Reset
        </Button>
      </div>

      {/* Controles de Som */}
      <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">🔊 Configurações de Som</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="soundEnabled"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="soundEnabled" className="text-sm text-blue-800">
              Som habilitado
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-blue-800">Tipo:</label>
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value)}
              className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
            >
              <option value="classic">🔔 Clássico</option>
              <option value="bell">🔔 Sino</option>
              <option value="chime">🎵 Carrilhão</option>
              <option value="beep">📢 Beep</option>
              <option value="custom">🎼 Personalizado</option>
            </select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={playNotificationSound}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            🔊 Testar Som
          </Button>
        </div>
      </div>

      {/* Modal de Tela Cheia - Novo Pedido */}
      {showFullScreenModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={handleCloseModal}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 4s ease infinite'
          }}
        >
          {/* Efeito de círculos concêntricos animados */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full border-4 border-white transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'pulse 3s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'pulse 2s ease-in-out infinite reverse'
              }}
            />
            <div 
              className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Efeito de estrelas brilhantes */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  boxShadow: '0 0 6px rgba(255,255,255,0.8)'
                }}
              />
            ))}
          </div>
          
          {/* Efeito de linhas de energia */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"
                style={{
                  left: `${12.5 + i * 12.5}%`,
                  animation: `energyFlow ${4 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          {/* Conteúdo Principal */}
          <div className="relative z-10 text-center text-white">
            {/* Ícone de Cesto Animado */}
            <div className="mb-8">
              <ShoppingCart 
                className="h-32 w-32 mx-auto animate-bounce text-white drop-shadow-lg" 
                style={{
                  animation: 'bounce 1s infinite, pulse 2s infinite'
                }}
              />
            </div>
            
            {/* Texto Principal */}
            <h1 
              className="text-6xl font-bold mb-4 drop-shadow-lg"
              style={{
                animation: 'textGlow 2s ease-in-out infinite, textBounce 3s ease-in-out infinite'
              }}
            >
              Temos um Novo Pedido!
            </h1>
            
            {/* Instrução */}
            <p className="text-lg opacity-90">
              Clique na tela para ver os detalhes
            </p>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pedido */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 border-2 border-red-500">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <AlertTriangle className="h-12 w-12 text-red-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">
                  🚨 NOVO PEDIDO RECEBIDO! 🚨
                </h2>
                <p className="text-lg text-gray-700">
                  Um novo pedido chegou e precisa da sua atenção imediatamente!
                </p>
              </div>

              {pendingOrder && (
                <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
                  {/* Informações do Pedido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Pedido #{pendingOrder.id.slice(-6)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(pendingOrder.created_date), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-6 w-6 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {pendingOrder.cliente_nome || pendingOrder.clienteNome || 'Nome não informado'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {pendingOrder.cliente_telefone || pendingOrder.clienteTelefone || 'Telefone não informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {pendingOrder.metodo_pagamento === 'dinheiro' ?
                              `Dinheiro${pendingOrder.valor_pago ? ` (Pago: €${pendingOrder.valor_pago.toFixed(2)})` : ''}${pendingOrder.troco > 0 ? ` - Troco: €${pendingOrder.troco.toFixed(2)}` : ''}` :
                              pendingOrder.metodo_pagamento === 'cartao_credito' ?
                                `Cartão de Crédito${pendingOrder.final_cartao ? ` (••••${pendingOrder.final_cartao})` : ''}` :
                                pendingOrder.metodo_pagamento === 'cartao_debito' ?
                                  `Cartão de Débito${pendingOrder.final_cartao ? ` (••••${pendingOrder.final_cartao})` : ''}` :
                                  pendingOrder.metodo_pagamento === 'pix' ? 'PIX' :
                                  pendingOrder.metodo_pagamento || 'Forma de pagamento não informada'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-6 w-6 text-orange-500" />
                        <div>
                          <p className="font-medium text-gray-900">Endereço de Entrega</p>
                          <p className="text-sm text-gray-500">
                            {formatAddress(pendingOrder.endereco_entrega)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Euro className="h-6 w-6 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">Total do Pedido</p>
                          <p className="text-lg font-bold text-green-600">
                            €{(pendingOrder.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Itens do Pedido</h3>
                    <div className="space-y-2">
                      {pendingOrder.itens && Array.isArray(pendingOrder.itens) ? (
                        pendingOrder.itens.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {item.quantidade || 1}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.nome || item.menu_item?.nome || item.name || 'Item'}
                                </p>
                                {item.observacoes && (
                                  <p className="text-xs text-blue-600">Obs: {item.observacoes}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-gray-900">
                              €{(item.preco || item.price || item.valor || 0).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">Itens não disponíveis</p>
                      )}
                    </div>
                  </div>

                  {/* Observações do Cliente */}
                  {pendingOrder.observacoes && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Observações do Cliente</h4>
                      <p className="text-blue-800">{pendingOrder.observacoes}</p>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex space-x-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleAcceptOrder}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-semibold"
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      ACEITAR PEDIDO
                    </Button>
                    <Button
                      onClick={handleRejectOrder}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 py-3 text-lg font-semibold"
                    >
                      <X className="w-6 h-6 mr-2" />
                      REJEITAR PEDIDO
                    </Button>
                  </div>

                  {/* Aviso */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>Atenção:</strong> Este pedido precisa da sua confirmação para prosseguir. 
                        O cliente está aguardando sua resposta.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {showOrderDetailsModal && selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Pedido #{selectedOrderForDetails.id.slice(-6)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(selectedOrderForDetails.created_date), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCloseOrderDetailsModal}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Informações do Cliente</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedOrderForDetails.cliente_nome || selectedOrderForDetails.clienteNome || 'Nome não informado'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedOrderForDetails.cliente_telefone || selectedOrderForDetails.clienteTelefone || 'Telefone não informado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Euro className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          €{selectedOrderForDetails.total?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedOrderForDetails.metodo_pagamento === 'dinheiro' ? 
                            `Dinheiro${selectedOrderForDetails.valor_pago ? ` (Pago: €${selectedOrderForDetails.valor_pago.toFixed(2)})` : ''}${selectedOrderForDetails.troco > 0 ? ` - Troco: €${selectedOrderForDetails.troco.toFixed(2)}` : ''}` :
                           selectedOrderForDetails.metodo_pagamento === 'cartao_credito' ? 
                            `Cartão de Crédito${selectedOrderForDetails.final_cartao ? ` (****${selectedOrderForDetails.final_cartao})` : ''}` :
                           selectedOrderForDetails.metodo_pagamento === 'cartao_debito' ? 
                            `Cartão de Débito${selectedOrderForDetails.final_cartao ? ` (****${selectedOrderForDetails.final_cartao})` : ''}` :
                           selectedOrderForDetails.metodo_pagamento === 'pix' ? 'PIX' :
                           selectedOrderForDetails.metodo_pagamento === 'stripe' ? 
                            `Cartão (Stripe)${selectedOrderForDetails.final_cartao ? ` (****${selectedOrderForDetails.final_cartao})` : ''}` :
                           selectedOrderForDetails.metodo_pagamento || 'Forma de pagamento não informada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Endereço de Entrega</h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-1" />
                    <p className="text-sm text-gray-700">
                      {formatAddress(selectedOrderForDetails.endereco_entrega)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="bg-white border rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
                <div className="space-y-3">
                  {selectedOrderForDetails.itens && Array.isArray(selectedOrderForDetails.itens) ? (
                    selectedOrderForDetails.itens.map((item, index) => {
                      console.log(`🔍 DEBUG - Renderizando item ${index}:`, item);
                      
                      // Verificar diferentes possíveis nomes de campos para ingredientes removidos
                      const ingredientesRemovidos = item.ingredientes_removidos || 
                                                   item.ingredientesRemovidos || 
                                                   item.ingredientes_removidos_salvos ||
                                                   item.removidos ||
                                                   item.ingredientes_retirados ||
                                                   [];
                      
                      // Verificar adicionais com diferentes nomes de campos
                      const adicionais = item.adicionais_selecionados || 
                                        item.adicionaisSelecionados || 
                                        item.adicionais || 
                                        [];
                      
                      // Verificar personalizações
                      const personalizacoes = item.personalizacoes || {};
                      
                      return (
                        <div key={index} className="border-b border-gray-100 pb-3">
                          {/* Nome e preço */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.quantidade}x {item.nome}</h4>
                            </div>
                            
                            <div className="text-right ml-3">
                              <p className="font-semibold text-sm">€{(item.subtotal || 0).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Personalizações */}
                          {personalizacoes && Object.keys(personalizacoes).length > 0 && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {Object.entries(personalizacoes).map(([grupo, opcao]) => {
                                const nomeGrupoNormalizado = grupo
                                  .replace(/^_/, '') // Remove underscore do início
                                  .replace(/_/g, ' ') // Substitui underscores por espaços
                                  .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza primeira letra de cada palavra
                                return (
                                  <div key={grupo} className="flex justify-between items-center">
                                    <span className="text-gray-600">• {nomeGrupoNormalizado}: {opcao.nome || opcao}</span>
                                    {opcao.preco_adicional > 0 && (
                                      <span className="font-medium text-gray-800">+€{opcao.preco_adicional.toFixed(2)}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Adicionais */}
                          {adicionais && adicionais.length > 0 && (
                            <div className="text-xs text-gray-600 space-y-1 mt-1">
                              {adicionais.map((adicional, addIdx) => (
                                <div key={addIdx} className="flex justify-between items-center">
                                  <span className="text-gray-600">+ {adicional.nome}</span>
                                  <span className="font-medium text-gray-800">€{adicional.preco.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Ingredientes Removidos */}
                          {ingredientesRemovidos && ingredientesRemovidos.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {Array.isArray(ingredientesRemovidos) ? 
                                ingredientesRemovidos.map((ingrediente, ingIdx) => (
                                  <div key={ingIdx}>- Sem {ingrediente}</div>
                                )) : 
                                <div>- Sem {String(ingredientesRemovidos)}</div>
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
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">Itens não disponíveis</p>
                  )}
                </div>
                
                {/* Resumo Financeiro */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>€{selectedOrderForDetails.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    {selectedOrderForDetails.taxaEntrega > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Entrega:</span>
                        <span>€{selectedOrderForDetails.taxaEntrega?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    {selectedOrderForDetails.taxaServico > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Serviço:</span>
                        <span>€{selectedOrderForDetails.taxaServico?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    {selectedOrderForDetails.desconto > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto:</span>
                        <span>-€{selectedOrderForDetails.desconto?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>€{selectedOrderForDetails.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações do Cliente */}
              {selectedOrderForDetails.observacoes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Observações do Cliente</h4>
                  <p className="text-sm text-blue-800">{String(selectedOrderForDetails.observacoes)}</p>
                </div>
              )}

              {/* Status do Pedido */}
              <div className="mt-6 flex items-center justify-center">
                <Badge className={`${ORDER_STATUSES[selectedOrderForDetails.status]?.color} text-white text-lg px-4 py-2`}>
                  {ORDER_STATUSES[selectedOrderForDetails.status]?.label || selectedOrderForDetails.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Cards de Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pendente' ? 'ring-2 ring-yellow-300 bg-yellow-50' : ''}`}
            onClick={() => handleStatusCardClick('pendente')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aguardando Confirmação</p>
                  <p className="text-2xl font-bold text-yellow-600">{getOrderCountByStatus('pendente')}</p>
                </div>
                <Bell className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'confirmado' ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}
            onClick={() => handleStatusCardClick('confirmado')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-blue-600">{getOrderCountByStatus('confirmado')}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`border-l-4 border-l-orange-500 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'preparando' ? 'ring-2 ring-orange-300 bg-orange-50' : ''}`}
            onClick={() => handleStatusCardClick('preparando')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Preparando</p>
                  <p className="text-2xl font-bold text-orange-600">{getOrderCountByStatus('preparando')}</p>
                </div>
                <ChefHat className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`border-l-4 border-l-purple-500 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pronto' ? 'ring-2 ring-purple-300 bg-purple-50' : ''}`}
            onClick={() => handleStatusCardClick('pronto')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prontos</p>
                  <p className="text-2xl font-bold text-purple-600">{getOrderCountByStatus('pronto')}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {statusFilter === 'todos' ? 'Todos os Pedidos' : 
               statusFilter === 'pendente' ? 'Aguardando Confirmação' :
               statusFilter === 'confirmado' ? 'Pedidos Confirmados' :
               statusFilter === 'preparando' ? 'Pedidos Preparando' :
               statusFilter === 'pronto' ? 'Pedidos Prontos' : 'Pedidos'}
            </h2>
            <div className="flex items-center space-x-2">
              {statusFilter !== 'todos' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('todos')}
                >
                  Ver Todos
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadOrders(restaurant.id)}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>

          {getFilteredOrders().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {statusFilter === 'todos' ? 'Nenhum pedido encontrado' : 
                   statusFilter === 'pendente' ? 'Nenhum pedido aguardando confirmação' :
                   statusFilter === 'confirmado' ? 'Nenhum pedido confirmado' :
                   statusFilter === 'preparando' ? 'Nenhum pedido preparando' :
                   statusFilter === 'pronto' ? 'Nenhum pedido pronto' : 'Nenhum pedido encontrado'}
                </h3>
                <p className="text-gray-500">
                  {statusFilter === 'todos' ? 'Não há pedidos no sistema' : 
                   'Não há pedidos com este status no momento'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <Card key={order.id} className="bg-white border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-gray-900 text-lg">
                          Pedido #{order.id.slice(-6)}
                        </h3>
                        <Badge className={`px-3 py-1 text-sm font-medium rounded-full ${
                          order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'preparando' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'pronto' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ORDER_STATUSES[order.status]?.label || order.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(order.created_date), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Cliente:</span>
                        <span className="text-sm text-gray-900">
                          {order.cliente_nome || order.clienteNome || 'Nome não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Total:</span>
                        <span className="text-sm text-gray-900 font-semibold">
                          €{(order.total || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">Itens:</span>
                        <span className="text-sm text-gray-900">
                          {order.itens?.length || 0}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Endereço:</span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          {formatAddress(order.endereco_entrega)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        {order.status === 'pronto' ? 'Aguardando entregador' : 
                         order.status === 'preparando' ? 'Em preparo' :
                         order.status === 'confirmado' ? 'Confirmado' :
                         order.status === 'pendente' ? 'Aguardando confirmação' :
                         'Status desconhecido'}
                      </div>
                      
                      <div className="flex space-x-2">
                        {order.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'confirmado')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'rejeitado')}
                              className="border-red-500 text-red-500 hover:bg-red-50 px-4 py-2"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        
                        {order.status === 'confirmado' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparando')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                          >
                            <ChefHat className="w-4 h-4 mr-2" />
                            Preparar
                          </Button>
                        )}
                        
                        {order.status === 'preparando' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'pronto')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Pronto
                          </Button>
                        )}
                        
                        {order.status === 'pronto' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'saiu_entrega')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Saiu p/ Entrega
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrderDetails(order)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
