import { ShoppingCart } from '../src/cart';

describe('ShoppingCart Suite', () => {
  let cart;
  let mockStockService;
  let mockDiscountService;

  beforeEach(() => {
    mockStockService = {
      checkStock: jest.fn()
    };
    mockDiscountService = {
      getDiscount: jest.fn()
    };
    cart = new ShoppingCart(mockStockService, mockDiscountService);
  });


  describe('Gestión de Items', () => {
    test('debería calcular el subtotal correctamente', () => {
      cart.addItem({ id: 1, name: 'Laptop', price: 1000 }, 1);
      cart.addItem({ id: 2, name: 'Mouse', price: 50 }, 2);
      
      expect(cart.calculateSubtotal()).toBe(1100);
    });

    test('debería lanzar error si la cantidad es menor a 1', () => {
      expect(() => {
        cart.addItem({ id: 1, price: 100 }, 0);
      }).toThrow("La cantidad debe ser mayor a 0");
    });
  });


  describe('Validación de Stock (Mocks)', () => {
    test('debería retornar true si hay stock suficiente', async () => {
      mockStockService.checkStock.mockResolvedValue(true);
      cart.addItem({ id: 1, name: 'Monitor', price: 200 }, 1);

      const result = await cart.validateAllStock();
      
      expect(result).toBe(true);
      expect(mockStockService.checkStock).toHaveBeenCalledWith(1, 1);
    });

    test('debería fallar si el servicio de stock retorna false', async () => {
      mockStockService.checkStock.mockResolvedValue(false);
      cart.addItem({ id: 1, name: 'Teclado', price: 50 }, 1);

      await expect(cart.validateAllStock()).rejects.toThrow("Sin stock para: Teclado");
    });
  });


  describe('Cálculo de Totales y Descuentos', () => {
    test('debería aplicar un descuento del 10% correctamente', async () => {
      mockDiscountService.getDiscount.mockResolvedValue(0.10);
      cart.addItem({ id: 1, price: 100 }, 1);
      const total = await cart.getTotal('PROMO10');
      expect(total).toBe(90);
      expect(mockDiscountService.getDiscount).toHaveBeenCalledWith('PROMO10');
    });

    test('debería manejar errores en el servicio de descuento', async () => {
      mockDiscountService.getDiscount.mockRejectedValue(new Error("API Down"));
      cart.addItem({ id: 1, price: 100 }, 1);

      await expect(cart.getTotal('FAIL')).rejects.toThrow("API Down");
    });
  });
});