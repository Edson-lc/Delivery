
import { Prisma } from '@prisma/client';
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { publicUserSelect, privateUserSelect, adminUserSelect } from '../utils/user';
import { buildErrorPayload } from '../utils/errors';
import { parsePagination, applyPaginationHeaders } from '../utils/pagination';
import { createUserSchema, updateUserSchema, validateSchema } from '../schemas/validation';
import { createLimiter } from '../middleware/security';
import { logBusiness } from '../utils/logger';
import { env } from '../env';

const router = Router();

function getAuthContext(req: Request, res: Response) {
  return (res.locals?.authUser as Record<string, any> | undefined) ?? (req.authUser as Record<string, any> | undefined);
}

function isAdminContext(context?: Record<string, any> | null): boolean {
  if (!context) {
    return false;
  }
  const role = context.role ?? null;
  const tipo = context.tipoUsuario ?? context.tipo_usuario ?? null;
  return role === 'admin' || tipo === 'admin';
}

function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const context = getAuthContext(req, res);
  if (isAdminContext(context)) {
    return next();
  }
  return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
}

function ensureSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  const context = getAuthContext(req, res);
  if (!context) {
    return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
  }
  if (isAdminContext(context)) {
    return next();
  }
  const targetId = req.params.id ?? (req.body as Record<string, any>)?.id ?? null;
  if (targetId && context.id === targetId) {
    return next();
  }
  return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
}


router.post('/', createLimiter, ensureAdmin, async (req, res, next) => {
  try {
    // Validar entrada com Zod
    const validatedData = validateSchema(createUserSchema, req.body);
    
    const { email, fullName, password, ...otherData } = validatedData;
    const body = req.body;

    let passwordHash: string | undefined;
    if (typeof password === 'string' && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    }

    // Build create data by whitelisting known fields only
    const enderecoRaw = (body as any).endereco as unknown;

    const normalizeEndereco = (val: unknown): unknown => {
      if (val === null || val === undefined) return undefined;
      if (Array.isArray(val)) return val;
      if (typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === null || v === undefined) continue;
          if (typeof v === 'string') {
            const t = v.trim();
            if (!t) continue;
            cleaned[k] = t;
          } else {
            cleaned[k] = v;
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }
      if (typeof val === 'string') {
        const t = val.trim();
        return t || undefined;
      }
      return undefined;
    };

    const enderecoPrepared = normalizeEndereco(enderecoRaw);

    const createData: Prisma.UserCreateInput = {
      email,
      fullName,
      // Optional fields
      role: (body as any).role ?? undefined,
      tipoUsuario: (body as any).tipoUsuario ?? undefined,
      nome: (body as any).nome ?? undefined,
      sobrenome: (body as any).sobrenome ?? undefined,
      telefone: (body as any).telefone ?? undefined,
      nif: (body as any).nif ?? undefined,
      dataNascimento: (body as any).dataNascimento ? new Date(String((body as any).dataNascimento)) : undefined,
      fotoUrl: (body as any).fotoUrl ?? undefined,
      status: (body as any).status ?? undefined,
      restaurant: (body as any).restaurantId
        ? { connect: { id: String((body as any).restaurantId) } }
        : undefined,
      passwordHash,
      consentimentoDados: (body as any).consentimentoDados ?? undefined,
      enderecosSalvos: (body as any).enderecosSalvos ?? (enderecoPrepared !== undefined ? [enderecoPrepared] : undefined),
      metodosPagamento: (body as any).metodosPagamento ?? undefined,
    } as Prisma.UserCreateInput;

    const created = await prisma.user.create({ data: createData });

    const user = await prisma.user.findUnique({
      where: { id: created.id },
      select: adminUserSelect,
    });

    return res.status(201).json(serialize(user));
  } catch (error: any) {
    // Handle unique email constraint
    if (error?.code === 'P2002') {
      return res.status(409).json(buildErrorPayload('EMAIL_ALREADY_REGISTERED', 'E-mail jÃ¡ cadastrado.'));
    }
    return next(error);
  }
});

