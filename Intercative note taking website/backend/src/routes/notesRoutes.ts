import express, { Router } from 'express';
import { getNotes, getNotesByOwnerId, getNoteById, createNote, deleteNote, getNotesForBooks, updateNote, getNoteByName, getNoteByNameCategory, saveNote, moveNote, saveSharedNote } from '../controllers/notesController';
import { authenticatedUser } from '../start_server';

const router = Router();

router.use(express.json({type: "*/*"})); //enable JSON parsing

router.use(authenticatedUser); // Everything past this point requires a JWT to work

/**
 * @swagger
 * /api/notes:
 *  get:
 *   summary: Get all notes
 *   tags: [Notes]
 *  responses:
 *   200:
 *   description: The list of notes
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Notes
 *
 */
router.get('/', getNotes);

/**
 * @swagger
 * /api/notes/ownerId/{id}:
 *  get:
 *   summary: Get all notes by owner ID
 *   tags: [Notes]
 *  parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The owner ID
 *     schema:
 *      type: integer
 *  responses:
 *   200:
 *   description: The list of notes
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Notes
 *
 */
router.get('/owner/:id', getNotesByOwnerId);

/**
 * @swagger
 * /api/note/noteId/{id}:
 * get:
 *  summary: Get note by note ID
 *  tags: [Notes]
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   description: The note ID
 *   schema:
 *      type: integer
 *
 * responses:
 *  200:
 *      description: The note corresponding to the note ID
 *      content:
 *          application/json:
 *              schema:
 *                  items: #/components/schemas/Notes
 */
router.get('/noteId/:id', getNoteById);

router.get('/books/:user_id/:category', getNotesForBooks)

router.get('/:user_id/:name', getNoteByName)

router.get('/:user_id/:name/:category', getNoteByNameCategory)

/**
 * @swagger
 * /api/note/new:
 *  post:
 *   summary: Create a new note
 *   tags: [Notes]
 *   requestBody:
 *       required: true
 *       content:
 *           application/json:
 *               schema:
 *                   type: object
 *                   properties:
 *                       title:
 *                           type: string
 *                       content:
 *                           type: string
 *                       ownerId:
 *                           type: integer
 *  responses:
 *   201:
 *   description: The note was successfully created
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Notes
 *
 */
router.post('/new', createNote);

/**
 * @swagger
 * /api/note/delete:
 *  post:
 *   summary: Delete a note
 *   tags: [Notes]
 *   requestBody:
 *       required: true
 *       content:
 *           application/json:
 *               schema:
 *                   type: object
 *                   properties:
 *                       noteId:
 *                           type: integer
 *  responses:
 *   200:
 *   description: The note was successfully deleted
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Notes
 *
 */
router.post('/delete', deleteNote);

router.use(authenticatedUser); // Everything past this point requires a JWT to work

router.post('/update', updateNote)

router.post('/save', saveNote)

router.post('/shared/save', saveSharedNote)

router.post('/move_note', moveNote)

export default router;
