import { Router } from 'express';
import {
  listDocuments, getDocument, createDocument, updateDocument, deleteDocument,
} from './document.controller';
import { createDocumentRules, updateDocumentRules, listDocumentRules } from './document.validation';

// mergeParams exposes :caseId from the parent case router.
const router = Router({ mergeParams: true });

router.get('/',      listDocumentRules,   listDocuments);
router.get('/:id',                        getDocument);
router.post('/',     createDocumentRules, createDocument);
router.patch('/:id', updateDocumentRules, updateDocument);
router.delete('/:id',                     deleteDocument);

export default router;
