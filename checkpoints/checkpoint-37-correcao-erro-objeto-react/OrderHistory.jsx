
import React, { useState, useEffect } from 'react';
import { Order, Cart, Restaurant } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingBag, Eye, RefreshCw, MapPin, Clock, User, Phone, Calendar, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import OrderDetailsModal from './OrderDetailsModal';

const statusConfig = {
  pendente_pagamento: { 
    label: "Aguardando Pagamento", 
    color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    icon: "⏳"
  },
  pago: { 
    label: "Pago", 
    color: "bg-blue-100 text-blue-800 border border-blue-200",
    icon: "💳"
  },
  confirmado: { 
    label: "Confirmado", 
    color: "bg-blue-100 text-blue-800 border border-blue-200",
    icon: "✅"
  },
  preparando: { 
    label: "Preparando", 
    color: "bg-orange-100 text-orange-800 border border-orange-200",
    icon: "👨‍🍳"
  },
  pronto: { 
    label: "Pronto", 
    color: "bg-purple-100 text-purple-800 border border-purple-200",
    icon: "🍽️"
  },
  saiu_entrega: { 
    label: "Em Rota", 
    color: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    icon: "🚚"
  },
  entregue: { 
    label: "Entregue", 
    color: "bg-green-100 text-green-800 border border-green-200",
    icon: "🎉"
  },
  cancelado: { 
    label: "Cancelado", 
    color: "bg-red-100 text-red-800 border border-red-200",
    icon: "❌"
  },
  rejeitado: { 
    label: "Rejeitado", 
    color: "bg-red-100 text-red-800 border border-red-200",
    icon: "🚫"
  },
};

export default function OrderHistory({ userEmail }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!userEmail) return;
            setIsLoading(true);
            try {
                const userOrders = await Order.filter({ cliente_email: userEmail }, '-created_date');
                setOrders(userOrders);
            } catch (error) {
                console.error("Erro ao buscar histórico de pedidos:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [userEmail]);

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleReorder = async (order) => {
        setIsReordering(true);
        try {
            // Buscar o restaurante para verificar se ainda está ativo
            const restaurant = await Restaurant.get(order.restaurant_id);
            
            if (!restaurant || restaurant.status !== 'ativo') {
                alert('Este restaurante não está mais disponível.');
                setIsReordering(false);
                return;
            }

            // Verificar se já existe um carrinho para este restaurante
            let existingCart = [];
            try {
                const sessionId = localStorage.getItem('session_id') || `session_${Date.now()}`;
                localStorage.setItem('session_id', sessionId);
                existingCart = await Cart.filter({ 
                    session_id: sessionId, 
                    restaurant_id: order.restaurant_id 
                });
            } catch (error) {
                console.log("Nenhum carrinho existente encontrado");
            }

            // Preparar os itens do pedido para o carrinho
            const cartItems = order.itens.map(item => ({
                item_id: item.item_id,
                nome: item.nome,
                preco_unitario: item.preco_unitario,
                quantidade: item.quantidade,
                observacoes: item.observacoes || '',
                adicionais: item.adicionais || []
            }));

            const sessionId = localStorage.getItem('session_id');
            const subtotal = order.itens.reduce((sum, item) => sum + (item.subtotal || 0), 0);

            if (existingCart.length > 0) {
                // Atualizar carrinho existente
                const currentCart = existingCart[0];
                const updatedItems = [...(currentCart.itens || []), ...cartItems];
                const updatedSubtotal = currentCart.subtotal + subtotal;
                
                await Cart.update(currentCart.id, {
                    itens: updatedItems,
                    subtotal: updatedSubtotal,
                    data_atualizacao: new Date().toISOString()
                });
            } else {
                // Criar novo carrinho
                await Cart.create({
                    session_id: sessionId,
                    restaurant_id: order.restaurant_id,
                    itens: cartItems,
                    subtotal: subtotal,
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: new Date().toISOString()
                });
            }

            // Redirecionar para o menu do restaurante
            window.location.href = createPageUrl(`RestaurantMenu?id=${order.restaurant_id}`);
            
        } catch (error) {
            console.error("Erro ao reordenar:", error);
            alert("Ocorreu um erro ao adicionar os itens ao carrinho. Tente novamente.");
        }
        setIsReordering(false);
    };

    return (
        <>
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Histórico de Pedidos</CardTitle>
                    <CardDescription>Veja todos os seus pedidos anteriores.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                            <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order, index) => (
                                <Card key={order.id} className="border border-gray-200">
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            {/* Cabeçalho do pedido */}
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                <div className="flex-1">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Pedido #{order.id.slice(-6)}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>
                                                                {format(new Date(order.created_date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:items-end gap-2">
                                                    <Badge className={`${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'} px-3 py-1 text-sm font-medium rounded-md hover:bg-transparent hover:shadow-none`}>
                                                        <span className="mr-1">{statusConfig[order.status]?.icon || '📦'}</span>
                                                        {statusConfig[order.status]?.label || order.status}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-gray-900">
                                                        <Euro className="w-4 h-4" />
                                                        <span className="font-semibold text-lg">{(order.total || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista resumida dos itens */}
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="space-y-1">
                                                    {order.itens && order.itens.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                                                                {item.quantidade}
                                                            </span>
                                                            <p className="text-sm text-gray-700">{item.nome}</p>
                                                        </div>
                                                    ))}
                                                    {order.itens && order.itens.length > 2 && (
                                                        <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                                                            <span className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium">
                                                                +
                                                            </span>
                                                            <p className="text-sm text-gray-500">
                                                                e mais {order.itens.length - 2} {order.itens.length - 2 === 1 ? 'item' : 'itens'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Botão de ação */}
                                            <div className="flex justify-end">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-8 px-3 text-xs font-medium border-gray-300 text-gray-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(order);
                                                    }}
                                                >
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de detalhes */}
            {isModalOpen && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setIsModalOpen(false)}
                    onReorder={handleReorder}
                    isReordering={isReordering}
                />
            )}
        </>
    );
}
