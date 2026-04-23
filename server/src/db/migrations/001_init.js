export const up = async (knex) => {
    // Пользователи
    await knex.schema.createTableIfNotExists('users', (table) => {
        table.increments('vk_id').primary();
        table.string('first_name');
        table.string('last_name');
        table.string('avatar');
        table.json('settings').defaultTo('{}');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Категории
    await knex.schema.createTableIfNotExists('categories', (table) => {
        table.increments('id').primary();
        table.integer('owner_id').references('vk_id').inTable('users').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('color').defaultTo('#4A90E2');
        table.string('icon').defaultTo('📌');
        table.boolean('is_system').defaultTo(0);
        table.unique(['owner_id', 'name']);
    });

    // Задачи
    await knex.schema.createTableIfNotExists('tasks', (table) => {
        table.increments('id').primary();
        table.integer('owner_id').references('vk_id').inTable('users').onDelete('CASCADE');
        table.string('title').notNullable();
        table.text('description');
        table.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
        table.timestamp('due_date');
        table.enu('priority', ['low', 'medium', 'high']).defaultTo('medium');
        table.enu('status', ['todo', 'in_progress', 'done', 'archived']).defaultTo('todo');
        table.string('repeat_rule');
        table.integer('assigned_to').references('vk_id').inTable('users');
        table.timestamp('completed_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Системные категории
    const systemCategories = [
        { name: '👶 Дети', color: '#4C6EF5', icon: '👶', is_system: 1 },
        { name: '🏠 Дом', color: '#D97706', icon: '🏠', is_system: 1 },
        { name: '💼 Бизнес', color: '#2F855A', icon: '💼', is_system: 1 },
        { name: '📱 Контент', color: '#805AD5', icon: '📱', is_system: 1 },
        { name: '❤️ Себя', color: '#E53E3E', icon: '❤️', is_system: 1 },
    ];

    for (const cat of systemCategories) {
        await knex('categories').insert({ ...cat, owner_id: 0 });
    }
};

export const down = async (knex) => {
    await knex.schema.dropTableIfExists('tasks');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('users');
};