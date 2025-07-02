'use client';

import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle, Clock, FileText, User, Calendar } from 'lucide-react';

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
}

interface FormValidationAlertProps {
  issues: ValidationIssue[];
  isSubmitting?: boolean;
  canSubmit?: boolean;
  className?: string;
}

export function FormValidationAlert({ 
  issues, 
  isSubmitting = false, 
  canSubmit = false,
  className = '' 
}: FormValidationAlertProps) {
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');

  // No mostrar nada si no hay problemas y se puede enviar
  if (issues.length === 0 && canSubmit) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          ✅ Formulario completo y listo para enviar
        </AlertDescription>
      </Alert>
    );
  }

  // Si está enviando
  if (isSubmitting) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
        <AlertDescription className="text-blue-700">
          🔄 Enviando solicitud... Por favor espere.
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar errores críticos
  if (errors.length > 0) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">❌ Campos requeridos faltantes:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-center gap-2">
                  {error.icon}
                  <span><strong>{error.field}:</strong> {error.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar advertencias
  if (warnings.length > 0) {
    return (
      <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          <div className="space-y-1">
            <p className="font-medium">⚠️ Revisar antes de enviar:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-center gap-2">
                  {warning.icon}
                  <span><strong>{warning.field}:</strong> {warning.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// Hook para validación en tiempo real
export function useFormValidation() {
  const [issues, setIssues] = React.useState<ValidationIssue[]>([]);

  const validateField = React.useCallback((
    field: string, 
    value: any, 
    isRequired: boolean = false,
    customValidator?: (value: any) => ValidationIssue | null
  ) => {
    const newIssues: ValidationIssue[] = [];

    // Validación de campo requerido
    if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
      newIssues.push({
        field,
        message: 'Este campo es requerido',
        severity: 'error',
        icon: <AlertCircle className="h-3 w-3 text-red-500" />
      });
    }

    // Validación personalizada
    if (customValidator && value) {
      const customIssue = customValidator(value);
      if (customIssue) {
        newIssues.push(customIssue);
      }
    }

    // Actualizar issues
    setIssues(prevIssues => {
      const filteredIssues = prevIssues.filter(issue => issue.field !== field);
      return [...filteredIssues, ...newIssues];
    });

    return newIssues.length === 0;
  }, []);

  const clearField = React.useCallback((field: string) => {
    setIssues(prevIssues => prevIssues.filter(issue => issue.field !== field));
  }, []);

  const clearAll = React.useCallback(() => {
    setIssues([]);
  }, []);

  const hasErrors = React.useMemo(() => 
    issues.some(issue => issue.severity === 'error'), [issues]);

  const canSubmit = React.useMemo(() => 
    !hasErrors && issues.filter(issue => issue.severity === 'error').length === 0, [hasErrors, issues]);

  return {
    issues,
    validateField,
    clearField,
    clearAll,
    hasErrors,
    canSubmit,
    setIssues
  };
}

// Validadores específicos para formularios
export const createFormValidators = {
  // Validador para solicitud de permisos
  permitRequest: (data: {
    noveltyType: string;
    selectedDates: Date[];
    userData: { code: string; name: string; phone: string };
    time?: string;
    description?: string;
  }) => {
    const issues: ValidationIssue[] = [];

    // Usuario
    if (!data.userData.code || !data.userData.name) {
      issues.push({
        field: 'Usuario',
        message: 'Datos de usuario incompletos',
        severity: 'error',
        icon: <User className="h-3 w-3 text-red-500" />
      });
    }

    // Teléfono ya no es requerido - validación removida

    // Tipo de solicitud
    if (!data.noveltyType) {
      issues.push({
        field: 'Tipo de solicitud',
        message: 'Debe seleccionar un tipo',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    }

    // Fechas
    const requiresDates = !['semanaAM', 'semanaPM'].includes(data.noveltyType);
    if (requiresDates && data.selectedDates.length === 0) {
      issues.push({
        field: 'Fechas',
        message: 'Debe seleccionar al menos una fecha',
        severity: 'error',
        icon: <Calendar className="h-3 w-3 text-red-500" />
      });
    }

    // Hora para citas y audiencias
    if (['cita', 'audiencia'].includes(data.noveltyType) && !data.time) {
      issues.push({
        field: 'Hora',
        message: 'Hora requerida para este tipo de solicitud',
        severity: 'error',
        icon: <Clock className="h-3 w-3 text-red-500" />
      });
    }

    // Descripción para tipos específicos
    if (['licencia', 'cita', 'audiencia'].includes(data.noveltyType) && !data.description?.trim()) {
      issues.push({
        field: 'Descripción',
        message: 'Descripción requerida para este tipo',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    }

    return issues;
  },

  // Validador para solicitud de equipos
  equipmentRequest: (data: {
    selectedType: string;
    description: string;
    userData: { code: string; name: string };
    selectedAMUser?: { code: string } | null;
    selectedPMUser?: { code: string } | null;
    zone?: string;
    shift?: string;
  }) => {
    const issues: ValidationIssue[] = [];

    // Usuario
    if (!data.userData.code || !data.userData.name) {
      issues.push({
        field: 'Usuario',
        message: 'Datos de usuario incompletos',
        severity: 'error',
        icon: <User className="h-3 w-3 text-red-500" />
      });
    }

    // Tipo de equipo
    if (!data.selectedType) {
      issues.push({
        field: 'Tipo de equipo',
        message: 'Debe seleccionar un tipo',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    }

    // Descripción
    if (!data.description?.trim()) {
      issues.push({
        field: 'Descripción',
        message: 'Descripción requerida',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    } else if (data.description.length < 10) {
      issues.push({
        field: 'Descripción',
        message: 'Debe tener al menos 10 caracteres',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    }

    // Validaciones específicas por tipo
    if (data.selectedType === 'Turno pareja') {
      if (!data.selectedAMUser || !data.selectedPMUser) {
        issues.push({
          field: 'Usuarios AM/PM',
          message: 'Debe seleccionar ambos turnos',
          severity: 'error',
          icon: <User className="h-3 w-3 text-red-500" />
        });
      }
      if (!data.zone) {
        issues.push({
          field: 'Zona',
          message: 'Zona requerida para turno pareja',
          severity: 'error',
          icon: <FileText className="h-3 w-3 text-red-500" />
        });
      }
    }

    if (data.selectedType === 'Tabla partida' && !data.zone) {
      issues.push({
        field: 'Zona',
        message: 'Zona requerida para tabla partida',
        severity: 'error',
        icon: <FileText className="h-3 w-3 text-red-500" />
      });
    }

    if (data.selectedType === 'Disponible fijo' && !data.shift) {
      issues.push({
        field: 'Turno',
        message: 'Debe seleccionar AM o PM',
        severity: 'error',
        icon: <Clock className="h-3 w-3 text-red-500" />
      });
    }

    return issues;
  }
};

export default FormValidationAlert; 