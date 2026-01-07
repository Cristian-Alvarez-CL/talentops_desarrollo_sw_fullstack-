const transporter = require('../config/email');

const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Simulación de email en test para:', to);
    return { messageId: 'test-id' };
  }

  try {
    const mailOptions = { from: process.env.EMAIL_FROM, to, subject, text, html };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};

const sendOrderConfirmation = async (order, user) => {
  const html = `
    <h1>Confirmación de Pedido #${order.id}</h1>
    <p>Hola ${user.nombre},</p>
    <p>Gracias por tu compra. Aquí está el resumen de tu pedido:</p>
    
    <h2>Detalles del Pedido</h2>
    <ul>
      ${order.productos.map(p => `
        <li>${p.nombre} - ${p.cantidad} x $${p.precio_unitario} = $${p.subtotal}</li>
      `).join('')}
    </ul>
    
    <p><strong>Total: $${order.total}</strong></p>
    <p><strong>Estado: ${order.estado}</strong></p>
    
    <h2>Información de Envío</h2>
    <p>${order.direccion_envio}</p>
    
    <p>Gracias por comprar con nosotros!</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Confirmación de Pedido #${order.id}`,
    html
  });
};

module.exports = { sendEmail, sendOrderConfirmation };