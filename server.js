const express = require("express");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Beauty Shop - сервер працює!");
});

app.get("/items", (req, res) => {
  db.all("SELECT * FROM items", [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: "Помилка отримання товарів",
      });
    }

    res.json(rows);
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Beauty Shop",
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
