import { Request, Response } from 'express';
import pool from '../db/connection'; //pool is the connection pool connecting to the DB

//get all category info
export const getCategories = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM "Categories"');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const user_id = req.body.user_id;
    const category_name = req.body.category_name;
    try {
        const result = await pool.query('DELETE FROM "Categories" WHERE user_id = $1 AND category_name = $2', [user_id, category_name]);
        res.json(result.rows);
        console.log("Category deleted: " + category_name);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

export const createCategory = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const category_name = req.body.category_name as string;
    try {
        const result = await pool.query('INSERT INTO "Categories" (user_id, category_name) VALUES ($1, $2)', [user_id, category_name]);
        res.json(result.rows);
        console.log("Category created: " + category_name);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateCategoryName = async (req: Request, res: Response) => {
    const user_id = req.body.user_id as number;
    const category_name = req.body.category_name as string;
    const new_category_name = req.body.new_category_name as string;
    try {
        const result = await pool.query('UPDATE "Categories" SET category_name = $1 WHERE category_name = $2 AND user_id = $3', [new_category_name, category_name, user_id]);
        res.json(result.rows);
        console.log("Category updated: " + category_name + " to " + new_category_name);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getCategoryByUserId = async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM "Categories" WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getCategoryByCategoryId = async (req: Request, res: Response) => {
    const category_id = parseInt(req.params.category_id);
    try {
        const result = await pool.query('SELECT * FROM "Categories" WHERE category_id = $1', [category_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message, category_id: "2" });
    }
};

export const getCategoryByName = async (req: Request, res: Response) => {
    const user_id = parseInt(req.params.user_id);
    const category_name = req.params.category_name as string;
    try {
        const result = await pool.query('SELECT * FROM "Categories" WHERE user_id = $1 AND category_name = $2', [user_id, category_name]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

