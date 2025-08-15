import pino from 'pino';
import { customAlphabet } from 'nanoid';

// Generate request IDs
const generateRequestId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'api_key',
      'apiKey',
      'secret',
      'email',
      'ssn',
      'creditCard',
    ],
    remove: true,
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Request context type
interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

// Create child logger with request context
export function createRequestLogger(context: Partial<RequestContext> = {}) {
  const requestId = context.requestId || generateRequestId();
  return logger.child({
    requestId,
    ...context,
  });
}

// Log levels
export const logLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

// Structured logging helpers
export const log = {
  trace: (msg: string, data?: any) => logger.trace(data, msg),
  debug: (msg: string, data?: any) => logger.debug(data, msg),
  info: (msg: string, data?: any) => logger.info(data, msg),
  warn: (msg: string, data?: any) => logger.warn(data, msg),
  error: (msg: string, error?: any, data?: any) => {
    if (error instanceof Error) {
      logger.error({ err: error, ...data }, msg);
    } else {
      logger.error({ ...error, ...data }, msg);
    }
  },
  fatal: (msg: string, error?: any, data?: any) => {
    if (error instanceof Error) {
      logger.fatal({ err: error, ...data }, msg);
    } else {
      logger.fatal({ ...error, ...data }, msg);
    }
  },
};

// Audit logging for security events
export function auditLog(event: {
  action: string;
  userId: string;
  resource?: string;
  resourceId?: string;
  result: 'success' | 'failure';
  metadata?: any;
}) {
  logger.info({
    type: 'audit',
    timestamp: new Date().toISOString(),
    ...event,
  }, `Audit: ${event.action} ${event.result}`);
}

// Performance logging
export function perfLog(operation: string, duration: number, metadata?: any) {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]({
    type: 'performance',
    operation,
    duration,
    ...metadata,
  }, `Performance: ${operation} took ${duration}ms`);
}

// Export logger instance and utilities
export { logger, generateRequestId };
export default logger;
