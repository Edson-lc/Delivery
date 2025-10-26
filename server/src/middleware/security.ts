import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { env } from '../env';

// Rate limiting para autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // não contar requests bem-sucedidos
});

// Rate limiting geral
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || (env.IS_PRODUCTION ? 15 * 60 * 1000 : 60 * 1000), // 1 minuto em desenvolvimento, 15 minutos em produção
  max: env.RATE_LIMIT_MAX_REQUESTS || (env.IS_PRODUCTION ? 1000 : 100000), // Muito mais permissivo em desenvolvimento
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas requisições. Tente novamente mais tarde.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // Contar todos os requests
});

// Rate limiting para criação de recursos
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 criações por minuto
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas de criação. Tente novamente em 1 minuto.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do Helmet para segurança
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "http://localhost:*", 
        "http://192.168.1.*:*",
        "http://127.0.0.1:*"
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para sanitização de entrada
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>\"'&]/g, (match) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match];
      })
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .substring(0, 1000);
  };

  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Aplicar sanitização
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // req.query é somente leitura, então criamos uma cópia sanitizada
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = sanitizeObject(req.query);
    // Substituir propriedades individualmente
    Object.keys(req.query).forEach(key => {
      delete req.query[key];
    });
    Object.assign(req.query, sanitizedQuery);
  }

  next();
}

// Middleware para validação de origem
export function validateOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get('Origin');
  
  if (env.IS_PRODUCTION) {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Origem não permitida.'
        }
      });
    }
  }
  
  next();
}

// Middleware para headers de segurança
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Remover header X-Powered-By
  res.removeHeader('X-Powered-By');
  
  // Adicionar headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache control para APIs
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

// Middleware para validação de tamanho de payload
export function validatePayloadSize(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload muito grande. Máximo permitido: 1MB.'
      }
    });
  }
  
  next();
}