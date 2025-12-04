// calculadora.js

// Obtenemos los argumentos desde la línea de comandos
const args = process.argv.slice(2);

// Verificamos que haya al menos 3 argumentos (operación y dos números)
if (args.length < 3) {
    console.log('Uso: node calculadora.js <operación> <num1> <num2> [num3 ...]');
    console.log('Operaciones disponibles: sumar, restar, multiplicar, dividir, potencia, raiz');
    console.log('Ejemplo: node calculadora.js sumar 5 3');
    process.exit(1);
}

// Extraemos la operación y los números
const operacion = args[0].toLowerCase();
const numeros = args.slice(1).map(num => {
    const n = parseFloat(num);
    if (isNaN(n)) {
        console.log(`Error: '${num}' no es un número válido`);
        process.exit(1);
    }
    return n;
});

// Función para realizar las operaciones
function realizarOperacion(op, nums) {
    switch (op) {
        case 'sumar':
        case 'add':
        case '+':
            return nums.reduce((total, num) => total + num, 0);
            
        case 'restar':
        case 'subtract':
        case '-':
            if (nums.length === 1) return -nums[0];
            return nums.reduce((total, num, index) => {
                return index === 0 ? num : total - num;
            });
            
        case 'multiplicar':
        case 'multiply':
        case '*':
            return nums.reduce((total, num) => total * num, 1);
            
        case 'dividir':
        case 'divide':
        case '/':
            if (nums.slice(1).some(num => num === 0)) {
                throw new Error('No se puede dividir por cero');
            }
            return nums.reduce((total, num, index) => {
                return index === 0 ? num : total / num;
            });
            
        case 'potencia':
        case 'power':
        case '**':
            if (nums.length !== 2) {
                throw new Error('La potencia requiere exactamente 2 números: base y exponente');
            }
            return Math.pow(nums[0], nums[1]);
            
        case 'raiz':
        case 'sqrt':
            if (nums.length !== 1) {
                throw new Error('La raíz cuadrada requiere exactamente 1 número');
            }
            if (nums[0] < 0) {
                throw new Error('No se puede calcular la raíz cuadrada de un número negativo');
            }
            return Math.sqrt(nums[0]);
            
        default:
            throw new Error(`Operación '${op}' no reconocida`);
    }
}

// Ejecutamos la operación y mostramos el resultado
try {
    const resultado = realizarOperacion(operacion, numeros);
    console.log(`Resultado: ${resultado}`);
} catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
}