const nodemailer = require('nodemailer');
const bwipjs = require('bwip-js');

// Configuración segura: si no hay env vars, no falla la app, solo loguea
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io', // Fallback dummy
    port: 587,
    auth: { 
        user: process.env.EMAIL_USER || 'user', 
        pass: process.env.EMAIL_PASS || 'pass' 
    }
});

async function enviarAlertaStock(producto) {
    try {
        // Simulación si no hay credenciales reales
        if (!process.env.EMAIL_HOST) {
            console.log(`[SIMULACIÓN EMAIL] ⚠️ ALERTA DE STOCK BAJO: ${producto.nombre} (${producto.stock_actual} unidades)`);
            return;
        }

        await transporter.sendMail({
            from: '"Sistema Inventario" <alertas@tuempresa.com>',
            to: "jefe.almacen@tuempresa.com",
            subject: `⚠️ Stock Bajo: ${producto.nombre}`,
            html: `
                <h2>Alerta de Inventario</h2>
                <p>El producto <strong>${producto.nombre}</strong> (SKU: ${producto.codigo}) requiere atención.</p>
                <ul>
                    <li>Stock Actual: ${producto.stock_actual}</li>
                    <li>Mínimo Requerido: ${producto.stock_minimo}</li>
                </ul>
                <p>Por favor genere una orden de compra.</p>
            `
        });
        console.log(`📧 Email enviado para ${producto.codigo}`);
    } catch (error) {
        console.error('Error enviando email:', error.message);
    }
}

async function generarBarcode(text) {
    return await bwipjs.toBuffer({
        bcid: 'code128',       // Tipo de código
        text: text,            // Texto a codificar
        scale: 3,              // Escala 3x
        height: 10,            // Altura
        includetext: true,     // Mostrar texto humano
        textxalign: 'center',  // Texto centrado
    });
}

module.exports = { enviarAlertaStock, generarBarcode };