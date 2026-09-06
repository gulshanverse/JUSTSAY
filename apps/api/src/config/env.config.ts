export interface AppConfig {
  env: 'development' | 'test' | 'staging' | 'production';
  port: number;
  apiPrefix: string;

  database: {
    url: string;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    ssl: boolean;
  };

  redis: {
    url: string;
    keyPrefix: string;
    connectTimeoutMs: number;
    maxRetriesPerRequest: number;
  };

  objectStorage: {
    provider: 'memory' | 'gcs' | 's3';
    bucketName: string;
    region: string;
    signedUrlTtlSeconds: number;
    maxFileSizeBytes: number;
  };

  fcm: {
    enabled: boolean;
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  };

  secrets: {
    sessionSecret: string;
    adminSecret: string;
  };

  moderation: {
    provider: 'keyword' | 'ai';
    autoBlockThreshold: number;
  };
}

export function validateConfig(config: AppConfig): void {
  if (config.env === 'production') {
    const devSecretDefault = 'dev_session_secret_change_in_production_32chars';
    const devAdminDefault = 'dev_admin_jwt_secret_change_in_production_32chars';

    if (!process.env.SESSION_SECRET || config.secrets.sessionSecret === devSecretDefault) {
      throw new Error('PRODUCTION_CONFIG_ERROR: SESSION_SECRET environment variable must be set to a secure custom value in production.');
    }

    if (!process.env.ADMIN_SECRET && config.secrets.adminSecret === devAdminDefault) {
      throw new Error('PRODUCTION_CONFIG_ERROR: ADMIN_SECRET environment variable must be set to a secure custom value in production.');
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('PRODUCTION_CONFIG_ERROR: DATABASE_URL environment variable must be set in production.');
    }

    if (!process.env.REDIS_URL) {
      throw new Error('PRODUCTION_CONFIG_ERROR: REDIS_URL environment variable must be set in production.');
    }
  }
}

export function loadConfig(): AppConfig {
  const env = (process.env.NODE_ENV as AppConfig['env']) || 'development';

  const config: AppConfig = {
    env,
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',

    database: {
      url: process.env.DATABASE_URL || 'postgres://justsay_user:justsay_dev_pass@localhost:5432/justsay_db',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
      ssl: process.env.DB_SSL === 'true' || env === 'production'
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'justsay:',
      connectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || '5000', 10),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10)
    },

    objectStorage: {
      provider: (process.env.STORAGE_PROVIDER as any) || (env === 'production' ? 'gcs' : 'memory'),
      bucketName: process.env.OBJECT_STORAGE_BUCKET || 'justsay-media-assets-prod',
      region: process.env.OBJECT_STORAGE_REGION || 'us-central1',
      signedUrlTtlSeconds: parseInt(process.env.STORAGE_SIGNED_URL_TTL || '3600', 10),
      maxFileSizeBytes: 5 * 1024 * 1024 // 5MB
    },

    fcm: {
      enabled: process.env.FCM_ENABLED === 'true',
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey: process.env.FCM_PRIVATE_KEY
    },

    secrets: {
      sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production_32chars',
      adminSecret: process.env.ADMIN_SECRET || process.env.ADMIN_JWT_SECRET || 'dev_admin_jwt_secret_change_in_production_32chars'
    },

    moderation: {
      provider: (process.env.MODERATION_PROVIDER as any) || 'keyword',
      autoBlockThreshold: parseFloat(process.env.MODERATION_AUTO_BLOCK_THRESHOLD || '0.85')
    }
  };

  validateConfig(config);
  return config;
}
