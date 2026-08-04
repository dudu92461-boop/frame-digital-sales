import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Variavel de ambiente ${name} nao definida. Copie server/.env.example para server/.env.`,
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL', 'file:./dev.db'),
  jwtSecret: required('JWT_SECRET', 'frame-digital-sales-dev-secret'),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  tokenName: 'fds_token',
  tokenTtlSeconds: 60 * 60 * 12, // 12 horas
};

if (env.isProduction && env.jwtSecret.includes('dev-secret')) {
  throw new Error('Defina um JWT_SECRET proprio antes de rodar em producao.');
}
