
const { randomUUID } = require("crypto");
const express = require("express");
const productRoutes = require("./api/productRoutes");

const app = express();
const PORT = 3000;

// Унікальний ідентифікатор кожного запиту
app.use((req, res, next) => {
    const requestId = req.get("X-Request-Id") || randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    next();
});

// Приймаємо JSON
app.use(express.json());

// Обмеження кількості запитів
const rateLimitStore = new Map();
const WINDOW_MS = 10000;
const MAX_REQUESTS = 8;

app.use((req, res, next) => {
    const ip = req.ip;
    const currentTime = Date.now();

    const record = rateLimitStore.get(ip) || {
        count: 0,
        startTime: currentTime
    };

    if (currentTime - record.startTime >= WINDOW_MS) {
        record.count = 0;
        record.startTime = currentTime;
    }

    record.count++;
    rateLimitStore.set(ip, record);

    if (record.count > MAX_REQUESTS) {
        const remainingSeconds = Math.max(
            1,
            Math.ceil(
                (WINDOW_MS - (currentTime - record.startTime)) / 1000
            )
        );

        res.setHeader("Retry-After", String(remainingSeconds));

        return res.status(429).json({
            error: "too_many_requests",
            code: "RATE_LIMIT_EXCEEDED",
            details: [],
            requestId: req.requestId
        });
    }

    next();
});

// Підключаємо файли сайту
app.use(express.static("public"));

// Тестування помилок і затримок
app.use("/items", async (req, res, next) => {
    if (req.get("X-Test-Error") === "503") {
        return res.status(503).json({
            error: "ServiceUnavailable",
            code: "SERVICE_UNAVAILABLE",
            details: [],
            requestId: req.requestId
        });
    }

    if (req.get("X-Test-Delay") === "2000") {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    next();
});

// Маршрути товарів
app.use("/items", productRoutes);

// Перевірка роботи сервера
app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "ok"
    });
});

// Невідомі маршрути
app.use((req, res) => {
    return res.status(404).json({
        error: "NotFoundError",
        code: "ROUTE_NOT_FOUND",
        details: [],
        requestId: req.requestId
    });
});

// Обробка інших помилок сервера
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const invalidJson = err instanceof SyntaxError && err.status === 400;

    return res.status(invalidJson ? 400 : 500).json({
        error: invalidJson ? "ValidationError" : "InternalServerError",
        code: invalidJson ? "INVALID_JSON" : "INTERNAL_ERROR",
        details: [],
        requestId: req.requestId
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
