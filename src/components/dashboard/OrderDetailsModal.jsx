import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, UserIcon, Euro, MapPin, Printer, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const ORDER_STATUSES = {
  pendente: { label: "Aguardando Confirmação", color: "bg-yellow-500", textColor: "text-yellow-600", priority: 1 },
  confirmado: { label: "Confirmado", color: "bg-blue-500", textColor: "text-blue-600", priority: 2 },
  preparando: { label: "Preparando", color: "bg-orange-500", textColor: "text-orange-600", priority: 3 },
  pronto: { label: "Pronto para Entrega", color: "bg-purple-500", textColor: "text-purple-600", priority: 4 },
  saiu_entrega: { label: "Saiu para Entrega", color: "bg-indigo-500", textColor: "text-indigo-600", priority: 5 },
  entregue: { label: "Entregue", color: "bg-green-500", textColor: "text-green-600", priority: 6 },
  cancelado: { label: "Cancelado", color: "bg-red-500", textColor: "text-red-600", priority: 7 },
  rejeitado: { label: "Rejeitado", color: "bg-gray-500", textColor: "text-gray-600", priority: 8 }
};

export default function OrderDetailsModal({ 
  order, 
  isOpen, 
  onClose, 
  onPrintReceipt 
}) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <div className="flex items-center space-x-3">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Pedido #{order.id.slice(-6)}
                  </DialogTitle>
                  <span className={`text-lg font-medium ${
                    order.status === 'pendente' ? 'text-yellow-600' :
                    order.status === 'confirmado' ? 'text-blue-600' :
                    order.status === 'preparando' ? 'text-orange-600' :
                    order.status === 'pronto' ? 'text-purple-600' :
                    'text-gray-600'
                  }`}>
                    {ORDER_STATUSES[order.status]?.label || order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(order.created_date), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onPrintReceipt}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Informações do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Informações do Cliente</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.cliente_nome || order.clienteNome || 'Nome não informado'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.cliente_telefone || order.clienteTelefone || 'Telefone não informado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Euro className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    €{order.total?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.metodo_pagamento === 'dinheiro' ? 
                      `Dinheiro${order.valor_pago ? ` (Pago: €${order.valor_pago.toFixed(2)})` : ''}${order.troco > 0 ? ` - Troco: €${order.troco.toFixed(2)}` : ''}` :
                     order.metodo_pagamento === 'cartao_credito' ? 
                      `Cartão de Crédito${order.final_cartao ? ` (****${order.final_cartao})` : ''}` :
                     order.metodo_pagamento === 'cartao_debito' ? 
                      `Cartão de Débito${order.final_cartao ? ` (****${order.final_cartao})` : ''}` :
                     order.metodo_pagamento === 'pix' ? 'PIX' :
                     order.metodo_pagamento === 'stripe' ? 
                      `Cartão (Stripe)${order.final_cartao ? ` (****${order.final_cartao})` : ''}` :
                     order.metodo_pagamento || 'Forma de pagamento não informada'}
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
                {formatAddress(order.endereco_entrega)}
              </p>
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
          <div className="space-y-3">
            {order.itens && Array.isArray(order.itens) ? (
              order.itens.map((item, index) => {
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
                <span>€{order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {order.taxaEntrega > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega:</span>
                  <span>€{order.taxaEntrega?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order.taxaServico > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de Serviço:</span>
                  <span>€{order.taxaServico?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order.desconto > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span>-€{order.desconto?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>€{order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações do Cliente */}
        {order.observacoes && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Observações do Cliente</h4>
            <p className="text-sm text-blue-800">{String(order.observacoes)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
