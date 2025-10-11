import React from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAddress } from '../utils/orderCalculations';

export default function NewOrderModal({
  order,
  isOpen,
  onAccept,
  onReject,
  onClose
}) {
  if (!isOpen || !order) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold text-orange-600">
              Novo Pedido #{order.id.slice(-6)}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Informações do Cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
              <p className="text-gray-700">
                <strong>Nome:</strong> {order.cliente_nome || order.clienteNome || 'N/A'}
              </p>
              <p className="text-gray-700">
                <strong>Telefone:</strong> {order.cliente_telefone || order.clienteTelefone || 'N/A'}
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> {order.cliente_email || order.clienteEmail || 'N/A'}
              </p>
            </div>

            {/* Endereço de Entrega */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Endereço de Entrega</h3>
              <p className="text-gray-700">
                {formatAddress(order.endereco_entrega)}
              </p>
            </div>

            {/* Itens do Pedido */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h3>
              {order.itens && Array.isArray(order.itens) ? (
                <div className="space-y-2">
                  {order.itens.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.quantidade}x {item.nome}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.preco_unitario || item.precoUnitario)} cada
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 ml-4">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                      
                      {/* Observações */}
                      {item.observacoes && (
                        <div className="bg-yellow-50 p-2 rounded-lg mt-2">
                          <p className="text-sm text-gray-700">
                            <strong>Observações:</strong> {item.observacoes}
                          </p>
                        </div>
                      )}

                      {/* Adicionais */}
                      {item.adicionais && Array.isArray(item.adicionais) && item.adicionais.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-700 mb-1">➕ Adicionais:</p>
                          {item.adicionais.map((adicional, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-600 ml-2">
                              <span>+ {adicional.nome}</span>
                              <span className="text-green-600 font-medium">
                                {formatCurrency(adicional.preco || adicional.valor || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Removidos */}
                      {item.removidos && Array.isArray(item.removidos) && item.removidos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-700 mb-1">➖ Removidos:</p>
                          {item.removidos.map((removido, idx) => (
                            <div key={idx} className="text-sm text-red-600 ml-2">
                              - {removido.nome}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Opções Personalizadas */}
                      {item.opcoes_personalizacao && Array.isArray(item.opcoes_personalizacao) && item.opcoes_personalizacao.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-700 mb-1">🎨 Personalizações:</p>
                          {item.opcoes_personalizacao.map((opcao, idx) => (
                            <div key={idx} className="ml-2">
                              <div className="text-sm font-medium text-gray-700">{opcao.nome}:</div>
                              {opcao.selecionadas && Array.isArray(opcao.selecionadas) && opcao.selecionadas.map((selecionada, sidx) => (
                                <div key={sidx} className="flex justify-between text-sm text-gray-600 ml-2">
                                  <span>• {selecionada.nome}</span>
                                  {selecionada.preco && (
                                    <span className="text-blue-600 font-medium">
                                      {formatCurrency(selecionada.preco)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Personalizações (formato alternativo) */}
                      {item.personalizacoes && Array.isArray(item.personalizacoes) && item.personalizacoes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-purple-700 mb-1">🔧 Personalizações:</p>
                          {item.personalizacoes.map((personalizacao, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-600 ml-2">
                              <span>• {personalizacao.nome}</span>
                              {personalizacao.preco && (
                                <span className="text-purple-600 font-medium">
                                  {formatCurrency(personalizacao.preco)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ingredientes Especiais */}
                      {item.ingredientes_especiais && Array.isArray(item.ingredientes_especiais) && item.ingredientes_especiais.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-orange-700 mb-1">🌟 Ingredientes Especiais:</p>
                          {item.ingredientes_especiais.map((ingrediente, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-600 ml-2">
                              <span>• {ingrediente.nome}</span>
                              {ingrediente.preco && (
                                <span className="text-orange-600 font-medium">
                                  {formatCurrency(ingrediente.preco)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Nenhum item encontrado</p>
              )}
            </div>

            {/* Totais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Resumo do Pedido</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxa_entrega > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(order.taxa_entrega)}</span>
                  </div>
                )}
                {order.taxa_servico > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Serviço:</span>
                    <span>{formatCurrency(order.taxa_servico)}</span>
                  </div>
                )}
                {order.desconto > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(order.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Pagamento</h3>
              <p className="text-gray-700">
                <strong>Método:</strong> {order.metodo_pagamento || 'Não informado'}
              </p>
            </div>

            {/* Data do Pedido */}
            <div className="text-sm text-gray-500">
              Pedido criado em: {formatDate(order.created_date)}
            </div>

            {/* Ações */}
            <div className="flex gap-4 justify-center pt-4">
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                <Check className="h-5 w-5 mr-2" />
                Aceitar Pedido
              </Button>
              
              <Button
                variant="outline"
                onClick={onReject}
                className="px-8 py-3 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Rejeitar Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
