// Sistema de Monitoreo de Rendimiento para Chunks
(function() {
  'use strict';
  
  // Configuración
  const CONFIG = {
    CHUNK_TIMEOUT: 120000, // 2 minutos
    MAX_RETRIES: 3,
    REPORT_INTERVAL: 5 * 60 * 1000, // 5 minutos
    MEMORY_CHECK_INTERVAL: 30000, // 30 segundos
  };
  
  // Métricas globales
  const metrics = {
    chunks: [],
    totalLoadTime: 0,
    errors: 0,
    retries: 0,
    connectionType: null,
    memoryUsage: null,
  };
  
  const chunkRetries = new Map();
  const chunkStartTimes = new Map();
  
  // Utilidades
  function log(message, data) {
    console.log('🚀 PerformanceMonitor: ' + message, data || '');
  }
  
  function warn(message, data) {
    console.warn('⚠️ PerformanceMonitor: ' + message, data || '');
  }
  
  function error(message, data) {
    console.error('❌ PerformanceMonitor: ' + message, data || '');
  }
  
  function extractChunkId(url) {
    const match = url.match(/chunks\/([^\/]+\.js)/);
    return match ? match[1] : 'unknown';
  }
  
  function isChunkError(err) {
    if (!err) return false;
    
    const errorIndicators = [
      'ChunkLoadError',
      'Loading chunk',
      'net::ERR_INCOMPLETE_CHUNKED_ENCODING',
      'Failed to fetch',
      '_next/static/chunks/',
    ];
    
    const errorMessage = err.message || err.toString();
    return errorIndicators.some(function(indicator) {
      return errorMessage.includes(indicator);
    });
  }
  
  // Manejo de errores de chunks
  function handleChunkError(err, source) {
    const chunkId = extractChunkIdFromError(err);
    const retryCount = chunkRetries.get(chunkId) || 0;
    
    recordChunkError(chunkId, err.message, source);
    
    if (retryCount < CONFIG.MAX_RETRIES) {
      chunkRetries.set(chunkId, retryCount + 1);
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(function() {
        log('Reintentando carga de chunk ' + chunkId + ' (intento ' + (retryCount + 1) + ')');
        retryChunkLoad(chunkId);
      }, delay);
    } else {
      error('Chunk ' + chunkId + ' falló después de ' + CONFIG.MAX_RETRIES + ' intentos');
      handleCriticalChunkFailure(chunkId);
    }
  }
  
  function extractChunkIdFromError(err) {
    const message = err.message || err.toString();
    const match = message.match(/chunks\/([^\/\s]+)/);
    return match ? match[1] : 'unknown';
  }
  
  function recordChunkError(chunkId, errorType, source) {
    const metric = {
      chunkId: chunkId,
      loadTime: -1,
      size: 0,
      retryCount: chunkRetries.get(chunkId) || 0,
      errorType: errorType,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    metrics.chunks.push(metric);
    metrics.errors++;
    
    error('Error en chunk ' + chunkId + ':', {
      error: errorType,
      source: source,
      retryCount: metric.retryCount,
    });
  }
  
  function retryChunkLoad(chunkId) {
    const chunkUrl = '/_next/static/chunks/' + chunkId;
    
    fetch(chunkUrl, { cache: 'no-cache' })
      .then(function(response) {
        if (response.ok) {
          log('Chunk ' + chunkId + ' recargado exitosamente');
        } else {
          throw new Error('HTTP ' + response.status);
        }
      })
      .catch(function(err) {
        error('Fallo al recargar chunk ' + chunkId + ':', err);
      });
  }
  
  function handleCriticalChunkFailure(chunkId) {
    showCriticalErrorNotification(
      'Hubo un problema crítico cargando parte de la aplicación (' + chunkId + '). Se recomienda recargar la página.'
    );
  }
  
  function showCriticalErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = 
      'position: fixed;' +
      'top: 20px;' +
      'right: 20px;' +
      'background: #dc2626;' +
      'color: white;' +
      'padding: 16px;' +
      'border-radius: 8px;' +
      'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);' +
      'z-index: 10000;' +
      'max-width: 400px;' +
      'font-family: system-ui, -apple-system, sans-serif;' +
      'font-size: 14px;' +
      'line-height: 1.4;';
    
    const shortMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    notification.innerHTML = 
      '<div style="display: flex; align-items: start; gap: 12px;">' +
        '<div style="flex-shrink: 0; margin-top: 2px;">⚠️</div>' +
        '<div style="flex: 1;">' +
          '<div style="font-weight: 600; margin-bottom: 4px;">Error Crítico Detectado</div>' +
          '<div style="opacity: 0.9; font-size: 13px; margin-bottom: 8px;">' +
            shortMessage +
          '</div>' +
          '<button onclick="window.location.reload()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">' +
            'Recargar Página' +
          '</button>' +
        '</div>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; margin-left: 8px;">' +
          '×' +
        '</button>' +
      '</div>';
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
  
  // Monitoreo de memoria
  function setupMemoryMonitoring() {
    if (!('memory' in performance)) return;
    
    setInterval(function() {
      const memory = performance.memory;
      metrics.memoryUsage = memory.usedJSHeapSize;
      
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        warn('Alto uso de memoria detectado', {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2) + '%'
        });
      }
    }, CONFIG.MEMORY_CHECK_INTERVAL);
  }
  
  // Monitoreo de conexión
  function setupConnectionMonitoring() {
    if (!('connection' in navigator)) return;
    
    const connection = navigator.connection;
    metrics.connectionType = connection.effectiveType;
    
    connection.addEventListener('change', function() {
      metrics.connectionType = connection.effectiveType;
      log('Conexión cambió a: ' + connection.effectiveType);
    });
  }
  
  // Interceptar fetch para monitorear chunks
  function setupFetchInterception() {
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('_next/static/chunks/')) {
        const chunkId = extractChunkId(url);
        const startTime = performance.now();
        chunkStartTimes.set(chunkId, startTime);
        
        return originalFetch(input, init)
          .then(function(response) {
            const endTime = performance.now();
            
            if (response.ok) {
              recordSuccessfulChunkLoad(chunkId, endTime - startTime, response);
            } else {
              recordChunkError(chunkId, 'HTTP ' + response.status, url);
            }
            
            return response;
          })
          .catch(function(err) {
            recordChunkError(chunkId, err.message, url);
            throw err;
          });
      }
      
      return originalFetch(input, init);
    };
  }
  
  function recordSuccessfulChunkLoad(chunkId, loadTime, response) {
    const size = parseInt(response.headers.get('content-length') || '0');
    
    const metric = {
      chunkId: chunkId,
      loadTime: loadTime,
      size: size,
      retryCount: chunkRetries.get(chunkId) || 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    metrics.chunks.push(metric);
    metrics.totalLoadTime += loadTime;
    
    if (loadTime > 5000) {
      warn('Chunk lento detectado: ' + chunkId + ' (' + loadTime.toFixed(2) + 'ms)');
    } else {
      log('Chunk cargado: ' + chunkId + ' (' + loadTime.toFixed(2) + 'ms)');
    }
  }
  
  // Generar reportes
  function generateReport() {
    if (metrics.chunks.length === 0) return;
    
    const errorRate = (metrics.errors / metrics.chunks.length) * 100;
    const averageLoadTime = metrics.totalLoadTime / metrics.chunks.length;
    
    const slowChunks = metrics.chunks
      .filter(function(chunk) { return chunk.loadTime > 3000; })
      .sort(function(a, b) { return b.loadTime - a.loadTime; })
      .slice(0, 5);
      
    const errorChunks = metrics.chunks
      .filter(function(chunk) { return chunk.errorType; })
      .slice(-10);
    
    const report = {
      summary: {
        totalChunks: metrics.chunks.length,
        totalLoadTime: metrics.totalLoadTime,
        averageLoadTime: averageLoadTime,
        errors: metrics.errors,
        errorRate: errorRate,
        retries: metrics.retries,
        connectionType: metrics.connectionType,
        memoryUsage: metrics.memoryUsage,
      },
      slowChunks: slowChunks,
      errorChunks: errorChunks,
      timestamp: new Date().toISOString(),
    };
    
    log('Reporte de Rendimiento:', report);
    
    // Alertas automáticas
    if (errorRate > 20) {
      warn('Alta tasa de errores detectada: ' + errorRate.toFixed(2) + '%');
    }
    
    if (averageLoadTime > 10000) {
      warn('Tiempo promedio de carga alto: ' + averageLoadTime.toFixed(2) + 'ms');
    }
  }
  
  // Configurar reportes periódicos
  function setupPeriodicReporting() {
    setInterval(generateReport, CONFIG.REPORT_INTERVAL);
    
    window.addEventListener('beforeunload', generateReport);
    
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        generateReport();
      }
    });
  }
  
  // Configurar timeout de webpack
  function setupWebpackTimeout() {
    if (typeof window.__webpack_require__ !== 'undefined') {
      window.__webpack_require__.timeout = CONFIG.CHUNK_TIMEOUT;
      log('Webpack timeout configurado a ' + CONFIG.CHUNK_TIMEOUT + 'ms');
    }
  }
  
  // API pública para debugging
  function setupDebugAPI() {
    window.__PERFORMANCE_MONITOR__ = {
      getMetrics: function() {
        return JSON.parse(JSON.stringify(metrics));
      },
      clearMetrics: function() {
        metrics.chunks = [];
        metrics.totalLoadTime = 0;
        metrics.errors = 0;
        metrics.retries = 0;
        chunkRetries.clear();
        chunkStartTimes.clear();
        log('Métricas limpiadas');
      },
      generateReport: generateReport,
      config: CONFIG,
    };
    
    if (window.location.hostname === 'localhost') {
      log('API de debugging disponible en window.__PERFORMANCE_MONITOR__');
    }
  }
  
  // Inicialización
  function init() {
    log('Iniciando sistema de monitoreo...');
    
    // Configurar manejo de errores
    window.addEventListener('error', function(event) {
      if (isChunkError(event.error)) {
        handleChunkError(event.error, event.filename || 'unknown');
      }
    });
    
    window.addEventListener('unhandledrejection', function(event) {
      if (isChunkError(event.reason)) {
        handleChunkError(event.reason, 'promise-rejection');
        event.preventDefault();
      }
    });
    
    // Configurar monitoreo
    setupFetchInterception();
    setupMemoryMonitoring();
    setupConnectionMonitoring();
    setupPeriodicReporting();
    setupWebpackTimeout();
    setupDebugAPI();
    
    log('Sistema de monitoreo iniciado correctamente');
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})(); 