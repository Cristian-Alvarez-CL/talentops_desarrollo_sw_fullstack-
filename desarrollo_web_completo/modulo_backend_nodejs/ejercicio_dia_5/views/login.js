const layout = require('./layout');

module.exports = (data) => {
  const { titulo, user } = data; // user vendrá como null

  const content = `
    <div style="max-width: 400px; margin: 4rem auto;">
      <div class="producto-card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem; color: var(--primary-color);">🔐 Acceso Seguro</h2>
        <form action="/login" method="POST">
          <div style="text-align: left;">
            <label style="font-weight: bold;">Usuario</label>
            <input type="text" name="username" placeholder="admin" required>
          </div>
          <div style="text-align: left;">
            <label style="font-weight: bold;">Contraseña</label>
            <input type="password" name="password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn-primary" style="margin-top: 1rem;">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  `;
  return layout({ title: titulo, content, user });
};