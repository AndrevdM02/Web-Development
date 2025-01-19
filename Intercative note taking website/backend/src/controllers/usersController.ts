import { Request, Response } from 'express';
import crypto from "node:crypto";
import pool from '../db/connection'; //pool is the connection pool connecting to the DB
import { saltAndHashPassword } from '../utils/saltAndHashPassword';

//get all user info
// TODO: add permissions/security stuff (e.g. hide passwords, salt values, etc. by default)
export const getUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM Users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//get user info by ID
// TODO: add permissions/security stuff (e.g. hide passwords, salt values, etc. by default)
export const getUserById = async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Get user by email
export const getUserByEmail = async (req: Request, res: Response) => {
    const email = req.params.email as string;
    try {
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//create a new user
export const createUser = async (req: Request, res: Response) => {
    const user_name = req.body.user_name as string;
    let password = req.body.password as string;
    const email = req.body.email as string;
    password = password.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    try {
        const salt = crypto.randomBytes(128).toString('base64');
        const pwHash = saltAndHashPassword(password, salt);
        const result = await pool.query('INSERT INTO Users (user_name, password, email, salt_password) VALUES ($1, $2, $3, $4) RETURNING user_id', [user_name, pwHash, email, salt]); //This needs to be salted and hashed
        res.json({ user_id: result.rows[0].user_id });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//delete a user
export const deleteUser = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    try {
        const result = await pool.query('DELETE FROM Users WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//add user image
export const createUserImage = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const image_url = req.body.image_url as string;
    try {
        const result = await pool.query('UPDATE Users SET image_url = $1 WHERE user_id = $2', [image_url, user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//get user display info
export const getDisplayInfo = async (req: Request, res: Response) => {
    const user_name = req.params.user_name as string;
    try {
        const result = await pool.query('SELECT user_name, image_URL FROM Users WHERE user_name = $1', [user_name]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//update user_name and password info
export const updateUserInfo = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const user_name = req.body.user_name as string;
    const email = req.body.email as string;
    try {
        const result = await pool.query('UPDATE Users SET user_name = $1, email = $2 WHERE user_id = $3', [user_name, email, user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Updates the users password
export const updateUserPassword = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    let password = req.body.password as string;
    password = password.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    try {
        const salt = crypto.randomBytes(128).toString('base64');
        const pwHash = saltAndHashPassword(password, salt);
        const result = await pool.query('UPDATE Users SET password = $1, salt_password = $2 WHERE user_id = $3', [pwHash, salt, user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const checkIfExists = async (req: Request, res: Response) => {
    const user_name = req.body.user_name as string;
    const email = req.body.email as string;
    let user_exists = false;
    let email_exists = false;
    try {
        const res_name = await pool.query('SELECT * FROM Users WHERE user_name = $1', [user_name]);
        const res_email = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (res_name.rowCount !== 0) {
            user_exists = true;
        }
        if (res_email.rowCount !== 0) {
            email_exists = true;
        }
        if (user_exists === true && email_exists === true) {
            res.json({user_used:'username', email_used:'email'});
        } else if (user_exists === true && email_exists === false) {
            res.json({user_used:'username', email_used:'none'});
        } else if (user_exists == false && email_exists === true) {
            res.json({user_used:'none', email_used:'email'});
        } else {
            res.json({user_used:'none', email_used:'none'});
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}