router.get('/', ensureAdmin, async (req, res, next) => {
  try {
    const { email, role, tipoUsuario, id } = req.query;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const where: Prisma.UserWhereInput = {};

    if (email) {
      where.email = { contains: String(email), mode: Prisma.QueryMode.insensitive };
    }

    if (role) {
      where.role = String(role);
    }

    if (tipoUsuario) {
      where.tipoUsuario = String(tipoUsuario);
    }

    if (id) {
      where.id = String(id);
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdDate: 'desc' },
        select: adminUserSelect,
        ...(pagination.limit !== undefined ? { take: pagination.limit } : {}),
        ...(pagination.skip !== undefined ? { skip: pagination.skip } : {}),
      }),
    ]);

    applyPaginationHeaders(res, pagination, total);

    res.json(serialize(users));
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    if (!res.locals.authUser) {
      return res.status(401).json(buildErrorPayload('UNAUTHENTICATED', 'Sessão expirada ou inválida.'));
    }

    // Buscar dados completos do usuário incluindo dados sensíveis
    const user = await prisma.user.findUnique({
      where: { id: res.locals.authUser.id },
      select: privateUserSelect,
    });

    if (!user) {
      return res.status(404).json(buildErrorPayload('USER_NOT_FOUND', 'Usuário não encontrado.'));
    }

    res.json(serialize(user));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', ensureSelfOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = getAuthContext(req, res);
    
    // Determinar qual select usar baseado no contexto
    const select = isAdminContext(context) ? adminUserSelect : privateUserSelect;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select,
    });

    if (!user) {
      return res.status(404).json(buildErrorPayload('USER_NOT_FOUND', 'Usuário não encontrado.'));
    }

    res.json(serialize(user));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ensureSelfOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = (req.body ?? {}) as (Prisma.UserUpdateInput & {
      password?: string;
      endereco?: unknown;
      metodosPagamentoSalvos?: unknown;
      metodos_pagamento_salvos?: unknown;
    }) | Record<string, unknown>;

    console.log('🔄 PUT /users/:id - Iniciando atualização');
    console.log('👤 ID do usuário:', id);
    console.log('📝 Body recebido:', JSON.stringify(body, null, 2));

    const updateData: Prisma.UserUpdateInput = { ...body } as Prisma.UserUpdateInput;

    const passwordValue = (body as any).password;
    let nextPasswordHash: string | undefined;
    if (typeof passwordValue === 'string' && passwordValue.trim().length > 0) {
      nextPasswordHash = await bcrypt.hash(passwordValue, env.BCRYPT_ROUNDS);
    }

    delete (updateData as Record<string, unknown>).password;

    if (nextPasswordHash) {
      (updateData as Prisma.UserUpdateInput).passwordHash = nextPasswordHash;
    } else {
      delete (updateData as Record<string, unknown>).passwordHash;
    }

    if ((body as any).dataNascimento) {
      (updateData as any).dataNascimento = new Date(String((body as any).dataNascimento));
    }

    if ((body as any).metodosPagamentoSalvos !== undefined || (body as any).metodos_pagamento_salvos !== undefined) {
      const rawMethods = (body as any).metodosPagamentoSalvos ?? (body as any).metodos_pagamento_salvos;
      (updateData as any).metodosPagamento = rawMethods as Prisma.InputJsonValue;
    }

    delete (updateData as Record<string, unknown>).metodosPagamentoSalvos;
    delete (updateData as Record<string, unknown>).metodos_pagamento_salvos;

    // Tratar enderecosSalvos (plural) - para arrays de endereços
    if (Object.prototype.hasOwnProperty.call(body, 'enderecosSalvos')) {
      const raw = (body as any).enderecosSalvos as unknown;
      console.log('🏠 enderecosSalvos encontrado:', JSON.stringify(raw, null, 2));
      
      // Verificar coordenadas especificamente
      if (Array.isArray(raw)) {
        raw.forEach((address, index) => {
          console.log(`📍 Endereço ${index} coordenadas:`, {
            latitude: address.latitude,
            longitude: address.longitude
          });
        });
      }
      
      if (raw !== null && raw !== undefined) {
        (updateData as any).enderecosSalvos = raw as Prisma.InputJsonValue;
        console.log('✅ enderecosSalvos adicionado ao updateData');
      }
    }

    // Tratar endereco (singular) - para compatibilidade com código antigo
    if (Object.prototype.hasOwnProperty.call(body, 'endereco')) {
      const raw = (body as any).endereco as unknown;
      let prepared: unknown;
      if (raw === null || raw === undefined) {
        prepared = undefined;
      } else if (Array.isArray(raw)) {
        prepared = raw;
      } else if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === null || v === undefined) continue;
          if (typeof v === 'string') {
            const t = v.trim();
            if (!t) continue;
            cleaned[k] = t;
          } else {
            cleaned[k] = v;
          }
        }
        prepared = Object.keys(cleaned).length > 0 ? cleaned : undefined;
      } else if (typeof raw === 'string') {
        const t = raw.trim();
        prepared = t || undefined;
      }

      if (prepared !== undefined) {
        (updateData as any).enderecosSalvos = [prepared];
      }
    }

    delete (updateData as Record<string, unknown>).endereco;

    console.log('💾 Dados para atualização:', JSON.stringify(updateData, null, 2));

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Usuário atualizado no banco de dados');

    const user = await prisma.user.findUnique({
      where: { id },
      select: privateUserSelect,
    });

    console.log('👤 Usuário retornado:', JSON.stringify(user, null, 2));
    res.json(serialize(user));
  } catch (error) {
    next(error);
  }
});

export default router;

