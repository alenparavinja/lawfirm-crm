import { Router } from 'express';
import {
  listStaff, getStaffMember, createStaffMember, updateStaffMember, deleteStaffMember,
} from './staff.controller';
import { createStaffRules, updateStaffRules, listStaffRules } from './staff.validation';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/',      listStaffRules,   listStaff);
router.get('/:id',                     getStaffMember);
router.post('/',     createStaffRules, createStaffMember);
router.patch('/:id', updateStaffRules, updateStaffMember);
router.delete('/:id',                  deleteStaffMember);

export default router;