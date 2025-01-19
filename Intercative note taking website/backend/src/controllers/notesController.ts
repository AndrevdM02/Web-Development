import { Request, Response } from 'express';
import pool from '../db/connection'; //pool is the connection pool connecting to the DB

//get all note info
export const getNotes = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM Notes ORDER BY edited_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//get notes by owner ID
export const getNotesByOwnerId = async (req: Request, res: Response) => {
    const ownerId = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM Notes WHERE user_id = $1 AND category IS NULL ORDER BY edited_at DESC', [ownerId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//get note by note ID
export const getNoteById = async (req: Request, res: Response) => {
    const note_id = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM Notes WHERE note_id = $1', [note_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getNotesForBooks = async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id);
    const category = parseInt(req.params.category);
    try {
        const result = await pool.query('SELECT * FROM Notes WHERE user_id = $1 AND category = $2 ORDER BY edited_at DESC', [user_id, category]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getNoteByName = async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id);
    const note_name = req.params.name as string;
    try {
        const result = await pool.query('SELECT * FROM Notes WHERE user_id = $1 AND note_name = $2 AND category IS NULL ORDER BY edited_at DESC', [user_id, note_name]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

export const getNoteByNameCategory = async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id);
    const note_name = req.params.name as string;
    const category = parseInt(req.params.category);
    try {
        const result = await pool.query('SELECT * FROM Notes WHERE user_id = $1 AND note_name = $2 AND category = $3 ORDER BY edited_at DESC', [user_id, note_name, category]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

//create a new note
export const createNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const title = req.body.note_name as string;
    const category = req.body.category as number | null;
    try {
        if (category === null) {
            const result = await pool.query('INSERT INTO Notes (user_id, note_name) VALUES ($1, $2)', [user_id, title]);
            res.json(result.rows);
        } else {
            const result = await pool.query('INSERT INTO Notes (user_id, note_name, category) VALUES ($1, $2, $3)', [user_id, title, category]);
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//delete a note
export const deleteNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const note_name = req.body.note_name as string;
    const category = req.body.category as number | null;
    try {
        if (category === null) {
            const result = await pool.query('DELETE FROM Notes WHERE note_name = $1 AND user_id = $2 AND category IS NULL', [note_name, user_id]);
        } else {
            const result = await pool.query('DELETE FROM Notes WHERE note_name = $1 AND user_id = $2 AND category = $3', [note_name, user_id, category]);
        }
        res.json(note_name);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

//Rename Note
export const updateNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const category = req.body.category as number | null;
    const old_name = req.body.old_name as string;
    const new_name = req.body.new_name as string;
    try {
        if (category === null) {
            const result = await pool.query('UPDATE Notes SET note_name = $2 WHERE user_id = $1 AND note_name = $3 AND category IS NULL', [user_id, new_name, old_name]);
            res.json(result.rows);
        } else {
            const result = await pool.query('UPDATE Notes SET note_name = $2 WHERE user_id = $1 AND note_name = $3 AND category = $4', [user_id, new_name, old_name, category]);
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

//Save the note
export const saveNote =  async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const note_id = req.body.note_id as number;
    const content = req.body.content as string;
    try {
        const result = await pool.query('UPDATE Notes SET content = $2, edited_at = NOW() + INTERVAL \'2 hours\' WHERE user_id = $1 AND note_id = $3', [user_id, content, note_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

//Save a shared note
export const saveSharedNote =  async (req: Request, res: Response) => {
    const note_id = req.body.note_id as number;
    const content = req.body.content as string;
    try {
        const result = await pool.query('UPDATE Notes SET content = $1, edited_at = NOW() WHERE note_id = $2', [content, note_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

// Move the note
export const moveNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const note_name = req.body.note_name as string;
    const category = req.body.category as null | number;
    try {
        if (category === null) {
            const result = await pool.query('UPDATE Notes SET category = NULL WHERE user_id = $1 AND note_name = $2', [user_id, note_name]);
            res.json(result.rows);
        } else {
            const result = await pool.query('UPDATE Notes SET category = $3 WHERE user_id = $1 AND note_name = $2', [user_id, note_name, category]);
            res.json(result.rows);
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}