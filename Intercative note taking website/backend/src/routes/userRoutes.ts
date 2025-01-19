import express, { Router } from 'express';
import { createUser, getUsers, deleteUser, createUserImage, getDisplayInfo, getUserById, updateUserInfo, updateUserPassword, checkIfExists, getUserByEmail } from '../controllers/usersController';
import { authenticatedUser } from '../start_server';

const router = Router();

router.use(express.json({type: "*/*"})); //enable JSON parsing



router.post('/exists', checkIfExists);


/**
 * @swagger
 * /api/users/new:
 *   post:
 *     summary: Add a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 user_name:
 *                   type: string
 *                 email:
 *                   type: string
 */
router.post('/new', createUser);



/**
 * @swagger
 * /api/users/displayInfo/{id}:
 *  get:
 *   summary: Get display information for a user
 *   tags: [Users]
 *   parameters:
 *   - in: path
 *     name: id
 *     schema:
 *       type: string
 *     required: true
 *     description: The user ID
 *  responses:
 *   200:
 *   description: The display information for the user
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Users
 *
 */
router.get('/displayInfo/:user_name', getDisplayInfo);

router.get('/info/:email', getUserByEmail);

router.use(authenticatedUser); // Everything past this point requires a JWT to work

/**
 * @swagger
 * /api/users/{id}:
 *  get:
 *   summary: Get User matching ID
 *   tags: [Users]
 *  responses:
 *   200:
 *   description: The user matching the ID
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Users
 *
 */
router.get('/:id', getUserById);

/**
* @swagger
* /api/users/new:
*  get:
*   summary: Delete a user
*   tags: [Users]
*   requestBody:
*       required: true
*       content:
*           application/json:
*               schema:
*                   type: object
*                   properties:
*                       user_name:
*                           type: string

*  responses:
*   201:
*   description: The user was successfully deleted
*  content:
*      application/json:
*          schema:
*              type: array
*              items: #/components/schemas/Users
*
*/
router.post('/delete', deleteUser);


/**
 * @swagger
 * /api/users/addImage:
 *  post:
 *   summary: Add an image for a user
 *   tags: [Users]
 *   requestBody:
 *       required: true
 *       content:
 *           application/json:
 *               schema:
 *                   type: object
 *                   properties:
 *                       user_id:
 *                           type: string
 *                       image_url:
 *                           type: string
 *  responses:
 *   200:
 *   description: The image was successfully added
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Users
 *
 */
router.post('/image', createUserImage);

/**
 * @swagger
 * /api/users/update:
 *  post:
 *   summary: Update user information
 *   tags: [Users]
 *   requestBody:
 *       required: true
 *       content:
 *           application/json:
 *               schema:
 *                   type: object
 *                   properties:
 *                       user_id:
 *                           type: string
 *                       user_name:
 *                           type: string
 *                       email:
 *                           type: string
 *  responses:
 *   200:
 *   description: The user information was successfully updated
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Users
 *
 */
router.post('/update', updateUserInfo);

router.post('/password_update', updateUserPassword)

/**
 * @swagger
 * /api/users:
 *  get:
 *   summary: Get all Users
 *   tags: [Users]
 *  responses:
 *   200:
 *   description: The list of users with their information
 *  content:
 *      application/json:
 *          schema:
 *              type: array
 *              items: #/components/schemas/Users
 *
 */
router.get('/', getUsers);

export default router;
