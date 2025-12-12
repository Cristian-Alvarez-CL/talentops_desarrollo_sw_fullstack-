const layout = require('./layout');

module.exports = ({ titulo, mensaje, user }) => {
  const content = `
    <div class="error-page" style="text-align: center; padding: 4rem 1rem;">
      <h1 style="font-size: 4rem; margin-bottom: 1rem; color: #cbd5e1;">404</h1>
      <h2 style="color: var(--text-main); margin-bottom: 1rem;">${titulo}</h2>
      <p style="color: var(--text-light); margin-bottom: 2rem; font-size: 1.2rem;">${mensaje}</p>
      <a href="/" class="btn-primary">Volver al Inicio</a>
    </div>
  `;
  return layout({ title: titulo, content, user });
};