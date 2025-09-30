import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './env';
import routes from './routes';
import { buildErrorPayload, mapUnknownError } from './utils/errors';
import { 
  helmetConfig, 
  generalLimiter, 
  sanitizeInput, 
  validateOrigin, 
  securityHeaders, 
  validatePayloadSize 
} from './middleware/security';
import { logRequest } from './utils/logger';

const app = express();

// Trust proxy para rate limiting funcionar corretamente
app.set('trust proxy', 1);

// Middleware de segurança
app.use(helmetConfig);
app.use(securityHeaders);
app.use(validatePayloadSize);

// Sanitização de entrada
app.use(sanitizeInput);

// Compressão de resposta
app.use(compression());

// Rate limiting geral
app.use(generalLimiter);

// CORS seguro e restritivo
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (env.IS_PRODUCTION) {
      // Em produção, validar origem específica
      const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];
      
      if (allowedOrigins.length === 0) {
        return callback(new Error('CORS_ORIGIN deve ser configurado em produção'), false);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Origem não permitida pelo CORS'), false);
      }
    } else {
      // Em desenvolvimento, permitir localhost
      const allowedDevOrigins = [
        'http://localhost:4000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179'
      ];
      if (allowedDevOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    return callback(new Error('Origem não permitida'), false);
  },
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'X-Limit', 'X-Skip'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  maxAge: 86400, // Cache preflight por 24 horas
};

app.use(cors(corsOptions));

// Validação de origem em produção
if (env.IS_PRODUCTION) {
  app.use(validateOrigin);
}

// Logging de requests
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      // Log será feito pelo middleware customizado
    }
  }
}));

// Middleware customizado para logging de requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });
  
  next();
});

// Parser de JSON com limite
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

// Parser de URL encoded
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(), 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(buildErrorPayload('NOT_FOUND', `Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Error handler global
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const appError = mapUnknownError(error);
  
  // Log do erro
  if (appError.status >= 500) {
    console.error('[Server Error]', error);
  }
  
  // Resposta de erro
  const errorResponse = buildErrorPayload(appError.code, appError.message, appError.details);
  
  // Em produção, não expor detalhes internos
  if (env.IS_PRODUCTION && appError.status >= 500) {
    errorResponse.error.message = 'Erro interno do servidor';
    delete errorResponse.error.details;
  }
  
  res.status(appError.status).json(errorResponse);
});

export default app;