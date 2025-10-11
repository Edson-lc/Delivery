import { useState, useEffect, useCallback } from 'react';

export function useOrderTimer(order, restaurant) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isOverdue, setIsOverdue] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    // Verificar ambos os nomes possíveis devido à transformação de dados
    const confirmationDate = order?.dataConfirmacao || order?.data_confirmacao;
    
    if (!order || !confirmationDate) {
      console.log("🔍 useOrderTimer: Order não confirmado ou data de confirmação não encontrada", { 
        order: order?.id, 
        confirmationDate: order?.dataConfirmacao || order?.data_confirmacao,
        status: order?.status,
        camposDisponiveis: order ? Object.keys(order) : []
      });
      // Não mostrar timer se pedido não foi confirmado
      setTimeRemaining(null);
      setIsOverdue(false);
      return null;
    }

    // Só calcular timer para pedidos confirmados
    const startDate = confirmationDate;
    
    // Prioridade: tempo do pedido -> tempo do restaurante -> 30 minutos padrão
    const preparationTime = order.tempoPreparo || order.tempo_preparo || restaurant?.tempo_preparo || 30;
    const orderDate = new Date(startDate);
    const now = new Date();
    
    console.log("🔍 useOrderTimer: Calculando tempo", {
      orderId: order.id,
      preparationTime,
      startDate: orderDate.toISOString(),
      dateSource: 'confirmação',
      now: now.toISOString()
    });
    
    // Calcular quando o pedido deve estar pronto
    const expectedReadyTime = new Date(orderDate.getTime() + (preparationTime * 60 * 1000));
    
    // Calcular diferença em minutos
    let diffInMinutes = Math.floor((expectedReadyTime - now) / (1000 * 60));
    
    // Obter tempo adicional do banco de dados
    const additionalTime = order?.tempoAdicional || order?.tempo_adicional || 0;
    
    // Se há tempo adicional (alteração de tempo de preparo), recalcular o tempo esperado
    if (additionalTime > 0) {
      // Recalcular o tempo esperado com o tempo adicional
      const newExpectedReadyTime = new Date(orderDate.getTime() + ((preparationTime + additionalTime) * 60 * 1000));
      diffInMinutes = Math.floor((newExpectedReadyTime - now) / (1000 * 60));
      
      console.log("🔍 useOrderTimer: Tempo adicional aplicado", {
        orderId: order.id,
        additionalTime,
        originalPreparationTime: preparationTime,
        newPreparationTime: preparationTime + additionalTime,
        originalExpectedTime: expectedReadyTime.toISOString(),
        newExpectedTime: newExpectedReadyTime.toISOString(),
        originalDiff: Math.floor((expectedReadyTime - now) / (1000 * 60)),
        newDiff: diffInMinutes
      });
    }
    
    console.log("🔍 useOrderTimer: Resultado", {
      orderId: order.id,
      expectedReadyTime: expectedReadyTime.toISOString(),
      diffInMinutes,
      isOverdue: diffInMinutes < 0
    });
    
    if (diffInMinutes > 0) {
      // Ainda há tempo restante
      setTimeRemaining(diffInMinutes);
      setIsOverdue(false);
    } else {
      // Tempo esgotado - mostrar atraso
      setTimeRemaining(Math.abs(diffInMinutes));
      setIsOverdue(true);
    }
  }, [order, restaurant]);

  useEffect(() => {
    calculateTimeRemaining();
    
    // Atualizar a cada minuto
    const interval = setInterval(calculateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  return { timeRemaining, isOverdue };
}
