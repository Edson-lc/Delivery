import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, ChefHat, Package, TrendingUp, Eye, RefreshCw, Clock, AlertTriangle, MapPin, Timer, Star, Phone } from "lucide-react";
import { useOrderTimer } from "./RestaurantDashboard/hooks/useOrderTimer";
import { calculateDeliveryDistance, calculateEstimatedDeliveryTime } from "./RestaurantDashboard/utils/orderCalculations";
import DeliveryPersonModal from "./RestaurantDashboard/modals/DeliveryPersonModal";

const ORDER_STATUSES = {
  pendente: { 
    label: "Aguardando Confirmação", 
    color: "bg-yellow-500", 
    textColor: "text-yellow-600", 
    borderColor: "border-l-yellow-500",
    priority: 1 
  },
  confirmado: { 
    label: "Confirmado", 
    color: "bg-blue-500", 
    textColor: "text-blue-600", 
    borderColor: "border-l-blue-500",
    priority: 2 
  },
  preparando: { 
    label: "Preparando", 
    color: "bg-orange-500", 
    textColor: "text-orange-600", 
    borderColor: "border-l-orange-500",
    priority: 3 
  },
  pronto: { 
    label: "Pronto para Entrega", 
    color: "bg-purple-500", 
    textColor: "text-purple-600", 
    borderColor: "border-l-purple-500",
    priority: 4 
  },
  saiu_entrega: { 
    label: "Saiu para Entrega", 
    color: "bg-indigo-500", 
    textColor: "text-indigo-600", 
    borderColor: "border-l-indigo-500",
    priority: 5 
  },
  entregue: { 
    label: "Entregue", 
    color: "bg-green-500", 
    textColor: "text-green-600", 
    borderColor: "border-l-green-500",
    priority: 6 
  },
  cancelado: { 
    label: "Cancelado", 
    color: "bg-red-500", 
    textColor: "text-red-600", 
    borderColor: "border-l-red-500",
    priority: 7 
  },
  rejeitado: { 
    label: "Rejeitado", 
    color: "bg-gray-500", 
    textColor: "text-gray-600", 
    borderColor: "border-l-gray-500",
    priority: 8 
  }
};

