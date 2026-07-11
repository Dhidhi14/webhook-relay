import { Router } from 'express';
import { requireApiKey } from '../middleware/require-api-key.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema } from '../validators/event.validator.js';
import * as eventController from '../controllers/event.controller.js';

const router = Router();

router.post('/', requireApiKey, validate(createEventSchema), eventController.ingest);

export default router;
