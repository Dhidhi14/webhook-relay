import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger.js';
import { AppError } from './utils/app-error.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import endpointRoutes from './routes/endpoint.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/endpoints', endpointRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
    },
  });
});

app.use((req, res, next) => {
  next(new AppError(404, 'Route not found'));
});

app.use(errorHandler);

export default app;
