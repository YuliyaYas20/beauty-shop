
const test = require("node:test");
const assert = require("node:assert/strict");
const service = require("../service/productService");

test("Успішне отримання товару за ID", async () => {
    const createdProduct = await service.createProduct({
        name: "Тестовий крем",
        brand: "Beauty Shop",
        category: "Догляд за обличчям",
        price: 150,
        description: "Товар для автоматичного тестування",
        stockQuantity: 5
    });

    try {
        const product = await service.getProductById(createdProduct.id);

        assert.ok(product);
        assert.equal(product.id, createdProduct.id);
        assert.equal(product.name, "Тестовий крем");
    } finally {
        await service.deleteProduct(createdProduct.id);
    }
});

test("Помилка при створенні товару з від'ємною ціною", async () => {
    await assert.rejects(
        service.createProduct({
            name: "Тест",
            price: -100,
            stockQuantity: 5
        }),
        (err) => {
            assert.equal(err.error, "ValidationError");
            assert.equal(err.code, "INVALID_PRODUCT_DATA");
            return true;
        }
    );
});
