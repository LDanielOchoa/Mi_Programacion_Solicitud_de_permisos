'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

interface ValidationRule<T> {
  field: keyof T;
  rule: (value: any, allValues: T) => string | null;
  debounceMs?: number;
}

interface FormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRule<T>[];
  onSubmit: (values: T) => Promise<void> | void;
  debounceMs?: number;
  preventAutoSubmit?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function useSmartForm<T extends Record<string, any>>(options: FormOptions<T>) {
  const {
    initialValues,
    validationRules = [],
    onSubmit,
    debounceMs = 300,
    preventAutoSubmit = true,
    autoSave = false,
    autoSaveDelay = 2000,
  } = options;

  const [state, setState] = useState<FormState<T>>({
    values: { ...initialValues },
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
    isValid: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const initialValuesRef = useRef(initialValues);

  // Función de validación
  const validateField = useCallback((field: keyof T, value: any, allValues: T): string | null => {
    const rule = validationRules.find(r => r.field === field);
    if (!rule) return null;
    
    try {
      return rule.rule(value, allValues);
    } catch (error) {
      console.error('Error en validación:', error);
      return 'Error en validación';
    }
  }, [validationRules]);

  // Validar todos los campos
  const validateAllFields = useCallback((values: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    validationRules.forEach(rule => {
      const error = validateField(rule.field, values[rule.field], values);
      if (error) {
        errors[rule.field] = error;
      }
    });

    return errors;
  }, [validateField, validationRules]);

  // Verificar si el formulario está sucio (ha cambiado)
  const checkIsDirty = useCallback((values: T): boolean => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, []);

  // Actualizar valor de campo
  const setValue = useCallback((field: keyof T, value: any) => {
    // Prevenir actualizaciones si está enviando
    if (isSubmittingRef.current) {
      console.warn('Preveniendo actualización durante envío');
      return;
    }

    setState(prevState => {
      const newValues = { ...prevState.values, [field]: value };
      const isDirty = checkIsDirty(newValues);
      
      // Limpiar timeout anterior
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Validación con debounce
      const rule = validationRules.find(r => r.field === field);
      const validationDelay = rule?.debounceMs || debounceMs;

      validationTimeoutRef.current = setTimeout(() => {
        const fieldError = validateField(field, value, newValues);
        const allErrors = validateAllFields(newValues);
        const isValid = Object.keys(allErrors).length === 0;

        setState(state => ({
          ...state,
          errors: { ...state.errors, ...allErrors, [field]: fieldError },
          isValid,
        }));
      }, validationDelay);

      return {
        ...prevState,
        values: newValues,
        touched: { ...prevState.touched, [field]: true },
        isDirty,
      };
    });

    // Auto-guardar si está habilitado
    if (autoSave && !isSubmittingRef.current) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, autoSaveDelay);
    }
  }, [checkIsDirty, validateField, validateAllFields, validationRules, debounceMs, autoSave, autoSaveDelay]);

  // Auto-guardar
  const handleAutoSave = useCallback(async () => {
    if (isSubmittingRef.current || !state.isDirty || !state.isValid) {
      return;
    }

    try {
      console.log('🔄 Auto-guardando...');
      await onSubmit(state.values);
      console.log('✅ Auto-guardado exitoso');
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error);
    }
  }, [state.values, state.isDirty, state.isValid, onSubmit]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevenir envíos múltiples
    if (isSubmittingRef.current) {
      console.warn('⚠️ Envío ya en progreso, ignorando');
      return;
    }

    // Validar antes de enviar
    const errors = validateAllFields(state.values);
    const isValid = Object.keys(errors).length === 0;

    setState(prevState => ({
      ...prevState,
      errors,
      isValid,
      touched: Object.keys(prevState.values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>),
    }));

    if (!isValid) {
      console.warn('⚠️ Formulario inválido, no enviando');
      return;
    }

    setState(prevState => ({ ...prevState, isSubmitting: true }));
    isSubmittingRef.current = true;

    try {
      console.log('📤 Enviando formulario...');
      await onSubmit(state.values);
      console.log('✅ Formulario enviado exitosamente');
      
      // Actualizar valores iniciales después del envío exitoso
      initialValuesRef.current = { ...state.values };
      
      setState(prevState => ({
        ...prevState,
        isDirty: false,
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('❌ Error enviando formulario:', error);
      setState(prevState => ({
        ...prevState,
        isSubmitting: false,
      }));
      throw error; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      isSubmittingRef.current = false;
    }
  }, [state.values, validateAllFields, onSubmit]);

  // Resetear formulario
  const reset = useCallback((newInitialValues?: T) => {
    const values = newInitialValues || initialValues;
    initialValuesRef.current = values;
    
    setState({
      values: { ...values },
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
      isValid: true,
    });

    // Limpiar timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
  }, [initialValues]);

  // Establecer errores manualmente
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState(prevState => ({
      ...prevState,
      errors: { ...prevState.errors, ...errors },
      isValid: Object.keys({ ...prevState.errors, ...errors }).length === 0,
    }));
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, []);

  // Funciones de utilidad
  const getFieldProps = useCallback((field: keyof T) => ({
    value: state.values[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(field, e.target.value);
    },
    onBlur: () => {
      // Marcar como tocado al perder el foco
      setState(prevState => ({
        ...prevState,
        touched: { ...prevState.touched, [field]: true },
      }));
    },
    error: state.touched[field] ? state.errors[field] : undefined,
    disabled: state.isSubmitting,
  }), [state.values, state.errors, state.touched, state.isSubmitting, setValue]);

  const getSelectProps = useCallback((field: keyof T) => ({
    value: state.values[field] || '',
    onValueChange: (value: string) => {
      setValue(field, value);
    },
    error: state.touched[field] ? state.errors[field] : undefined,
    disabled: state.isSubmitting,
  }), [state.values, state.errors, state.touched, state.isSubmitting, setValue]);

  return {
    // Estado
    ...state,
    
    // Funciones
    setValue,
    handleSubmit,
    reset,
    setErrors,
    
    // Helpers
    getFieldProps,
    getSelectProps,
    
    // Información útil
    canSubmit: state.isValid && !state.isSubmitting && state.isDirty,
    hasErrors: Object.keys(state.errors).length > 0,
  };
}

// Hook para validaciones comunes
export const createValidationRules = {
  required: <T>(field: keyof T, message = 'Este campo es requerido') => ({
    field,
    rule: (value: any) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return message;
      }
      return null;
    },
  }),

  email: <T>(field: keyof T, message = 'Email inválido') => ({
    field,
    rule: (value: string) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    },
  }),

  minLength: <T>(field: keyof T, min: number, message?: string) => ({
    field,
    rule: (value: string) => {
      if (!value) return null;
      const msg = message || `Mínimo ${min} caracteres`;
      return value.length >= min ? null : msg;
    },
  }),

  maxLength: <T>(field: keyof T, max: number, message?: string) => ({
    field,
    rule: (value: string) => {
      if (!value) return null;
      const msg = message || `Máximo ${max} caracteres`;
      return value.length <= max ? null : msg;
    },
  }),

  pattern: <T>(field: keyof T, regex: RegExp, message = 'Formato inválido') => ({
    field,
    rule: (value: string) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    },
  }),
};

export default useSmartForm; 