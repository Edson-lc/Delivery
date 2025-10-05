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
          restaurantId: true,
          restaurant: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              endereco: true,
              cidade: true,
              codigoPostal: true,
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
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            endereco: true,
            cidade: true,
            codigoPostal: true,
          }
        },
        customer: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          }
        },
        entregador: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
          }
        },
        delivery: {
          select: {
            id: true,
            status: true,
            dataEntrega: true,
            observacoes: true,
          }
        }
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
      historicoStatus,
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

    if (isOnlyStatusUpdate) {
      console.log("🔄 Atualizando apenas status do pedido:", id, "para:", data.status);
      
      const order = await prisma.order.update({
        where: { id },
        data: {
          status: data.status,
        },
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

    const historyEntries = Array.isArray(existing.historicoStatus)
      ? [...(existing.historicoStatus as Prisma.JsonArray)]
      : [];

    historyEntries.push({ status, note, timestamp: new Date().toISOString() });

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        historicoStatus: historyEntries as Prisma.InputJsonValue,
      },
    });

    res.json(serialize(order));
  } catch (error) {
    next(error);
  }
});

export default router;
