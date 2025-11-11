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

describe('Power function edge cases', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    test('handles base of zero correctly', () => {
        expect(calculator.power(0, 5)).toBe(0);
        expect(calculator.power(0, 0)).toBe(1);
    });

    test('handles fractional base correctly', () => {
        expect(calculator.power(4, 0.5)).toBe(2);
    });
});