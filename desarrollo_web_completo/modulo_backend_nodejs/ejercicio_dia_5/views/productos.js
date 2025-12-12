const layout = require('./layout');

module.exports = ({ titulo, productos, filtros, user }) => {
  let filtrosHtml = '';
  if (filtros && Object.keys(filtros).length > 0) {
    filtrosHtml = `
      <div class="filtros-activos" style="margin-bottom: 1rem; padding: 10px; background: #e0f2fe; border-radius: 5px;">
        <h3>Filtros aplicados:</h3>
        ${Object.keys(filtros).map(key => 
          `<span class="filtro" style="margin-right: 10px; font-weight: bold;">${key}: ${filtros[key]}</span>`
        ).join('')}
        <a href="/productos" style="font-size: 0.8rem; color: #ef4444; margin-left: 10px;">(Borrar filtros)</a>
      </div>
    `;
  }

  const content = `
    <h2>${titulo}</h2>
    ${filtrosHtml}
    
    <div class="grid-productos">
      ${productos.map(p => `
        <div class="producto-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          
          <div style="height: 200px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #e2e8f0;">
             ${p.imagen 
               ? `<img src="${p.imagen}" alt="${p.nombre}" style="width: 100%; height: 100%; object-fit: cover;">` 
               : `<span style="font-size: 3rem; opacity: 0.2;">📷</span>`
             }
          </div>

          <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3>${p.nombre}</h3>
              <p class="categoria" style="margin-bottom: 0.5rem;">${p.categoria}</p>
            </div>
            
            <div style="margin-top: 1rem;">
              <p class="precio" style="font-size: 1.25rem; font-weight: bold; color: var(--primary-color);">$${p.precio}</p>
              <a href="/productos/${p.id}" class="btn-primary" style="width: 100%; text-align: center; display: block; margin-top: 10px;">Ver Detalles</a>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    ${productos.length === 0 ? '<p>No se encontraron productos.</p>' : ''}
  `;

  return layout({ title: titulo, content, user });
};