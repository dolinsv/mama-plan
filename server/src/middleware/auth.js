import { verifyVkInitData } from '../utils/vkVerify.js';
import db from '../db/connection.js';

export const authMiddleware = async (req, res, next) => {
    const initData = req.headers['x-vk-init-data'];

    // 🔥 В режиме разработки разрешаем запросы без токена (для локальных тестов)
    if (process.env.NODE_ENV === 'development' && !initData) {
        req.user = { vkId: 'local_dev_user', firstName: 'Локальный Тест' };
        return next();
    }

    if (!initData) {
        return res.status(401).json({ error: 'X-VK-Init-Data header required' });
    }

    try {
        const userData = await verifyVkInitData(initData, process.env.VK_APP_SECRET);

        await db('users')
            .insert({
                vk_id: userData.vkId,
                first_name: userData.firstName,
                last_name: userData.lastName,
                avatar: userData.avatar
            })
            .onConflict('vk_id')
            .merge(['first_name', 'last_name', 'avatar']);

        req.user = { vkId: userData.vkId, firstName: userData.firstName };
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid VK signature' });
    }
};