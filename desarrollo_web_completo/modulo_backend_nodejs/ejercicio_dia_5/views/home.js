const layout = require('./layout');

module.exports = (data) => {
  const { titulo, products, user } = data;

  const content = `
    <div class="hero">
      <h2>${titulo}</h2>
      <p>La mejor tecnología al mejor precio, gestionada con Node.js puro.</p>
      
      <div class="actions">
        <a href="/productos" class="btn-secondary">Explorar Catálogo</a>
        ${user 
          ? `<a href="/admin" class="btn-primary" style="background: white; color: var(--primary-color);">Ir al Panel</a>`
          : `<a href="/login" class="btn-primary" style="background: rgba(0,0,0,0.2);">Acceso Staff</a>`
        }
      </div>
    </div>

    <section class="productos-destacados">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3>🔥 Tendencias de Hoy</h3>
          <a href="/productos" style="color: var(--primary-color);">Ver todo &rarr;</a>
      </div>
      
      <div class="grid-productos">
        ${products.map(p => `
          <div class="producto-card">
            <div>
              <h4>${p.nombre}</h4>
              <span class="categoria">${p.categoria}</span>
            </div>
            <div>
               <p class="precio">$${p.precio}</p>
               <a href="/productos/${p.id}" class="btn-primary" style="width: 100%; text-align: center; margin-top: 10px;">Ver Detalles</a>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  return layout({ title: titulo, content, user });
};