const layout = require('./layout');

module.exports = ({ titulo, empresa, descripcion, fundacion, user }) => {
  const content = `
    <div class="about" style="max-width: 800px; margin: 3rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="color: var(--primary-color); font-size: 2rem; margin-bottom: 0.5rem;">${titulo}</h2>
        <div style="height: 4px; width: 60px; background: var(--primary-color); margin: 0 auto; border-radius: 2px;"></div>
      </div>

      <div class="empresa-info">
        <h3 style="font-size: 1.4rem; color: var(--text-main); margin-bottom: 1rem;">${empresa}</h3>
        
        <p style="line-height: 1.8; color: var(--text-light); font-size: 1.1rem; margin-bottom: 2rem;">
          ${descripcion}
        </p>
        
        <div style="display: flex; gap: 20px; flex-wrap: wrap; background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="flex: 1; min-width: 200px;">
                <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">📅 Trayectoria</h4>
                <p>Fundada en <strong>${fundacion}</strong>, llevamos innovación a cada escritorio.</p>
            </div>
            <div style="flex: 1; min-width: 200px;">
                 <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">🚀 Misión</h4>
                 <p>Proveer hardware de calidad con la mejor tecnología Node.js.</p>
            </div>
        </div>
      </div>

      <div style="margin-top: 2.5rem; text-align: center;">
         <a href="/productos" class="btn-primary">Ver Catálogo</a>
         <a href="/" class="btn-secondary" style="margin-left: 10px;">Volver al Inicio</a>
      </div>
    </div>
  `;
  
  return layout({ title: titulo, content, user });
};