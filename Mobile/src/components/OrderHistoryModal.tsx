import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../hooks/useColors';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import httpClient from '../api/httpClient';

interface OrderItem {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  adicionais?: any[];
  ingredientesRemovidos?: string[];
  observacoes?: string;
}

interface Address {
  nome?: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
}

interface Order {
  id: string;
  numeroPedido: string;
  status: string;
  createdDate: string;
  subtotal: number;
  taxaEntrega: number;
  taxaServico?: number;
  desconto?: number;
  total: number;
  metodoPagamento: string;
  itens: OrderItem[];
  enderecoEntrega: Address;
  observacoes?: string;
  restaurant?: {
    id: string;
    nome: string;
  };
}

interface OrderHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export default function OrderHistoryModal({ visible, onClose, initialOrderId }: OrderHistoryModalProps) {
  const { user } = useAuth();
  const colors = useColors();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função de normalização reutilizável
  const normalizeOrder = useCallback((order: any): Order => {
    // Garantir que itens seja um array
    let itens: any[] = [];
    if (order.itens) {
      if (typeof order.itens === 'string') {
        try {
          itens = JSON.parse(order.itens);
        } catch (e) {
          itens = [];
        }
      } else if (Array.isArray(order.itens)) {
        itens = order.itens;
      }
    }
    
    // Normalizar itens
    itens = itens.map((item: any) => ({
      ...item,
      id: item.id ? String(item.id) : '',
      nome: item.nome ? String(item.nome) : '',
      quantidade: Number(item.quantidade || 0),
      precoUnitario: Number(item.precoUnitario || 0),
      ingredientesRemovidos: Array.isArray(item.ingredientesRemovidos) 
        ? item.ingredientesRemovidos.map((i: any) => String(i || ''))
        : [],
      adicionais: Array.isArray(item.adicionais) 
        ? item.adicionais.map((a: any) => {
            if (typeof a === 'string') return { nome: String(a) };
            if (a && typeof a === 'object' && a.nome) return { ...a, nome: String(a.nome) };
            return { nome: String(a || '') };
          })
        : [],
      observacoes: item.observacoes ? String(item.observacoes) : undefined,
    }));

    // Garantir que enderecoEntrega seja um objeto
    let enderecoEntrega: any = {};
    if (order.enderecoEntrega) {
      if (typeof order.enderecoEntrega === 'string') {
        try {
          enderecoEntrega = JSON.parse(order.enderecoEntrega);
        } catch (e) {
          enderecoEntrega = {};
        }
      } else if (typeof order.enderecoEntrega === 'object') {
        enderecoEntrega = order.enderecoEntrega;
      }
    }

    // Normalizar enderecoEntrega
    enderecoEntrega = {
      nome: enderecoEntrega.nome ? String(enderecoEntrega.nome) : undefined,
      rua: enderecoEntrega.rua ? String(enderecoEntrega.rua) : '',
      numero: enderecoEntrega.numero ? String(enderecoEntrega.numero) : '',
      complemento: enderecoEntrega.complemento ? String(enderecoEntrega.complemento) : undefined,
      bairro: enderecoEntrega.bairro ? String(enderecoEntrega.bairro) : '',
      cidade: enderecoEntrega.cidade ? String(enderecoEntrega.cidade) : '',
      cep: enderecoEntrega.cep ? String(enderecoEntrega.cep) : '',
    };

    return {
      ...order,
      id: order.id ? String(order.id) : '',
      numeroPedido: order.numeroPedido ? String(order.numeroPedido) : '',
      status: order.status ? String(order.status) : '',
      createdDate: order.createdDate ? String(order.createdDate) : '',
      subtotal: Number(order.subtotal || 0),
      taxaEntrega: Number(order.taxaEntrega || 0),
      taxaServico: order.taxaServico ? Number(order.taxaServico) : undefined,
      desconto: order.desconto ? Number(order.desconto) : undefined,
      total: Number(order.total || 0),
      metodoPagamento: order.metodoPagamento ? String(order.metodoPagamento) : '',
      itens,
      enderecoEntrega,
      observacoes: order.observacoes ? String(order.observacoes) : undefined,
      restaurant: order.restaurant && order.restaurant.nome ? {
        ...order.restaurant,
        id: order.restaurant.id ? String(order.restaurant.id) : '',
        nome: String(order.restaurant.nome),
      } : order.restaurant,
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await httpClient.get('/orders');
      // A API pode retornar diretamente um array ou um objeto com data/orders
      let ordersData: any[] = [];
      const responseAny = response as any;
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (responseAny?.data && Array.isArray(responseAny.data)) {
        ordersData = responseAny.data;
      } else if (responseAny?.orders && Array.isArray(responseAny.orders)) {
        ordersData = responseAny.orders;
      }
      
      // Processar e normalizar pedidos usando a função normalizeOrder
      const processedOrders = ordersData.map((order: any) => normalizeOrder(order));

      // Ordenar por data mais recente primeiro
      const sortedOrders = processedOrders.sort((a: Order, b: Order) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      
      // Se houver um pedido inicial especificado, selecioná-lo automaticamente
      if (initialOrderId && sortedOrders.length > 0) {
        const orderToSelect = sortedOrders.find((o: Order) => o.id === initialOrderId);
        if (orderToSelect) {
          setSelectedOrder(normalizeOrder(orderToSelect));
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Não foi possível carregar seus pedidos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [initialOrderId, normalizeOrder]);

  useEffect(() => {
    if (visible && user) {
      fetchOrders();
    }
  }, [visible, user, fetchOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return '';
    const statusMap: Record<string, string> = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      preparando: 'Preparando',
      pronto: 'Pronto',
      saiu_entrega: 'Saiu para Entrega',
      entregue: 'Entregue',
      cancelado: 'Cancelado',
      rejeitado: 'Rejeitado',
      pendente_pagamento: 'Aguardando Pagamento',
    };
    return statusMap[status] || String(status || '');
  };

  const getStatusColor = (status: string) => {
    if (!status) return colors.textSecondary || COLORS.textSecondary || '#666';
    const colorMap: Record<string, string> = {
      pendente: colors.warning || '#f59e0b',
      confirmado: colors.primary || COLORS.primary,
      preparando: colors.primary || COLORS.primary,
      pronto: colors.success || '#10b981',
      saiu_entrega: colors.primary || COLORS.primary,
      entregue: colors.success || '#10b981',
      cancelado: colors.error || COLORS.error,
      rejeitado: colors.error || COLORS.error,
      pendente_pagamento: colors.warning || '#f59e0b',
    };
    return colorMap[status] || colors.textSecondary || COLORS.textSecondary || '#666';
  };

  const formatPaymentMethod = (method: string) => {
    if (!method) return '';
    const methodMap: Record<string, string> = {
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      vale_refeicao: 'Vale Refeição',
    };
    return methodMap[method] || String(method || '');
  };

  const getOrderCode = (orderId: string) => {
    // Extrair os últimos 6 dígitos/caracteres do ID
    if (!orderId) return '';
    const idString = String(orderId);
    // Remover hífens e outros caracteres não alfanuméricos para pegar os últimos 6 caracteres
    const cleanId = idString.replace(/[^a-zA-Z0-9]/g, '');
    return cleanId.slice(-6).toUpperCase();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background, borderWidth: 0 }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Histórico de Pedidos</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando seus pedidos...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{String(error || '')}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchOrders}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum pedido encontrado</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Seus pedidos aparecerão aqui
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setSelectedOrder(normalizeOrder(order));
                }}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>
                      {`#${getOrderCode(order.id || '')}`}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                      {String(formatDate(order.createdDate || ''))}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {String(formatStatus(order.status || ''))}
                    </Text>
                  </View>
                </View>

                {order.restaurant?.nome && (
                  <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>
                    {String(order.restaurant.nome)}
                  </Text>
                )}

                <View style={styles.orderFooter}>
                  <View style={styles.orderItemsInfo}>
                    <MaterialIcons name="shopping-bag" size={16} color={colors.textSecondary} />
                    <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
                      {`${Array.isArray(order.itens) ? order.itens.length : 0} item${Array.isArray(order.itens) && order.itens.length !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <Text style={[styles.orderTotal, { color: colors.text }]}>
                    {`€${Number(order.total || 0).toFixed(2)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Modal de Detalhes do Pedido */}
        {selectedOrder && (
          <Modal
            visible={!!selectedOrder}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedOrder(null)}
          >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
              {/* Header do Detalhes */}
              <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.background, borderWidth: 0 }]}
                  onPress={() => setSelectedOrder(null)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes do Pedido</Text>
                <View style={styles.headerRight} />
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.detailsScrollContent}
              >
                {/* Informações do Pedido */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações do Pedido</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Número:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {String(selectedOrder.numeroPedido || '')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Código:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {String(getOrderCode(selectedOrder.id || ''))}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Data:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {String(formatDate(selectedOrder.createdDate || ''))}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(selectedOrder.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(selectedOrder.status) },
                        ]}
                      >
                        {String(formatStatus(selectedOrder.status || ''))}
                      </Text>
                    </View>
                  </View>
                  {selectedOrder.restaurant?.nome && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Restaurante:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {String(selectedOrder.restaurant.nome)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Itens do Pedido */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Itens do Pedido</Text>
                  {Array.isArray(selectedOrder.itens) && selectedOrder.itens.length > 0 ? (
                    selectedOrder.itens.map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <View style={styles.orderItemHeader}>
                          <Text style={[styles.itemName, { color: colors.text }]}>
                            {`${String(item.quantidade || 0)} x ${String(item.nome || '')}`}
                          </Text>
                          <Text style={[styles.itemPrice, { color: colors.text }]}>
                            {`€${Number((item.precoUnitario || 0) * (item.quantidade || 0)).toFixed(2)}`}
                          </Text>
                        </View>
                        {item.ingredientesRemovidos && item.ingredientesRemovidos.length > 0 && (
                          <Text style={[styles.itemModification, { color: colors.textSecondary }]}>
                            {`Sem: ${item.ingredientesRemovidos.map((i: any) => String(i || '')).join(', ')}`}
                          </Text>
                        )}
                        {item.adicionais && item.adicionais.length > 0 && (
                          <Text style={[styles.itemModification, { color: colors.textSecondary }]}>
                            {`Extras: ${item.adicionais.map((a: any) => {
                              if (typeof a === 'string') return String(a);
                              if (a && a.nome) return String(a.nome);
                              return String(a || '');
                            }).join(', ')}`}
                          </Text>
                        )}
                        {item.observacoes && (
                          <Text style={[styles.itemObservations, { color: colors.textSecondary }]}>
                            {`Obs: ${String(item.observacoes || '')}`}
                          </Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Nenhum item encontrado
                    </Text>
                  )}
                </View>

                {/* Endereço de Entrega */}
                {selectedOrder.enderecoEntrega && (
                  <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereço de Entrega</Text>
                    <View style={styles.addressContainer}>
                      {selectedOrder.enderecoEntrega.nome && (
                        <Text style={[styles.addressText, { color: colors.text, fontWeight: 'bold' }]}>
                          {String(selectedOrder.enderecoEntrega.nome || '')}
                        </Text>
                      )}
                      <Text style={[styles.addressText, { color: colors.text }]}>
                        {(() => {
                          const rua = String(selectedOrder.enderecoEntrega?.rua || '');
                          const numero = String(selectedOrder.enderecoEntrega?.numero || '');
                          const complemento = selectedOrder.enderecoEntrega?.complemento ? ` - ${String(selectedOrder.enderecoEntrega.complemento)}` : '';
                          return `${rua}, ${numero}${complemento}`;
                        })()}
                      </Text>
                      <Text style={[styles.addressText, { color: colors.text }]}>
                        {(() => {
                          const bairro = String(selectedOrder.enderecoEntrega?.bairro || '');
                          const cidade = String(selectedOrder.enderecoEntrega?.cidade || '');
                          return `${bairro}, ${cidade}`;
                        })()}
                      </Text>
                      <Text style={[styles.addressText, { color: colors.text }]}>
                        {String(selectedOrder.enderecoEntrega?.cep || '')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Observações */}
                {selectedOrder.observacoes && (
                  <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Observações</Text>
                    <Text style={[styles.observationsText, { color: colors.text }]}>
                      {String(selectedOrder.observacoes || '')}
                    </Text>
                  </View>
                )}

                {/* Método de Pagamento */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Pagamento</Text>
                  <Text style={[styles.paymentMethod, { color: colors.text }]}>
                    {String(formatPaymentMethod(selectedOrder.metodoPagamento || ''))}
                  </Text>
                </View>

                {/* Resumo Financeiro */}
                <View style={[styles.detailsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumo</Text>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal:</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {`€${Number(selectedOrder.subtotal || 0).toFixed(2)}`}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxa de Entrega:</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {`€${Number(selectedOrder.taxaEntrega || 0).toFixed(2)}`}
                    </Text>
                  </View>
                  {selectedOrder.taxaServico && selectedOrder.taxaServico > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Taxa de Serviço:</Text>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {`€${Number(selectedOrder.taxaServico || 0).toFixed(2)}`}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.desconto && selectedOrder.desconto > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.success || '#10b981' }]}>Desconto:</Text>
                      <Text style={[styles.summaryValue, { color: colors.success || '#10b981' }]}>
                        {`-€${Number(selectedOrder.desconto || 0).toFixed(2)}`}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
                    <Text style={[styles.totalValue, { color: colors.primary }]}>
                      {`€${Number(selectedOrder.total || 0).toFixed(2)}`}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginTop: SPACING.md,
    color: COLORS.text,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  orderDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '20',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  restaurantName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderItemsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  itemsCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailsScrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  detailsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  orderItem: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemQuantity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  itemModification: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  itemObservations: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  addressContainer: {
    gap: SPACING.xs,
  },
  addressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  observationsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  paymentMethod: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
