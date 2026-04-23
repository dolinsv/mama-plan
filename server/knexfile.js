import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

config();

// 🔥 Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Абсолютный путь к папке проекта
const projectRoot = path.resolve(__dirname, '..');

// 🔥 Папка для БД
const dbDir = path.join(projectRoot, 'db');

// 🔥 Создаём папку, если не существует (используем fs из импорта)
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('📁 Created DB directory:', dbDir);
}

// 🔥 Полный путь к файлу БД
const dbPath = path.join(dbDir, 'mama-plan.sqlite');

console.log('🗄️ Database path:', dbPath);

export default {
    client: 'sqlite3',
    connection: {
        filename: dbPath
    },
    useNullAsDefault: true,

    // 🔥 Важно для SQLite
    acquireConnectionTimeout: 10000,

    migrations: {
        directory: path.join(__dirname, 'src', 'db', 'migrations'),
        tableName: 'knex_migrations'
    },

    // 🔥 Отладка (раскомментируйте при проблемах)
    // debug: process.env.NODE_ENV === 'development'
};