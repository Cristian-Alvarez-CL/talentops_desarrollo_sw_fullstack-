export class ShoppingCart {
  constructor(stockService, discountService) {
    this.items = [];
    this.stockService = stockService;
    this.discountService = discountService;
  }

  addItem(product, quantity) {
    if (quantity <= 0) throw new Error("La cantidad debe ser mayor a 0");
    this.items.push({ ...product, quantity });
  }

  calculateSubtotal() {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  async validateAllStock() {
    for (const item of this.items) {
      const isAvailable = await this.stockService.checkStock(item.id, item.quantity);
      if (!isAvailable) throw new Error(`Sin stock para: ${item.name}`);
    }
    return true;
  }

  async getTotal(couponCode) {
    const subtotal = this.calculateSubtotal();
    let discount = 0;

    if (couponCode) {
      discount = await this.discountService.getDiscount(couponCode);
    }

    return subtotal - (subtotal * discount);
  }
}