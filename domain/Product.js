
class Product {
    constructor(id, name, brand, category, price, description, stockQuantity) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.price = price;
        this.description = description;
        this.stockQuantity = stockQuantity;
    }

    isAvailable() {
        return this.stockQuantity > 0;
    }

    updatePrice(newPrice) {
        if (newPrice >= 0) {
            this.price = newPrice;
        }
    }
}

module.exports = Product;
