import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { router } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { prisma } from './lib/prisma';

const app = express();

// Atras de proxy (deploy) o rate limit e o req.ip precisam do IP real.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.webOrigin,
    credentials: true, // necessario para o cookie httpOnly de sessao
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'frame-digital-sales', time: new Date().toISOString() });
});

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`\n  FRAME DIGITAL SALES - API`);
  console.log(`  http://localhost:${env.port}/api`);
  console.log(`  ambiente: ${env.nodeEnv}\n`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} recebido, encerrando...`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

export { app };
