const http = require('http');
const url = require('url');

// --- CONFIGURACIÓN Y ESTADO ---
const CONFIG = {
  PORT: 3000,
  API_KEY: 'secret-123', // En producción, usar variables de entorno
};

let tareas = [
  { id: 1, titulo: 'Aprender Node.js', descripcion: 'Completar tutoriales básicos', completada: false, prioridad: 'alta', fechaCreacion: new Date().toISOString() },
  { id: 2, titulo: 'Practicar HTTP', descripcion: 'Crear servidor básico', completada: true, prioridad: 'media', fechaCreacion: new Date().toISOString() }
];
let siguienteId = 3;

// --- SCHEMAS DE VALIDACIÓN ---
const taskSchema = {
  titulo: { type: 'string', required: true },
  descripcion: { type: 'string', required: false },
  prioridad: { type: 'string', required: false, enum: ['alta', 'media', 'baja'] },
  completada: { type: 'boolean', required: false }
};

// --- HELPERS ---

// Logger de operaciones
function logRequest(method, path, status, ms) {
  const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m'; // Red, Yellow, Green
  const reset = '\x1b[0m';
  console.log(`${new Date().toISOString()} | ${method} ${path} | ${color}${status}${reset} | ${ms}ms`);
}

// Respuesta JSON estandarizada
function enviarJSON(response, data, statusCode = 200) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
  });
  response.end(JSON.stringify(data, null, 2));
}

// Respuesta HTML
function enviarHTML(response, html, statusCode = 200) {
  response.writeHead(statusCode, { 'Content-Type': 'text/html' });
  response.end(html);
}

// Parser del Body
function obtenerCuerpo(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => body += chunk.toString());
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('JSON inválido'));
      }
    });
    request.on('error', reject);
  });
}

// Validador de esquemas simple
function validarDatos(data, schema) {
  const errores = [];
  for (const [campo, reglas] of Object.entries(schema)) {
    // Check requerido
    if (reglas.required && (data[campo] === undefined || data[campo] === null || data[campo] === '')) {
      errores.push(`El campo '${campo}' es requerido.`);
      continue;
    }
    // Check tipo (si el dato existe)
    if (data[campo] !== undefined) {
      if (typeof data[campo] !== reglas.type) {
        errores.push(`El campo '${campo}' debe ser tipo ${reglas.type}.`);
      }
      // Check enum
      if (reglas.enum && !reglas.enum.includes(data[campo])) {
        errores.push(`El campo '${campo}' debe ser uno de: ${reglas.enum.join(', ')}.`);
      }
    }
  }
  return errores;
}

// Middleware de Autenticación
function estaAutenticado(request) {
  const apiKey = request.headers['x-api-key'];
  return apiKey === CONFIG.API_KEY;
}

