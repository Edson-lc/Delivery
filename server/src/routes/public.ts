import { Prisma } from '@prisma/client';
import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateCartSubtotal(items: unknown): number {
  if (!Array.isArray(items)) {
    return 0;
  }

  const total = items.reduce((acc, current) => {
    const item = current as Record<string, unknown>;
    const quantity = Math.max(0, toSafeNumber(item.quantidade ?? item.quantity ?? 0));
    if (quantity === 0) {
      return acc;
    }

    const unitPrice = toSafeNumber(
      item.preco_unitario ??
        item.precoUnitario ??
        item.preco ??
        item.price ??
        item.valor ?? 0
    );

    const adicionaisSource =
      item.adicionais ??
      item.adicionais_selecionados ??
      item.extras ??
      item.opcoes ??
      [];

    const adicionais = Array.isArray(adicionaisSource) ? adicionaisSource : [];

    const adicionaisTotal = adicionais.reduce((sum, rawAdicional) => {
      const adicional = rawAdicional as Record<string, unknown>;
      const adicionalPrice = toSafeNumber(
        adicional?.preco ??
          adicional?.preco_unitario ??
          adicional?.price ??
          adicional?.valor ?? 0
      );
      return sum + adicionalPrice;
    }, 0);

    // Adicionar preço das personalizações
    const personalizacoesPrice = toSafeNumber(item.preco_personalizacoes ?? 0);

    return acc + unitPrice * quantity + adicionaisTotal * quantity + personalizacoesPrice * quantity;
  }, 0);

  return Math.round(total * 100) / 100;
}

