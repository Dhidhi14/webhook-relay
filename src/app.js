import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger.js';
import { AppError } from './utils/app-error.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import endpointRoutes from './routes/endpoint.routes.js';
import eventRoutes from './routes/event.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import { requireJwt } from './middleware/require-jwt.js';
import { authLimiter, apiLimiter } from './middleware/rate-limit.js';
import * as deliveryController from './controllers/delivery.controller.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';

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

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

if (process.env.NODE_ENV === 'test') {
  app.use('/api/auth', authRoutes);
  app.use('/api/endpoints', endpointRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.get('/api/stats', requireJwt, deliveryController.stats);
} else {
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/endpoints', apiLimiter, endpointRoutes);
  app.use('/api/events', apiLimiter, eventRoutes);
  app.use('/api/deliveries', apiLimiter, deliveryRoutes);
  app.get('/api/stats', apiLimiter, requireJwt, deliveryController.stats);
}

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
