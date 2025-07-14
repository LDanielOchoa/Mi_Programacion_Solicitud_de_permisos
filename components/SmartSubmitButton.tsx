'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface SmartSubmitButtonProps {
  onClick?: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  preventDoubleClick?: boolean;
  showSuccessState?: boolean;
  successDuration?: number;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function SmartSubmitButton({
  onClick,
  children,
  disabled = false,
  type = 'button',
  variant = 'default',
  size = 'default',
  className = '',
  preventDoubleClick = true,
  showSuccessState = true,
  successDuration = 2000,
  loadingText = 'Enviando...',
  successText = 'Enviado ✓',
  errorText = 'Error',
  onSuccess,
  onError,
  ...props
}: SmartSubmitButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastClickTime, setLastClickTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir dobles clics
    if (preventDoubleClick) {
      const now = Date.now();
      if (now - lastClickTime < 1000) {
        console.warn('⚠️ Doble clic prevenido');
        return;
      }
      setLastClickTime(now);
    }

    // Prevenir clics si ya está procesando
    if (state === 'loading') {
      console.warn('⚠️ Clic ignorado - ya está procesando');
      return;
    }

    if (!onClick) return;

    setState('loading');

    try {
      console.log('🚀 Ejecutando acción del botón...');
      await onClick();
      
      console.log('✅ Acción completada exitosamente');
      
      if (showSuccessState) {
        setState('success');
        onSuccess?.();
        
        // Volver al estado normal después del tiempo especificado
        timeoutRef.current = setTimeout(() => {
          setState('idle');
        }, successDuration);
      } else {
        setState('idle');
        onSuccess?.();
      }
    } catch (error) {
      console.error('❌ Error en acción del botón:', error);
      setState('error');
      onError?.(error);
      
      // Volver al estado normal después de 3 segundos en caso de error
      timeoutRef.current = setTimeout(() => {
        setState('idle');
      }, 3000);
    }
  };

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isDisabled = disabled || state === 'loading';

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        );
      case 'success':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            {successText}
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            {errorText}
          </>
        );
      default:
        return children;
    }
  };

  const getButtonVariant = () => {
    switch (state) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return variant;
    }
  };

  return (
    <Button
      type={type}
      variant={getButtonVariant()}
      size={size}
      className={`transition-all duration-200 ${className}`}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {getButtonContent()}
    </Button>
  );
}

// Hook para usar con formularios
export function useSmartSubmit(action: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const submit = async () => {
    // Prevenir envíos múltiples
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      console.warn('⚠️ Envío múltiple prevenido');
      return;
    }

    if (isSubmitting) {
      console.warn('⚠️ Ya hay un envío en progreso');
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    canSubmit: !isSubmitting && (Date.now() - lastSubmitTime > 2000),
  };
}

export default SmartSubmitButton; 