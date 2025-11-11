const Calculator = require('./calculator');

describe('Calculator', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    test('adds two numbers correctly', () => {
        expect(calculator.add(2, 3)).toBe(5);
    });

    test('subtracts two numbers correctly', () => {
        expect(calculator.subtract(5, 3)).toBe(2);
    });

    test('multiplies two numbers correctly', () => {
        expect(calculator.multiply(4, 3)).toBe(12);
    });

    test('divides two numbers correctly', () => {
        expect(calculator.divide(10, 2)).toBe(5);
    });

    test('throws error when dividing by zero', () => {
        expect(() => calculator.divide(10, 0)).toThrow('No se puede dividir por cero');
    });
});

describe('Power function', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    test('calculates positive exponent correctly', () => {
        // TODO: Implementar test cuando exista la función power
        // expect(calculator.power(2, 3)).toBe(8);
    });

    test('handles zero exponent correctly', () => {
        // TODO: Implementar test cuando exista la función power
        // expect(calculator.power(5, 0)).toBe(1);
    });

    test('handles negative exponent correctly', () => {
        // TODO: Implementar test cuando exista la función power
        // expect(calculator.power(2, -2)).toBe(0.25);
    });
});