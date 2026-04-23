import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { authMiddleware } from './src/middleware/auth.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: ['http://localhost:5173', 'https://vk.com', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.headers['x-vk-init-data']?.split('user_id=')[1]?.split('&')[0] || req.ip
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', (await import('./src/routes/auth.js')).default);
app.use('/api/tasks', authMiddleware, (await import('./src/routes/tasks.js')).default);
app.use('/api/categories', authMiddleware, (await import('./src/routes/categories.js')).default);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});