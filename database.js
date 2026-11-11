
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./beautyshop.db', (err) => {
    if (err) {
        console.error('Помилка бази даних:', err.message);
    } else {
        console.log('Базу даних підключено!');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    db.get('SELECT COUNT(*) AS count FROM items', (err, row) => {
        if (err) {
            console.error('Помилка:', err.message);
            return;
        }

        if (row.count === 0) {
            const products = [
                'Крем для обличчя',
                'Шампунь для волосся',
                'Маска для обличчя',
                'Сироватка з вітаміном C',
                'Бальзам для губ'
            ];

            const stmt = db.prepare('INSERT INTO items (name) VALUES (?)');

            products.forEach(product => stmt.run(product));
            stmt.finalize();

            console.log('Косметичні товари додано!');
        }
    });
});

module.exports = db;
