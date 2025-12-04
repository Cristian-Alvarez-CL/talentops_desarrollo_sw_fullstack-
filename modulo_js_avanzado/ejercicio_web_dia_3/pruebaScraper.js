// pruebaScraper.js
const WebScraper = require('./sistema-pedidos');

async function pruebaSimple() {
    console.log('=== PRUEBA SIMPLE DEL WEB SCRAPER ===\n');
    
    const scraper = new WebScraper({
        maxConcurrent: 2,
        retryAttempts: 1,
        rateLimit: 2000
    });

    const urls = [
        'https://httpbin.org/html',
        'https://example.com',
        'https://httpbin.org/status/200',
        'https://httpbin.org/status/404'  // Esta fallará
    ];

    console.log(`Scrapeando ${urls.length} URLs...\n`);
    
    const resultados = await scraper.scrapePages(urls);
    
    console.log('\n=== RESULTADOS ===');
    console.log(`Páginas exitosas: ${scraper.metrics.successfulRequests}`);
    console.log(`Páginas fallidas: ${scraper.metrics.failedRequests}`);
    
    // Mostrar reporte
    const reporte = scraper.generatePerformanceReport();
    console.log('\n=== REPORTE ===');
    console.log(JSON.stringify(reporte, null, 2));
}

pruebaSimple().catch(console.error);