import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../hooks/useColors';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import httpClient from '../api/httpClient';

interface OrderItem {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

interface Order {
  id: string;
  numeroPedido: string;
  status: string;
  createdDate: string;
  dataConfirmacao?: string;
  total: number;
  itens: OrderItem[];
  restaurant?: {
    id: string;
    nome: string;
  };
  tempoPreparo?: number;
  tempoAdicional?: number;
}

interface ActiveOrderCardProps {
  onViewDetails?: (orderId: string) => void;
}

export default function ActiveOrderCard({ onViewDetails }: ActiveOrderCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Status que indicam pedido em aberto
  const activeStatuses = [
    'pendente',
    'confirmado',
    'preparando',
    'pronto',
    'saiu_entrega',
    'pendente_pagamento',
  ];

  const fetchActiveOrder = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await httpClient.get('/orders');
      const responseAny = response as any;
      
      let ordersData: any[] = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (responseAny?.data && Array.isArray(responseAny.data)) {
        ordersData = responseAny.data;
      } else if (responseAny?.orders && Array.isArray(responseAny.orders)) {
        ordersData = responseAny.orders;
      }

      // Processar pedidos
      const processedOrders = ordersData.map((order: any) => {
        if (order.itens && typeof order.itens === 'string') {
          try {
            order.itens = JSON.parse(order.itens);
          } catch (e) {
            order.itens = [];
          }
        }
        return order;
      });

      // Encontrar o primeiro pedido em aberto (mais recente)
      const openOrder = processedOrders
        .filter((order: Order) => activeStatuses.includes(order.status?.toLowerCase()))
        .sort((a: Order, b: Order) => {
          const dateA = new Date(a.createdDate).getTime();
          const dateB = new Date(b.createdDate).getTime();
          return dateB - dateA;
        })[0];

      setActiveOrder(openOrder || null);
    } catch (err: any) {
      console.error('Erro ao buscar pedido ativo:', err);
      setActiveOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveOrder();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchActiveOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveOrder]);

  const formatStatus = (status: string) => {
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
    return statusMap[status?.toLowerCase()] || status;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
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
    return colorMap[statusLower] || colors.textSecondary;
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase();
    const iconMap: Record<string, string> = {
      pendente: 'schedule',
      confirmado: 'check-circle',
      preparando: 'restaurant',
      pronto: 'check-circle',
      saiu_entrega: 'local-shipping',
      entregue: 'done',
      cancelado: 'cancel',
      rejeitado: 'cancel',
      pendente_pagamento: 'payment',
    };
    return iconMap[statusLower] || 'info';
  };

  const getTimelineSteps = (status: string) => {
    const statusLower = status?.toLowerCase();
    const steps = [
      { key: 'pendente', label: 'Pedido Recebido', icon: 'receipt' },
      { key: 'confirmado', label: 'Pedido Confirmado', icon: 'check-circle' },
      { key: 'preparando', label: 'Em Preparação', icon: 'restaurant' },
      { key: 'pronto', label: 'Pronto para Entrega', icon: 'done' },
      { key: 'saiu_entrega', label: 'Saiu para Entrega', icon: 'local-shipping' },
      { key: 'entregue', label: 'Entregue', icon: 'done-all' },
    ];

    const statusOrder = ['pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue'];
    const currentIndex = statusOrder.indexOf(statusLower);

    return steps.map((step, index) => {
      const stepIndex = statusOrder.indexOf(step.key);
      const isCompleted = stepIndex <= currentIndex && currentIndex !== -1;
      const isCurrent = stepIndex === currentIndex;

      return {
        ...step,
        isCompleted,
        isCurrent,
      };
    }).filter(step => {
      // Mostrar apenas até o passo atual + 1 próximo, ou todos se entregue
      if (statusLower === 'entregue') return true;
      const stepIndex = statusOrder.indexOf(step.key);
      return stepIndex <= currentIndex + 1;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  const getOrderCode = (orderId: string) => {
    if (!orderId) return '';
    const idString = String(orderId);
    const cleanId = idString.replace(/[^a-zA-Z0-9]/g, '');
    return cleanId.slice(-6).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Verificando pedidos...
          </Text>
        </View>
      </View>
    );
  }

  if (!activeOrder) {
    return null;
  }

  const timelineSteps = getTimelineSteps(activeOrder.status);
  const statusColor = getStatusColor(activeOrder.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header - Clique para expandir/recolher */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <MaterialIcons 
            name={getStatusIcon(activeOrder.status) as any} 
            size={24} 
            color={statusColor} 
          />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {`#${getOrderCode(activeOrder.id)}`}
            </Text>
            <Text style={[styles.orderCode, { color: colors.textSecondary }]}>Em Andamento</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {String(formatStatus(activeOrder.status || ''))}
            </Text>
          </View>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Conteúdo expandível */}
      {isExpanded && (
        <>
          {/* Timeline */}
          <View style={styles.timelineContainer}>
        {timelineSteps.map((step, index) => (
          <View key={step.key} style={styles.timelineStep}>
            <View style={styles.timelineLineContainer}>
              <View
                style={[
                  styles.timelineIcon,
                  {
                    backgroundColor: step.isCompleted
                      ? statusColor
                      : colors.border,
                    borderColor: step.isCurrent ? statusColor : colors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name={step.icon as any}
                  size={16}
                  color={step.isCompleted ? 'white' : colors.textSecondary}
                />
              </View>
              {index < timelineSteps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: step.isCompleted
                        ? statusColor
                        : colors.border,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  {
                    color: step.isCompleted || step.isCurrent
                      ? colors.text
                      : colors.textSecondary,
                    fontWeight: step.isCurrent ? 'bold' : 'normal',
                  },
                ]}
              >
                {String(step.label || '')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Order Info */}
      <View style={[styles.orderInfo, { borderTopColor: colors.border }]}>
        {activeOrder.restaurant?.nome && (
          <View style={styles.infoRow}>
            <MaterialIcons name="restaurant" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {String(activeOrder.restaurant.nome)}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <MaterialIcons name="shopping-bag" size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {`${Array.isArray(activeOrder.itens) ? activeOrder.itens.length : 0} item${Array.isArray(activeOrder.itens) && activeOrder.itens.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="euro" size={18} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text, fontWeight: 'bold' }]}>
            {`€${Number(activeOrder.total).toFixed(2)}`}
          </Text>
        </View>
      </View>

          {/* Actions */}
          <TouchableOpacity
            style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (onViewDetails && activeOrder) {
                onViewDetails(activeOrder.id);
              } else {
                router.push('/profile');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewDetailsText}>Ver Detalhes</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderCode: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  timelineContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: SPACING.sm,
    width: 32,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginTop: SPACING.xs,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  orderInfo: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  viewDetailsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: 'white',
  },
});
