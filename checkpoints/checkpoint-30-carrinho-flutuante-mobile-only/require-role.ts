import { NextFunction, Request, Response } from 'express';
import { buildErrorPayload } from '../utils/errors';

type Role = string;

type AuthUser = Request['authUser'] & {
  tipoUsuario?: string | null;
};

function extractUserRole(req: Request, res: Response) {
  const authUser = req.authUser as AuthUser | undefined;
  const fullUser = (res.locals?.authUser as { role?: string | null; tipoUsuario?: string | null }) || {};

  return {
    role: authUser?.role ?? fullUser.role ?? null,
    tipoUsuario: authUser?.tipoUsuario ?? fullUser.tipoUsuario ?? null,
  };
}

export default function requireRole(roles: Role | Role[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return function requireRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    const { role, tipoUsuario } = extractUserRole(req, res);

    const hasAccess = allowed.some((allowedRole) => allowedRole === role || allowedRole === tipoUsuario);

    if (!hasAccess) {
      return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Permissao insuficiente.'));
    }

    return next();
  };
}
