
class Order {
    constructor(id, userId) {
        this.id = id;
        this.userId = userId;
        this.items = [];
        this.totalPrice = 0;
        this.status = "new";
        this.createdAt = new Date();
    }

    addItem(product, quantity) {
        if (!product.isAvailable() || quantity <= 0 ||
            quantity > product.stockQuantity) {
            return;
        }

        this.items.push({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price
        });

        this.totalPrice = this.calculateTotal();
    }

    calculateTotal() {
        return this.items.reduce((total, item) => {
            return total + item.unitPrice * item.quantity;
        }, 0);
    }
}

module.exports = Order;
