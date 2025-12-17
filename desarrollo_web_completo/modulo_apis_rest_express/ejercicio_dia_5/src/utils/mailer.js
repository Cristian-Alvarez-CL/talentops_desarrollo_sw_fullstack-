exports.sendEmail = async (to, subject, text) => {
  console.log(`[Simulación Email] Para: ${to} | Asunto: ${subject} | Msg: ${text}`);
  // Aquí se integraría nodemailer.createTransport si se desea envío real.
};