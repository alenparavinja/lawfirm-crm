import { Router } from 'express';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from './client.controller';
import { createClientRules, updateClientRules, listClientRules } from './client.validation';

const router = Router();

router.get('/',    listClientRules,   listClients);
router.get('/:id',                   getClient);
router.post('/',   createClientRules, createClient);
router.patch('/:id', updateClientRules, updateClient);
router.delete('/:id',                deleteClient);

export default router;
