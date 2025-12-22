/**
 * Tipos e interfaces para el módulo de solicitud de permisos
 */

export interface DateInfo {
    date: Date
    formattedDate: string
    shortDate: string
    dayName: string
    dayNumber: string
    monthName: string
    year: string
}

export interface Employee {
    cedula: string
    nombre: string
    cargo: string
    foto?: string
}

export interface FileWithInfo {
    file: File
    id: string
    preview?: string
    error?: string
    isUploading?: boolean
    uploadProgress?: number
    uploadStatus?: "pending" | "uploading" | "completed" | "error"
    fileSize?: string
    fileType?: string
}

export interface ConnectionAwareSubmitState {
    isSubmitting: boolean
    isRetrying: boolean
    retryCount: number
    stage: string
    connectionQuality: "excellent" | "good" | "poor" | "unknown"
}

export interface ConnectionAwareSubmitOptions {
    timeout: number
    maxRetries: number
    retryDelay: number
    deduplicationWindow: number
    onProgress?: (stage: string) => void
    onConnectionIssue?: (issue: string) => void
}

export interface PermitRequestFormProps {
    isExtemporaneous?: boolean
}

export interface UserInfoCardProps {
    code: string | undefined
    name: string | undefined
    phone: string | undefined
    onPhoneEdit: () => void
}

export interface EmployeeSelectionDialogProps {
    isOpen: boolean
    onClose: () => void
    employees: Employee[]
    employeesLoading: boolean
    onEmployeeSelect: (employee: Employee) => void
}

export interface UserPermit {
    id: number
    code: string
    name: string
    tipo_novedad: string
    description: string
    status: "approved" | "rejected" | "pending"
    respuesta: string
    createdAt: string
    fecha: string
    turno?: string
    [key: string]: string | number | undefined
}
