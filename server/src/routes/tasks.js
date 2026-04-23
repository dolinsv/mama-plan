import express from 'express';
import { z } from 'zod';
import db from '../db/connection.js';

const router = express.Router();

const taskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    category_id: z.number().int().optional(),
    due_date: z.string().datetime().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional()
});

// GET /api/tasks
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        const vkId = req.user.vkId;

        let query = db('tasks').where('owner_id', vkId).where('status', '!=', 'archived');

        if (status && status !== 'all') query = query.where('status', status);
        if (category) query = query.where('category_id', category);

        const tasks = await query
            .leftJoin('categories', 'tasks.category_id', 'categories.id')
            .select(
                'tasks.*',
                'categories.name as category_name',
                'categories.color as category_color',
                'categories.icon as category_icon'
            )
            .orderBy('created_at', 'desc');

        res.json(tasks);
    } catch (e) {
        console.error('Get tasks error:', e);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks
router.post('/', async (req, res) => {
    try {
        const validated = taskSchema.parse(req.body);
        const vkId = req.user.vkId;

        const [taskId] = await db('tasks').insert({
            ...validated,
            owner_id: vkId,
            status: validated.status || 'todo',
            priority: validated.priority || 'medium'
        });

        const [newTask] = await db('tasks')
            .where('id', taskId)
            .leftJoin('categories', 'tasks.category_id', 'categories.id')
            .select('tasks.*', 'categories.name as category_name', 'categories.color as category_color');

        res.status(201).json(newTask);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: e.errors });
        }
        console.error('Create task error:', e);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validated = taskSchema.partial().parse(req.body);
        const vkId = req.user.vkId;

        const [existing] = await db('tasks').where({ id, owner_id: vkId });
        if (!existing) return res.status(404).json({ error: 'Task not found' });

        if (validated.status === 'done' && existing.status !== 'done') {
            validated.completed_at = new Date().toISOString();
        }

        await db('tasks').where({ id, owner_id: vkId }).update(validated);

        const [updated] = await db('tasks')
            .where('id', id)
            .leftJoin('categories', 'tasks.category_id', 'categories.id')
            .select('tasks.*', 'categories.name as category_name', 'categories.color as category_color');

        res.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: e.errors });
        }
        console.error('Update task error:', e);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id (архивирование)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vkId = req.user.vkId;

        const [updated] = await db('tasks')
            .where({ id, owner_id: vkId })
            .update({ status: 'archived', completed_at: new Date().toISOString() });

        if (!updated) return res.status(404).json({ error: 'Task not found' });

        res.json({ success: true });
    } catch (e) {
        console.error('Archive task error:', e);
        res.status(500).json({ error: 'Failed to archive task' });
    }
});

export default router;