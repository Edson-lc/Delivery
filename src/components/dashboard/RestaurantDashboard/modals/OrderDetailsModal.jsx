import React, { useState } from 'react';
import { X, Printer, Clock, User, MapPin, CreditCard, Package, Edit3, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatAddress } from '../utils/orderCalculations';

const STATUS_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  preparando: 'bg-orange-100 text-orange-800',
  pronto: 'bg-purple-100 text-purple-800',
  saiu_entrega: 'bg-indigo-100 text-indigo-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  rejeitado: 'bg-red-100 text-red-800'
};

const STATUS_TEXT_COLORS = {
  pendente: 'text-yellow-600',
  confirmado: 'text-blue-600',
  preparando: 'text-orange-600',
  pronto: 'text-purple-600',
  saiu_entrega: 'text-indigo-600',
  entregue: 'text-green-600',
  cancelado: 'text-red-600',
  rejeitado: 'text-red-600'
};

const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu para Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  rejeitado: 'Rejeitado'
};

export default function OrderDetailsModal({
  order,
  restaurant,
  isOpen,
  onClose,
  onPrintReceipt,
  onUpdatePreparationTime
}) {
  if (!isOpen || !order) return null;

  const [isEditingPrepTime, setIsEditingPrepTime] = useState(false);
  // Usar tempo do restaurante como padrão, depois tempo do pedido se alterado
  const defaultPrepTime = restaurant?.tempo_preparo || 30;
  const [preparationTime, setPreparationTime] = useState(order.tempoPreparo || defaultPrepTime);

  const handleSavePreparationTime = async () => {
    try {
      if (onUpdatePreparationTime) {
        await onUpdatePreparationTime(order.id, preparationTime);
      }
      setIsEditingPrepTime(false);
    } catch (error) {
      console.error('Erro ao atualizar tempo de preparo:', error);
    }
  };

  const handleCancelEdit = () => {
    setPreparationTime(order.tempoPreparo || defaultPrepTime);
    setIsEditingPrepTime(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (order) => {
    // Priorizar data de confirmação, usar data de criação como fallback
    const confirmationDate = order?.dataConfirmacao || order?.data_confirmacao;
    const createdDate = order?.createdDate || order?.created_date;
    const startDate = confirmationDate || createdDate;
    
    if (!startDate) return 'Data não disponível';
    
    const formattedDate = new Date(startDate).toLocaleString('pt-BR');
    const dateSource = confirmationDate ? ' (aceito)' : ' (criado)';
    return formattedDate + dateSource;
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusTextColor = (status) => {
    return STATUS_TEXT_COLORS[status] || 'text-gray-600';
  };

  const getStatusLabel = (status) => {
    return STATUS_LABELS[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Pedido #{order.id.slice(-6)}
              </h2>
              <p className="text-sm text-gray-500">
                {formatDate(order)}
              </p>
            </div>
          </div>
           <div className="flex items-center gap-3">
             <span className={`text-sm font-medium ${getStatusTextColor(order.status)}`}>
               {getStatusLabel(order.status)}
             </span>
             <Button
               variant="ghost"
               size="sm"
               onClick={onClose}
               className="h-8 w-8 p-0 hover:bg-gray-100"
             >
               <X className="h-4 w-4" />
             </Button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Cliente */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                {order.cliente_nome || order.clienteNome || 'Cliente'}
              </h3>
              <p className="text-sm text-gray-600">
                {order.cliente_telefone || order.clienteTelefone || 'N/A'}
              </p>
              {order.cliente_email && (
                <p className="text-sm text-gray-600">
                  {order.cliente_email}
                </p>
              )}
            </div>
          </div>

          {/* Tempo de Preparo */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900">
                  {(order.tempoPreparoAlterado || order.tempo_preparo_alterado) && (order.tempoAdicional || order.tempo_adicional) > 0 
                    ? 'Tempo de Preparo Adicional' 
                    : 'Tempo de Preparo'
                  }
                </h3>
                
              </div>
              {isEditingPrepTime ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(parseInt(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                    min="1"
                    max="120"
                  />
                  <span className="text-sm text-gray-600">minutos</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSavePreparationTime}
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {(order.tempoPreparoAlterado || order.tempo_preparo_alterado) && (order.tempoAdicional || order.tempo_adicional) > 0
                      ? `+${order.tempoAdicional || order.tempo_adicional} minutos`
                      : `${order.tempoPreparo || defaultPrepTime} minutos`
                    }
                  </p>
                  {!(order.tempoPreparoAlterado || order.tempo_preparo_alterado) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingPrepTime(true)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="h-6 w-6 flex items-center justify-center">
                      <span className="text-xs text-gray-400" title="Tempo já alterado">
                        ✓
                      </span>
                    </div>
                  )}
                </div>
              )}
              {(order.tempoPreparoAlterado || order.tempo_preparo_alterado) && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    O tempo de preparo adicional já foi adicionado para este pedido
                  </p>
                 
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Endereço de Entrega</h3>
              <p className="text-sm text-gray-600">
                {formatAddress(order.endereco_entrega)}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              Itens do Pedido
            </h3>
            <div className="space-y-3">
              {order.itens && Array.isArray(order.itens) ? (
                order.itens.map((item, index) => {
                  
                  return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    {/* Item Principal */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.quantidade}x {item.nome}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency((item.preco_unitario || item.precoUnitario || 0) * item.quantidade)}
                      </p>
                    </div>
                    
                    {/* Personalizações */}
                    {item.personalizacoes && typeof item.personalizacoes === 'object' && Object.keys(item.personalizacoes).length > 0 && (
                      <div className="space-y-1 mb-2">
                        {Object.entries(item.personalizacoes).map(([key, personalizacao], idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600">
                            <span>• {key === '_porcao' ? 'Porção' : key}: {personalizacao.nome}</span>
                            {personalizacao.preco_adicional && (
                              <span className="font-medium text-gray-900">
                                +{formatCurrency(personalizacao.preco_adicional)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionais Selecionados */}
                    {item.adicionais_selecionados && Array.isArray(item.adicionais_selecionados) && item.adicionais_selecionados.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {item.adicionais_selecionados.map((adicional, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600">
                            <span>+ {adicional.nome}</span>
                            <span className="font-medium text-gray-900">
                              +{formatCurrency(adicional.preco || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ingredientes Removidos */}
                    {item.ingredientes_removidos && Array.isArray(item.ingredientes_removidos) && item.ingredientes_removidos.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {item.ingredientes_removidos.map((removido, idx) => (
                          <div key={idx} className="text-sm text-red-600">
                            - Sem {removido}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Observações */}
                    {item.observacoes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">OBS:</span> <em>"{item.observacoes}"</em>
                        </p>
                      </div>
                    )}


                  </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum item encontrado</p>
              )}
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
              Resumo
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.desconto > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(order.desconto)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-lg">{formatCurrency(order.subtotal - (order.desconto || 0))}</span>
                </div>
              </div>
            </div>
            
            {/* Aviso de Pagamento em Dinheiro */}
            {order.metodo_pagamento === 'dinheiro' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800 leading-relaxed">
                      O valor de {formatCurrency(order.subtotal - (order.desconto || 0))} deve ser pago pelo entregador na recolha do pedido
                    </p>
                    <p className="text-xs text-amber-700 mt-1 opacity-80">
                      O cliente pagará em dinheiro quando receber o pedido
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">Pagamento</h3>
              <p className="text-base text-gray-700 font-medium">
                {order.metodo_pagamento === 'dinheiro' ? 'Dinheiro' : (order.metodo_pagamento || 'Não informado')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <Button
            onClick={onPrintReceipt}
            variant="outline"
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}