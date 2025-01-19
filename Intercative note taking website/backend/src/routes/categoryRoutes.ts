import express, { Router } from 'express';
import { getNotes, getNotesByOwnerId, getNoteById, createNote, deleteNote } from '../controllers/notesController';
import { createCategory, deleteCategory, getCategories, getCategoryByUserId, updateCategoryName, getCategoryByName, getCategoryByCategoryId } from '../controllers/categoriesController';
import { authenticatedUser } from '../start_server';

const router = Router();

router.use(express.json({type: "*/*"})); //enable JSON parsing

router.get('/shared/:category_id', getCategoryByCategoryId);

router.use(authenticatedUser); // Everything past this point requires a JWT to work

router.get('/', getCategories);

router.post('/delete', deleteCategory);

router.post('/new', createCategory);

router.post('/update_name', updateCategoryName);

router.get('/:id', getCategoryByUserId);

router.get('/:user_id/:category_name', getCategoryByName);



export default router;
