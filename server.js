
const express = require('express');
const db = require('./database');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Beauty Shop - сервер працює!');
});

app.get('/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: 'Помилка отримання товарів'
            });
        }

        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
