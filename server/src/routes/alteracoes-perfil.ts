import { Router } from 'express';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { buildErrorPayload } from '../utils/errors';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { entregadorId, status } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    // Temporariamente retornar dados vazios até resolver problema do Prisma
    const total = 0;
    const changes: any[] = [];

    applyPaginationHeaders(res, pagination, total);
    res.json(serialize(changes));
  } catch (error) {
    console.error('Erro ao buscar alterações de perfil:', error);
    // Retornar dados vazios em caso de erro
    res.json(serialize([]));
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body ?? {};

    if (!data.entregadorId || !data.dadosAntigos || !data.dadosNovos) {
      return res
        .status(400)
        .json(buildErrorPayload('VALIDATION_ERROR', 'entregadorId, dadosAntigos e dadosNovos são obrigatórios.'));
    }

    // Temporariamente retornar erro até resolver problema do Prisma
    return res.status(501).json(buildErrorPayload('NOT_IMPLEMENTED', 'Funcionalidade temporariamente desabilitada.'));
  } catch (error) {
    console.error('Erro ao criar alteração de perfil:', error);
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body ?? {};

    // Temporariamente retornar erro até resolver problema do Prisma
    return res.status(501).json(buildErrorPayload('NOT_IMPLEMENTED', 'Funcionalidade temporariamente desabilitada.'));
  } catch (error) {
    console.error('Erro ao atualizar alteração de perfil:', error);
    next(error);
  }
});

export default router;
