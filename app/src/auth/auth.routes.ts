import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from './auth.controller';
import { requireAuth } from './auth.middleware';

const router = Router();

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

// Returns the authenticated staff member's own record.
router.get('/me', requireAuth, me);

export default router;
