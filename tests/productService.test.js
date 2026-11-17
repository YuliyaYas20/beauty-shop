const test = require("node:test");
const assert = require("node:assert/strict");
const service = require("../service/productService");

test("Успішне отримання товару за ID", async () => {
    const product = await service.getProductById(1);

    assert.ok(product);
    assert.equal(product.id, 1);
    assert.equal(typeof product.name, "string");
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