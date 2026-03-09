import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import presentationRoutes from './routes/presentations';
import codeRoutes from './routes/code';

const app = express();

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/documents', defaultLimiter, documentRoutes);
app.use('/api/presentations', defaultLimiter, presentationRoutes);
app.use('/api/code', defaultLimiter, codeRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`SkhoFlow backend running on port ${config.port}`);
});

export default app;
