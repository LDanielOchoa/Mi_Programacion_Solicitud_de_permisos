/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// Tipos para métricas de rendimiento
interface ChunkMetrics {
  chunkId: string;
  loadTime: number;
  size: number;
  retryCount: number;
  errorType?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

interface PerformanceMetrics {
  chunks: ChunkMetrics[];
  totalLoadTime: number;
  errors: number;
  retries: number;
  connectionType?: string;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private chunkRetries: Map<string, number>;
  private chunkStartTimes: Map<string, number>;
  private observer: PerformanceObserver | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.metrics = {
      chunks: [],
      totalLoadTime: 0,
      errors: 0,
      retries: 0,
    };
    this.chunkRetries = new Map();
    this.chunkStartTimes = new Map();
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Configurar observador de rendimiento
    this.setupPerformanceObserver();
    
    // Configurar manejo de errores de chunks
    this.setupChunkErrorHandling();
    
    // Configurar monitoreo de recursos
    this.setupResourceMonitoring();
    
    // Configurar reporte periódico
    this.setupPeriodicReporting();

    console.log('🚀 Performance Monitor iniciado');
  }

  private setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('_next/static/chunks/')) {
            this.recordChunkLoad(entry);
          }
        });
      });

      this.observer.observe({ 
        entryTypes: ['resource', 'measure', 'navigation'] 
      });
    } catch (error) {
      console.warn('❌ No se pudo configurar PerformanceObserver:', error);
    }
  }

  private setupChunkErrorHandling() {
    // Manejo de errores JavaScript
    window.addEventListener('error', (event) => {
      const error = event.error;
      if (this.isChunkError(error)) {
        this.handleChunkError(error, event.filename || 'unknown');
      }
    });

    // Manejo de promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (this.isChunkError(error)) {
        this.handleChunkError(error, 'promise-rejection');
        event.preventDefault(); // Prevenir que se muestre en consola
      }
    });

    // Interceptar fetch para monitorear chunks
    this.interceptFetch();
  }

  private setupResourceMonitoring() {
    // Monitorear memoria si está disponible
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Alertar si el uso de memoria es alto
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('⚠️ Alto uso de memoria detectado');
          this.reportHighMemoryUsage();
        }
      }, 30000); // Cada 30 segundos
    }

    // Detectar tipo de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType;
      
      connection.addEventListener('change', () => {
        this.metrics.connectionType = connection.effectiveType;
        console.log(`📡 Conexión cambió a: ${connection.effectiveType}`);
      });
    }
  }

  private setupPeriodicReporting() {
    // Reporte cada 5 minutos
    setInterval(() => {
      this.generateReport();
    }, 5 * 60 * 1000);

    // Reporte al salir de la página
    window.addEventListener('beforeunload', () => {
      this.generateReport();
    });

    // Reporte cuando la página se oculta
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.generateReport();
      }
    });
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('_next/static/chunks/')) {
        const chunkId = this.extractChunkId(url);
        const startTime = performance.now();
        this.chunkStartTimes.set(chunkId, startTime);
        
        try {
          const response = await originalFetch(input, init);
          const endTime = performance.now();
          
          if (response.ok) {
            this.recordSuccessfulChunkLoad(chunkId, endTime - startTime, response);
          } else {
            this.recordChunkError(chunkId, `HTTP ${response.status}`, url);
          }
          
          return response;
                 } catch (error) {
           this.recordChunkError(chunkId, (error as Error).message, url);
           throw error;
         }
      }
      
      return originalFetch(input, init);
    };
  }

  private isChunkError(error: any): boolean {
    if (!error) return false;
    
    const errorIndicators = [
      'ChunkLoadError',
      'Loading chunk',
      'ChunkLoadError',
      'net::ERR_INCOMPLETE_CHUNKED_ENCODING',
      'Failed to fetch',
      '_next/static/chunks/',
    ];
    
    const errorMessage = error.message || error.toString();
    return errorIndicators.some(indicator => 
      errorMessage.includes(indicator)
    );
  }

  private handleChunkError(error: any, source: string) {
    const chunkId = this.extractChunkIdFromError(error);
    const retryCount = this.chunkRetries.get(chunkId) || 0;
    
    this.recordChunkError(chunkId, error.message, source);
    
    // Lógica de reintentos inteligente
    if (retryCount < 3) {
      this.chunkRetries.set(chunkId, retryCount + 1);
      
      // Delay exponencial para reintentos
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(() => {
        console.log(`🔄 Reintentando carga de chunk ${chunkId} (intento ${retryCount + 1})`);
        this.retryChunkLoad(chunkId);
      }, delay);
    } else {
      console.error(`❌ Chunk ${chunkId} falló después de 3 intentos`);
      this.handleCriticalChunkFailure(chunkId);
    }
  }

  private recordChunkLoad(entry: PerformanceEntry) {
    const chunkId = this.extractChunkId(entry.name);
    const size = 'transferSize' in entry ? (entry as any).transferSize : 0;
    
    const metric: ChunkMetrics = {
      chunkId,
      loadTime: entry.duration,
      size,
      retryCount: this.chunkRetries.get(chunkId) || 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    this.metrics.chunks.push(metric);
    this.metrics.totalLoadTime += entry.duration;
    
    // Log si la carga es lenta
    if (entry.duration > 5000) {
      console.warn(`⚠️ Chunk lento detectado: ${chunkId} (${entry.duration.toFixed(2)}ms)`);
    }
  }

  private recordSuccessfulChunkLoad(chunkId: string, loadTime: number, response: Response) {
    const size = parseInt(response.headers.get('content-length') || '0');
    
    const metric: ChunkMetrics = {
      chunkId,
      loadTime,
      size,
      retryCount: this.chunkRetries.get(chunkId) || 0,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    this.metrics.chunks.push(metric);
    this.metrics.totalLoadTime += loadTime;
    
    console.log(`✅ Chunk cargado exitosamente: ${chunkId} (${loadTime.toFixed(2)}ms)`);
  }

  private recordChunkError(chunkId: string, errorType: string, source: string) {
    const metric: ChunkMetrics = {
      chunkId,
      loadTime: -1,
      size: 0,
      retryCount: this.chunkRetries.get(chunkId) || 0,
      errorType,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    this.metrics.chunks.push(metric);
    this.metrics.errors++;
    
    console.error(`❌ Error en chunk ${chunkId}:`, {
      error: errorType,
      source,
      retryCount: metric.retryCount,
    });
  }

  private extractChunkId(url: string): string {
    const match = url.match(/chunks\/([^\/]+\.js)/);
    return match ? match[1] : 'unknown';
  }

  private extractChunkIdFromError(error: any): string {
    const message = error.message || error.toString();
    const match = message.match(/chunks\/([^\/\s]+)/);
    return match ? match[1] : 'unknown';
  }

  private retryChunkLoad(chunkId: string) {
    // Intentar recargar el chunk específico
    const chunkUrl = `/_next/static/chunks/${chunkId}`;
    
    fetch(chunkUrl, { cache: 'no-cache' })
      .then(response => {
        if (response.ok) {
          console.log(`✅ Chunk ${chunkId} recargado exitosamente`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .catch(error => {
        console.error(`❌ Fallo al recargar chunk ${chunkId}:`, error);
      });
  }

  private handleCriticalChunkFailure(chunkId: string) {
    // Notificar al usuario del problema crítico
    const message = `Hubo un problema crítico cargando parte de la aplicación (${chunkId}). Se recomienda recargar la página.`;
    
    if (confirm(message)) {
      window.location.reload();
    }
  }

  private reportHighMemoryUsage() {
    const report = {
      type: 'high-memory',
      memoryUsage: this.metrics.memoryUsage,
      chunksLoaded: this.metrics.chunks.length,
      timestamp: Date.now(),
    };
    
    console.warn('🧠 Reporte de alto uso de memoria:', report);
  }

  private generateReport() {
    if (this.metrics.chunks.length === 0) return;

    const report = {
      summary: {
        totalChunks: this.metrics.chunks.length,
        totalLoadTime: this.metrics.totalLoadTime,
        averageLoadTime: this.metrics.totalLoadTime / this.metrics.chunks.length,
        errors: this.metrics.errors,
        errorRate: (this.metrics.errors / this.metrics.chunks.length) * 100,
        retries: this.metrics.retries,
        connectionType: this.metrics.connectionType,
        memoryUsage: this.metrics.memoryUsage,
      },
      slowChunks: this.metrics.chunks
        .filter(chunk => chunk.loadTime > 3000)
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 5),
      errorChunks: this.metrics.chunks
        .filter(chunk => chunk.errorType)
        .slice(-10),
      timestamp: new Date().toISOString(),
    };

    console.log('📊 Reporte de Rendimiento:', report);
    
    // Aquí podrías enviar el reporte a tu sistema de monitoreo
    // this.sendReportToServer(report);
  }

  // Métodos públicos para control
  public disable() {
    this.isEnabled = false;
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  public enable() {
    this.isEnabled = true;
    this.setupPerformanceObserver();
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public clearMetrics() {
    this.metrics = {
      chunks: [],
      totalLoadTime: 0,
      errors: 0,
      retries: 0,
    };
    this.chunkRetries.clear();
    this.chunkStartTimes.clear();
  }
}

// Instancia global del monitor
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(): PerformanceMonitor {
  if (typeof window === 'undefined') {
    return null as any;
  }
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

export { PerformanceMonitor };
export type { ChunkMetrics, PerformanceMetrics }; 