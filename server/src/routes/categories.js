import express from 'express';
import { z } from 'zod';
import db from '../db/connection.js';

const router = express.Router();

const categorySchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icon: z.string().optional()
});

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const vkId = req.user.vkId;
        const categories = await db('categories')
            .where((qb) => qb.where('owner_id', 0).orWhere('owner_id', vkId))
            .orderBy('is_system', 'desc')
            .orderBy('name');

        res.json(categories);
    } catch (e) {
        console.error('Get categories error:', e);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const validated = categorySchema.parse(req.body);
        const vkId = req.user.vkId;

        const [categoryId] = await db('categories').insert({
            ...validated,
            owner_id: vkId,
            color: validated.color || '#4A90E2',
            icon: validated.icon || '📌',
            is_system: 0
        });

        const [newCat] = await db('categories').where('id', categoryId);
        res.status(201).json(newCat);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: e.errors });
        }
        console.error('Create category error:', e);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

export default router;