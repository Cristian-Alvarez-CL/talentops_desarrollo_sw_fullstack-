const Calculator = require('./calculadora');

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
        expect(calculator.power(2, 3)).toBe(8);
    });

    test('handles zero exponent correctly', () => {
        expect(calculator.power(5, 0)).toBe(1);
    });

    test('handles negative exponent correctly', () => {
        expect(calculator.power(2, -2)).toBe(0.25);
    });
});

describe('Power function edge cases', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    test('handles base of zero correctly', () => {
        expect(calculator.power(0, 5)).toBe(0);
        expect(calculator.power(0, 0)).toBe(1);
    });

    test('handles square roots correctly', () => {
        expect(calculator.power(4, 0.5)).toBeCloseTo(2);
        expect(calculator.power(9, 0.5)).toBeCloseTo(3);
    });

    test('handles cube roots correctly', () => {
        expect(calculator.power(8, 1/3)).toBeCloseTo(2);
        expect(calculator.power(27, 1/3)).toBeCloseTo(3);
    });
});