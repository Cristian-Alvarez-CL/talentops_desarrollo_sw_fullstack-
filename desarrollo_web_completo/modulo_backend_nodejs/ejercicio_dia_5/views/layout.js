module.exports = ({ title, content, user }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TechStore</title>
  <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body>
  <header>
    <nav class="nav-container">
      <h1>🛍️ TechStore</h1>
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/productos">Catálogo</a></li>
        ${user 
          ? `<li><a href="/admin" style="color: var(--primary-color); font-weight: bold;">⚙️ Panel Admin</a></li>
             <li><a href="/logout" class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem;">Salir</a></li>`
          : `<li><a href="/login" style="font-size: 0.9rem;">Ingresar</a></li>`
        }
      </ul>
    </nav>
  </header>

  <main>
    ${content}
  </main>

  <footer>
    <p>&copy; 2025 TechStore Enterprise. Sistema corriendo en Node.js Nativo.</p>
  </footer>
</body>
</html>
`;