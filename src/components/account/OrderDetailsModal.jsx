import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, MapPin, Clock, User, Phone, RefreshCw, Loader2, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  pendente_pagamento: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800" },
  pago: { label: "Pago", color: "bg-blue-100 text-blue-800" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  preparando: { label: "Preparando", color: "bg-orange-100 text-orange-800" },
  pronto: { label: "Pronto", color: "bg-purple-100 text-purple-800" },
  saiu_entrega: { label: "Em Rota", color: "bg-indigo-100 text-indigo-800" },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
};

const paymentMethodLabels = {
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  pix: "PIX",
  dinheiro: "Dinheiro",
  vale_refeicao: "Vale Refeição"
};

export default function OrderDetailsModal({ order, onClose, onReorder, isReordering }) {
    // Função para normalizar nomes de grupos de personalização
    const normalizeGroupName = (groupName) => {
        return groupName
            .replace(/^_/, '') // Remove underscore do início
            .replace(/_/g, ' ') // Substitui underscores por espaços
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza primeira letra de cada palavra
    };

    const paymentMethod = order?.metodo_pagamento ?? order?.metodoPagamento ?? order?.forma_pagamento ?? order?.formaPagamento ?? null;
    const paymentMethodLabel = paymentMethod ? (paymentMethodLabels[paymentMethod] || paymentMethod) : 'Não informado';

    const formatAddress = (endereco) => {
        if (typeof endereco === 'string') return endereco;
        if (!endereco || typeof endereco !== 'object') return 'Endereço não informado';

        const { rua = '', numero = '', complemento = '', bairro = '', cidade = '' } = endereco;
        let addressString = '';
        if (rua) addressString += rua;
        if (numero) addressString += `, ${numero}`;
        if (complemento) addressString += ` - ${complemento}`;
        if (bairro) addressString += ` - ${bairro}`;
        if (cidade && bairro !== cidade) addressString += `, ${cidade}`;

        return addressString || 'Endereço não informado';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <Card className="border-none shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-xl">Detalhes do Pedido #{order.id.slice(-6)}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {format(new Date(order.created_date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`${statusConfig[order.status]?.color || ''} border`}>
                                {statusConfig[order.status]?.label || order.status}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* Informações do Restaurante */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Utensils className="w-4 h-4" />
                                Restaurante
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p className="font-medium">{order.restaurant?.nome || 'Restaurante não informado'}</p>
                                {order.restaurant?.telefone && (
                                    <p><strong>Telefone:</strong> {order.restaurant.telefone}</p>
                                )}
                                {order.restaurant?.endereco && (
                                    <p><strong>Endereço:</strong> {order.restaurant.endereco} - {order.restaurant.cidade}{order.restaurant.codigoPostal ? `, ${order.restaurant.codigoPostal}` : ''}</p>
                                )}
                            </div>
                        </div>

                        {/* Informações do Cliente */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Dados do Cliente
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p><strong>Nome:</strong> {order.cliente_nome}</p>
                                <p><strong>Telefone:</strong> {order.cliente_telefone}</p>
                                <p><strong>Email:</strong> {order.cliente_email}</p>
                            </div>
                        </div>

                        {/* Endereço de Entrega */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Endereço de Entrega
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p>{formatAddress(order.endereco_entrega)}</p>
                            </div>
                        </div>

                        {/* Itens do Pedido */}
                        <div>
                            <h3 className="font-semibold mb-3">Itens do Pedido</h3>
                            <div className="space-y-3">
                                {order.itens && order.itens.map((item, idx) => {
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
                                        <div key={idx} className="border-b border-gray-100 pb-3">
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
                                                        const nomeGrupoNormalizado = normalizeGroupName(grupo);
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
                                })}
                            </div>
                        </div>

                        {/* Resumo Financeiro */}
                        <div>
                            <h3 className="font-semibold mb-3">Resumo do Pagamento</h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>€{(order.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {order.taxa_entrega > 0 && (
                                    <div className="flex justify-between">
                                        <span>Taxa de Entrega:</span>
                                        <span>€{(order.taxa_entrega || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.taxa_servico > 0 && (
                                    <div className="flex justify-between">
                                        <span>Taxa de Serviço:</span>
                                        <span>€{(order.taxa_servico || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.desconto > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Desconto:</span>
                                        <span>-€{(order.desconto || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>€{(order.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">
                                        <strong>Forma de Pagamento:</strong> {paymentMethodLabel}
                                    </p>
                                    
                                    {/* Informações específicas para pagamento em dinheiro */}
                                    {paymentMethod === 'dinheiro' && (
                                        <div className="mt-2 space-y-1">
                                            {(order.valor_pago || order.valorPago) && (
                                                <p className="text-sm text-gray-600">
                                                    <strong>Valor Pago:</strong> €{(order.valor_pago || order.valorPago).toFixed(2)}
                                                </p>
                                            )}
                                            {(order.troco || order.troco) && (order.troco || order.troco) > 0 && (
                                                <p className="text-sm text-gray-600">
                                                    <strong>Troco:</strong> €{(order.troco || order.troco).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Informações específicas para cartão */}
                                    {paymentMethod && (paymentMethod === 'cartao_credito' || paymentMethod === 'cartao_debito') && (
                                        <div className="mt-2 space-y-1">
                                            {(order.bandeira_cartao || order.bandeiraCartao) && (
                                                <p className="text-sm text-gray-600">
                                                    <strong>Bandeira:</strong> {order.bandeira_cartao || order.bandeiraCartao}
                                                </p>
                                            )}
                                            {(order.final_cartao || order.finalCartao) && (
                                                <p className="text-sm text-gray-600">
                                                    <strong>Final do Cartão:</strong> •••• {order.final_cartao || order.finalCartao}
                                                </p>
                                            )}
                                            {(order.nome_titular || order.nomeTitular) && (
                                                <p className="text-sm text-gray-600">
                                                    <strong>Titular:</strong> {order.nome_titular || order.nomeTitular}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Informações específicas para PIX */}
                                    {paymentMethod === 'pix' && order.pix_info && (
                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            {order.pix_info.chave && (
                                                <p>
                                                    <strong>Chave PIX:</strong> {order.pix_info.chave}
                                                </p>
                                            )}
                                            {order.pix_info.qr_code && (
                                                <p>
                                                    <strong>QR Code:</strong> {order.pix_info.qr_code}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        {order.observacoes_cliente && (
                            <div>
                                <h3 className="font-semibold mb-3">Observações do Cliente</h3>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p>{order.observacoes_cliente}</p>
                                </div>
                            </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                Fechar
                            </Button>
                            {order.status === 'entregue' && (
                                <Button 
                                    className="bg-orange-500 hover:bg-orange-600"
                                    onClick={() => onReorder(order)}
                                    disabled={isReordering}
                                >
                                    {isReordering ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Pedir Novamente
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}