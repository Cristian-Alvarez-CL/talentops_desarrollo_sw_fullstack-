class Calculator {
    add(a, b) {
        return a + b;
    }

    subtract(a, b) {
        return a - b;
    }

    multiply(a, b) {
        return a * b;
    }

    divide(a, b) {
        if (b === 0) {
            throw new Error('No se puede dividir por cero');
        }
        return a / b;
    }

    power(base, exponent) {
        // Implementación básica - solo funciona con exponentes positivos
        if (exponent === 0) return 1;
        let result = 1;
        for (let i = 0; i < exponent; i++) {
            result *= base;
        }
        return result;
    }
}

module.exports = Calculator;