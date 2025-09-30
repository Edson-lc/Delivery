import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { serialize } from '../utils/serialization';
import { publicUserSelect, privateUserSelect } from '../utils/user';
import { buildErrorPayload } from '../utils/errors';
import { signAccessToken } from '../utils/auth';
import authenticate from '../middleware/authenticate';
import { authLimiter } from '../middleware/security';
import { loginSchema, registerUserSchema } from '../schemas/validation';
import { validateSchema } from '../schemas/validation';
import { logAuth } from '../utils/logger';
import { env } from '../env';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = validateSchema(registerUserSchema, req.body);
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return res.status(409).json(buildErrorPayload('EMAIL_ALREADY_REGISTERED', 'E-mail já cadastrado.'));
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        tipoUsuario: 'cliente',
        status: 'ativo',
      },
      select: publicUserSelect,
    });

    const token = signAccessToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ token, user: serialize(user) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation error')) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', error.message));
    }

    if ((error as any)?.code === 'P2002') {
      return res.status(409).json(buildErrorPayload('EMAIL_ALREADY_REGISTERED', 'E-mail já cadastrado.'));
    }

    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    // Validar entrada com Zod
    const { email, password } = validateSchema(loginSchema, req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      logAuth('login_attempt', undefined, email, false);
      return res.status(401).json(buildErrorPayload('INVALID_CREDENTIALS', 'Credenciais inválidas.'));
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      logAuth('login_attempt', user.id, email, false);
      return res.status(401).json(buildErrorPayload('INVALID_CREDENTIALS', 'Credenciais inválidas.'));
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ativo') {
      logAuth('login_attempt', user.id, email, false);
      return res.status(401).json(buildErrorPayload('USER_INACTIVE', 'Usuário inativo.'));
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { updatedDate: now },
      }),
      ...(user.tipoUsuario === 'entregador'
        ? [
            prisma.entregador.updateMany({
              where: { userId: user.id },
              data: { ultimoLogin: now },
            }),
          ]
        : []),
    ]);

    const publicUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });

    if (!publicUser) {
      logAuth('login_error', user.id, email, false);
      return res.status(500).json(buildErrorPayload('USER_NOT_FOUND', 'Não foi possível carregar os dados do usuário.'));
    }

    const token = signAccessToken({ id: publicUser.id, email: publicUser.email, role: publicUser.role });

    logAuth('login_success', user.id, email, true);

    res.json({
      token,
      user: serialize(publicUser),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation error')) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', error.message));
    }
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.status(204).send();
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    // Buscar dados completos do usuário incluindo dados sensíveis
    const user = await prisma.user.findUnique({
      where: { id: res.locals.authUser.id },
      select: {
        ...privateUserSelect,
        // Force include metodosPagamento explicitly
        metodosPagamento: true,
      },
    });

    if (!user) {
      return res.status(404).json(buildErrorPayload('USER_NOT_FOUND', 'Usuário não encontrado.'));
    }

    const serializedUser = serialize(user);

    res.json(serializedUser);
  } catch (error) {
    next(error);
  }
});

export default router;
