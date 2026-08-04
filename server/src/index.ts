import path from 'node:path';
import type { Server } from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { router } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { prisma } from './lib/prisma';
import { bootstrap } from './lib/bootstrap';

const app = express();

// Atras de proxy (Render) o rate limit, o req.ip e o cookie Secure precisam
// enxergar o protocolo e o IP reais.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    // Politica sob medida para o site compilado: permite fotos em data URL
    // (avatares) e estilos inline (cores calculadas em runtime), mantendo
    // scripts restritos a propria origem.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  }),
);
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
// Rota /api desconhecida responde 404 em JSON (nunca a pagina do site).
app.use('/api', notFoundHandler);

// Em producao, o mesmo servidor entrega o site ja compilado. Assim frontend e
// API ficam na mesma origem e o cookie de sessao funciona sem ajuste de dominio.
if (env.serveWeb) {
  const webDist = path.resolve(__dirname, '../../web/dist');
  app.use(express.static(webDist));
  // Qualquer outra rota devolve o index.html: o roteamento e do lado do cliente.
  app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
} else {
  app.use(notFoundHandler);
}

app.use(errorHandler);

let server: Server | undefined;

async function start() {
  // Prepara um banco recem-criado (admin + catalogo). Idempotente.
  await bootstrap().catch((err) => console.error('[bootstrap] falhou:', err));

  server = app.listen(env.port, () => {
    console.log(`\n  FRAME DIGITAL SALES`);
    console.log(`  porta: ${env.port}  |  ambiente: ${env.nodeEnv}`);
    console.log(`  site: ${env.serveWeb ? 'servido por este processo' : 'Vite (dev, porta 5173)'}\n`);
  });
}

void start();

async function shutdown(signal: string) {
  console.log(`\n${signal} recebido, encerrando...`);
  server?.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

export { app };
