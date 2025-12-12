const http = require('http');
const handleRequest = require('./router');
const PORT = process.env.PORT || 3000;

const server = http.createServer(handleRequest);

// Solo iniciamos el servidor si no estamos en modo test
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server corriendo en http://localhost:${PORT}`);
        console.log(`Métricas disponibles en /admin (requiere login)`);
    });
}

module.exports = server;