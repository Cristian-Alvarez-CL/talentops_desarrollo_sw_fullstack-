
console.log("NICIANDO DEMOSTRACIÓN: var vs let vs const\n");

// =============================================
// 1. CONTEXTO GLOBAL
// =============================================
console.log("\n 1. CONTEXTO GLOBAL");

// Hoisting con var (se inicializa con undefined)
console.log("varGlobal (hoisting):", varGlobal); // undefined
var varGlobal = "Soy var global";

// ReferenceError: No se puede acceder a let/const antes de la declaración
console.log(`Error TDZ: ${letGlobal}`);
console.log(`Error TDZ: ${constGlobal}`);

let letGlobal = "Soy let global";
const constGlobal = "Soy const global";

console.log(`varGlobal después de declararlo: ${varGlobal}`);
console.log(`letGlobal después de declararlo: ${letGlobal}`);
console.log(`constGlobal después de declararlo: ${constGlobal}`);

// =============================================
// 2. CONTEXTO DE FUNCIÓN
// =============================================
console.log("\n 2. CONTEXTO DE FUNCIÓN");

function demostrarFuncion() {
    console.log("\n--- Dentro de la función ---");
    
    console.log(`varEnFuncion (hoisting): ${varEnFuncion}`); // undefined
    var varEnFuncion = "Soy var en función";
    
    // TDZ para let/const en función
    console.log(`Error TDZ dentro de la función: ${letEnFuncion}`);

    let letEnFuncion = "Soy let en función";
    const constEnFuncion = "Soy const en función";
    
    console.log(`varEnFuncion después: ${varEnFuncion}`);
    console.log(`letEnFuncion después: ${letEnFuncion}`);
    console.log(`constEnFuncion después: ${constEnFuncion}`);
    
    // Re-declaración en mismo ámbito
    var varEnFuncion = "Puedo redeclarar var";
    //let letEnFuncion = "No puedo redeclarar let"; // SyntaxError
    //const constEnFuncion = "No puedo redeclarar const"; // SyntaxError
}

demostrarFuncion();

// =============================================
// 3. CONTEXTO DE BLOQUE (if, for, {})
// =============================================
console.log("\n 3. CONTEXTO DE BLOQUE");

function demostrarBloque() {
    if (true) {
        var varEnBloque = "Soy var en bloque";
        let letEnBloque = "Soy let en bloque";
        const constEnBloque = "Soy const en bloque";
        
        console.log("\n--- Dentro del bloque ---");
        console.log(`varEnBloque: ${varEnBloque}`);
        console.log(`letEnBloque: ${letEnBloque}`);
        console.log(`constEnBloque: ${constEnBloque}`);
    }
    
    console.log("\n--- Fuera del bloque ---");
    console.log(`varEnBloque (accesible): ${varEnBloque}`);
    // console.log(`letEnBloque: ${letEnBloque}`); // ReferenceError
    // console.log(`constEnBloque: ${constEnBloque}`); // ReferenceError
}

demostrarBloque();

// =============================================
// 4. REASIGNACIÓN Y MUTABILIDAD
// =============================================
console.log("\n 4. REASIGNACIÓN Y MUTABILIDAD");

var variableVar = "valor inicial var";
let variableLet = "valor inicial let";
const variableConst = "valor inicial const";

// Reasignación
variableVar = "nuevo valor var";
variableLet = "nuevo valor let";
// variableConst = "nuevo valor const"; //TypeError

console.log(`var después de reasignar: ${variableVar}`);
console.log(`let después de reasignar: ${variableLet}`);
console.log(`const mantiene valor: ${variableConst}`);

// Mutabilidad en objetos/arrays (const)
const objetoConst = { nombre: "Juan", edad: 25 };
const arrayConst = [1, 2, 3];

// No se puede reasignar
// objetoConst = { otro: "objeto" }; // TypeError
// arrayConst = [4, 5, 6]; // TypeError

// Pero se puede mutar el contenido
objetoConst.edad = 30;
objetoConst.ciudad = "Madrid";
arrayConst.push(4);

console.log(`Objeto const mutado: ${objetoConst}`);
console.log(`Array const mutado: ${arrayConst}`);

// =============================================
// 5. EJEMPLO CON BUCLE FOR
// =============================================
console.log("\n 5. BUCLE FOR - COMPORTAMIENTO DIFERENTE");

console.log("Bucle con var:");
for (var i = 0; i < 3; i++) {
    setTimeout(() => {
        console.log(`var i = ${i}`); // Siempre muestra 3
    }, 100);
}

console.log("Bucle con let:");
for (let j = 0; j < 3; j++) {
    setTimeout(() => {
        console.log(`let j = ${j}`); // Muestra 0, 1, 2
    }, 100);
}

// =============================================
// 6. TEMPORAL DEAD ZONE (TDZ) DETALLADO
// =============================================
console.log("\n 6. TEMPORAL DEAD ZONE (TDZ)");

function demostrarTDZ() {
    console.log(`Accediendo a var (hoisting): ${tdzVar}`); // undefined
    var tdzVar = "var con hoisting";
    
    // ZONA DE MUERTE TEMPORAL para let
    // La variable existe pero no se puede acceder
    // console.log(tdzLet); // ❌ ReferenceError
    
    let tdzLet = "let en TDZ";
    console.log(`Después de declarar let: ${tdzLet}`);
    
    // ZONA DE MUERTE TEMPORAL para const
    // console.log(tdzConst); // ReferenceError
    
    const tdzConst = "const en TDZ";
    console.log(`Después de declarar const: ${tdzConst}`);
}

demostrarTDZ();


// Esperar para ver los resultados del setTimeout
setTimeout(() => {
    console.log("\n DEMOSTRACIÓN COMPLETADA");
}, 200);