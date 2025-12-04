function validarFormularioRegistro(datosUsuario) {
    try {
        // Validación del nombre
        if (!datosUsuario.nombre || datosUsuario.nombre.trim() === '') {
            throw new Error('El nombre no puede estar vacío');
        }

        if (datosUsuario.nombre.length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }

        // Validación del email
        if (!datosUsuario.email || datosUsuario.email.trim() === '') {
            throw new Error('El email no puede estar vacío');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(datosUsuario.email)) {
            throw new Error('El formato del email no es válido');
        }

        // Validación de la edad
        if (!datosUsuario.edad && datosUsuario.edad !== 0) {
            throw new Error('La edad no puede estar vacía');
        }

        const edad = parseInt(datosUsuario.edad);
        if (isNaN(edad)) {
            throw new Error('La edad debe ser un número válido');
        }

        if (edad < 18) {
            throw new Error('Debes tener al menos 18 años para registrarte');
        }

        if (edad > 99) {
            throw new Error('La edad no puede ser mayor a 99 años');
        }

        // Validación de la contraseña
        if (!datosUsuario.password || datosUsuario.password.trim() === '') {
            throw new Error('La contraseña no puede estar vacía');
        }

        // Verificar fortaleza de la contraseña
        const erroresPassword = [];
        
        if (datosUsuario.password.length < 8) {
            erroresPassword.push('al menos 8 caracteres');
        }
        
        if (!/[A-Z]/.test(datosUsuario.password)) {
            erroresPassword.push('al menos una letra mayúscula');
        }
        
        if (!/[a-z]/.test(datosUsuario.password)) {
            erroresPassword.push('al menos una letra minúscula');
        }
        
        if (!/\d/.test(datosUsuario.password)) {
            erroresPassword.push('al menos un número');
        }
        
        if (!/[@$!%*?&]/.test(datosUsuario.password)) {
            erroresPassword.push('al menos un carácter especial (@$!%*?&)');
        }

        if (erroresPassword.length > 0) {
            throw new Error(`La contraseña debe contener: ${erroresPassword.join(', ')}`);
        }

        // Si todas las validaciones pasan
        console.log('✅ Formulario validado correctamente');
        return {
            exito: true,
            mensaje: 'Registro validado correctamente'
        };

    } catch (error) {
        console.error('❌ Error en la validación:', error.message);
        return {
            exito: false,
            mensaje: error.message
        };
    }
}

// Ejemplos de uso
console.log('=== Pruebas de validación ===');

// Caso 1: Formulario válido
const usuarioValido = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    edad: 25,
    password: 'SecurePass123!'
};
console.log(validarFormularioRegistro(usuarioValido));

// Caso 2: Nombre vacío
const usuarioNombreInvalido = {
    nombre: '',
    email: 'juan@example.com',
    edad: 25,
    password: 'SecurePass123!'
};
console.log(validarFormularioRegistro(usuarioNombreInvalido));

// Caso 3: Email inválido
const usuarioEmailInvalido = {
    nombre: 'Juan Pérez',
    email: 'email-invalido',
    edad: 25,
    password: 'SecurePass123!'
};
console.log(validarFormularioRegistro(usuarioEmailInvalido));

// Caso 4: Edad fuera de rango
const usuarioEdadInvalida = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    edad: 16,
    password: 'SecurePass123!'
};
console.log(validarFormularioRegistro(usuarioEdadInvalida));

// Caso 5: Contraseña débil
const usuarioPasswordDebil = {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    edad: 25,
    password: '123'
};
console.log(validarFormularioRegistro(usuarioPasswordDebil));

// Función con diferentes estructuras de control (versión alternativa)
function validarFormularioConEstructuras(datos) {
    const errores = [];

    // Usando if/else para nombre
    if (!datos.nombre || datos.nombre.trim().length < 2) {
        errores.push('El nombre debe tener al menos 2 caracteres');
    }

    // Usando operador ternario para verificación rápida
    const emailValido = datos.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email);
    !emailValido && errores.push('Email inválido');

    // Usando switch para rangos de edad
    const edad = parseInt(datos.edad);
    if (!isNaN(edad)) {
        switch (true) {
            case edad < 18:
                errores.push('Edad mínima: 18 años');
                break;
            case edad > 99:
                errores.push('Edad máxima: 99 años');
                break;
            default:
                // Edad válida
                break;
        }
    } else {
        errores.push('La edad debe ser un número');
    }

    // Usando for para verificar requisitos de contraseña
    const requisitosPassword = [
        { test: datos.password && datos.password.length >= 8, mensaje: 'Mínimo 8 caracteres' },
        { test: /[A-Z]/.test(datos.password), mensaje: 'Al menos una mayúscula' },
        { test: /[a-z]/.test(datos.password), mensaje: 'Al menos una minúscula' },
        { test: /\d/.test(datos.password), mensaje: 'Al menos un número' },
        { test: /[@$!%*?&]/.test(datos.password), mensaje: 'Al menos un carácter especial' }
    ];

    for (const requisito of requisitosPassword) {
        if (!requisito.test) {
            errores.push(`Contraseña: ${requisito.mensaje}`);
        }
    }

    return errores.length === 0 
        ? { exito: true, mensaje: 'Validación exitosa' }
        : { exito: false, errores: errores };
}

// Ejemplo de uso con HTML (para contexto práctico)
function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        edad: document.getElementById('edad').value,
        password: document.getElementById('password').value
    };

    const resultado = validarFormularioRegistro(datos);
    
    const mensajeDiv = document.getElementById('mensaje');
    if (resultado.exito) {
        mensajeDiv.innerHTML = `<p style="color: green;">${resultado.mensaje}</p>`;
        // Enviar formulario al servidor
    } else {
        mensajeDiv.innerHTML = `<p style="color: red;">${resultado.mensaje}</p>`;
    }
}