import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireJwt } from '../middleware/require-jwt.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/rotate-key', requireJwt, authController.rotateKey);

export default router;
