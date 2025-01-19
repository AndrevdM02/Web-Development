import express, { Router } from 'express';
import { getNotes, getNotesByOwnerId, getNoteById, createNote, deleteNote } from '../controllers/notesController';
import { getSharedNotes, getSharedNotesByNoteID, getSharedNotesByUserID, getSharedNotesByUserIDAndNoteID, createSharedNote, removeSharedNote } from '../controllers/shared_notesController';
import e from 'express';
import { authenticatedUser } from '../start_server';

const router = Router();

router.use(express.json({type: "*/*"})); //enable JSON parsing

router.use(authenticatedUser); // Everything past this point requires a JWT to work

router.get('/', getSharedNotes);

router.get('/user/:id', getSharedNotesByUserID);

router.get('/note/:id', getSharedNotesByNoteID);

router.get('/user/:user_id/note/:note_id', getSharedNotesByUserIDAndNoteID);

router.post('/new', createSharedNote);

router.post('/remove', removeSharedNote);

export default router;
