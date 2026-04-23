import express from 'express';
import { verifyVkInitData } from '../utils/vkVerify.js';
import db from '../db/connection.js';

const router = express.Router();

router.post('/verify', async (req, res) => {
    try {
        const { initData } = req.body;
        if (!initData) return res.status(400).json({ error: 'initData required' });

        const userData = await verifyVkInitData(initData, process.env.VK_APP_SECRET);

        const [user] = await db('users')
            .where('vk_id', userData.vkId)
            .select('vk_id', 'first_name', 'last_name', 'avatar', 'settings');

        res.json({
            success: true,
            user: {
                vkId: user?.vk_id,
                firstName: user?.first_name,
                lastName: user?.last_name,
                avatar: user?.avatar,
                settings: JSON.parse(user?.settings || '{}')
            }
        });
    } catch (e) {
        res.status(401).json({ error: e.message || 'Verification failed' });
    }
});

export default router;