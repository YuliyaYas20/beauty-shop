const db = require('../database');

function getAllProducts() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM items', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getProductById(id) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM items WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            }
        );
    });
}


async function createProduct(data) {
    const { name, brand, category, price, description, stockQuantity } = data;

    const details = [];

    if (typeof name !== 'string' || !name.trim()) {
        details.push({ field: 'name', message: 'Name is required' });
    }

    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        details.push({ field: 'price', message: 'Price must be a non-negative number' });
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        details.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative integer' });
    }

    if (details.length > 0) {
        throw {
            error: 'ValidationError',
            code: 'INVALID_PRODUCT_DATA',
            details
        };
    }

    const result = await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO items
            (name, brand, category, price, description, stockQuantity)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name.trim(), brand ?? null, category ?? null,
             price, description ?? null, stockQuantity],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });

    return getProductById(result);
}


async function updateProduct(id, data) {
    const existingProduct = await getProductById(id);

    if (!existingProduct) {
        return null;
    }

    const { name, brand, category, price, description, stockQuantity } = data;
    const details = [];

    if (typeof name !== 'string' || !name.trim()) {
        details.push({ field: 'name', message: 'Name is required' });
    }

    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        details.push({ field: 'price', message: 'Price must be a non-negative number' });
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        details.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative integer' });
    }

    if (details.length > 0) {
        throw {
            error: 'ValidationError',
            code: 'INVALID_PRODUCT_DATA',
            details
        };
    }

    await new Promise((resolve, reject) => {
        db.run(
            `UPDATE items
             SET name = ?, brand = ?, category = ?, price = ?,
                 description = ?, stockQuantity = ?
             WHERE id = ?`,
            [
                name.trim(),
                brand ?? null,
                category ?? null,
                price,
                description ?? null,
                stockQuantity,
                id
            ],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );
    });

    return getProductById(id);
}


async function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM items WHERE id = ?',
            [id],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}


module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};