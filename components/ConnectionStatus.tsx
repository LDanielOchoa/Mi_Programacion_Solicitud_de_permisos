'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalLow, 
  SignalMedium, 
  SignalHigh,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  connectionQuality: 'good' | 'slow' | 'poor' | 'offline';
  isSubmitting: boolean;
  isRetrying: boolean;
  retryCount: number;
  stage: string;
  progressMessage?: string;
  connectionStatus?: string;
  pendingRequestsCount?: number;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function ConnectionStatus({
  connectionQuality,
  isSubmitting,
  isRetrying,
  retryCount,
  stage,
  progressMessage,
  connectionStatus,
  pendingRequestsCount = 0,
  onCancel,
  onRetry
}: ConnectionStatusProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar solo cuando hay actividad o problemas de conexión
  useEffect(() => {
    const shouldShow = isSubmitting || 
                      isRetrying || 
                      connectionQuality === 'offline' || 
                      connectionQuality === 'poor' ||
                      pendingRequestsCount > 0 ||
                      !!connectionStatus ||
                      !!progressMessage;
    
    setIsVisible(shouldShow);
  }, [
    isSubmitting, 
    isRetrying, 
    connectionQuality, 
    pendingRequestsCount,
    connectionStatus,
    progressMessage
  ]);

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'poor':
        return <SignalLow className="h-4 w-4 text-red-500" />;
      case 'slow':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />;
      case 'good':
      default:
        return <SignalHigh className="h-4 w-4 text-green-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'offline':
        return 'border-red-200 bg-red-50';
      case 'poor':
        return 'border-red-200 bg-red-50';
      case 'slow':
        return 'border-yellow-200 bg-yellow-50';
      case 'good':
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  const getStageIcon = () => {
    if (stage === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (stage === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (stage === 'cancelled') {
      return <XCircle className="h-4 w-4 text-gray-500" />;
    }
    if (isRetrying) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (isSubmitting) {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getConnectionQualityText = () => {
    switch (connectionQuality) {
      case 'offline':
        return 'Sin conexión';
      case 'poor':
        return 'Conexión muy lenta';
      case 'slow':
        return 'Conexión lenta';
      case 'good':
      default:
        return 'Conexión buena';
    }
  };

  const getStageText = () => {
    if (progressMessage) return progressMessage;
    if (stage === 'success') return 'Enviado exitosamente';
    if (stage === 'error') return 'Error en el envío';
    if (stage === 'cancelled') return 'Envío cancelado';
    if (isRetrying) return `Reintentando (${retryCount})`;
    if (isSubmitting) return 'Enviando solicitud...';
    return stage || 'En espera';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className={`rounded-xl border-2 shadow-lg backdrop-blur-md ${getConnectionColor()}`}>
            <div className="p-4 space-y-3">
              {/* Header con estado de conexión */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getConnectionIcon()}
                  <span className="text-sm font-medium text-gray-700">
                    {getConnectionQualityText()}
                  </span>
                </div>
                
                {pendingRequestsCount > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{pendingRequestsCount}</span>
                  </div>
                )}
              </div>

              {/* Estado del envío */}
              {(isSubmitting || isRetrying || stage === 'success' || stage === 'error') && (
                <div className="flex items-center space-x-2">
                  {getStageIcon()}
                  <span className="text-sm text-gray-700">
                    {getStageText()}
                  </span>
                </div>
              )}

              {/* Mensaje de estado de conexión */}
              {connectionStatus && (
                <Alert className="border-0 bg-transparent p-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {connectionStatus}
                  </AlertDescription>
                </Alert>
              )}

              {/* Barra de progreso para reintentos */}
              {isRetrying && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              )}

              {/* Botones de acción */}
              {(isSubmitting || isRetrying) && (
                <div className="flex space-x-2">
                  {onCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancel}
                      className="text-xs h-8"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}

              {/* Offline / Error state actions */}
              {(connectionQuality === 'offline' || stage === 'error') && onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="w-full text-xs h-8"
                  disabled={isSubmitting}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConnectionStatus; 