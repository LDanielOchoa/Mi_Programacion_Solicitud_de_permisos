'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SmartInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValidChange?: (value: string, isValid: boolean) => void;
  validator?: (value: string) => string | null;
  debounceMs?: number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showValidation?: boolean;
  validateOnBlur?: boolean;
  preventSubmitOnEnter?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  name?: string;
}

export function SmartInput({
  id,
  label,
  placeholder,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onValidChange,
  validator,
  debounceMs = 300,
  type = 'text',
  multiline = false,
  rows = 3,
  disabled = false,
  required = false,
  className = '',
  showValidation = true,
  validateOnBlur = true,
  preventSubmitOnEnter = true,
  maxLength,
  minLength,
  autoComplete,
  name,
}: SmartInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  // Validación con debounce
  const validateValue = useCallback(async (val: string) => {
    if (!validator) return null;
    
    setIsValidating(true);
    
    try {
      const result = await validator(val);
      setError(result);
      return result;
    } catch (err) {
      const errorMsg = 'Error en validación';
      setError(errorMsg);
      return errorMsg;
    } finally {
      setIsValidating(false);
    }
  }, [validator]);

  // Manejar cambios de valor
  const handleChange = useCallback((newValue: string) => {
    // Marcar como typing
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    // Validaciones básicas inmediatas
    if (maxLength && newValue.length > maxLength) {
      return; // No permitir exceder el límite
    }

    // Actualizar valor
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);

    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Validar con debounce
    if (validator && isTouched) {
      debounceRef.current = setTimeout(async () => {
        const validationError = await validateValue(newValue);
        onValidChange?.(newValue, !validationError);
      }, debounceMs);
    }
  }, [
    isControlled, 
    onChange, 
    validator, 
    isTouched, 
    debounceMs, 
    validateValue, 
    onValidChange, 
    maxLength
  ]);

  // Manejar blur
  const handleBlur = useCallback(async () => {
    setIsTouched(true);
    
    if (validateOnBlur && validator) {
      const validationError = await validateValue(currentValue);
      onValidChange?.(currentValue, !validationError);
    }
  }, [validateOnBlur, validator, currentValue, validateValue, onValidChange]);

  // Manejar Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (preventSubmitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('⚠️ Envío por Enter prevenido');
      
      // Trigger blur para validar
      (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).blur();
    }
  }, [preventSubmitOnEnter]);

  // Sincronizar valor controlado
  useEffect(() => {
    if (isControlled && controlledValue !== internalValue) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue, isControlled, internalValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Determinar estado visual
  const getValidationState = () => {
    if (!showValidation || !isTouched) return null;
    if (isValidating) return 'validating';
    if (error) return 'error';
    if (validator && !error) return 'success';
    return null;
  };

  const validationState = getValidationState();
  
  // Estilos dinámicos
  const getInputClassName = () => {
    const baseClasses = className;
    const stateClasses = {
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
      validating: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500',
    };
    
    return `${baseClasses} ${validationState ? stateClasses[validationState] || '' : ''}`;
  };

  // Renderizar íconos de estado
  const renderValidationIcon = () => {
    if (!showValidation || !isTouched) return null;
    
    const iconClasses = "h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2";
    
    switch (validationState) {
      case 'validating':
        return <Loader2 className={`${iconClasses} text-blue-500 animate-spin`} />;
      case 'error':
        return <AlertCircle className={`${iconClasses} text-red-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      default:
        return null;
    }
  };

  const InputComponent = multiline ? Textarea : Input;
  
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <InputComponent
          id={id}
          name={name}
          type={multiline ? undefined : type}
          placeholder={placeholder}
          value={currentValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
            handleChange(e.target.value)
          }
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          className={getInputClassName()}
          maxLength={maxLength}
          minLength={minLength}
          autoComplete={autoComplete}
          rows={multiline ? rows : undefined}
          aria-invalid={validationState === 'error'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        {renderValidationIcon()}
        
        {/* Indicador de typing */}
        {isTyping && (
          <div className="absolute -top-2 -right-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Mensaje de error */}
      {showValidation && error && isTouched && (
        <div 
          id={`${id}-error`}
          className="flex items-center text-sm text-red-600 mt-1"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {/* Contador de caracteres */}
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {currentValue.length}/{maxLength}
        </div>
      )}
      
      {/* Indicador de estado de validación */}
      {showValidation && isValidating && (
        <div className="text-xs text-blue-600 flex items-center">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Validando...
        </div>
      )}
    </div>
  );
}

// Validadores comunes
export const validators = {
  required: (message = 'Este campo es requerido') => (value: string) => {
    return !value.trim() ? message : null;
  },
  
  email: (message = 'Email inválido') => (value: string) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },
  
  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return null;
    const msg = message || `Mínimo ${min} caracteres`;
    return value.length >= min ? null : msg;
  },
  
  maxLength: (max: number, message?: string) => (value: string) => {
    const msg = message || `Máximo ${max} caracteres`;
    return value.length <= max ? null : msg;
  },
  
  pattern: (regex: RegExp, message = 'Formato inválido') => (value: string) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },
  
  phone: (message = 'Número de teléfono inválido') => (value: string) => {
    if (!value) return null;
    const phoneRegex = /^[+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : message;
  },
  
  combine: (...validators: Array<(value: string) => string | null>) => (value: string) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result) return result;
    }
    return null;
  },
};

export default SmartInput; 