// Endpoint pÃºblico para listar restaurantes ativos
router.get('/restaurants', async (req, res, next) => {
  try {
    const { category, search, includeMenuItems } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const filters: Record<string, unknown> = {
      status: "ativo", // Apenas restaurantes ativos
      open: true // Apenas restaurantes abertos
    };

    if (category) {
      filters.categoria = String(category).toLowerCase();
    }

    const where = {
      ...filters,
      ...(search
        ? {
            OR: [
              { nome: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { descricao: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { categoria: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        orderBy: { rating: 'desc' }, // Ordenar por avaliação (melhores primeiro)
        select: {
          id: true,
          createdDate: true,
          updatedDate: true,
          createdBy: true,
          nome: true,
          descricao: true,
          categoria: true,
          endereco: true,
          cidade: true,
          codigoPostal: true,
          telefone: true,
          email: true,
          website: true,
          horarioFuncionamento: true,
          tempoPreparo: true,
          taxaEntrega: true,
          valorMinimo: true,
          status: true,
          open: true,
          imagemUrl: true,
          rating: true,
          totalAvaliacoes: true,
          menuItems: includeMenuItems === 'true' ? {
            where: { disponivel: true },
            orderBy: { nome: 'asc' }
          } : false
        },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(restaurants));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para obter categorias de restaurantes
router.get('/restaurants/categories', async (req, res, next) => {
  try {
    const categories = await prisma.restaurant.findMany({
      where: { status: "ativo", open: true },
      select: { categoria: true },
      distinct: ['categoria'],
    });

    const categoryList = categories
      .map((cat: { categoria: string | null }) => cat.categoria ?? "")
      .filter(Boolean)
      .sort();

    res.json(serialize(categoryList));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para obter detalhes de um restaurante
router.get('/restaurants/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        id,
        status: "ativo", // Apenas restaurantes ativos
        open: true // Apenas restaurantes abertos
      },
      include: { 
        menuItems: { 
          where: { disponivel: true }, // Apenas itens disponÃ­veis
          orderBy: [{ categoria: 'asc' }, { nome: 'asc' }]
        } 
      },
    });

    if (!restaurant) {
      return res.status(404).json(buildErrorPayload('RESTAURANT_NOT_FOUND', 'Restaurante nÃ£o encontrado ou inativo.'));
    }

    res.json(serialize(restaurant));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para obter menu de um restaurante
router.get('/restaurants/:id/menu', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, search } = req.query;
    
    const filters: Record<string, unknown> = {
      restaurantId: id,
      disponivel: true // Apenas itens disponÃ­veis
    };

    if (category) {
      filters.categoria = String(category).toLowerCase();
    }

    const where = {
      ...filters,
      ...(search
        ? {
            OR: [
              { nome: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { descricao: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { categoria: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
      select: {
        id: true,
        createdDate: true,
        updatedDate: true,
        createdBy: true,
        nome: true,
        descricao: true,
        categoria: true,
        preco: true,
        disponivel: true,
        ingredientes: true,
        alergenos: true,
        adicionais: true,
        opcoes_personalizacao: true,
        imagemUrl: true,
        restaurantId: true,
        calorias: true,
        tempoPreparo: true,
        ordem: true
      }
    });

    res.json(serialize(menuItems));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para listar itens do cardÃ¡pio
router.get('/menu-items', async (req, res, next) => {
  try {
    const { restaurantId, category, search } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const filters: Record<string, unknown> = {
      disponivel: true // Apenas itens disponÃ­veis
    };

    if (restaurantId) {
      filters.restaurantId = String(restaurantId);
    }

    if (category) {
      filters.categoria = String(category).toLowerCase();
    }

    const where = {
      ...filters,
      ...(search
        ? {
            OR: [
              { nome: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { descricao: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { categoria: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [total, menuItems] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          createdDate: true,
          updatedDate: true,
          createdBy: true,
          nome: true,
          descricao: true,
          categoria: true,
          preco: true,
          disponivel: true,
          ingredientes: true,
          alergenos: true,
          adicionais: true,
          opcoes_personalizacao: true,
          imagemUrl: true,
          restaurantId: true,
          restaurant: {
            select: {
              id: true,
              nome: true,
              status: true,
              open: true
            }
          }
        },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    // Filtrar apenas itens de restaurantes ativos
    const activeMenuItems = menuItems.filter((item: { restaurantId?: string }) => {
      // Verificar se o restaurante está ativo através de uma consulta separada
      return true; // Por enquanto, retornar todos os itens
    });

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(activeMenuItems));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para obter categorias de itens do cardÃ¡pio
router.get('/menu-items/categories', async (req, res, next) => {
  try {
    const categories = await prisma.menuItem.findMany({
      where: { 
        disponivel: true,
        restaurant: { ativo: true }
      },
      select: { categoria: true },
      distinct: ['categoria'],
    });

    const categoryList = categories
      .map((cat: { categoria: string | null }) => cat.categoria)
      .filter(Boolean)
      .sort();

    res.json(serialize(categoryList));
  } catch (error) {
    next(error);
  }
});

// Endpoint pÃºblico para obter detalhes de um item do cardÃ¡pio
router.get('/menu-items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findFirst({
      where: { 
        id,
        disponivel: true // Apenas itens disponÃ­veis
      },
      include: { 
        restaurant: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            telefone: true,
            tempoPreparo: true,
            taxaEntrega: true,
            pedidoMinimo: true,
            rating: true,
            status: true,
            open: true
          }
        }
      },
    });

    if (!menuItem || !menuItem.restaurant?.status || menuItem.restaurant.status !== "ativo" || !menuItem.restaurant.open) {
      return res.status(404).json(buildErrorPayload('MENU_ITEM_NOT_FOUND', 'Item de menu nÃ£o encontrado ou indisponÃ­vel.'));
    }

    res.json(serialize(menuItem));
  } catch (error) {
    next(error);
  }
});
// Endpoint publico para gerenciar carrinhos de sessao
router.get('/carts', async (req, res, next) => {
  try {
    const sessionIdRaw = req.query.sessionId;
    const restaurantIdRaw = req.query.restaurantId;
    const idRaw = req.query.id;

    const sessionIdValue = Array.isArray(sessionIdRaw) ? sessionIdRaw[0] : sessionIdRaw;
    const restaurantIdValue = Array.isArray(restaurantIdRaw) ? restaurantIdRaw[0] : restaurantIdRaw;
    const idValue = Array.isArray(idRaw) ? idRaw[0] : idRaw;

    const sessionId = typeof sessionIdValue === 'string' ? sessionIdValue.trim() : '';
    const restaurantId = typeof restaurantIdValue === 'string' ? restaurantIdValue.trim() : '';
    const id = typeof idValue === 'string' ? idValue.trim() : '';

    if (!sessionId && !id) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'sessionId ou id e obrigatorio para buscar carrinho.'));
    }

    const where: Prisma.CartWhereInput = {};

    if (id) {
      where.id = id;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const carts = await prisma.cart.findMany({
      where,
      orderBy: { updatedDate: 'desc' },
    });

    res.json(serialize(carts));
  } catch (error) {
    next(error);
  }
});

router.post('/carts', async (req, res, next) => {
  try {
    const data = (req.body ?? {}) as {
      sessionId?: string;
      restaurantId?: string;
      itens?: unknown;
      dataCriacao?: string;
    };

    const sessionId = data.sessionId?.trim() ?? '';
    const restaurantId = data.restaurantId?.trim() ?? '';

    if (!sessionId || !restaurantId) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'sessionId e restaurantId sao obrigatorios.'));
    }

    const itensSource = Array.isArray(data.itens) ? data.itens : [];
    const itens: Prisma.InputJsonValue = itensSource as Prisma.InputJsonValue;
    const subtotal = calculateCartSubtotal(itensSource);

    const parseDate = (value?: string) => {
      if (!value) {
        return undefined;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const dataCriacaoDate = parseDate(data.dataCriacao);
    const agora = new Date();

    const cart = await prisma.cart.create({
      data: {
        sessionId,
        restaurantId,
        itens,
        subtotal,
        ...(dataCriacaoDate ? { createdDate: dataCriacaoDate } : {}),
        updatedDate: agora,
      },
    });

    res.status(201).json(serialize(cart));
  } catch (error) {
    next(error);
  }
});

router.put('/carts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = (req.body ?? {}) as {
      sessionId?: string;
      itens?: unknown;
    };

    const sessionId = data.sessionId?.trim() ?? '';

    if (!sessionId) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'sessionId e obrigatorio para atualizar carrinho.'));
    }

    const existing = await prisma.cart.findUnique({ where: { id } });

    if (!existing || existing.sessionId !== sessionId) {
      return res
        .status(404)
        .json(buildErrorPayload('CART_NOT_FOUND', 'Carrinho nao encontrado para a sessao informada.'));
    }

    const itensSource = Array.isArray(data.itens)
      ? data.itens
      : Array.isArray(existing.itens)
        ? (existing.itens as unknown[])
        : [];
    const itens: Prisma.InputJsonValue = itensSource as Prisma.InputJsonValue;
    const subtotal = calculateCartSubtotal(itensSource);

    const updatedCart = await prisma.cart.update({
      where: { id },
      data: {
        itens,
        subtotal,
        updatedDate: new Date(),
      },
    });

    res.json(serialize(updatedCart));
  } catch (error) {
    next(error);
  }
});

export default router;



