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

// Endpoint temporário para resetar rate limiting (apenas em desenvolvimento)
if (!env.IS_PRODUCTION) {
  app.post('/api/reset-rate-limit', (req, res) => {
    // Resetar rate limiting para o IP atual
    const key = `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
    // Note: express-rate-limit não tem método direto para resetar, mas podemos ignorar temporariamente
    res.json({ message: 'Rate limit reset requested', ip: req.ip });
  });
  
  // Endpoint para verificar status do servidor
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      environment: env.NODE_ENV,
      cors_origin: env.CORS_ORIGIN,
      rate_limit_window: env.RATE_LIMIT_WINDOW_MS,
      rate_limit_max: env.RATE_LIMIT_MAX_REQUESTS,
      is_production: env.IS_PRODUCTION,
      timestamp: new Date().toISOString()
    });
  });
}

// CORS otimizado para dispositivos móveis
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('🌐 CORS: Permitindo requisição sem origin (mobile/app)');
      return callback(null, true);
    }
    
    console.log('🌐 CORS: Verificando origem:', origin);
    
    if (env.IS_PRODUCTION) {
      // Em produção, validar origem específica
      const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];
      
      if (allowedOrigins.length === 0) {
        return callback(new Error('CORS_ORIGIN deve ser configurado em produção'), false);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS: Origem permitida em produção:', origin);
        return callback(null, true);
      } else {
        console.log('❌ CORS: Origem não permitida em produção:', origin);
        return callback(new Error('Origem não permitida pelo CORS'), false);
      }
    } else {
      // Em desenvolvimento, permitir localhost e IPs da rede local
      const allowedDevOrigins = [
        'http://localhost:4000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        // IPs da rede local (192.168.1.x)
        'http://192.168.1.229:5173',
        'http://192.168.1.229:5174',
        'http://192.168.1.229:5175',
        'http://192.168.1.229:5176',
        'http://192.168.1.229:5177',
        'http://192.168.1.229:5178',
        'http://192.168.1.229:5179',
        'http://192.168.1.229:5180',
        'http://192.168.1.229:5181',
        // Permitir qualquer IP da rede 192.168.1.x para mobile
        ...Array.from({length: 254}, (_, i) => `http://192.168.1.${i+1}:5173`),
        ...Array.from({length: 254}, (_, i) => `http://192.168.1.${i+1}:5174`),
        ...Array.from({length: 254}, (_, i) => `http://192.168.1.${i+1}:5175`),
        // IP Docker/VM
        'http://82.155.88.172:5173',
        'http://82.155.88.172:5174',
        'http://82.155.88.172:5175',
        'http://82.155.88.172:5176',
        'http://82.155.88.172:5177',
        'http://82.155.88.172:5178',
        'http://82.155.88.172:5179',
        'http://82.155.88.172:5180',
        'http://82.155.88.172:5181',        
      ];
      
      // Verificar se a origem está na lista ou se é um IP da rede local
      const isAllowed = allowedDevOrigins.includes(origin) || 
                       /^http:\/\/192\.168\.1\.\d{1,3}:\d+$/.test(origin) ||
                       /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(origin) ||
                       /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/.test(origin);
      
      if (isAllowed) {
        console.log('✅ CORS: Origem permitida em desenvolvimento:', origin);
        return callback(null, true);
      } else {
        console.log('❌ CORS: Origem não permitida em desenvolvimento:', origin);
      }
    }
    
    return callback(new Error('Origem não permitida'), false);
  },
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'X-Limit', 'X-Skip'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-CSRF-Token',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
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

// Middleware para webhook do Stripe (raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

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