// --- SERVIDOR ---
const servidor = http.createServer(async (request, response) => {
  const start = Date.now();
  const { method } = request;
  const parsedUrl = url.parse(request.url, true);
  const { pathname, query } = parsedUrl;

  // Wrapper para manejar errores globales y logging final
  try {
    // 0. Manejo de CORS Preflight
    if (method === 'OPTIONS') {
      enviarJSON(response, {}, 204);
      logRequest('OPTIONS', pathname, 204, Date.now() - start);
      return;
    }

    // 1. RUTA PÚBLICA: Frontend (Dashboard)
    if (method === 'GET' && pathname === '/') {
      enviarHTML(response, obtenerDashboardHTML());
      logRequest(method, pathname, 200, Date.now() - start);
      return;
    }

    // 2. MIDDLEWARE DE SEGURIDAD (Para todo lo que sea /api/)
    if (pathname.startsWith('/api/')) {
      if (!estaAutenticado(request)) {
        enviarJSON(response, { error: 'No autorizado. Falta x-api-key válida' }, 401);
        logRequest(method, pathname, 401, Date.now() - start);
        return;
      }
    }

    // --- RUTAS DE API ---

    // GET /api/stats - Estadísticas (Nuevo)
    if (method === 'GET' && pathname === '/api/stats') {
      const stats = {
        total: tareas.length,
        completadas: tareas.filter(t => t.completada).length,
        pendientes: tareas.filter(t => !t.completada).length,
        porPrioridad: {
          alta: tareas.filter(t => t.prioridad === 'alta').length,
          media: tareas.filter(t => t.prioridad === 'media').length,
          baja: tareas.filter(t => t.prioridad === 'baja').length,
        },
        sistema: {
          uptime: process.uptime(),
          memoria: process.memoryUsage().rss
        }
      };
      enviarJSON(response, stats);
    }
    
    // GET /api/tareas
    else if (method === 'GET' && pathname === '/api/tareas') {
      let resultados = [...tareas];
      if (query.completada !== undefined) {
        const esCompletada = query.completada === 'true';
        resultados = resultados.filter(t => t.completada === esCompletada);
      }
      if (query.q) {
        const termino = query.q.toLowerCase();
        resultados = resultados.filter(t => t.titulo.toLowerCase().includes(termino));
      }
      enviarJSON(response, { count: resultados.length, data: resultados });
    }

    // POST /api/tareas
    else if (method === 'POST' && pathname === '/api/tareas') {
      const body = await obtenerCuerpo(request);
      
      // Validación
      const errores = validarDatos(body, taskSchema);
      if (errores.length > 0) {
        enviarJSON(response, { error: 'Validación fallida', detalles: errores }, 400);
        logRequest(method, pathname, 400, Date.now() - start);
        return;
      }

      const nuevaTarea = {
        id: siguienteId++,
        titulo: body.titulo,
        descripcion: body.descripcion || '',
        completada: body.completada || false,
        prioridad: body.prioridad || 'media',
        fechaCreacion: new Date().toISOString()
      };
      tareas.push(nuevaTarea);
      enviarJSON(response, nuevaTarea, 201);
    }

    // PUT /api/tareas/:id
    else if (method === 'PUT' && pathname.startsWith('/api/tareas/')) {
      const id = parseInt(pathname.split('/')[3]);
      const body = await obtenerCuerpo(request);
      const indice = tareas.findIndex(t => t.id === id);

      if (indice === -1) {
        enviarJSON(response, { error: 'Tarea no encontrada' }, 404);
      } else {
        // Validar parcialmente
        const errores = validarDatos(body, { 
            ...taskSchema, 
            titulo: { ...taskSchema.titulo, required: false } // En PUT el título podría ser opcional
        }); 
        
        // Merge seguro
        tareas[indice] = { ...tareas[indice], ...body, id }; // Protegemos el ID
        enviarJSON(response, tareas[indice]);
      }
    }

    // DELETE /api/tareas/:id
    else if (method === 'DELETE' && pathname.startsWith('/api/tareas/')) {
      const id = parseInt(pathname.split('/')[3]);
      const indice = tareas.findIndex(t => t.id === id);
      if (indice === -1) {
        enviarJSON(response, { error: 'Tarea no encontrada' }, 404);
      } else {
        const eliminada = tareas.splice(indice, 1)[0];
        enviarJSON(response, { mensaje: 'Eliminada', id: eliminada.id });
      }
    }
    
    // 404 Default
    else {
      enviarJSON(response, { error: 'Endpoint no encontrado' }, 404);
    }

    // Log final exitoso (el status code se toma de la respuesta, aunque aquí es estimado)
    logRequest(method, pathname, response.statusCode, Date.now() - start);

  } catch (error) {
    console.error('SERVER ERROR:', error);
    enviarJSON(response, { error: 'Internal Server Error' }, 500);
    logRequest(method, pathname, 500, Date.now() - start);
  }
});

