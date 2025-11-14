const fs = require('fs').promises;
const https = require('https');
const { URL } = require('url');

// URLs de las APIs
const APIs = [
    'https://jsonplaceholder.typicode.com/comments',
    'https://jsonplaceholder.typicode.com/posts',
    'https://jsonplaceholder.typicode.com/users'
];

// Configuración
const CONFIG = {
    maxRetries: 3,
    timeout: 10000, // 10 segundos
    retryDelay: 1000, // 1 segundo
    dataDir: './data'
};

// Logger
class Logger {
    static log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        console.log(JSON.stringify(logEntry));
    }

    static info(message, data = null) {
        this.log('INFO', message, data);
    }

    static error(message, data = null) {
        this.log('ERROR', message, data);
    }

    static warn(message, data = null) {
        this.log('WARN', message, data);
    }
}

// Utilidad para hacer requests HTTP
function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            timeout: CONFIG.timeout,
            ...options
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error(`Error parsing JSON: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Función de reintento genérica
async function withRetry(operation, operationName, maxRetries = CONFIG.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            Logger.info(`Intento ${attempt} para ${operationName}`);
            return await operation();
        } catch (error) {
            lastError = error;
            Logger.warn(`Error en intento ${attempt} para ${operationName}`, {
                error: error.message
            });
            
            if (attempt < maxRetries) {
                await new Promise(resolve => 
                    setTimeout(resolve, CONFIG.retryDelay * attempt)
                );
            }
        }
    }
    
    throw new Error(`Falló ${operationName} después de ${maxRetries} intentos: ${lastError.message}`);
}

// Procesador de datos
class DataProcessor {
    static processData(data, apiName) {
        Logger.info(`Procesando datos de ${apiName}`, {
            records: data.length
        });

        // Ejemplo de procesamiento: agregar timestamp y fuente
        return data.map(item => ({
            ...item,
            _syncTimestamp: new Date().toISOString(),
            _source: apiName
        }));
    }
}

// ===============================
// IMPLEMENTACIÓN CON CALLBACKS
// ===============================

function downloadWithCallbacks(url, callback) {
    const urlObj = new URL(url);
    
    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: CONFIG.timeout
    };

    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const parsedData = JSON.parse(data);
                    callback(null, parsedData);
                } catch (error) {
                    callback(new Error(`Error parsing JSON: ${error.message}`));
                }
            } else {
                callback(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
        });
    });

    req.on('timeout', () => {
        req.destroy();
        callback(new Error('Request timeout'));
    });

    req.on('error', (error) => {
        callback(error);
    });

    req.end();
}

function retryWithCallbacks(operation, operationName, maxRetries, callback, attempt = 1) {
    operation((error, result) => {
        if (error) {
            Logger.warn(`Error en intento ${attempt} para ${operationName}`, {
                error: error.message
            });
            
            if (attempt < maxRetries) {
                setTimeout(() => {
                    retryWithCallbacks(operation, operationName, maxRetries, callback, attempt + 1);
                }, CONFIG.retryDelay * attempt);
            } else {
                callback(new Error(`Falló ${operationName} después de ${maxRetries} intentos: ${error.message}`));
            }
        } else {
            callback(null, result);
        }
    });
}

function syncWithCallbacks(callback) {
    Logger.info('Iniciando sincronización con CALLBACKS');
    
    let completed = 0;
    const total = APIs.length;
    const results = {};
    let hasError = false;

    function checkCompletion() {
        completed++;
        if (completed === total) {
            if (hasError) {
                callback(new Error('Algunas APIs fallaron en la sincronización'));
            } else {
                Logger.info('Sincronización con CALLBACKS completada');
                callback(null, results);
            }
        }
    }

    APIs.forEach(apiUrl => {
        const apiName = apiUrl.split('/').pop();
        
        retryWithCallbacks(
            (cb) => downloadWithCallbacks(apiUrl, cb),
            `descarga de ${apiName}`,
            CONFIG.maxRetries,
            (error, data) => {
                if (error) {
                    Logger.error(`Error sincronizando ${apiName}`, { error: error.message });
                    hasError = true;
                } else {
                    const processedData = DataProcessor.processData(data, apiName);
                    results[apiName] = processedData;
                    Logger.info(`Datos de ${apiName} procesados`, { records: processedData.length });
                }
                checkCompletion();
            }
        );
    });
}

// ===============================
// IMPLEMENTACIÓN CON PROMISES
// ===============================

function syncWithPromises() {
    Logger.info('Iniciando sincronización con PROMISES');
    
    const downloadPromises = APIs.map(apiUrl => {
        const apiName = apiUrl.split('/').pop();
        
        return withRetry(
            () => httpRequest(apiUrl),
            `descarga de ${apiName}`
        )
        .then(data => {
            const processedData = DataProcessor.processData(data, apiName);
            Logger.info(`Datos de ${apiName} procesados`, { records: processedData.length });
            return { [apiName]: processedData };
        })
        .catch(error => {
            Logger.error(`Error sincronizando ${apiName}`, { error: error.message });
            return { [apiName]: null, error: error.message };
        });
    });

    return Promise.all(downloadPromises)
        .then(results => {
            const mergedResults = {};
            let hasErrors = false;
            
            results.forEach(result => {
                const key = Object.keys(result)[0];
                if (result[key] === null) {
                    hasErrors = true;
                } else {
                    mergedResults[key] = result[key];
                }
            });

            if (hasErrors) {
                throw new Error('Algunas APIs fallaron en la sincronización');
            }

            Logger.info('Sincronización con PROMISES completada');
            return mergedResults;
        });
}

// ===============================
// IMPLEMENTACIÓN CON ASYNC/AWAIT
// ===============================

async function syncWithAsyncAwait() {
    Logger.info('Iniciando sincronización con ASYNC/AWAIT');
    
    const results = {};
    const errors = [];

    for (const apiUrl of APIs) {
        const apiName = apiUrl.split('/').pop();
        
        try {
            const data = await withRetry(
                () => httpRequest(apiUrl),
                `descarga de ${apiName}`
            );
            
            const processedData = DataProcessor.processData(data, apiName);
            results[apiName] = processedData;
            Logger.info(`Datos de ${apiName} procesados`, { records: processedData.length });
            
        } catch (error) {
            Logger.error(`Error sincronizando ${apiName}`, { error: error.message });
            errors.push({ api: apiName, error: error.message });
        }
    }

    if (errors.length > 0) {
        throw new Error(`Sincronización fallida para ${errors.length} API(s)`);
    }

    Logger.info('Sincronización con ASYNC/AWAIT completada');
    return results;
}

// ===============================
// FUNCIÓN PRINCIPAL
// ===============================

async function main() {
    try {
        // Crear directorio de datos si no existe
        await fs.mkdir(CONFIG.dataDir, { recursive: true });
        
        Logger.info('Iniciando sistema de sincronización');

        // Ejecutar las tres implementaciones y comparar
        const startTime = Date.now();
        
        // 1. Sincronización con Callbacks
        const callbackStart = Date.now();
        await new Promise((resolve, reject) => {
            syncWithCallbacks((error, results) => {
                if (error) {
                    Logger.error('Sincronización con callbacks falló', { error: error.message });
                    reject(error);
                } else {
                    const callbackTime = Date.now() - callbackStart;
                    Logger.info('Callbacks completado', { tiempo: `${callbackTime}ms` });
                    resolve(results);
                }
            });
        }).catch(() => {}); // Continuar aunque falle

        // 2. Sincronización con Promises
        const promisesStart = Date.now();
        try {
            const promisesResults = await syncWithPromises();
            const promisesTime = Date.now() - promisesStart;
            Logger.info('Promises completado', { tiempo: `${promisesTime}ms` });
        } catch (error) {
            Logger.error('Sincronización con promises falló', { error: error.message });
        }

        // 3. Sincronización con Async/Await
        const asyncStart = Date.now();
        try {
            const asyncResults = await syncWithAsyncAwait();
            const asyncTime = Date.now() - asyncStart;
            Logger.info('Async/Await completado', { tiempo: `${asyncTime}ms` });
            
            // Guardar datos (usamos los de async/await como ejemplo)
            for (const [apiName, data] of Object.entries(asyncResults)) {
                const filename = `${CONFIG.dataDir}/${apiName}_${Date.now()}.json`;
                await fs.writeFile(filename, JSON.stringify(data, null, 2));
                Logger.info(`Datos guardados en ${filename}`, { records: data.length });
            }
        } catch (error) {
            Logger.error('Sincronización con async/await falló', { error: error.message });
        }

        const totalTime = Date.now() - startTime;
        Logger.info('Sincronización completada', { tiempoTotal: `${totalTime}ms` });

    } catch (error) {
        Logger.error('Error en el sistema de sincronización', { error: error.message });
    }
}

// Ejecutar el sistema
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    syncWithCallbacks,
    syncWithPromises,
    syncWithAsyncAwait,
    withRetry,
    DataProcessor
};