import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { entregadorId, orderId, status } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};

    if (entregadorId !== undefined) {
      if (entregadorId === null || entregadorId === 'null') {
        where.entregadorId = null; // ✅ CORREÇÃO: Buscar pedidos SEM entregador
      } else {
        where.entregadorId = String(entregadorId); // ✅ CORREÇÃO: Buscar pedidos COM entregador específico
      }
    }

    if (orderId) {
      where.id = String(orderId);
    }

    if (status) {
      where.status = String(status);
    }

    const [total, deliveries] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        select: {
          id: true,
          createdDate: true,
          updatedDate: true,
          numeroPedido: true,
          status: true,
          clienteNome: true,
          clienteEmail: true,
          clienteTelefone: true,
          enderecoEntrega: true, // Incluir explicitamente
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
          stripePaymentIntentId: true,
          observacoes: true,
          dataEntrega: true,
          dataConfirmacao: true,
          tempoPreparo: true,
          tempoPreparoAlterado: true,
          tempoAdicional: true,
          tempoAtraso: true,
          restaurantId: true,
          entregadorId: true,
          entregador: true,
          restaurant: true
        },
        orderBy: { createdDate: 'desc' },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    // Debug: verificar se enderecoEntrega está sendo retornado
    console.log('🔍 Debug API - Primeiro pedido:', deliveries[0] ? {
      id: deliveries[0].id,
      clienteNome: deliveries[0].clienteNome,
      enderecoEntrega: deliveries[0].enderecoEntrega,
      tipoEndereco: typeof deliveries[0].enderecoEntrega
    } : 'Nenhum pedido encontrado');

    res.json(serialize(deliveries));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.order.findUnique({ 
      where: { id },
      select: {
        id: true,
        createdDate: true,
        updatedDate: true,
        numeroPedido: true,
        status: true,
        clienteNome: true,
        clienteEmail: true,
        clienteTelefone: true,
        enderecoEntrega: true, // Incluir explicitamente
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
        stripePaymentIntentId: true,
        observacoes: true,
        dataEntrega: true,
        dataConfirmacao: true,
        tempoPreparo: true,
        tempoPreparoAlterado: true,
        tempoAdicional: true,
        tempoAtraso: true,
        restaurantId: true,
        entregadorId: true,
        entregador: true,
        restaurant: true
      }
    });

    if (!delivery) {
      return res.status(404).json(buildErrorPayload('DELIVERY_NOT_FOUND', 'Entrega não encontrada.'));
    }

    res.json(serialize(delivery));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body ?? {};

    if (!data.orderId || !data.enderecoColeta || !data.enderecoEntrega || data.valorFrete === undefined) {
      return res
        .status(400)
        .json(
          buildErrorPayload(
            'VALIDATION_ERROR',
            'orderId, enderecoColeta, enderecoEntrega e valorFrete são obrigatórios.',
          ),
        );
    }

    // Atualizar o pedido com o entregador
    const delivery = await prisma.order.update({
      where: { id: data.orderId },
      data: {
        entregadorId: data.entregadorId,
        status: data.status || 'aceito'
      },
      include: {
        entregador: true,
        restaurant: true
      }
    });
    
    res.status(201).json(serialize(delivery));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body ?? {};

    // ✅ CORREÇÃO: Verificar se o pedido existe antes de atualizar
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, numeroPedido: true, status: true }
    });

    if (!existingOrder) {
      return res.status(404).json(
        buildErrorPayload('ORDER_NOT_FOUND', `Pedido com ID ${id} não encontrado.`)
      );
    }

    console.log(`🔄 Atualizando pedido ${existingOrder.numeroPedido} (${existingOrder.status}) para ${data.status}`);

    const delivery = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        entregadorId: data.entregadorId,
        dataEntrega: data.dataEntrega ? new Date(data.dataEntrega) : undefined,
        taxaEntrega: data.taxaEntrega ? parseFloat(data.taxaEntrega) : undefined
      },
      include: {
        entregador: true,
        restaurant: true
      }
    });

    console.log(`✅ Pedido ${delivery.numeroPedido} atualizado com sucesso para ${delivery.status}`);
    res.json(serialize(delivery));
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido:', error);
    next(error);
  }
});

export default router;
