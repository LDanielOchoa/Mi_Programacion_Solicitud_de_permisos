export interface User {
  code: string;
  name: string;
  telefone: string;
  email?: string;
  password: string;
  role: 'admin' | 'employee';
  cargo?: string;
  userType?: 'registered' | 'se_maintenance'; // Tipo de autenticación del usuario
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  code: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  role: string;
}

export interface UserResponse {
  code: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  cargo?: string;
}

export interface UpdatePhoneRequest {
  phone: string;
}

export interface PermitRequest {
  code: string;
  name: string;
  phone: string;
  dates: string[];
  noveltyType: string;
  time?: string;
  description: string;
  files?: File[];
}

export interface PermitRequest2 {
  code: string;
  name: string;
  phone: string;
  dates: string[];
  noveltyType: string;
  time?: string;
  description: string;
}

export interface EquipmentRequest {
  type: string;
  description: string;
  zona: string;
  codeAM: string;
  codePM: string;
  shift: string;
}

export interface ApprovalUpdate {
  approved_by: string;
}

export interface NotificationStatusUpdate {
  notification_status: string;
}

export interface SolicitudResponse {
  id: number;
  code: string;
  name: string;
  telefono?: string;
  fecha?: string;
  hora?: string;
  tipo_novedad: string;
  description: string;
  files?: string;
  time_created: Date;
  solicitud: string;
  respuesta?: string;
  notifications: string;
  zona?: string;
  comp_am?: string;
  comp_pm?: string;
  turno?: string;
  request_type: 'permiso' | 'equipo';
}

export interface DateCheck {
  dates: string[];
}

export interface FileUpload {
  fileName: string;
  fileUrl: string;
  originalName?: string;
  size?: number;
  sizeFormatted?: string;
  type?: string;
  uploadTime?: string;
  metadata?: any;
}

export interface HistoryRecord {
  id: number;
  type: string;
  createdAt: string;
  requestedDates: string;
  status: string;
}

export interface PerformanceMetrics {
  total_requests: number;
  avg_response_time: number;
  success_rate: number;
  cache_hit_rate: number;
  last_updated: Date;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
}

export interface JWTPayload {
  sub: string;
  iat?: number;
  exp?: number;
} 