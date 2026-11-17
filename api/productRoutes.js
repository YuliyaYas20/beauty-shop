
const express = require("express");
const productService = require("../service/productService");

const router = express.Router();

// Єдиний формат помилок
function sendError(req, res, status, error, code, details = []) {
    return res.status(status).json({
        error,
        code,
        details,
        requestId: req.requestId
    });
}

// Зберігання результатів POST за Idempotency-Key
const idempotencyStore = new Map();

// Отримати всі товари
router.get("/", async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        return res.status(200).json(products);
    } catch (err) {
        return sendError(
            req, res, 500,
            "InternalServerError",
            "DATABASE_ERROR"
        );
    }
});

// Отримати товар за ID
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        const product = await productService.getProductById(id);

        if (!product) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        return res.status(200).json(product);
    } catch (err) {
        return sendError(
            req, res, 500,
            "InternalServerError",
            "DATABASE_ERROR"
        );
    }
});

// Створити новий товар
router.post("/", async (req, res) => {
    const key = req.get("Idempotency-Key");

    // Без ключа повертаємо помилку 400
    if (!key) {
        return sendError(
            req, res, 400,
            "ValidationError",
            "IDEMPOTENCY_KEY_REQUIRED"
        );
    }

    const createProduct = async () => {
        try {
            const product = await productService.createProduct(req.body);

            return {
                status: 201,
                body: product
            };
        } catch (err) {
            if (err.error === "ValidationError") {
                return {
                    status: 400,
                    body: err
                };
            }

            return {
                status: 500,
                body: {
                    error: "InternalServerError",
                    code: "DATABASE_ERROR",
                    details: []
                }
            };
        }
    };

    // Один ключ — один результат
    // Працює також для одночасних запитів
    if (!idempotencyStore.has(key)) {
        idempotencyStore.set(key, createProduct());
    }

    const result = await idempotencyStore.get(key);

    return res.status(result.status).json({
        ...result.body,
        ...(result.status >= 400
            ? { requestId: req.requestId }
            : {})
    });
});

// Оновити товар
router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        const product = await productService.updateProduct(id, req.body);

        if (!product) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        return res.status(200).json(product);
    } catch (err) {
        if (err.error === "ValidationError") {
            return sendError(
                req, res, 400,
                err.error,
                err.code || "INVALID_PRODUCT_DATA",
                err.details || []
            );
        }

        return sendError(
            req, res, 500,
            "InternalServerError",
            "DATABASE_ERROR"
        );
    }
});

// Видалити товар
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        const deleted = await productService.deleteProduct(id);

        if (!deleted) {
            return sendError(
                req, res, 404,
                "NotFoundError",
                "PRODUCT_NOT_FOUND"
            );
        }

        return res.status(204).send();
    } catch (err) {
        return sendError(
            req, res, 500,
            "InternalServerError",
            "DATABASE_ERROR"
        );
    }
});

module.exports = router;
