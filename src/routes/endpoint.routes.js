import { Router } from 'express';
import { requireJwt } from '../middleware/require-jwt.js';
import { validate } from '../middleware/validate.js';
import {
  createEndpointSchema,
  updateEndpointSchema,
} from '../validators/endpoint.validator.js';
import * as endpointController from '../controllers/endpoint.controller.js';

const router = Router();

router.use(requireJwt);

router.post('/', validate(createEndpointSchema), endpointController.create);
router.get('/', endpointController.list);
router.get('/:id', endpointController.get);
router.patch('/:id', validate(updateEndpointSchema), endpointController.update);
router.delete('/:id', endpointController.remove);

export default router;