// --- UI DASHBOARD (HTML/JS/CSS EMBEBIDO) ---
function obtenerDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskMaster Pro</title>
    <style>
        :root { --primary: #2563eb; --bg: #f8fafc; --card: #ffffff; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .card { background: var(--card); padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .stat-box { text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; color: var(--primary); }
        .task-list { list-style: none; padding: 0; }
        .task-item { border-bottom: 1px solid #e2e8f0; padding: 1rem 0; display: flex; justify-content: space-between; align-items: center; }
        .badge { padding: 4px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
        .badge-alta { background: #fee2e2; color: #991b1b; }
        .badge-media { background: #fef3c7; color: #92400e; }
        .badge-baja { background: #dcfce7; color: #166534; }
        button { background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; }
        button:hover { opacity: 0.9; }
        button.delete { background: #ef4444; }
        input, select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 0.25rem; margin-right: 0.5rem; }
        
        /* CORRECCIÓN AQUI: */
        #login-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 100; }
        .hidden { display: none !important; } /* !important fuerza el ocultamiento */
    </style>
</head>
<body>
    <div id="login-overlay">
        <div class="card" style="width: 300px; text-align: center;">
            <h2>🔐 Acceso Requerido</h2>
            <p>Introduce tu API Key</p>
            <input type="password" id="apiKeyInput" placeholder="secret-123" value="secret-123">
            <button onclick="login()">Ingresar</button>
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 TaskMaster Dashboard</h1>
            <button onclick="logout()">Salir</button>
        </div>

        <div class="grid" style="margin-bottom: 2rem;">
            <div class="card stat-box">
                <div class="stat-number" id="stat-total">-</div>
                <div>Total Tareas</div>
            </div>
            <div class="card stat-box">
                <div class="stat-number" id="stat-completed" style="color: #166534">-</div>
                <div>Completadas</div>
            </div>
            <div class="card stat-box">
                <div class="stat-number" id="stat-high" style="color: #991b1b">-</div>
                <div>Prioridad Alta</div>
            </div>
        </div>

        <div class="card">
            <h3>Nueva Tarea</h3>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="newTitle" placeholder="Título de la tarea" style="flex: 2">
                <select id="newPriority">
                    <option value="baja">Baja</option>
                    <option value="media" selected>Media</option>
                    <option value="alta">Alta</option>
                </select>
                <button onclick="createTask()">Agregar</button>
            </div>
        </div>

        <div class="card">
            <h3>Lista de Tareas</h3>
            <ul id="taskList" class="task-list"></ul>
        </div>
    </div>

    <script>
        let API_KEY = localStorage.getItem('task_api_key');
        const API_URL = '/api';

        // Verificación inicial
        if (API_KEY) {
            document.getElementById('login-overlay').classList.add('hidden');
            loadData(); // Cargar datos si ya hay key
        }

        function login() {
            const key = document.getElementById('apiKeyInput').value;
            if (key) {
                API_KEY = key;
                localStorage.setItem('task_api_key', key);
                // Forzamos el ocultamiento
                document.getElementById('login-overlay').classList.add('hidden');
                loadData();
            }
        }

        function logout() {
            localStorage.removeItem('task_api_key');
            location.reload();
        }

        async function apiCall(endpoint, options = {}) {
            options.headers = { ...options.headers, 'x-api-key': API_KEY, 'Content-Type': 'application/json' };
            try {
                const res = await fetch(API_URL + endpoint, options);
                if (res.status === 401) { logout(); alert('API Key inválida'); return null; }
                return res.json();
            } catch (e) {
                console.error("Error de red", e);
                return null;
            }
        }

        async function loadData() {
            const [tasksData, statsData] = await Promise.all([
                apiCall('/tareas'),
                apiCall('/stats')
            ]);

            if (tasksData) renderTasks(tasksData.data);
            if (statsData) renderStats(statsData);
        }

        function renderStats(stats) {
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-completed').textContent = stats.completadas;
            document.getElementById('stat-high').textContent = stats.porPrioridad.alta;
        }

        function renderTasks(tasks) {
            const list = document.getElementById('taskList');
            list.innerHTML = tasks.map(t => \`
                <li class="task-item" style="opacity: \${t.completada ? 0.6 : 1}">
                    <div>
                        <strong style="text-decoration: \${t.completada ? 'line-through' : 'none'}">\${t.titulo}</strong>
                        <span class="badge badge-\${t.prioridad}">\${t.prioridad}</span>
                    </div>
                    <div>
                        <button onclick="toggleTask(\${t.id}, \${!t.completada})">\${t.completada ? '↩️' : '✅'}</button>
                        <button class="delete" onclick="deleteTask(\${t.id})">🗑️</button>
                    </div>
                </li>
            \`).join('');
        }

        async function createTask() {
            const titulo = document.getElementById('newTitle').value;
            const prioridad = document.getElementById('newPriority').value;
            if (!titulo) return alert('Escribe un título');

            await apiCall('/tareas', {
                method: 'POST',
                body: JSON.stringify({ titulo, prioridad })
            });
            document.getElementById('newTitle').value = '';
            loadData();
        }

        async function toggleTask(id, completada) {
            await apiCall('/tareas/' + id, {
                method: 'PUT',
                body: JSON.stringify({ completada })
            });
            loadData();
        }

        async function deleteTask(id) {
            if(!confirm('¿Eliminar tarea?')) return;
            await apiCall('/tareas/' + id, { method: 'DELETE' });
            loadData();
        }
    </script>
</body>
</html>
  `;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  servidor.close(() => process.exit(0));
});

servidor.listen(CONFIG.PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${CONFIG.PORT}`);
  console.log(`🔑 API Key maestra: ${CONFIG.API_KEY}`);
});