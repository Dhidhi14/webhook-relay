import { Router } from 'express';
import { requireJwt } from '../middleware/require-jwt.js';
import { validateQuery } from '../middleware/validate-query.js';
import { listDeliveriesQuerySchema } from '../validators/delivery.validator.js';
import * as deliveryController from '../controllers/delivery.controller.js';

const router = Router();

router.use(requireJwt);

router.get('/', validateQuery(listDeliveriesQuerySchema), deliveryController.list);
router.get('/:id', deliveryController.get);
router.post('/:id/replay', deliveryController.replay);

export default router;
