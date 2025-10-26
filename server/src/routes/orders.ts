import { Prisma } from '@prisma/client';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';
import authenticate from '../middleware/authenticate';

const router = Router();

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (value && typeof value === 'object' && typeof (value as any).toString === 'function') {
    const coerced = Number((value as any).toString());
    return Number.isFinite(coerced) ? coerced : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCurrency(value: unknown): number {
  const parsed = toSafeNumber(value);
  const sanitized = parsed < 0 ? 0 : parsed;
  return Math.round(sanitized * 100) / 100;
}

function calculateOrderDelay(order: any): number | null {
  if (!order) return null;
  
  // Só calcular atraso para pedidos confirmados
  const confirmationDate = order.dataConfirmacao;
  const preparationTime = order.tempoPreparo || 30;
  
  if (!confirmationDate) {
    console.log("⚠️ calculateOrderDelay: Pedido não confirmado", { 
      order: order?.id,
      dataConfirmacao: confirmationDate,
      status: order?.status
    });
    return null;
  }
  
  const orderDate = new Date(confirmationDate);
  const now = new Date();
  
  // Calcular quando o pedido deveria estar pronto
  const expectedReadyTime = new Date(orderDate.getTime() + (preparationTime * 60 * 1000));
  
  // Calcular diferença em minutos
  const diffInMinutes = Math.floor((now.getTime() - expectedReadyTime.getTime()) / (1000 * 60));
  
  console.log("🔍 calculateOrderDelay:", {
    orderId: order.id,
    preparationTime,
    startDate: orderDate.toISOString(),
    dateSource: 'confirmação',
    expectedReadyTime: expectedReadyTime.toISOString(),
    now: now.toISOString(),
    diffInMinutes
  });
  
  // Retornar apenas se houver atraso (valor positivo)
  return diffInMinutes > 0 ? diffInMinutes : null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

async function findNearestAvailableDelivery(restaurantId: string): Promise<string | null> {
  try {
    // Buscar dados do restaurante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { latitude: true, longitude: true }
    });

    if (!restaurant || !restaurant.latitude || !restaurant.longitude) {
      console.log("⚠️ Restaurante sem coordenadas:", restaurantId);
      return null;
    }

    // Buscar entregadores ativos, disponíveis e com coordenadas
    const availableDeliveries = await prisma.entregador.findMany({
      where: {
        status: 'ativo',
        disponivel: true,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        nomeCompleto: true,
        latitude: true,
        longitude: true,
        avaliacao: true,
        totalEntregas: true
      }
    });

    if (availableDeliveries.length === 0) {
      console.log("⚠️ Nenhum entregador disponível encontrado");
      return null;
    }

    // Calcular distâncias e encontrar o mais próximo
    let nearestDelivery = null;
    let minDistance = Infinity;

    for (const delivery of availableDeliveries) {
      if (delivery.latitude && delivery.longitude) {
        const distance = calculateDistance(
          restaurant.latitude,
          restaurant.longitude,
          delivery.latitude,
          delivery.longitude
        );

        console.log(`🔍 Entregador ${delivery.id} (${delivery.nomeCompleto}): ${distance.toFixed(2)}km`);

        if (distance < minDistance) {
          minDistance = distance;
          nearestDelivery = delivery;
        }
      }
    }

    if (nearestDelivery) {
      console.log(`✅ Entregador mais próximo encontrado: ${nearestDelivery.id} (${nearestDelivery.nomeCompleto}) - ${minDistance.toFixed(2)}km`);
      return nearestDelivery.id;
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar entregador mais próximo:", error);
    return null;
  }
}

function calculateOrderSubtotal(items: unknown): number {
  console.log("=== DEBUG calculateOrderSubtotal ===");
  console.log("Items recebidos:", items);
  console.log("É array?", Array.isArray(items));
  
  if (!Array.isArray(items)) {
    console.log("❌ Não é array, retornando 0");
    return 0;
  }

  console.log("Quantidade de itens:", items.length);
  
  const total = items.reduce((acc, current, index) => {
    console.log(`--- Processando item ${index} ---`);
    console.log("Item atual:", current);
    
    const item = current as Record<string, unknown>;
    const quantity = Math.max(0, toSafeNumber(item.quantidade ?? item.quantity ?? 0));
    console.log("Quantidade:", quantity);
    
    if (quantity === 0) {
      console.log("❌ Quantidade 0, pulando item");
      return acc;
    }

    const unitPrice = toSafeNumber(
      item.precoUnitario ??
        item.preco_unitario ??
        item.preco ??
        item.price ??
        item.valor ?? 0
    );
    console.log("Preço unitário:", unitPrice);
    console.log("Campos de preço disponíveis:", {
      precoUnitario: item.precoUnitario,
      preco_unitario: item.preco_unitario,
      preco: item.preco,
      price: item.price,
      valor: item.valor
    });

    const adicionaisSource =
      item.adicionais_selecionados ??
      item.adicionais ??
      item.extras ??
      item.opcoes ??
      [];
    console.log("Adicionais source:", adicionaisSource);

    const adicionais = Array.isArray(adicionaisSource) ? adicionaisSource : [];
    console.log("Adicionais array:", adicionais);

    const adicionaisTotal = adicionais.reduce((sum, rawAdicional) => {
      const adicional = rawAdicional as Record<string, unknown>;
      const adicionalPrice = toSafeNumber(
        adicional?.preco ??
          adicional?.preco_unitario ??
          adicional?.price ??
          adicional?.valor ?? 0
      );
      console.log("Preço adicional:", adicionalPrice);
      return sum + adicionalPrice;
    }, 0);
    console.log("Total adicionais:", adicionaisTotal);

    // Adicionar preço das personalizações
    const personalizacoesPrice = toSafeNumber(item.preco_personalizacoes ?? 0);
    console.log("Preço personalizações:", personalizacoesPrice);

    const itemTotal = unitPrice * quantity + adicionaisTotal * quantity + personalizacoesPrice * quantity;
    console.log("Total do item:", itemTotal);
    console.log("Acumulador antes:", acc);
    console.log("Acumulador depois:", acc + itemTotal);

    return acc + itemTotal;
  }, 0);

  console.log("Total final:", total);
  console.log("Total arredondado:", Math.round(total * 100) / 100);
  
  return Math.round(total * 100) / 100;
}

function recalculateOrderTotals(options: {
  itens: unknown;
  taxaEntrega?: unknown;
  taxaServico?: unknown;
  desconto?: unknown;
}): {
  itens: Prisma.InputJsonValue;
  subtotal: number;
  taxaEntrega: number;
  taxaServico: number;
  desconto: number;
  total: number;
} {
  const itensArray = Array.isArray(options.itens) ? options.itens : [];
  const subtotal = calculateOrderSubtotal(itensArray);
  const taxaEntrega = normalizeCurrency(options.taxaEntrega);
  const taxaServico = normalizeCurrency(options.taxaServico);
  const desconto = normalizeCurrency(options.desconto);
  const total = Math.max(0, Math.round((subtotal + taxaEntrega + taxaServico - desconto) * 100) / 100);

  return {
    itens: itensArray as Prisma.InputJsonValue,
    subtotal,
    taxaEntrega,
    taxaServico,
    desconto,
    total,
  };
}

type AuthContext = {
  id?: string;
  email?: string | null;
  role?: string | null;
  tipoUsuario?: string | null;
  tipo_usuario?: string | null;
  restaurantId?: string | null;
  restaurant_id?: string | null;
};

function getAuthContext(req: Request, res: Response): AuthContext | undefined {
  return (res.locals?.authUser as AuthContext | undefined) ?? (req.authUser as AuthContext | undefined);
}

function isAdminContext(context?: AuthContext): boolean {
  if (!context) {
    return false;
  }
  const role = context.role ?? null;
  const tipo = context.tipoUsuario ?? context.tipo_usuario ?? null;
  return role === 'admin' || tipo === 'admin';
}

function applyOrderVisibility(where: Prisma.OrderWhereInput, context: AuthContext | undefined): Prisma.OrderWhereInput | null {
  if (!context) {
    return null;
  }

  if (isAdminContext(context)) {
    return where;
  }

  const tipo = context.tipoUsuario ?? context.tipo_usuario ?? context.role ?? null;

  if (tipo === 'restaurante') {
    const restaurantId = context.restaurantId ?? context.restaurant_id ?? null;
    if (!restaurantId) {
      return null;
    }
    return {
      ...where,
      restaurantId,
    };
  }

  if (tipo === 'entregador') {
    if (!context.id) {
      return null;
    }
    return {
      ...where,
      entregadorId: context.id,
    };
  }

  if (tipo === 'cliente' || context.role === 'user') {
    const email = context.email ?? null;
    if (!email) {
      return null;
    }
    return {
      ...where,
      clienteEmail: email,
    };
  }

  return null;
}

function canViewOrder(order: any, context: AuthContext | undefined): boolean {
  if (!order || !context) {
    return false;
  }

  if (isAdminContext(context)) {
    return true;
  }

  const tipo = context.tipoUsuario ?? context.tipo_usuario ?? context.role ?? null;

  if (tipo === 'restaurante') {
    const restaurantId = context.restaurantId ?? context.restaurant_id ?? null;
    return restaurantId ? order.restaurantId === restaurantId : false;
  }

  if (tipo === 'entregador') {
    return context.id ? order.entregadorId === context.id : false;
  }

  if (tipo === 'cliente' || context.role === 'user') {
    const email = (context.email ?? '').toLowerCase();
    return email ? (order.clienteEmail ?? '').toLowerCase() === email : false;
  }

  return false;
}

router.get('/', async (req, res, next) => {
  try {
    const { status, restaurantId, customerId, entregadorId, dateFrom, dateTo } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const filters: Record<string, unknown> = {};

    if (status) {
      filters.status = String(status);
    }

    if (restaurantId) {
      filters.restaurantId = String(restaurantId);
    }

    if (customerId) {
      filters.customerId = String(customerId);
    }

    if (entregadorId) {
      filters.entregadorId = String(entregadorId);
    }

    const dateFilter: Record<string, Date> = {};

    if (dateFrom) {
      dateFilter.gte = new Date(String(dateFrom));
    }

    if (dateTo) {
      dateFilter.lte = new Date(String(dateTo));
    }

    let where: Prisma.OrderWhereInput = {
      ...filters,
      ...(Object.keys(dateFilter).length > 0
        ? { createdDate: dateFilter }
        : {}),
    };

    const authContext = getAuthContext(req, res);
    const scopedWhere = applyOrderVisibility(where, authContext);

    if (!scopedWhere) {
      return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
    }

    where = scopedWhere;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdDate: 'desc' },
        select: {
          id: true,
          createdDate: true,
          updatedDate: true,
          createdBy: true,
          numeroPedido: true,
          status: true,
          clienteNome: true,
          clienteEmail: true,
          clienteTelefone: true,
          enderecoEntrega: true,
          itens: true,
          subtotal: true,
          taxaEntrega: true,
          taxaServico: true,
          desconto: true,
          total: true,
          metodoPagamento: true,
          valorPago: true,
          troco: true,
          bandeiraCartao: true,
          finalCartao: true,
          nomeTitular: true,
          observacoes: true,
          dataEntrega: true,
          dataConfirmacao: true,
          tempoPreparo: true,
          tempoPreparoAlterado: true,
          tempoAdicional: true,
          tempoAtraso: true,
          restaurantId: true,
          restaurant: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              endereco: true,
              cidade: true,
              codigoPostal: true,
              latitude: true,
              longitude: true,
              imagemUrl: true,
            }
          },
          entregador: {
            select: {
              id: true,
              nomeCompleto: true,
              fotoUrl: true,
              telefone: true,
              avaliacao: true,
              totalEntregas: true,
              latitude: true,
              longitude: true
            }
          }
        },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    console.log("=== DEBUG API ORDERS ===");
    console.log("Quantidade de pedidos:", orders.length);
    if (orders.length > 0) {
      console.log("Primeiro pedido:", orders[0]);
      console.log("Campos do primeiro pedido:", Object.keys(orders[0]));
      console.log("Itens do primeiro pedido:", orders[0].itens);
      console.log("Total do primeiro pedido:", orders[0].total);
    }

    res.json(serialize(orders));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        createdDate: true,
        updatedDate: true,
        createdBy: true,
        numeroPedido: true,
        status: true,
        clienteNome: true,
        clienteEmail: true,
        clienteTelefone: true,
        enderecoEntrega: true,
        itens: true,
        subtotal: true,
        taxaEntrega: true,
        taxaServico: true,
        desconto: true,
        total: true,
        metodoPagamento: true,
        valorPago: true,
        troco: true,
        bandeiraCartao: true,
        finalCartao: true,
        nomeTitular: true,
        observacoes: true,
        dataEntrega: true,
        dataConfirmacao: true,
        tempoPreparo: true,
        tempoPreparoAlterado: true,
        tempoAdicional: true,
        tempoAtraso: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            endereco: true,
            cidade: true,
            codigoPostal: true,
            latitude: true,
            longitude: true,
            imagemUrl: true,
          }
        },
        entregador: {
          select: {
            id: true,
            nomeCompleto: true,
            fotoUrl: true,
            telefone: true,
            email: true,
            avaliacao: true,
            totalEntregas: true,
            latitude: true,
            longitude: true
          }
        },
      }
    });

    if (!order) {
      return res.status(404).json(buildErrorPayload('ORDER_NOT_FOUND', 'Pedido não encontrado.'));
    }

    const authContext = getAuthContext(req, res);
    if (!canViewOrder(order, authContext)) {
      return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
    }

    res.json(serialize(order));
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      customerId,
      restaurantId,
      entregadorId,
      numeroPedido,
      clienteNome,
      clienteTelefone,
      clienteEmail,
      enderecoEntrega,
      itens,
      taxaEntrega,
      taxaServico,
      desconto,
      cupomUsado,
      formaPagamento,
      pagamentoStatus = 'pendente',
      pagamentoId,
      tempoEstimadoPreparo,
      tempoEstimadoEntrega,
      observacoesCliente,
      observacoesRestaurante,
      dataConfirmacao,
      dataEntrega,
      avaliacao,
      status = 'pendente_pagamento',
    } = req.body ?? {};

    if (!restaurantId || !clienteNome || !clienteTelefone || !enderecoEntrega) {
      return res
        .status(400)
        .json(
          buildErrorPayload(
            'VALIDATION_ERROR',
            'Campos obrigatórios: restaurantId, clienteNome, clienteTelefone e enderecoEntrega.'
          ),
        );
    }

    const itensArray = Array.isArray(itens) ? itens : [];

    console.log("=== DEBUG BACKEND PEDIDO ===");
    console.log("Itens recebidos:", itens);
    console.log("Itens array:", itensArray);
    console.log("Quantidade de itens:", itensArray.length);

    if (itensArray.length === 0) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'Pedido deve conter pelo menos um item.'));
    }

    const pricing = recalculateOrderTotals({
      itens: itensArray,
      taxaEntrega,
      taxaServico,
      desconto,
    });

    console.log("=== DEBUG APÓS recalculateOrderTotals ===");
    console.log("pricing.itens:", pricing.itens);
    console.log("pricing.itens.length:", Array.isArray(pricing.itens) ? pricing.itens.length : 'não é array');
    console.log("pricing.subtotal:", pricing.subtotal);
    console.log("pricing.total:", pricing.total);

    const generatedNumber = numeroPedido ?? `AMA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        restaurantId,
        numeroPedido: generatedNumber,
        clienteNome,
        clienteTelefone,
        clienteEmail,
        enderecoEntrega,
        itens: pricing.itens,
        subtotal: pricing.subtotal,
        taxaEntrega: pricing.taxaEntrega,
        taxaServico: pricing.taxaServico,
        desconto: pricing.desconto,
        total: pricing.total,
        status,
        metodoPagamento: formaPagamento,
        valorPago: req.body.valorPago ? parseFloat(req.body.valorPago) : null,
        troco: req.body.troco ? parseFloat(req.body.troco) : null,
        bandeiraCartao: req.body.cartaoInfo?.bandeira || null,
        finalCartao: req.body.cartaoInfo?.final_cartao || null,
        nomeTitular: req.body.cartaoInfo?.nome_titular || null,
        observacoes: observacoesCliente,
      },
    });

    // Debug: Log dos dados salvos
    console.log("=== DEBUG PEDIDO CRIADO ===");
    console.log("Forma de pagamento:", formaPagamento);
    console.log("Valor pago:", req.body.valorPago);
    console.log("Troco:", req.body.troco);
    console.log("Valor pago salvo:", order.valorPago);
    console.log("Troco salvo:", order.troco);
    console.log("Itens salvos:", order.itens);
    console.log("Subtotal salvo:", order.subtotal);
    console.log("Total salvo:", order.total);
    console.log("Quantidade de itens salvos:", Array.isArray(order.itens) ? order.itens.length : 'não é array');
    console.log("=== DEBUG COORDENADAS ===");
    console.log("Endereço de entrega:", enderecoEntrega);

    res.status(201).json(serialize(order));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = getAuthContext(req, res);

    if (!context || (!isAdminContext(context) && (context.tipoUsuario ?? context.tipo_usuario) !== 'restaurante')) {
      return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
    }

    const data = (req.body ?? {}) as Record<string, unknown>;

    // Se apenas o status está sendo atualizado, não recalcular itens
    const isOnlyStatusUpdate = Object.keys(data).length === 1 && data.status !== undefined;

    // Se apenas o tempo de preparo está sendo atualizado, não recalcular itens
    const isOnlyPreparationTimeUpdate = Object.keys(data).length === 1 && data.tempoPreparo !== undefined;

    // Se apenas campos específicos estão sendo atualizados, não recalcular itens
    const hasTempoAdicional = data.tempoAdicional !== undefined || data.tempo_adicional !== undefined;
    const isSimpleUpdate = isOnlyStatusUpdate || isOnlyPreparationTimeUpdate || 
      (Object.keys(data).length === 2 && data.tempoPreparo !== undefined && data.tempoPreparoAlterado !== undefined) ||
      (Object.keys(data).length === 3 && data.tempoPreparo !== undefined && data.tempoPreparoAlterado !== undefined && hasTempoAdicional);

    if (isSimpleUpdate) {
      console.log("🔄 Atualização simples do pedido:", id, "dados:", data);
      
      // Definir dados de atualização
      let updateData = { ...data };
      
      // Validação adicional: verificar se tempo de preparo já foi alterado
      if (data.tempoPreparo !== undefined) {
        const existingOrder = await prisma.order.findUnique({
          where: { id },
          select: { 
            tempoPreparoAlterado: true,
            tempoPreparo: true,
            restaurantId: true
          }
        });
        
        if (existingOrder?.tempoPreparoAlterado) {
          return res.status(400).json({
            error: {
              code: 'PREPARATION_TIME_ALREADY_CHANGED',
              message: 'O tempo de preparo deste pedido já foi alterado anteriormente. Apenas uma alteração é permitida por pedido.'
            }
          });
        }
        
        // Tempo adicional já calculado no frontend
        const tempoAdicional = data.tempoAdicional ?? data.tempo_adicional;
        if (tempoAdicional !== undefined) {
          updateData.tempoAdicional = tempoAdicional;
          console.log(`🕐 Tempo adicional recebido do frontend para pedido ${id}:`, tempoAdicional);
        }
      }
      
      // Definir data de confirmação quando pedido for aceito
      if (data.status === 'confirmado') {
        updateData.dataConfirmacao = new Date();
        console.log(`✅ Data de confirmação definida para pedido ${id}: ${new Date().toISOString()}`);
      }
      
      // Calcular tempo de atraso e atribuir entregador se o status for alterado para "pronto"
      if (data.status === 'pronto') {
        const existingOrder = await prisma.order.findUnique({
          where: { id },
          select: { createdDate: true, dataConfirmacao: true, tempoPreparo: true, restaurantId: true }
        });
        
        if (existingOrder) {
          // Calcular tempo de atraso
          const delay = calculateOrderDelay(existingOrder);
          if (delay !== null) {
            updateData.tempoAtraso = delay;
            console.log(`⏰ Tempo de atraso calculado para pedido ${id}: ${delay} minutos`);
          }

          // Atribuir entregador mais próximo
          const nearestDeliveryId = await findNearestAvailableDelivery(existingOrder.restaurantId);
          if (nearestDeliveryId) {
            updateData.entregadorId = nearestDeliveryId;
            console.log(`🚚 Entregador atribuído automaticamente ao pedido ${id}: ${nearestDeliveryId}`);
          } else {
            console.log(`⚠️ Nenhum entregador disponível encontrado para o pedido ${id}`);
          }
        }
      }
      
      const order = await prisma.order.update({
        where: { id },
        data: updateData,
      });

      res.json(serialize(order));
      return;
    }

    // Para outras atualizações, recalcular como antes
    const itensSource = Array.isArray(data.itens)
      ? data.itens
      : [];

    const pricing = recalculateOrderTotals({
      itens: itensSource,
      taxaEntrega: data.taxaEntrega,
      taxaServico: data.taxaServico,
      desconto: data.desconto,
    });

    const updateData = { ...data } as Prisma.OrderUpdateInput;
    delete (updateData as Record<string, unknown>).itens;
    delete (updateData as Record<string, unknown>).subtotal;
    delete (updateData as Record<string, unknown>).taxaEntrega;
    delete (updateData as Record<string, unknown>).taxaServico;
    delete (updateData as Record<string, unknown>).desconto;
    delete (updateData as Record<string, unknown>).total;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        itens: pricing.itens,
        subtotal: pricing.subtotal,
        taxaEntrega: pricing.taxaEntrega,
        taxaServico: pricing.taxaServico,
        desconto: pricing.desconto,
        total: pricing.total,
      },
    });

    res.json(serialize(order));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body ?? {};

    if (!status) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'status é obrigatório.'));
    }

    const context = getAuthContext(req, res);
    const tipo = context?.tipoUsuario ?? context?.tipo_usuario ?? context?.role ?? null;

    if (!context || !(isAdminContext(context) || tipo === 'restaurante' || tipo === 'entregador')) {
      return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
    }

    const existing = await prisma.order.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json(buildErrorPayload('ORDER_NOT_FOUND', 'Pedido não encontrado.'));
    }

    const historyEntries: any[] = [];

    historyEntries.push({ status, note, timestamp: new Date().toISOString() });

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
      },
    });

    res.json(serialize(order));
  } catch (error) {
    next(error);
  }
});

export default router;
