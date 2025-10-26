import dotenv from 'dotenv';

// Carregar variáveis de ambiente - tentar múltiplos arquivos
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Debug: log das variáveis de ambiente
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

const PORT = Number(process.env.PORT ?? 4000);
const DATABASE_URL = process.env.DATABASE_URL ?? 'file:./dev.db';
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000); // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10000); // 1000 requests por minuto
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? (NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://localhost:5174,http://192.168.1.229:5173,http://192.168.1.229:5174');
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

// Stripe Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

const DEFAULT_DEV_JWT_SECRET = 'dev-secret-change-me-insecure-please-change-1234567890abcdefghijklmnopqrstuvwxyz';


let resolvedJwtSecret = process.env.JWT_SECRET ?? '';

if (!resolvedJwtSecret) {
  if (NODE_ENV === 'production') {
    throw new Error('[env] JWT_SECRET is required in production environment.');
  }

  console.warn('[env] JWT_SECRET is not set. Using default development secret. NEVER use this in production.');
  resolvedJwtSecret = DEFAULT_DEV_JWT_SECRET;
}

if (NODE_ENV === 'production' && resolvedJwtSecret.length < 64) {
  throw new Error('[env] JWT_SECRET must be at least 64 characters long for production.');
}

if (NODE_ENV !== 'production' && resolvedJwtSecret.length < 64) {
  console.warn('[env] JWT_SECRET length is below 64 characters. Using development fallback.');
  resolvedJwtSecret = DEFAULT_DEV_JWT_SECRET;
}

export const env = {
  PORT,
  DATABASE_URL,
  JWT_SECRET: resolvedJwtSecret,
  JWT_EXPIRES_IN,
  NODE_ENV,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CORS_ORIGIN,
  LOG_LEVEL,
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET,
  IS_PRODUCTION: NODE_ENV === 'production',
  IS_DEVELOPMENT: NODE_ENV === 'development',
};

// Desabilitar console.log em produção para segurança
if (env.IS_PRODUCTION) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
}
