import { Router } from 'express';
import { listNotes, getNote, createNote, updateNote, deleteNote } from './note.controller';
import { createNoteRules, updateNoteRules, listNoteRules } from './note.validation';

const router = Router({ mergeParams: true });

router.get('/',      listNoteRules,   listNotes);
router.get('/:id',                    getNote);
router.post('/',     createNoteRules, createNote);
router.patch('/:id', updateNoteRules, updateNote);
router.delete('/:id',                 deleteNote);

export default router;
