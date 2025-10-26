import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { sessionId, restaurantId, id } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};

    if (sessionId) {
      where.sessionId = String(sessionId);
    }

    if (restaurantId) {
      where.restaurantId = String(restaurantId);
    }

    if (id) {
      where.id = String(id);
    }

    const [total, carts] = await Promise.all([
      prisma.cart.count({ where }),
      prisma.cart.findMany({
        where,
        orderBy: { updatedDate: 'desc' },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(carts));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = await prisma.cart.findUnique({ where: { id } });

    if (!cart) {
      return res.status(404).json(buildErrorPayload('CART_NOT_FOUND', 'Carrinho não encontrado.'));
    }

    res.json(serialize(cart));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body ?? {};

    if (!data.sessionId || !data.restaurantId) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'sessionId e restaurantId são obrigatórios.'));
    }

    const cart = await prisma.cart.create({
      data,
    });

    res.status(201).json(serialize(cart));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body ?? {};

    // Verificar se o carrinho existe
    const existingCart = await prisma.cart.findUnique({ where: { id } });
    if (!existingCart) {
      return res.status(404).json(buildErrorPayload('CART_NOT_FOUND', 'Carrinho não encontrado.'));
    }

    // Validar dados obrigatórios
    if (data.sessionId && data.sessionId !== existingCart.sessionId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'sessionId não pode ser alterado.'));
    }

    // Calcular subtotal se itens foram fornecidos
    let updateData: any = {};
    
    // Mapear campos do frontend para o schema do banco
    if (data.itens !== undefined) updateData.itens = data.itens;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.sessionId !== undefined) updateData.sessionId = data.sessionId;
    if (data.restaurantId !== undefined) updateData.restaurantId = data.restaurantId;
    
    // Calcular subtotal se itens foram fornecidos
    if (data.itens && Array.isArray(data.itens)) {
      const subtotal = data.itens.reduce((total: number, item: any) => {
        const itemTotal = (item.preco_unitario || 0) * (item.quantidade || 0);
        const adicionaisTotal = (item.adicionais_selecionados || []).reduce((sum: number, add: any) => sum + (add.preco || 0), 0) * (item.quantidade || 0);
        const personalizacoesTotal = (item.preco_personalizacoes || 0) * (item.quantidade || 0);
        return total + itemTotal + adicionaisTotal + personalizacoesTotal;
      }, 0);
      updateData.subtotal = Math.round(subtotal * 100) / 100;
    }

    // Adicionar timestamp de atualização
    updateData.updatedDate = new Date();

    const cart = await prisma.cart.update({
      where: { id },
      data: updateData,
    });

    res.json(serialize(cart));
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.cart.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
