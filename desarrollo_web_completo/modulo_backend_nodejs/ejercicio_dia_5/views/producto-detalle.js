const layout = require('./layout');

module.exports = ({ titulo, producto, user }) => {
  const content = `
    <div class="producto-detalle" style="max-width: 800px; margin: 0 auto;">
      
      <div class="header-producto" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="margin: 0;">${producto.nombre}</h2>
          <span class="precio-grande" style="font-size: 2em; color: var(--primary-color); font-weight: bold;">$${producto.precio}</span>
      </div>

      <div style="text-align: center; margin-bottom: 2rem; background: #fff; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0;">
        ${producto.imagen 
          ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain;">`
          : `<div style="padding: 3rem; background: #f8fafc; color: #94a3b8; border-radius: 8px;">Sin imagen disponible</div>`
        }
      </div>

      <div class="producto-info" style="margin-bottom: 2rem;">
        <p class="categoria">Categoría: <span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-weight: bold;">${producto.categoria}</span></p>
        <p class="id" style="color: #999; font-size: 0.8rem; margin-top: 0.5rem;">ID: ${producto.id}</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #ddd; margin: 2rem 0;">

      <div class="seccion-comentarios">
          <h3>💬 Comentarios</h3>
          
          <div class="lista-comentarios" style="margin: 1.5rem 0;">
            ${producto.comentarios && producto.comentarios.length > 0 
              ? producto.comentarios.map(c => `
                  <div class="comentario" style="background: #f8fafc; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid var(--primary-color); border-radius: 4px;">
                      <p style="margin-bottom: 0.5rem;"><strong>${c.autor}</strong> dijo:</p>
                      <p style="color: #334155;">${c.texto}</p>
                      <small style="color: #94a3b8; display: block; margin-top: 0.5rem;">${new Date(c.fecha).toLocaleString()}</small>
                  </div>`).join('')
              : '<p style="font-style: italic; color: #64748b;">No hay comentarios aún.</p>'
            }
          </div>

           <div class="nuevo-comentario" style="background: #fff; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h4 style="margin-bottom: 1rem;">Deja tu opinión</h4>
              <form id="form-comentario">
                  <input type="hidden" id="prodId" value="${producto.id}">
                  <div style="margin-bottom: 1rem;">
                    <input type="text" id="autor" placeholder="Tu nombre" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                  </div>
                  <div style="margin-bottom: 1rem;">
                    <textarea id="texto" placeholder="Escribe tu comentario aquí..." required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; min-height: 80px;"></textarea>
                  </div>
                  <button type="submit" class="btn-primary">Enviar Comentario</button>
              </form>
          </div>
      </div>

      <br>
      <a href="/productos" class="btn-secondary" style="display: inline-block; margin-top: 2rem;">← Volver al Catálogo</a>
    </div>

    <script>
    document.getElementById('form-comentario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            productoId: parseInt(document.getElementById('prodId').value),
            autor: document.getElementById('autor').value,
            texto: document.getElementById('texto').value
        };
        const res = await fetch('/api/comentar', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) window.location.reload();
    });
    </script>
  `;
  return layout({ title: titulo, content, user });
};