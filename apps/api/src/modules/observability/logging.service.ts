export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  requestId?: string;
  operation?: string;
  durationMs?: number;
  message: string;
  meta?: Record<string, any>;
}

export class LoggerService {
  private serviceName: string;
  private static sensitiveKeys = new Set([
    'password',
    'token',
    'authorization',
    'messagetext',
    'replytext',
    'cardcontent',
    'ip',
    'devicefingerprint',
    'privatekey',
    'clientemail',
    'secret'
  ]);

  constructor(serviceName: string = 'justsay-api') {
    this.serviceName = serviceName;
  }

  public sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta) return undefined;
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (LoggerService.sensitiveKeys.has(key.toLowerCase())) {
        clean[key] = '[REDACTED_SENSITIVE]';
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = this.sanitizeMeta(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  public log(level: LogLevel, message: string, opts?: { requestId?: string; operation?: string; durationMs?: number; meta?: Record<string, any> }) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      requestId: opts?.requestId,
      operation: opts?.operation,
      durationMs: opts?.durationMs,
      message,
      meta: this.sanitizeMeta(opts?.meta)
    };

    const formatted = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  public info(message: string, opts?: { requestId?: string; operation?: string; durationMs?: number; meta?: Record<string, any> }) {
    this.log('INFO', message, opts);
  }

  public warn(message: string, opts?: { requestId?: string; operation?: string; durationMs?: number; meta?: Record<string, any> }) {
    this.log('WARN', message, opts);
  }

  public error(message: string, opts?: { requestId?: string; operation?: string; durationMs?: number; meta?: Record<string, any> }) {
    this.log('ERROR', message, opts);
  }

  public debug(message: string, opts?: { requestId?: string; operation?: string; durationMs?: number; meta?: Record<string, any> }) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, opts);
    }
  }
}

export interface OperationalMetrics {
  totalRequests: number;
  totalErrors: number;
  activeConnections: number;
  databaseLatencyMs: number;
  cacheLatencyMs: number;
  queueDepth: number;
  failedJobsCount: number;
  moderationLatencyMs: number;
  notificationFailuresCount: number;
}

export class MetricsService {
  private metrics: OperationalMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    activeConnections: 1,
    databaseLatencyMs: 2,
    cacheLatencyMs: 1,
    queueDepth: 0,
    failedJobsCount: 0,
    moderationLatencyMs: 15,
    notificationFailuresCount: 0
  };

  public recordRequest(isError: boolean = false) {
    this.metrics.totalRequests++;
    if (isError) this.metrics.totalErrors++;
  }

  public recordDatabaseLatency(ms: number) {
    this.metrics.databaseLatencyMs = Math.round((this.metrics.databaseLatencyMs + ms) / 2);
  }

  public recordCacheLatency(ms: number) {
    this.metrics.cacheLatencyMs = Math.round((this.metrics.cacheLatencyMs + ms) / 2);
  }

  public setQueueDepth(depth: number) {
    this.metrics.queueDepth = depth;
  }

  public recordJobFailure() {
    this.metrics.failedJobsCount++;
  }

  public getMetrics(): OperationalMetrics {
    return { ...this.metrics };
  }
}

export interface StandardApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function formatApiError(code: string, message: string, requestId: string): StandardApiErrorResponse {
  return {
    error: {
      code,
      message,
      requestId
    }
  };
}
