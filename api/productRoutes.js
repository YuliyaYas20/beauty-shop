const express = require("express");
const productService = require("../service/productService");

const router = express.Router();

// Отримати всі товари
router.get("/", async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({
            error: "InternalServerError",
            code: "DATABASE_ERROR",
            details: []
        });
    }
});

// Отримати товар за ID
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        const product = await productService.getProductById(id);

        if (!product) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({
            error: "InternalServerError",
            code: "DATABASE_ERROR",
            details: []
        });
    }
});


// Створити новий товар
router.post("/", async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
    } catch (err) {
        if (err.error === "ValidationError") {
            return res.status(400).json(err);
        }

        res.status(500).json({
            error: "InternalServerError",
            code: "DATABASE_ERROR",
            details: []
        });
    }
});


// Оновити товар
router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        const product = await productService.updateProduct(id, req.body);

        if (!product) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        res.status(200).json(product);
    } catch (err) {
        if (err.error === "ValidationError") {
            return res.status(400).json(err);
        }

        res.status(500).json({
            error: "InternalServerError",
            code: "DATABASE_ERROR",
            details: []
        });
    }
});

// Видалити товар
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        const deleted = await productService.deleteProduct(id);

        if (!deleted) {
            return res.status(404).json({
                error: "NotFoundError",
                code: "PRODUCT_NOT_FOUND",
                details: []
            });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({
            error: "InternalServerError",
            code: "DATABASE_ERROR",
            details: []
        });
    }
});


module.exports = router;