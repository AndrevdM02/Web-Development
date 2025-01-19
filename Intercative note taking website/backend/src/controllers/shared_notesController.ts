import { Request, Response } from 'express';
import pool from '../db/connection'; //pool is the connection pool connecting to the DB

//get all shared_note info
export const getSharedNotes = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM Shared_Notes');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getSharedNotesByUserID = async (req: Request, res: Response) => {
    try {
        const results = await pool.query('SELECT * FROM Shared_Notes WHERE user_id = $1', [req.params.id]);
        res.json(results.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message,
                            message: "Error getting shared notes by user_id", 
                            user_id: req.params.user_id});
        
    }
}

export const getSharedNotesByNoteID = async (req: Request, res: Response) => {
    try {
        const results = await pool.query('SELECT * FROM Shared_Notes WHERE note_id = $1', [req.params.id]);
        res.json(results.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message,
                            message: "Error getting shared notes by note_id", 
                            note_id: req.params.note_id});
        
    }
}

export const getSharedNotesByUserIDAndNoteID = async (req: Request, res: Response) => {
    try {
        const results = await pool.query('SELECT * FROM Shared_Notes WHERE user_id = $1 AND note_id = $2', [req.params.user_id, req.params.note_id]);
        res.json(results.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message,
                            message: "Error getting shared notes by user_id and note_id", 
                            user_id: req.params.user_id,
                            note_id: req.params.note_id});
        
    }
}

export const createSharedNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const note_id = req.body.note_id as number;
    try {
        const result = await pool.query('INSERT INTO shared_notes (user_id, note_id) VALUES ($1, $2)', [user_id, note_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const removeSharedNote = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const note_id = req.body.note_id as number;
    try {
        const result = await pool.query('DELETE FROM shared_notes WHERE user_id = $1 AND note_id = $2', [user_id, note_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
