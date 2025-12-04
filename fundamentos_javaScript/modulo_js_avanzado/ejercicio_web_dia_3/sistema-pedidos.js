const https = require('https');
const http = require('http');
const URL = require('url');

class WebScraper {
    constructor(options = {}) {
        this.maxConcurrent = options.maxConcurrent || 5;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000; // ms
        this.requestTimeout = options.requestTimeout || 10000; // ms
        this.rateLimit = options.rateLimit || 1000; // ms entre solicitudes
        
        // Métricas de rendimiento
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retryCount: 0,
            totalTime: 0,
            startTime: null,
            endTime: null
        };
        
        // Cache para evitar duplicados
        this.visitedUrls = new Set();
        
        // Cola de rate limiting
        this.lastRequestTime = 0;
        this.requestQueue = [];
        this.isProcessingQueue = false;
    }

    // Rate limiting con cola
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimit) {
            const waitTime = this.rateLimit - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        return true;
    }

    // Función de reintento con backoff exponencial
    async withRetry(fn, url, attempts = this.retryAttempts) {
        let lastError;
        
        for (let i = 0; i < attempts; i++) {
            try {
                if (i > 0) {
                    this.metrics.retryCount++;
                    const delay = this.retryDelay * Math.pow(2, i - 1); // Backoff exponencial
                    console.log(`Reintentando ${url} (intento ${i + 1}/${attempts}) en ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`Intento ${i + 1} fallido para ${url}: ${error.message}`);
                
                // No reintentar para ciertos errores
                if (error.message.includes('404') || error.message.includes('403')) {
                    break;
                }
            }
        }
        
        throw lastError;
    }

    // Descargar una página individual
    async fetchPage(url) {
        await this.waitForRateLimit();
        
        const fetchFn = () => new Promise((resolve, reject) => {
            const parsedUrl = new URL.URL(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: this.requestTimeout
            };
            
            const req = client.request(options, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Manejar redirecciones
                    const redirectUrl = new URL.URL(res.headers.location, url).href;
                    return resolve(this.fetchPage(redirectUrl));
                }
                
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({
                    url,
                    content: data,
                    statusCode: res.statusCode,
                    headers: res.headers
                }));
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
            
            req.end();
        });
        
        return this.withRetry(fetchFn, url);
    }

    // Procesar datos con async generator (streaming)
    async *processDataGenerator(data) {
        // Ejemplo: extraer todos los enlaces de una página HTML
        const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
        let match;
        
        while ((match = linkRegex.exec(data.content)) !== null) {
            const link = match[1];
            const absoluteUrl = new URL.URL(link, data.url).href;
            
            // Filtrar por dominio si es necesario
            if (this.isValidUrl(absoluteUrl)) {
                yield {
                    sourceUrl: data.url,
                    extractedUrl: absoluteUrl,
                    text: link,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        // Ejemplo: extraer títulos
        const titleMatch = data.content.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) {
            yield {
                sourceUrl: data.url,
                type: 'title',
                content: titleMatch[1],
                timestamp: new Date().toISOString()
            };
        }
        
        // Ejemplo: extraer meta descripciones
        const metaDescMatch = data.content.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
        if (metaDescMatch) {
            yield {
                sourceUrl: data.url,
                type: 'description',
                content: metaDescMatch[1],
                timestamp: new Date().toISOString()
            };
        }
    }

    isValidUrl(url) {
        try {
            const parsed = new URL.URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Descargar múltiples páginas concurrentemente
    async scrapePages(urls, batchSize = this.maxConcurrent) {
        this.metrics.startTime = Date.now();
        this.metrics.totalRequests = urls.length;
        
        const results = [];
        const allUrls = [...urls];
        
        // Procesar en lotes para control de concurrencia
        for (let i = 0; i < allUrls.length; i += batchSize) {
            const batch = allUrls.slice(i, i + batchSize);
            console.log(`Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(allUrls.length / batchSize)}`);
            
            // Crear promesas para el lote actual
            const promises = batch.map(async (url) => {
                if (this.visitedUrls.has(url)) {
                    return { status: 'rejected', reason: new Error('URL ya visitada'), url };
                }
                
                this.visitedUrls.add(url);
                
                try {
                    const pageData = await this.fetchPage(url);
                    this.metrics.successfulRequests++;
                    return { status: 'fulfilled', value: pageData, url };
                } catch (error) {
                    this.metrics.failedRequests++;
                    return { status: 'rejected', reason: error, url };
                }
            });
            
            // Usar Promise.allSettled para manejar fallos gracefully
            const batchResults = await Promise.allSettled(promises);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    // La promesa del fetchPage ya se resolvió en el mapa anterior
                    const fetchResult = await result.value;
                    results.push(fetchResult);
                } else {
                    // Manejar error de la promesa wrapper
                    console.error(`Error procesando URL: ${result.reason}`);
                }
            }
            
            // Pequeña pausa entre lotes para ser amigable con el servidor
            if (i + batchSize < allUrls.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        this.metrics.endTime = Date.now();
        this.metrics.totalTime = this.metrics.endTime - this.metrics.startTime;
        
        return results;
    }

    // Generar reporte de rendimiento
    generatePerformanceReport() {
        const {
            totalRequests,
            successfulRequests,
            failedRequests,
            retryCount,
            totalTime
        } = this.metrics;
        
        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0;
        const avgTimePerRequest = totalRequests > 0 ? (totalTime / totalRequests).toFixed(2) : 0;
        
        return {
            summary: {
                totalRequests,
                successfulRequests,
                failedRequests,
                successRate: `${successRate}%`,
                retryCount,
                totalTimeMs: totalTime,
                totalTimeSeconds: (totalTime / 1000).toFixed(2),
                averageTimePerRequestMs: avgTimePerRequest
            },
            details: {
                startTime: new Date(this.metrics.startTime).toISOString(),
                endTime: new Date(this.metrics.endTime).toISOString(),
                duration: `${(totalTime / 1000).toFixed(2)} segundos`,
                urlsVisited: this.visitedUrls.size
            }
        };
    }

    // Método principal para scraping con procesamiento en streaming
    async *scrapeAndProcess(urls) {
        const scrapedPages = await this.scrapePages(urls);
        
        for (const pageData of scrapedPages) {
            if (pageData.status === 'fulfilled') {
                // Procesar los datos en streaming usando el async generator
                for await (const processedData of this.processDataGenerator(pageData.value)) {
                    yield processedData;
                }
            }
        }
    }
}

// Ejemplo de uso
async function main() {
    // Lista de URLs para scrapear (ejemplo)
    const urlsToScrape = [
        'https://httpbin.org/html',
        'https://httpbin.org/status/200',
        'https://httpbin.org/status/404', // Esta fallará
        'https://httpbin.org/status/429', // Rate limiting
        'https://httpbin.org/headers',
        'https://httpbin.org/delay/2', // Simula demora
        'https://httpbin.org/redirect-to?url=https://httpbin.org/html',
        'https://example.com',
        'https://httpbin.org/status/500', // Error de servidor
        'https://httpbin.org/user-agent'
    ];

    // Configurar el scraper
    const scraper = new WebScraper({
        maxConcurrent: 3,           // Máximo 3 solicitudes concurrentes
        retryAttempts: 2,           // 2 reintentos por fallo
        retryDelay: 1500,           // 1.5 segundos entre reintentos
        requestTimeout: 8000,       // 8 segundos timeout
        rateLimit: 1200             // 1.2 segundos entre solicitudes
    });

    console.log('Iniciando scraping de', urlsToScrape.length, 'URLs...');
    console.log('========================================');

    // Procesar datos en streaming
    const extractedData = [];
    
    try {
        // Usar el async generator para procesar en streaming
        for await (const data of scraper.scrapeAndProcess(urlsToScrape)) {
            extractedData.push(data);
            console.log('Dato extraído:', {
                tipo: data.type || 'enlace',
                contenido: data.content || data.extractedUrl,
                fuente: data.sourceUrl
            });
        }
        
        console.log('\n========================================');
        console.log('Scraping completado!');
        console.log(`Extraídos ${extractedData.length} elementos de datos`);
        
        // Generar reporte de rendimiento
        const report = scraper.generatePerformanceReport();
        console.log('\n=== REPORTE DE RENDIMIENTO ===');
        console.log(JSON.stringify(report, null, 2));
        
        // Mostrar algunos datos extraídos
        console.log('\n=== MUESTRA DE DATOS EXTRAÍDOS ===');
        const sampleData = extractedData.slice(0, 5);
        sampleData.forEach((data, i) => {
            console.log(`${i + 1}. Tipo: ${data.type || 'enlace'}`);
            console.log(`   Fuente: ${data.sourceUrl}`);
            console.log(`   Contenido: ${data.content || data.extractedUrl}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Error durante el scraping:', error);
    }
}

// Ejecutar si este archivo es el principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = WebScraper;