const fs = require('fs');
const path = require('path');
const url = require('url');
const { formidable } = require('formidable');
const mw = require('./middleware');
const viewHome = require('./views/home');
const viewProductos = require('./views/productos');
const viewDetalle = require('./views/producto-detalle');
const viewLogin = require('./views/login');
const viewAdmin = require('./views/admin');
const view404 = require('./views/404');
const viewError = require('./views/error');
const viewAbout = require('./views/about');

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'images');

// Asegurar directorios
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Helpers de Datos
const getProductos = () => JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'productos.json'), 'utf-8'));
const getComentarios = () => {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'comentarios.json'), 'utf-8')); }
    catch { return []; }
};

const handleRequest = async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const user = mw.getUserFromRequest(req);

    // Middleware global de métricas
    mw.trackMetrics(req);

    // --- 1. RUTAS ESTÁTICAS (CSS/JS/IMG) ---
    if (pathname.startsWith('/static/') || pathname.startsWith('/images/')) {
        let filePath = path.join(PUBLIC_DIR, pathname.replace('/static', ''));
        if (pathname.startsWith('/images/')) filePath = path.join(PUBLIC_DIR, pathname);

        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const mimeType = {
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.jpg': 'image/jpeg',
                '.png': 'image/png'
            }[ext] || 'text/plain';

            res.writeHead(200, { 'Content-Type': mimeType });
            return fs.createReadStream(filePath).pipe(res);
        }
    }

    // --- 2. RUTAS API (Datos JSON) ---
    if (pathname === '/api/productos' && method === 'GET') {
        const cached = mw.getCached('api_productos');
        if (cached) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'X-Cache': 'HIT' });
            return res.end(JSON.stringify(cached));
        }
        const data = getProductos();
        mw.setCache('api_productos', data);
        res.writeHead(200, { 'Content-Type': 'application/json', 'X-Cache': 'MISS' });
        return res.end(JSON.stringify(data));
    }

    // HOME
    if (pathname === '/' && method === 'GET') {
        const html = viewHome({
            titulo: 'Bienvenido a Mi Tienda',
            products: getProductos().slice(0, 3), // Top 3
            fecha: new Date().toLocaleDateString(),
            user: user
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // CATÁLOGO DE PRODUCTOS
    if (pathname === '/productos' && method === 'GET') {
        const html = viewProductos({
            titulo: 'Nuestro Catálogo',
            productos: getProductos(),
            filtros: parsedUrl.query,
            user: user
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // DETALLE DE PRODUCTO
    if (pathname.match(/^\/productos\/\d+$/) && method === 'GET') {
        const id = parseInt(pathname.split('/')[2]);
        const prod = getProductos().find(p => p.id === id);

        if (prod) {
            // Inyectar comentarios
            const comments = getComentarios().filter(c => c.productoId === id);
            prod.comentarios = comments;

            const html = viewDetalle({
                titulo: prod.nombre,
                producto: prod,
                user: user
            });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(html);
        }
    }

    // LOGIN (GET)
    if (pathname === '/login' && method === 'GET') {
        if (user) {
            res.writeHead(302, { 'Location': '/admin' });
            return res.end();
        }
        const html = viewLogin({ titulo: 'Acceso Administrativo', user: user });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // LOGIN (POST)
    if (pathname === '/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const username = params.get('username');
            const password = params.get('password');

            if (username === 'admin' && password === 'admin123') {
                const token = mw.createSession({ role: 'admin', name: 'Administrador' });
                res.writeHead(302, {
                    'Set-Cookie': `session_id=${token}; HttpOnly; Path=/; Max-Age=3600`,
                    'Location': '/admin'
                });
                res.end();
            } else {
                // Usamos la vista de error
                const html = viewError({
                    titulo: 'Error de Acceso',
                    mensaje: 'Credenciales incorrectas.',
                    error: 'El usuario o la contraseña no coinciden.',
                    user: user
                });
                res.writeHead(401, { 'Content-Type': 'text/html' });
                res.end(html);
            }
        });
        return;
    }

    // LOGOUT
    if (pathname === '/logout') {
        res.writeHead(302, {
            'Set-Cookie': 'session_id=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
            'Location': '/'
        });
        return res.end();
    }

    // PANEL ADMIN
    if (pathname === '/admin' && method === 'GET') {
        if (!user || user.role !== 'admin') {
            res.writeHead(302, { 'Location': '/login' });
            return res.end();
        }

        const metrics = mw.getMetrics();
        const html = viewAdmin({
            titulo: 'Panel de Administración',
            user: user,
            metrics: metrics
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // SUBIDA DE ARCHIVOS
    if (pathname === '/upload' && method === 'POST') {
        if (!user) return res.end('Necesitas login');

        const form = formidable({
            uploadDir: UPLOADS_DIR,
            keepExtensions: true,
            // Renombrar archivo para evitar colisiones
            filename: (name, ext, part, form) => `prod_${Date.now()}${ext}`
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error al subir archivo');
            }

            // 1. Leer base de datos actual
            const productos = getProductos();

            // 2. Generar nuevo ID (el último + 1)
            const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;

            // 3. Extraer datos (Formidable v3 devuelve arrays, tomamos el primer valor)
            // Nota: Dependiendo de tu versión exacta de formidable, puede ser fields.nombre o fields.nombre[0]
            // Esta función auxiliar asegura que obtengamos el string
            const getValue = (val) => Array.isArray(val) ? val[0] : val;

            const nuevoProducto = {
                id: newId,
                nombre: getValue(fields.nombre),
                precio: parseInt(getValue(fields.precio)),
                categoria: getValue(fields.categoria),
                // Guardamos la ruta relativa de la imagen para usarla en el HTML
                imagen: files.imagen ? `/images/${files.imagen[0].newFilename}` : null
            };

            // 4. Guardar en JSON
            productos.push(nuevoProducto);
            fs.writeFileSync(path.join(DATA_DIR, 'productos.json'), JSON.stringify(productos, null, 2));

            // 5. Redirigir al admin o mostrar éxito
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: green;">¡Producto Guardado!</h2>
                    <p>Se ha agregado: <strong>${nuevoProducto.nombre}</strong></p>
                    <a href="/admin">Volver al Panel</a> | <a href="/productos">Ver en Catálogo</a>
                </div>
            `);
        });
        return;
    }
    // COMENTARIOS (API)
    if (pathname === '/api/comentar' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const comment = JSON.parse(body);
            const comentarios = getComentarios();
            comentarios.push({ ...comment, fecha: new Date() });
            fs.writeFileSync(path.join(DATA_DIR, 'comentarios.json'), JSON.stringify(comentarios));
            res.writeHead(201);
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    if (pathname === '/about' && method === 'GET') {
        const html = viewAbout({
            titulo: 'Nuestra Historia',
            empresa: 'TechStore Enterprise',
            descripcion: 'Somos una empresa dedicada a la venta de hardware de última generación. Nuestro sistema está construido íntegramente sobre Node.js nativo para demostrar el máximo rendimiento y eficiencia sin dependencias externas innecesarias.',
            fundacion: '2025',
            user: user
        });
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }
    // 404 - NO ENCONTRADO
    const html = view404({ titulo: 'No Encontrado', mensaje: 'La ruta no existe', user: user });
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(html);
};

module.exports = handleRequest;