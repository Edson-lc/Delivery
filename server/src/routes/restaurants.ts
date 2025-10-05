import { Prisma } from '@prisma/client';
import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, status, search, includeMenuItems } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const filters: Record<string, unknown> = {};

    if (category) {
      filters.categoria = String(category).toLowerCase();
    }

    if (status) {
      filters.status = String(status).toLowerCase();
    }

    const where = {
      ...filters,
      ...(search
        ? {
            OR: [
              { nome: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
              { descricao: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        orderBy: { createdDate: 'desc' },
        include:
          includeMenuItems === 'true'
            ? { menuItems: { orderBy: { nome: 'asc' } } }
            : undefined,
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

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: true },
    });

    if (!restaurant) {
      return res.status(404).json(buildErrorPayload('RESTAURANT_NOT_FOUND', 'Restaurante não encontrado.'));
    }

    res.json(serialize(restaurant));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      nome,
      descricao,
      categoria,
      endereco,
      cidade,
      telefone,
      email,
      tempo_preparo,
      tempoPreparo,
      taxa_entrega,
      taxaEntrega,
      valor_minimo,
      valorMinimo,
      status,
      avaliacao,
      imagem_url,
      imagemUrl,
      horarioFuncionamento,
    } = req.body ?? {};

    if (!nome || !endereco || !telefone || !cidade) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'nome, endereco, telefone e cidade são obrigatórios.'));
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        nome,
        descricao,
        categoria,
        endereco,
        cidade,
        telefone,
        email,
        tempoPreparo: tempo_preparo ?? tempoPreparo ?? 30,
        taxaEntrega: taxa_entrega ?? taxaEntrega ?? 5.00,
        valorMinimo: valor_minimo ?? valorMinimo ?? pedidoMinimo ?? 20.00,
        status: status || 'ativo',
        open: true,
        rating: avaliacao ?? 0,
        imagemUrl: imagem_url ?? imagemUrl,
        horarioFuncionamento,
      },
    });

    res.status(201).json(serialize(restaurant));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawData = req.body ?? {};

    // Mapear campos do frontend para o modelo
    const data: Record<string, any> = {};
    
    if (rawData.nome !== undefined) data.nome = rawData.nome;
    if (rawData.descricao !== undefined) data.descricao = rawData.descricao;
    if (rawData.categoria !== undefined) data.categoria = rawData.categoria;
    if (rawData.endereco !== undefined) data.endereco = rawData.endereco;
    if (rawData.cidade !== undefined) data.cidade = rawData.cidade;
    if (rawData.telefone !== undefined) data.telefone = rawData.telefone;
    if (rawData.email !== undefined) data.email = rawData.email;
    if (rawData.tempoPreparo !== undefined) data.tempoPreparo = rawData.tempoPreparo;
    if (rawData.tempo_preparo !== undefined) data.tempoPreparo = rawData.tempo_preparo;
    if (rawData.taxaEntrega !== undefined) data.taxaEntrega = rawData.taxaEntrega;
    if (rawData.taxa_entrega !== undefined) data.taxaEntrega = rawData.taxa_entrega;
    if (rawData.pedidoMinimo !== undefined) data.valorMinimo = rawData.pedidoMinimo;
    if (rawData.valor_minimo !== undefined) data.valorMinimo = rawData.valor_minimo;
    if (rawData.valorMinimo !== undefined) data.valorMinimo = rawData.valorMinimo;
    if (rawData.imagemUrl !== undefined) data.imagemUrl = rawData.imagemUrl;
    if (rawData.imagem_url !== undefined) data.imagemUrl = rawData.imagem_url;
    if (rawData.horarioFuncionamento !== undefined) data.horarioFuncionamento = rawData.horarioFuncionamento;
    if (rawData.rating !== undefined) data.rating = rawData.rating;
    if (rawData.avaliacao !== undefined) data.rating = rawData.avaliacao;
    
    // Mapear status e open
    if (rawData.status !== undefined) {
      data.status = rawData.status;
    }
    if (rawData.open !== undefined) {
      data.open = rawData.open;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    });

    res.json(serialize(restaurant));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.restaurant.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