// Componente para cada card de pedido
function OrderCard({ order, restaurant, onUpdateOrderStatus, onViewOrderDetails }) {
  const { timeRemaining, isOverdue } = useOrderTimer(order, restaurant);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  
  // Só mostrar timer para pedidos confirmados ou preparando
  const shouldShowTimer = order.status === 'confirmado' || order.status === 'preparando';
  
  // Função para formatar data e hora
  const formatOrderDateTime = (order) => {
    // Priorizar data de confirmação, usar data de criação como fallback
    const confirmationDate = order?.dataConfirmacao || order?.data_confirmacao;
    const createdDate = order?.createdDate || order?.created_date;
    const startDate = confirmationDate || createdDate;
    
    if (!startDate) return 'Data não disponível';
    
    const date = new Date(startDate);
    const formattedDate = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Adicionar indicador da fonte da data
    const dateSource = confirmationDate ? ' (aceito)' : ' (criado)';
    return formattedDate + dateSource;
  };
  
  return (
    <Card key={order.id} className={`bg-white border-l-4 ${ORDER_STATUSES[order.status]?.borderColor || 'border-l-gray-500'} shadow-sm`}>
      <CardContent className="p-6">
               {/* Header com Informações do Pedido e Entregador na Mesma Linha */}
               <div className="flex items-center justify-between mb-4">
                 {/* Informações do Pedido */}
                 <div className="flex-1">
                   <div className="flex items-center space-x-3 mb-2">
                     <h3 className="font-bold text-gray-900 text-lg">
                       Pedido #{order.id.slice(-6)}
                     </h3>
                     <span className={`text-sm font-medium ${
                       order.status === 'pendente' ? 'text-yellow-600' :
                       order.status === 'confirmado' ? 'text-blue-600' :
                       order.status === 'preparando' ? 'text-orange-600' :
                       order.status === 'pronto' ? 'text-purple-600' :
                       'text-gray-600'
                     }`}>
                       {ORDER_STATUSES[order.status]?.label || order.status}
                     </span>
                   </div>
                   
                   {/* Detalhes do Pedido */}
                   <div className="space-y-1">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm text-gray-600 font-medium">Cliente:</span>
                       <span className="text-sm text-gray-900">
                         {order.cliente_nome || order.clienteNome || 'Nome não informado'}
                       </span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <span className="text-sm text-gray-600 font-medium">Data/Hora:</span>
                       <span className="text-sm text-gray-900">
                         {formatOrderDateTime(order)}
                       </span>
                     </div>
                   </div>
                   
                   {/* Timer */}
                   {shouldShowTimer && timeRemaining !== null && (
                     <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium mt-2 w-fit ${
                       isOverdue 
                         ? 'bg-red-100 text-red-700 border border-red-200' 
                         : 'bg-green-100 text-green-700 border border-green-200'
                     }`}>
                       {isOverdue ? (
                         <AlertTriangle className="w-4 h-4" />
                       ) : (
                         <Clock className="w-4 h-4" />
                       )}
                       <span>
                         {isOverdue ? `${timeRemaining}min atraso` : `${timeRemaining}min restantes`}
                       </span>
                     </div>
                   )}
                 </div>
                 
                 {/* Card do Entregador */}
                 {(order.status === 'pronto' || order.status === 'saiu_entrega' || order.status === 'entregue') && (
                   <div className="ml-6">
                     {order.entregador ? (
                       (() => {
                         console.log("🔍 DEBUG - Dados do entregador:", {
                           id: order.entregador.id,
                           nomeCompleto: order.entregador.nomeCompleto,
                           nome_completo: order.entregador.nome_completo,
                           telefone: order.entregador.telefone,
                           fotoUrl: order.entregador.fotoUrl,
                           foto_url: order.entregador.foto_url,
                           avaliacao: order.entregador.avaliacao,
                           avaliacaoRaw: order.entregador.avaliacao,
                           avaliacaoType: typeof order.entregador.avaliacao,
                           todosOsCampos: Object.keys(order.entregador)
                         });
                         return null;
                       })()
                     ) : null}
                     {order.entregador ? (
                       /* Entregador Atribuído */
                       <div className={`flex items-center space-x-4 px-5 py-4 rounded-xl min-w-[380px] shadow-sm ${
                         order.status === 'entregue' 
                           ? 'bg-gradient-to-r from-green-50 to-green-100 border border-green-300' 
                           : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                       }`}>
                        {/* Avatar */}
                        <div className={`relative ${order.status === 'entregue' ? 'cursor-default' : 'cursor-pointer'}`} 
                             onClick={order.status === 'entregue' ? undefined : () => setIsDeliveryModalOpen(true)}>
                          {(order.entregador.fotoUrl || order.entregador.foto_url) ? (
                            <img 
                              src={order.entregador.fotoUrl || order.entregador.foto_url} 
                              alt={order.entregador.nomeCompleto || order.entregador.nome_completo}
                              className={`w-16 h-16 rounded-full object-cover border-2 border-green-200 shadow-sm transition-shadow ${
                                order.status === 'entregue' ? '' : 'hover:shadow-md'
                              }`}
                              onError={(e) => {
                                console.log("❌ Erro ao carregar imagem:", order.entregador.fotoUrl || order.entregador.foto_url);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log("✅ Imagem carregada com sucesso:", order.entregador.fotoUrl || order.entregador.foto_url);
                              }}
                            />
                          ) : null}
                            <div 
                              className={`w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center border-2 border-green-200 shadow-sm transition-shadow ${
                                order.status === 'entregue' ? '' : 'hover:shadow-md'
                              }`}
                              style={{ display: (order.entregador.fotoUrl || order.entregador.foto_url) ? 'none' : 'flex' }}
                            >
                            <span className="text-white font-semibold text-xl">
                              {(order.entregador.nomeCompleto || order.entregador.nome_completo)?.charAt(0) || 'E'}
                            </span>
                          </div>
                          {/* Status indicator */}
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                            order.status === 'entregue' ? 'bg-green-600' : 'bg-green-500'
                          }`}></div>
                        </div>
                         
                         {/* Informações */}
                         <div className="flex-1">
                           <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {order.entregador.nomeCompleto || order.entregador.nome_completo || 'Nome não disponível'}
                            </h4>
                             {/* Avaliação */}
                             {(() => {
                               const avaliacao = order.entregador.avaliacao;
                               console.log("🔍 DEBUG - Verificando avaliação:", {
                                 avaliacao,
                                 type: typeof avaliacao,
                                 isNumber: typeof avaliacao === 'number',
                                 isGreaterThanZero: avaliacao > 0,
                                 shouldShow: avaliacao && avaliacao > 0
                               });
                               
                               if (avaliacao && avaliacao > 0) {
                                 return (
                                   <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                                     <Star className="w-3 h-3 text-yellow-600 fill-current" />
                                     <span className="text-yellow-700 text-xs font-medium">
                                       {typeof avaliacao === 'number' ? avaliacao.toFixed(1) : avaliacao}
                                     </span>
                                   </div>
                                 );
                               }
                               return null;
                             })()}
                           </div>
                           
                           {/* Telefone */}
                           {order.entregador.telefone && (
                             <div className="flex items-center space-x-2 mb-2">
                               <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                 <Phone className="w-3 h-3 text-blue-600" />
                               </div>
                               <span className="text-sm text-gray-700 font-medium">
                                 {order.entregador.telefone}
                               </span>
                             </div>
                           )}
                           
                           {/* Distância e Tempo Estimado */}
                           {(() => {
                             const distance = calculateDeliveryDistance(order.entregador, order.restaurant);
                             const estimatedTime = distance ? calculateEstimatedDeliveryTime(distance) : null;
                             
                             if (distance && estimatedTime) {
                               return (
                                 <div className="flex items-center space-x-4">
                                   {/* Distância */}
                                   <div className="flex items-center space-x-1">
                                     <MapPin className="w-4 h-4 text-orange-600" />
                                     <span className="text-xs text-gray-600">
                                       {distance.toFixed(1)} km
                                     </span>
                                   </div>
                                   
                                   {/* Tempo Estimado */}
                                   <div className="flex items-center space-x-1">
                                     <Timer className="w-4 h-4 text-purple-600" />
                                     <span className="text-xs text-gray-600">
                                       ~{estimatedTime} min
                                     </span>
                                   </div>
                                 </div>
                               );
                             }
                             return null;
                           })()}
                           
                           {/* Status específico para entregue */}
                           {order.status === 'entregue' && (
                             <div className="flex items-center space-x-2 mt-2">
                               <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                 <CheckCircle className="w-3 h-3 text-white" />
                               </div>
                               <span className="text-sm font-medium text-green-700">
                                 Pedido entregue com sucesso
                               </span>
                             </div>
                           )}
                         </div>
                       </div>
                     ) : (
                       /* Procurando Entregador */
                       <div className="flex items-center space-x-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg min-w-[360px]">
                         <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                           <span className="text-white font-medium text-sm">🔍</span>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium text-yellow-800">
                             Procurando entregador disponível para o pedido
                           </p>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>


        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {order.status === 'pronto' && !order.entregador ? 'Procurando entregador' :
             order.status === 'pronto' && order.entregador ? 'Entregador atribuído' :
             order.status === 'saiu_entrega' && order.entregador ? 'Entregador a caminho' :
             order.status === 'saiu_entrega' && !order.entregador ? 'Saiu para entrega' :
             order.status === 'entregue' && order.entregador ? 'Pedido entregue' :
             order.status === 'entregue' && !order.entregador ? 'Pedido entregue' :
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
                  onClick={() => onUpdateOrderStatus(order.id, 'confirmado')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateOrderStatus(order.id, 'rejeitado')}
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
                onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Preparar
              </Button>
            )}
            
            {order.status === 'preparando' && (
              <Button
                size="sm"
                onClick={() => onUpdateOrderStatus(order.id, 'pronto')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2"
              >
                <Package className="w-4 h-4 mr-2" />
                Pronto
              </Button>
            )}
            
            {order.status === 'pronto' && (
              <Button
                size="sm"
                onClick={() => onUpdateOrderStatus(order.id, 'saiu_entrega')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Saiu p/ Entrega
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewOrderDetails(order)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2"
            >
              <Eye className="w-4 h-4 mr-2" />
              Detalhes
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modal do Entregador */}
      <DeliveryPersonModal
        entregador={order.entregador}
        restaurant={order.restaurant}
        order={order}
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
    </Card>
  );
}

export default function OrderList({ 
  orders, 
  restaurant,
  statusFilter, 
  onStatusFilterChange, 
  onRefreshOrders, 
  onUpdateOrderStatus, 
  onViewOrderDetails 
}) {
  const getFilteredOrders = () => {
    if (statusFilter === 'todos') {
      return orders;
    }
    return orders.filter(order => order.status === statusFilter);
  };

  const getStatusTitle = () => {
    switch (statusFilter) {
      case 'todos': return 'Pedidos Finalizados';
      case 'pendente': return 'Aguardando Confirmação';
      case 'confirmado': return 'Pedidos Confirmados';
      case 'preparando': return 'Pedidos Preparando';
      case 'pronto': return 'Pedidos Prontos';
      default: return 'Pedidos';
    }
  };

  const getEmptyMessage = () => {
    switch (statusFilter) {
      case 'todos': return 'Nenhum pedido finalizado';
      case 'pendente': return 'Nenhum pedido aguardando confirmação';
      case 'confirmado': return 'Nenhum pedido confirmado';
      case 'preparando': return 'Nenhum pedido preparando';
      case 'pronto': return 'Nenhum pedido pronto';
      default: return 'Nenhum pedido encontrado';
    }
  };

  const getEmptyDescription = () => {
    return statusFilter === 'todos' ? 
      'Não há pedidos entregues ou cancelados' : 
      'Não há pedidos com este status no momento';
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {getStatusTitle()}
        </h2>
        <div className="flex items-center space-x-2">
          {statusFilter !== 'todos' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusFilterChange('todos')}
            >
              Ver Todos
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshOrders}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getEmptyMessage()}
            </h3>
            <p className="text-gray-500">
              {getEmptyDescription()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              restaurant={restaurant}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onViewOrderDetails={onViewOrderDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
