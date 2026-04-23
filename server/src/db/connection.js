import knex from 'knex';
import knexConfig from '../../knexfile.js';
import fs from 'fs';
import path from 'path';

// Создаём экземпляр knex
const db = knex(knexConfig);

// 🔥 Гарантируем, что папка для БД существует
const dbPath = knexConfig.connection.filename;
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created DB directory: ${dbDir}`);
}

// 🔥 Проверяем, что файл БД можно создать/открыть
try {
    // Пробуем записать тестовый файл
    const testFile = path.join(dbDir, '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Write permissions OK');
} catch (e) {
    console.error('❌ Cannot write to DB directory:', e.message);
    console.error('💡 Try running WebStorm as Administrator');
}

// Включаем WAL-режим (для производительности)
db.raw('PRAGMA journal_mode = WAL').catch(err => {
    console.warn('⚠️ Could not enable WAL mode:', err.message);
});

export default db;