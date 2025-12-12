const layout = require('./layout');

module.exports = ({ titulo, mensaje, error, user }) => {
  const content = `
    <div class="error-page" style="max-width: 600px; margin: 4rem auto; text-align: center;">
      <div style="background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; padding: 2rem; border-radius: 8px;">
        <h2 style="margin-bottom: 1rem;">⚠️ ${titulo}</h2>
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">${mensaje}</p>
        
        ${error ? `
          <div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px; text-align: left; font-family: monospace; font-size: 0.9rem; margin-top: 1rem;">
            <strong>Detalle:</strong> ${error}
          </div>
        ` : ''}

        <div style="margin-top: 2rem;">
            <a href="/login" class="btn-primary" style="background: #b91c1c; border: none;">Intentar de nuevo</a>
            <a href="/" class="btn-secondary" style="margin-left: 10px;">Ir al Inicio</a>
        </div>
      </div>
    </div>
  `;
  return layout({ title: titulo, content, user });
};