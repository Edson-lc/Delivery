import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/auth';
import { AppError, buildErrorPayload } from '../utils/errors';
import { publicUserSelect } from '../utils/user';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: {
      id: string;
      email: string;
      role?: string | null;
      tipoUsuario?: string | null;
    };
  }
}

export default async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('🔍 Authenticate middleware - Headers:', req.headers.authorization);
    const token = extractTokenFromHeader(req.headers.authorization);
    console.log('🔍 Token extraído:', token ? 'OK' : 'ERRO');
    const payload = verifyAccessToken(token);
    console.log('🔍 Payload verificado:', payload);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    });

    if (!user) {
      console.log('❌ Usuário não encontrado no banco:', payload.sub);
      throw new AppError(401, 'USER_NOT_FOUND', 'Usuário associado ao token não encontrado.');
    }

    console.log('✅ Usuário encontrado:', user.email);
    req.authUser = { id: user.id, email: user.email, role: user.role, tipoUsuario: user.tipoUsuario ?? null };
    res.locals.authUser = user;
    res.locals.tokenPayload = payload;

    next();
  } catch (error) {
    console.log('❌ Erro no authenticate:', error);
    const appError = error instanceof AppError ? error : new AppError(401, 'INVALID_TOKEN', 'Token inválido ou expirado.');
    res.status(appError.status).json(buildErrorPayload(appError.code, appError.message));
  }
}
