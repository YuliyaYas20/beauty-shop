const express = require("express");
const productRoutes = require("./api/productRoutes");

const app = express();
const PORT = 3000;

// Дозволяємо серверу приймати JSON
app.use(express.json());

// Підключаємо файли сайту
app.use(express.static("public"));

// Підключаємо маршрути товарів
app.use("/items", productRoutes);

// Перевірка роботи сервера
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});