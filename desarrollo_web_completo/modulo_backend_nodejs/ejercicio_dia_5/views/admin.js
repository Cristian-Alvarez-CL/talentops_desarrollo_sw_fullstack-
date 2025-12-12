const layout = require('./layout');

module.exports = ({ titulo, user, metrics }) => {
  const content = `
    <div class="admin-panel">
      <div class="hero" style="padding: 2rem; margin-bottom: 2rem;">
        <h2>⚙️ ${titulo}</h2>
        <p>Bienvenido, <strong>${user.name}</strong>.</p>
      </div>

      <div class="grid-productos" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));">
        
        <div class="producto-card">
          <h3 style="color: var(--primary-color);">📊 Métricas del Servidor</h3>
          <pre style="background: #1e293b; color: #a5b4fc; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem;">${JSON.stringify(metrics, null, 2)}</pre>
        </div>

        <div class="producto-card">
          <h3 style="color: var(--primary-color);">📤 Subir Nuevo Producto</h3>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            
            <div style="margin-bottom: 10px">
              <label style="font-weight: bold; font-size: 0.9rem;">Nombre</label>
              <input type="text" name="nombre" placeholder="Ej: Monitor 24" required>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 0.9rem;">Precio ($)</label>
                    <input type="number" name="precio" placeholder="1500" required>
                </div>
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 0.9rem;">Categoría</label>
                    <input type="text" name="categoria" placeholder="Ej: Pantallas" required>
                </div>
            </div>

            <div style="margin-bottom: 10px">
              <label style="font-weight: bold; font-size: 0.9rem;">Imagen</label>
              <input type="file" name="imagen" required style="background: white;">
            </div>
            
            <button class="btn-primary" style="width: 100%;">Publicar Producto</button>
          </form>
        </div>

      </div>
    </div>
  `;

  return layout({ title: titulo, content, user });
};