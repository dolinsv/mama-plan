// 🔥 Правильный импорт для CommonJS модуля в ES modules проекте
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db', 'test.sqlite');

console.log('Testing SQLite at:', dbPath);

// 🔥 Правильное создание подключения
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Failed to open DB:', err.message);
        process.exit(1);
    }
    console.log('✅ SQLite opened successfully!');

    db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)', (err) => {
        if (err) console.error('❌ Create table failed:', err.message);
        else console.log('✅ Table created!');
        db.close(() => console.log('👋 Done'));
    });
});