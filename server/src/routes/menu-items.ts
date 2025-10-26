import { Prisma } from '@prisma/client';
import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';
import path from 'path';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { restaurantId, category, available, search } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const filters: Record<string, unknown> = {};

    if (restaurantId) {
      filters.restaurantId = String(restaurantId);
    }

    if (category) {
      filters.categoria = String(category).toLowerCase();
    }

    if (available !== undefined) {
      filters.disponivel = String(available) === 'true';
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

    const [total, menuItems] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        orderBy: { nome: 'asc' },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(menuItems));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return res.status(404).json(buildErrorPayload('MENU_ITEM_NOT_FOUND', 'Item de menu não encontrado.'));
    }

    res.json(serialize(menuItem));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const rawData = req.body ?? {};

    if (!rawData.restaurantId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'restaurantId é obrigatório.'));
    }

    if (!rawData.nome || rawData.preco === undefined) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'nome e preco são obrigatórios.'));
    }

    // Mapear campos do frontend para o modelo
    const data: any = {
      nome: rawData.nome,
      preco: rawData.preco,
      restaurantId: rawData.restaurantId
    };
    
    if (rawData.nome !== undefined) data.nome = rawData.nome;
    if (rawData.descricao !== undefined) data.descricao = rawData.descricao;
    if (rawData.categoria !== undefined) data.categoria = rawData.categoria;
    if (rawData.preco !== undefined) data.preco = rawData.preco;
    if (rawData.disponivel !== undefined) data.disponivel = rawData.disponivel;
    if (rawData.imagemUrl !== undefined) data.imagemUrl = rawData.imagemUrl;
    if (rawData.imagem_url !== undefined) data.imagemUrl = rawData.imagem_url;
    if (rawData.ingredientes !== undefined) data.ingredientes = rawData.ingredientes;
    if (rawData.alergenos !== undefined) data.alergenos = rawData.alergenos;
    if (rawData.adicionais !== undefined) data.adicionais = rawData.adicionais;
    // Mapear tanto snake_case quanto camelCase do frontend
    if (rawData.opcoes_personalizacao !== undefined) {
      data.opcoes_personalizacao = rawData.opcoes_personalizacao;
    } else if (rawData.opcoesPersonalizacao !== undefined) {
      data.opcoes_personalizacao = rawData.opcoesPersonalizacao;
    }
    if (rawData.calorias !== undefined) data.calorias = rawData.calorias;
    if (rawData.tempoPreparo !== undefined) data.tempoPreparo = rawData.tempoPreparo;
    if (rawData.tempo_preparo !== undefined) data.tempoPreparo = rawData.tempo_preparo;
    if (rawData.ordem !== undefined) data.ordem = rawData.ordem;
    if (rawData.restaurantId !== undefined) data.restaurantId = rawData.restaurantId;

    const menuItem = await prisma.menuItem.create({ data });
    res.status(201).json(serialize(menuItem));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawData = req.body ?? {};


    // Filtrar apenas campos válidos do modelo MenuItem
    const validFields = [
      'nome', 'descricao', 'categoria', 'preco', 'disponivel', 
      'imagemUrl', 'ingredientes', 'alergenos', 'adicionais', 'opcoes_personalizacao',
      'calorias', 'tempoPreparo', 'ordem', 'restaurantId'
    ];

    const data: Record<string, any> = {};
    
    // Mapear campos do frontend para o modelo
    if (rawData.nome !== undefined) data.nome = rawData.nome;
    if (rawData.descricao !== undefined) data.descricao = rawData.descricao;
    if (rawData.categoria !== undefined) data.categoria = rawData.categoria;
    if (rawData.preco !== undefined) data.preco = rawData.preco;
    if (rawData.disponivel !== undefined) data.disponivel = rawData.disponivel;
    if (rawData.imagemUrl !== undefined) data.imagemUrl = rawData.imagemUrl;
    if (rawData.imagem_url !== undefined) data.imagemUrl = rawData.imagem_url;
    if (rawData.ingredientes !== undefined) data.ingredientes = rawData.ingredientes;
    if (rawData.alergenos !== undefined) data.alergenos = rawData.alergenos;
    if (rawData.adicionais !== undefined) data.adicionais = rawData.adicionais;
    // Mapear tanto snake_case quanto camelCase do frontend
    if (rawData.opcoes_personalizacao !== undefined) {
      data.opcoes_personalizacao = rawData.opcoes_personalizacao;
    } else if (rawData.opcoesPersonalizacao !== undefined) {
      data.opcoes_personalizacao = rawData.opcoesPersonalizacao;
    }
    if (rawData.calorias !== undefined) data.calorias = rawData.calorias;
    if (rawData.tempoPreparo !== undefined) data.tempoPreparo = rawData.tempoPreparo;
    if (rawData.tempo_preparo !== undefined) data.tempoPreparo = rawData.tempo_preparo;
    if (rawData.ordem !== undefined) data.ordem = rawData.ordem;
    if (rawData.restaurantId !== undefined) data.restaurantId = rawData.restaurantId;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
    });
    res.json(serialize(menuItem));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
