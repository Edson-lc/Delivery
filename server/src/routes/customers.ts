import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { telefone, email, nome, id } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};

    if (telefone) {
      where.telefone = String(telefone);
    }

    if (email) {
      where.email = String(email);
    }

    if (nome) {
      where.nome = { contains: String(nome), mode: 'insensitive' };
    }

    if (id) {
      where.id = String(id);
    }

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdDate: 'desc' },
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(customers));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findUnique({ where: { id } });

    if (!customer) {
      return res.status(404).json(buildErrorPayload('CUSTOMER_NOT_FOUND', 'Cliente não encontrado.'));
    }

    res.json(serialize(customer));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body ?? {};

    if (!data.nome || !data.telefone) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'nome e telefone são obrigatórios.'));
    }

    const customer = await prisma.user.create({ data });
    res.status(201).json(serialize(customer));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawData = req.body ?? {};

    // Filtrar apenas campos válidos do modelo User
    const validFields = [
      'fullName', 'email', 'role', 'tipoUsuario', 'nome', 'sobrenome', 
      'telefone', 'nif', 'dataNascimento', 'fotoUrl', 'status', 
      'passwordHash', 'consentimentoDados', 'enderecosSalvos', 'metodosPagamento',
      'enderecos_salvos', 'metodos_pagamento_salvos'
    ];

    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (validFields.includes(key)) {
        data[key] = value;
      }
    }

    // Mapear campos específicos se necessário
    if (rawData.enderecos_salvos) {
      data.enderecosSalvos = rawData.enderecos_salvos;
    }
    if (rawData.metodos_pagamento_salvos) {
      data.metodosPagamento = rawData.metodos_pagamento_salvos;
    }

    const customer = await prisma.user.update({
      where: { id },
      data,
    });

    res.json(serialize(customer));
  } catch (error) {
    next(error);
  }
});

export default router;
