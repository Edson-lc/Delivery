import winston from 'winston';
import { env } from '../env';
import path from 'path';
import fs from 'fs';

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato customizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuração do logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'amadelivery-api',
    environment: env.NODE_ENV
  },
  transports: [
    // Console transport para desenvolvimento
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport para todos os logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport apenas para erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Tratamento de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  ],
  
  // Tratamento de rejeições de Promise não capturadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  ]
});

// Em produção, remover console transport
if (env.IS_PRODUCTION) {
  logger.remove(logger.transports[0]);
}

// Funções helper para logging estruturado
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...meta
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Logger para requests HTTP
export const logRequest = (req: any, res: any, responseTime: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.authUser?.id,
    userEmail: req.authUser?.email
  };
  
  if (res.statusCode >= 400) {
    logError('HTTP Request Error', null, logData);
  } else {
    logInfo('HTTP Request', logData);
  }
};

// Logger para operações de banco de dados
export const logDatabase = (operation: string, table: string, duration: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`
  };
  
  if (error) {
    logError('Database Operation Error', error, logData);
  } else {
    logDebug('Database Operation', logData);
  }
};

// Logger para autenticação
export const logAuth = (event: string, userId?: string, email?: string, success: boolean = true, error?: Error) => {
  const logData = {
    event,
    userId,
    email,
    success,
    ip: undefined // Será preenchido pelo middleware
  };
  
  if (error) {
    logError('Authentication Error', error, logData);
  } else if (success) {
    logInfo('Authentication Success', logData);
  } else {
    logWarn('Authentication Failed', logData);
  }
};

// Logger para operações de negócio
export const logBusiness = (operation: string, entity: string, entityId: string, userId?: string, details?: any) => {
  logInfo('Business Operation', {
    operation,
    entity,
    entityId,
    userId,
    details
  });
};

export default logger;
