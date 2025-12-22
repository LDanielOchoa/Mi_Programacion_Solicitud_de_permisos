"use client"
import { Label } from "@/components/ui/label"
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Car,
  Shield,
  Phone,
  Edit2,
  Calendar,
  Clock,
  FileText,
  Upload,
  X,
  Search,
  AlertCircle,
  Briefcase,
  Loader2,
  UserPlus,
  CheckCircle,
  Info,
  ChevronRight,
  Table2,
  Sun,
  Moon,
  IdCard,
  HeartPulse,
  type File
} from "lucide-react"
import { format, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import BottomNavigation from "@/components/BottomNavigation"

interface UserInfoCardProps {
  code: string | undefined
  name: string | undefined
  phone: string | undefined
  onPhoneEdit: () => void
  isExtemporaneous?: boolean
  onEmployeeSelect?: (employee: any) => void
  selectedEmployee?: any
  userType?: string
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ code, name, phone, onPhoneEdit, isExtemporaneous = false, onEmployeeSelect, selectedEmployee, userType: propUserType }) => {
  const [employees, setEmployees] = useState<any[]>([])
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(false)

  // Use prop userType or fallback to localStorage
  const [userType, setUserType] = useState(propUserType || '')

  useEffect(() => {
    if (propUserType) {
      setUserType(propUserType)
    } else {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      setUserType(userData.userType || '')
    }

    console.log('🔍 UserInfoCard Debug:', {
      propUserType,
      userType: propUserType || JSON.parse(localStorage.getItem('userData') || '{}').userType,
      isExtemporaneous,
      condition: isExtemporaneous && (propUserType || JSON.parse(localStorage.getItem('userData') || '{}').userType) === 'se_maintenance'
    })
  }, [isExtemporaneous, propUserType])

  // Handle employee selection
  const handleEmployeeSelect = (employee: any) => {
    if (onEmployeeSelect) {
      onEmployeeSelect(employee)
    }
    setIsEmployeeDialogOpen(false)
  }

  // Función para obtener empleados según el tipo de usuario
  const fetchEmployees = async () => {
    setEmployeesLoading(true)
    try {
      const token = localStorage.getItem("accessToken")

      if (userType === 'se_operaciones') {
        // Para se_operaciones: Obtener usuarios de MySQL directamente (RÁPIDO)
        console.log('🔍 Fetching MySQL users for se_operaciones...')

        const mysqlResponse = await fetch('https://solicitud-permisos.sao6.com.co/api/users/user/lists?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!mysqlResponse.ok) {
          throw new Error('Error al obtener usuarios de MySQL')
        }

        const mysqlResult = await mysqlResponse.json()
        const mysqlUsers = mysqlResult.data || []
        console.log('📊 MySQL users obtained:', mysqlUsers.length)

        // Cache para URLs de fotos validadas
        const photoUrlCache = new Map<string, string>();

        // Función para verificar si una URL de imagen existe
        const checkImageExists = async (url: string): Promise<boolean> => {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
          } catch {
            return false;
          }
        };

        // Función para encontrar la URL de foto correcta
        const findPhotoUrl = async (cedula: string): Promise<string> => {
          // Verificar cache primero
          if (photoUrlCache.has(cedula)) {
            return photoUrlCache.get(cedula)!;
          }

          const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
          const extensions = ['jpg', 'jpeg', 'png'];

          // Probar cada extensión
          for (const ext of extensions) {
            const url = `${baseUrl}${cedula}.${ext}`;
            if (await checkImageExists(url)) {
              photoUrlCache.set(cedula, url);
              return url;
            }
          }

          // Si no se encuentra ninguna, usar jpg como fallback
          const fallbackUrl = `${baseUrl}${cedula}.jpg`;
          photoUrlCache.set(cedula, fallbackUrl);
          return fallbackUrl;
        };

        // Obtener URLs de fotos para todos los empleados
        console.log('📷 Validando fotos de empleados...');
        const employeePromises = mysqlUsers
          .filter(user => user.password && user.code && user.name)
          .map(async (user) => {
            const fotoUrl = await findPhotoUrl(user.password);
            return {
              nombre: user.name,
              cedula: user.password, // La cédula está en password
              cargo: user.cargo || 'Usuario',
              foto: fotoUrl, // URL validada
              code: user.code, // Código de MySQL
            };
          });

        const employees = await Promise.all(employeePromises);

        console.log('✅ Fast loading completed:', employees.length, 'employees')
        setEmployees(employees)

      } else {
        // Para se_maintenance: usar el endpoint original
        const response = await fetch('https://solicitud-permisos.sao6.com.co/api/admin/maintenance-employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()

          const mappedEmployees = (result.data || [])
            .map((emp: any, index: number) => {
              console.log(`Employee ${index}:`, emp)
              return {
                nombre: emp.name || emp.nombre || emp.f_nombre_empl,
                cedula: emp.code || emp.cedula || emp.f_nit_empl,
                cargo: emp.cargo || emp.f_desc_cargo,
                foto: emp.avatar
              }
            })
            .filter((emp: any) => emp.nombre && emp.cedula)

          console.log('Mapped employees:', mappedEmployees)
          setEmployees(mappedEmployees)
        }
      }
    } catch (error) {
      console.error('Error al obtener empleados:', error)
    } finally {
      setEmployeesLoading(false)
    }
  }


  // Show different design based on user type and mode
  if (isExtemporaneous && (userType === 'se_maintenance' || userType === 'se_operaciones')) {
    return (
      <>
        {!selectedEmployee ? (
          // Employee selection prompt design
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-green-50 rounded-3xl p-6 border-2 border-dashed border-green-300 relative overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-green-200/30"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-green-200/20"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <UserPlus className="h-10 w-10 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Seleccionar Empleado
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Para crear una solicitud extemporánea, debe seleccionar el empleado para quien desea tramitar el permiso
              </p>

              <motion.button
                onClick={() => {
                  console.log('🔍 Button clicked - fetching employees...')
                  fetchEmployees()
                  console.log('🔍 Setting dialog open to true')
                  setIsEmployeeDialogOpen(true)
                }}
                className="bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={employeesLoading}
              >
                {employeesLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Buscar Empleado</span>
                  </div>
                )}
              </motion.button>

              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Info className="h-3 w-3" />
                <span>Seleccione de la lista de empleados de mantenimiento</span>
              </div>
            </div>
          </motion.div>
        ) : (
          // Selected employee display
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-5 border-2 border-green-300 shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-green-200/40"></div>
            <div className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full bg-emerald-200/30"></div>

            <div className="flex items-center relative z-10">
              <div className="relative">
                <Avatar className="h-16 w-16 border-3 border-green-300 shadow-lg mr-4">
                  <AvatarImage src={selectedEmployee.foto} alt={selectedEmployee.nombre} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-lg">
                    {getInitials(selectedEmployee.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-green-600 mr-2" />
                    <h3 className="font-bold text-green-800 text-lg">
                      {selectedEmployee.nombre}
                    </h3>
                  </div>
                  <motion.button
                    onClick={() => {
                      fetchEmployees()
                      setIsEmployeeDialogOpen(true)
                    }}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cambiar
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">Cédula:</span>
                    <span className="text-sm text-green-800 ml-1 font-mono">{selectedEmployee.cedula}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">Cargo:</span>
                    <span className="text-sm text-green-800 ml-1">{selectedEmployee.cargo}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">Teléfono:</span>
                    <span className="text-sm text-green-800 ml-1">{phone || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Employee Selection Dialog for se_maintenance */}
        {console.log('🔍 Rendering EmployeeSelectionDialog for se_maintenance:', { isEmployeeDialogOpen, employeesCount: employees.length })}
        <EmployeeSelectionDialog
          isOpen={isEmployeeDialogOpen}
          onClose={() => {
            console.log('🔍 Closing dialog')
            setIsEmployeeDialogOpen(false)
          }}
          employees={employees}
          employeesLoading={employeesLoading}
          onEmployeeSelect={handleEmployeeSelect}
        />
      </>
    )
  }

  // Default design for non-se_maintenance users
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-green-50 to-green-100 rounded-3xl p-5 border border-green-200 shadow-sm relative overflow-hidden"
      >
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-green-200/30"></div>
        <div className="flex items-center relative z-10">
          <Avatar className="h-16 w-16 border-2 border-green-200 shadow-md mr-4">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <User className="h-4 w-4 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">{name || "Usuario"}</h3>
            </div>
            <div className="flex items-center mb-1">
              <Shield className="h-4 w-4 text-green-600 mr-2" />
              <p className="text-sm text-green-700">Código: {code || "000"}</p>
            </div>
            <div className="flex items-center group cursor-pointer" onDoubleClick={onPhoneEdit}>
              <Phone className="h-4 w-4 text-green-600 mr-2" />
              <p className="text-sm text-green-700 group-hover:underline">
                Teléfono: {phone || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// Helper functions
interface DateInfo {
  date: Date
  formattedDate: string
  shortDate: string
}

// Reemplazar getCurrentWeekDates por getCurrentWeekMonday
const getCurrentWeekMonday = () => {
  const now = new Date()
  const day = now.getDay()
  // Si es domingo (0), retrocede 6 días, si es lunes (1), retrocede 0, etc.
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const isHoliday = (date: Date): { isHoliday: boolean; name: string } => {
  if (!date) return { isHoliday: false, name: "" }
  const year = date.getFullYear()
  const month = date.getMonth() // 0-11
  const day = date.getDate()

  return { isHoliday: false, name: "" }
}

const getUpcomingHolidays = (dates: Date[]): Date[] => {
  const currentDate = new Date()
  const twoWeeksLater = new Date()
  twoWeeksLater.setDate(currentDate.getDate() + 14)

  const upcomingDates: Date[] = []
  const date = new Date(currentDate)
  while (date <= twoWeeksLater) {
    upcomingDates.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }

  return upcomingDates.filter((date) => isHoliday(date).isHoliday)
}

// Ajustar getCalendarDatesWithHolidays para usar el lunes real de la semana
const getCalendarDatesWithHolidays = () => {
  // Usar el lunes de la semana actual
  const weekStart = getCurrentWeekMonday()

  // Generar los 7 días de la semana
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    return {
      date,
      formattedDate: format(date, "EEEE d 'de' MMMM", { locale: es }),
      shortDate: format(date, "EEE d MMM", { locale: es }),
    }
  })

  // Filtrar el lunes si es festivo, pero nunca dejar el array vacío
  let filteredWeekDates = weekDates
  if (isHoliday(weekDates[0].date).isHoliday && weekDates.length > 1) {
    filteredWeekDates = weekDates.slice(1)
  }

  return {
    regularDates: filteredWeekDates,
    allDates: filteredWeekDates,
  }
}

// Función para fechas del 11 al 18 de agosto (incluyendo el 18 por ser festivo)
const getFixedRangeDates = () => {
  // El 11 de agosto de 2025 es un lunes. Month es 0-indexed, so 7 es agosto.
  const startDate = new Date(2025, 7, 11)
  startDate.setHours(0, 0, 0, 0) // Normalizar a medianoche
  const dates: DateInfo[] = []

  // Generar fechas del 11 al 17 (7 días)
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i)
    const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: es })
    const shortDate = format(date, "yyyy-MM-dd", { locale: es })
    dates.push({ date, formattedDate, shortDate })
  }

  // Añadir el día 18 por ser festivo
  const festiveDate = new Date(2025, 8, 8) // 18 de agosto
  dates.push({
    date: festiveDate,
    formattedDate: format(festiveDate, "EEEE, d 'de' MMMM", { locale: es }) + " (Festivo)",
    shortDate: format(festiveDate, "yyyy-MM-dd", { locale: es }),
  })

  return {
    regularDates: dates,
    upcomingHolidays: getUpcomingHolidays(dates.map((d) => d.date)),
  }
}

// Función para fechas extemporáneas (desde hoy hasta 2 semanas adelante)
const getExtemporaneousDates = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalizar a medianoche
  const twoWeeksLater = addDays(today, 14)
  const dates: DateInfo[] = []

  // Generar fechas desde hoy hasta 2 semanas adelante
  let currentDate = new Date(today)
  while (currentDate <= twoWeeksLater) {
    const formattedDate = format(currentDate, "EEEE, d 'de' MMMM", { locale: es })
    const shortDate = format(currentDate, "yyyy-MM-dd", { locale: es })
    dates.push({
      date: new Date(currentDate),
      formattedDate,
      shortDate
    })
    currentDate = addDays(currentDate, 1)
    currentDate.setHours(0, 0, 0, 0) // Asegurar medianoche tras suma
  }

  return {
    regularDates: dates,
    upcomingHolidays: getUpcomingHolidays(dates.map((d) => d.date)),
  }
}

// Cambia la firma de la función para aceptar noveltyType
const checkExistingPermits = async (dates: string[], noveltyType: string, userCode?: string) => {
  try {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      throw new Error("No se encontró el token de acceso")
    }

    const response = await fetch("https://solicitud-permisos.sao6.com.co/api/permits/check-existing-permits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dates, noveltyType, userCode }),
    })

    if (!response.ok) {
      throw new Error("Error al verificar permisos existentes")
    }

    const data = await response.json()
    return data.hasExistingPermit
  } catch (error) {
    console.error("Error:", error)
    return false
  }
}

// Inlined useConnectionAwareSubmit hook
interface ConnectionAwareSubmitState {
  isSubmitting: boolean
  isRetrying: boolean
  retryCount: number
  stage: string
  connectionQuality: "excellent" | "good" | "poor" | "unknown"
}

interface ConnectionAwareSubmitOptions {
  timeout: number
  maxRetries: number
  retryDelay: number
  deduplicationWindow: number
  onProgress?: (stage: string) => void
  onConnectionIssue?: (issue: string) => void
}

function useConnectionAwareSubmit<T, U>(
  submitFn: (data: T, signal: AbortSignal) => Promise<U>,
  options: ConnectionAwareSubmitOptions,
) {
  const { timeout, maxRetries, retryDelay, deduplicationWindow, onProgress, onConnectionIssue } = options

  const [state, setState] = useState<ConnectionAwareSubmitState>({
    isSubmitting: false,
    isRetrying: false,
    retryCount: 0,
    stage: "",
    connectionQuality: "excellent",
  })

  const pendingRequests = useRef(new Map<string, AbortController>())
  const lastSubmitTime = useRef(0)

  const getRequestKey = useCallback((data: T) => {
    // Simple stringify for deduplication key. More complex objects might need a custom hash.
    return JSON.stringify(data)
  }, [])

  const updateConnectionQuality = useCallback(() => {
    // Simulate network quality check
    const random = Math.random()
    let quality: "excellent" | "good" | "poor" = "excellent"
    if (random < 0.1) quality = "poor"
    else if (random < 0.3) quality = "good"

    setState((prev) => ({ ...prev, connectionQuality: quality }))
  }, [])

  useEffect(() => {
    const interval = setInterval(updateConnectionQuality, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [updateConnectionQuality])

  const submit = useCallback(
    async (data: T) => {
      const requestKey = getRequestKey(data)
      const now = Date.now()

      if (now - lastSubmitTime.current < deduplicationWindow && pendingRequests.current.has(requestKey)) {
        onConnectionIssue?.("Solicitud duplicada detectada. Por favor, espere un momento.")
        return Promise.reject(new Error("Deduplicated request"))
      }

      const controller = new AbortController()
      pendingRequests.current.set(requestKey, controller)
      lastSubmitTime.current = now

      setState((prev) => ({ ...prev, isSubmitting: true, stage: "Iniciando envío" }))
      onProgress?.("Iniciando envío")

      let currentRetry = 0
      let timeoutId: NodeJS.Timeout

      while (currentRetry <= maxRetries) {
        try {
          timeoutId = setTimeout(() => controller.abort(), timeout)

          const result = await submitFn(data, controller.signal)
          clearTimeout(timeoutId)

          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            isRetrying: false,
            retryCount: 0,
            stage: "Completado",
          }))
          onProgress?.("Completado")
          pendingRequests.current.delete(requestKey)
          return result
        } catch (error: any) {
          clearTimeout(timeoutId) // Ensure timeout is cleared on error too

          if (controller.signal.aborted) {
            onConnectionIssue?.("La solicitud ha excedido el tiempo límite.")
            setState((prev) => ({ ...prev, stage: "Tiempo de espera agotado" }))
          } else if (error.name === "AbortError") {
            onConnectionIssue?.("Envío cancelado por el usuario.")
            setState((prev) => ({ ...prev, stage: "Cancelado" }))
            pendingRequests.current.delete(requestKey)
            return Promise.reject(error) // Propagate cancellation
          } else {
            onConnectionIssue?.(`Error de red o servidor: ${error.message}`)
            setState((prev) => ({ ...prev, stage: `Error: ${error.message}` }))
          }

          if (currentRetry < maxRetries) {
            currentRetry++
            setState((prev) => ({
              ...prev,
              isRetrying: true,
              retryCount: currentRetry,
              stage: `Reintentando (${currentRetry}/${maxRetries})`,
            }))
            onProgress?.(`Reintentando (${currentRetry}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
          } else {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              isRetrying: false,
              stage: "Fallo",
            }))
            onProgress?.("Fallo")
            pendingRequests.current.delete(requestKey)
            return Promise.reject(error)
          }
        }
      }

      // Should not reach here, but for type safety
      return Promise.reject(new Error("Submission failed after retries"))
    },
    [submitFn, timeout, maxRetries, retryDelay, deduplicationWindow, onProgress, onConnectionIssue, getRequestKey],
  )

  const cancelAllRequests = useCallback(() => {
    pendingRequests.current.forEach((controller) => controller.abort())
    pendingRequests.current.clear()
    setState((prev) => ({
      ...prev,
      isSubmitting: false,
      isRetrying: false,
      retryCount: 0,
      stage: "Cancelado por el usuario",
    }))
    onProgress?.("Cancelado por el usuario")
  }, [onProgress])

  return {
    submit,
    cancelAllRequests,
    state,
    pendingRequestsCount: pendingRequests.current.size,
  }
}

// 1. Importar el hook useUserData
import useUserData from "../../hooks/useUserData"

// Helper function to get user initials
const getInitials = (userName: string | undefined) => {
  return userName
    ? userName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "U"
}

// Employee Selection Dialog Interfaces
interface Employee {
  cedula: string;
  nombre: string;
  cargo: string;
  foto?: string;
}

interface EmployeeSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  employeesLoading: boolean;
  onEmployeeSelect: (employee: Employee) => void;
}

// Employee Selection Dialog Component
const EmployeeSelectionDialog: React.FC<EmployeeSelectionDialogProps> = ({
  isOpen,
  onClose,
  employees,
  employeesLoading,
  onEmployeeSelect
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEmployees = employees.filter(employee =>
    (employee.nombre && employee.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.cedula && employee.cedula.includes(searchTerm)) ||
    (employee.cargo && employee.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
          style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-8 text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-xl" />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl"
                  >
                    <User className="h-10 w-10 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-bold mb-2 tracking-tight"
                    >
                      Seleccionar Empleado
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl text-emerald-100 font-medium"
                    >
                      Elige un empleado de la lista para continuar
                    </motion.p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/30 group"
                >
                  <X className="h-6 w-6 text-white group-hover:text-white/90" />
                </motion.button>
              </div>
            </div>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 border-b border-gray-200"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-[#4cc253]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none focus-visible:ring-2 focus-visible:ring-[#4cc253]/20 rounded-xl font-bold text-gray-800 transition-all placeholder:text-gray-400"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
              {employeesLoading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-green-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-[#4cc253]" />
                  </div>
                  <p className="text-gray-800 font-bold text-lg">Cargando empleados...</p>
                  <p className="text-gray-500 text-sm mt-2">Por favor espera un momento</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? 'No se encontraron empleados' : 'No hay empleados disponibles'}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega empleados al sistema'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 custom-scrollbar">
                      <AnimatePresence mode="popLayout">
                        {filteredEmployees.map((employee, index) => (
                          <motion.div
                            key={`${employee.cedula || 'empty'}-${index}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: { delay: index * 0.05 }
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer group"
                            onClick={() => onEmployeeSelect(employee)}
                          >
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-[#4cc253]/30 transition-all duration-300 relative overflow-hidden">
                              {/* Decorative gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-[#4cc253]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              <div className="flex items-center space-x-4 relative">
                                {/* Photo */}
                                <Avatar className="h-16 w-16 border border-gray-100 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                                  <AvatarImage
                                    src={employee.foto}
                                    alt={employee.nombre}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <AvatarFallback className="bg-white text-[#4cc253] font-black text-lg border border-[#4cc253]/10">
                                    {getInitials(employee.nombre)}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Employee info */}
                                <div className="flex-1 overflow-hidden">
                                  <h3 className="text-lg font-bold text-gray-900 truncate uppercase leading-tight group-hover:text-[#4cc253] transition-colors">
                                    {employee.nombre}
                                  </h3>

                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-1.5">
                                      <IdCard className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {employee.cedula}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-1.5">
                                      <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider truncate">
                                        {employee.cargo}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Arrow indicator */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ChevronRight size={20} className="text-[#4cc253]" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Premium Footer */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {filteredEmployees.length > 0 && !employeesLoading && (
                      `${filteredEmployees.length} empleado${filteredEmployees.length !== 1 ? 's' : ''} ${searchTerm ? 'encontrado' + (filteredEmployees.length !== 1 ? 's' : '') : 'disponible' + (filteredEmployees.length !== 1 ? 's' : '')}`
                    )}
                  </span>
                </div>
                <Button
                  onClick={onClose}
                  className="rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg transition-all duration-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Interfaz para archivos con información adicional
interface FileWithInfo {
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

interface PermitRequestFormProps {
  isExtemporaneous?: boolean
}

export default function PermitRequestForm({ isExtemporaneous = false }: PermitRequestFormProps) {
  const router = useRouter()
  // 2. Usar el hook para obtener los datos reales del usuario
  const { userData, isLoading, error, fetchUserData } = useUserData()

  // Auto-detect extemporaneous mode from URL parameters or localStorage
  const [actualIsExtemporaneous, setActualIsExtemporaneous] = useState(isExtemporaneous)

  useEffect(() => {
    // Check multiple sources to detect extemporaneous mode
    const urlParams = new URLSearchParams(window.location.search)
    const urlExtemporaneous = urlParams.get('extemporaneous') === 'true'

    // Check localStorage for navigation context
    const navigationContext = localStorage.getItem('navigationContext')
    const contextExtemporaneous = navigationContext === 'extemporaneous'

    // Check if we're coming from extemporaneous section
    const referrer = document.referrer
    const referrerExtemporaneous = referrer.includes('extemporaneous') || referrer.includes('dashboard-admin')

    // Check page title for extemporaneous
    const titleExtemporaneous = document.title.includes('Extemporáneos') ||
      document.querySelector('h1')?.textContent?.includes('Extemporáneos') ||
      document.querySelector('[class*="title"]')?.textContent?.includes('Extemporáneos')

    // For testing - always enable if user has se_maintenance type (temporary)
    const isMaintenanceUser = userData?.userType === 'se_maintenance'

    const shouldBeExtemporaneous = isExtemporaneous || urlExtemporaneous || contextExtemporaneous ||
      referrerExtemporaneous || titleExtemporaneous || isMaintenanceUser

    console.log('🔍 Extemporaneous Detection:', {
      isExtemporaneous,
      urlExtemporaneous,
      contextExtemporaneous,
      referrerExtemporaneous,
      titleExtemporaneous,
      isMaintenanceUser,
      finalDecision: shouldBeExtemporaneous,
      userType: userData?.userType
    })

    setActualIsExtemporaneous(shouldBeExtemporaneous)
  }, [isExtemporaneous, userData])

  // Estado para empleado seleccionado en modo extemporáneo
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  // 3. Eliminar el estado simulado de usuario
  // const [userData, setUserData] = useState({ name: "", code: "", phone: "" })
  // const [isLoading, setIsLoading] = useState(true)

  const [isSuccess, setIsSuccess] = useState(false)
  const [noveltyType, setNoveltyType] = useState("")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [isLicenseNotificationOpen, setIsLicenseNotificationOpen] = useState(false)
  const [hasShownLicenseNotification, setHasShownLicenseNotification] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false) // Not directly used in this component, but kept for BottomNavigation
  const [errorMessage, setErrorMessage] = useState("") // For new error modal
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false) // For new error modal
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false) // State for novelty type selection dialog
  const [selectedSubpolitica, setSelectedSubpolitica] = useState("") // State for subpolicy selection
  const [isSubpoliticaDialogOpen, setIsSubpoliticaDialogOpen] = useState(false) // State for subpolicy dialog
  const [subpoliticaSearchTerm, setSubpoliticaSearchTerm] = useState("") // State for subpolicy search

  // Estados para archivos
  const [uploadedFiles, setUploadedFiles] = useState<FileWithInfo[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const phoneInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [weekDates, setWeekDates] = useState<DateInfo[]>([])
  const [existingPermitDates, setExistingPermitDates] = useState<string[]>([])
  const [fechasEnviadasUsuario, setFechasEnviadasUsuario] = useState<string[]>([])
  const [cargandoFechasExistentes, setCargandoFechasExistentes] = useState(false)
  const [timeValue, setTimeValue] = useState("")
  const [descriptionValue, setDescriptionValue] = useState("")

  // Constantes para validación de archivos
  const MAX_FILES = 5
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
  const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]

  // Función mejorada para validar archivos
  const validateFile = (file: File): string | null => {
    // Validar que el archivo existe
    if (!file) {
      return "Archivo no válido"
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo "${file.name}" excede el tamaño máximo de 10MB`
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      return `El archivo "${file.name}" está vacío`
    }

    // Validar tipo MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      // Validar extensión como respaldo
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return `El archivo "${file.name}" no es un tipo válido. Solo se permiten PDF, JPG, JPEG y PNG`
      }
    }

    // Validar nombre del archivo
    if (file.name.length > 100) {
      return `El nombre del archivo "${file.name}" es demasiado largo`
    }

    // Validar caracteres especiales en el nombre
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(file.name)) {
      return `El nombre del archivo "${file.name}" contiene caracteres no permitidos`
    }

    return null
  }

  // Función mejorada para generar preview de archivos
  const generateFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          // Validar que el resultado sea válido
          if (result && result.startsWith("data:")) {
            resolve(result)
          } else {
            resolve(undefined)
          }
        }
        reader.onerror = () => {
          console.warn("Error al generar preview para:", file.name)
          resolve(undefined)
        }
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Función mejorada para manejar la carga de archivos
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Verificar límite de archivos
    if (uploadedFiles.length + fileArray.length > MAX_FILES) {
      setErrorMessage(
        `Solo se pueden cargar hasta ${MAX_FILES} archivos. Actualmente tienes ${uploadedFiles.length} archivo(s).`,
      )
      setIsErrorModalOpen(true)
      return
    }

    const newFiles: FileWithInfo[] = []

    for (const file of fileArray) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const validationError = validateFile(file)

      if (validationError) {
        newFiles.push({
          file,
          id: fileId,
          error: validationError,
          isUploading: false,
          uploadStatus: "error",
          fileSize: formatFileSize(file.size),
          fileType: file.type || "unknown",
        })
      } else {
        try {
          // Archivo válido, generar preview
          const preview = await generateFilePreview(file)
          newFiles.push({
            file,
            id: fileId,
            preview,
            isUploading: false,
            uploadStatus: "pending",
            uploadProgress: 0,
            fileSize: formatFileSize(file.size),
            fileType: file.type || "unknown",
          })
        } catch (error) {
          console.error("Error procesando archivo:", file.name, error)
          newFiles.push({
            file,
            id: fileId,
            error: `Error al procesar el archivo "${file.name}"`,
            isUploading: false,
            uploadStatus: "error",
            fileSize: formatFileSize(file.size),
            fileType: file.type || "unknown",
          })
        }
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Mostrar notificación de archivos cargados
    const validFiles = newFiles.filter((f) => !f.error).length
    const errorFiles = newFiles.filter((f) => f.error).length

    if (validFiles > 0) {
      toast({
        title: "Archivos cargados",
        description: `${validFiles} archivo(s) cargado(s) exitosamente${errorFiles > 0 ? `, ${errorFiles} con errores` : ""}`,
        variant: errorFiles > 0 ? "destructive" : "default",
      })
    }
  }

  // Función mejorada para remover archivo
  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId)
      if (fileToRemove) {
        // Limpiar preview si existe
        if (fileToRemove.preview && fileToRemove.preview.startsWith("data:")) {
          URL.revokeObjectURL(fileToRemove.preview)
        }
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  // Función para limpiar todos los archivos
  const clearAllFiles = () => {
    setUploadedFiles((prev) => {
      // Limpiar todos los previews
      prev.forEach((fileInfo) => {
        if (fileInfo.preview && fileInfo.preview.startsWith("data:")) {
          URL.revokeObjectURL(fileInfo.preview)
        }
      })
      return []
    })
  }

  // Función mejorada para manejar drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // Función para abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Función para verificar conectividad
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/health", {
        method: "HEAD",
        mode: "no-cors",
      })
      return true
    } catch (error) {
      console.warn("⚠️ Problema de conectividad detectado:", error)
      return false
    }
  }

  // Función para validar archivos antes del envío
  const validateFilesBeforeSubmit = useCallback(async (): Promise<boolean> => {
    const filesWithErrors = uploadedFiles.filter((f) => f.error)
    const validFiles = uploadedFiles.filter((f) => !f.error)

    if (filesWithErrors.length > 0) {
      setErrorMessage("Hay archivos con errores que deben ser corregidos antes de enviar la solicitud.")
      setIsErrorModalOpen(true)
      return false
    }

    // Verificar conectividad si hay archivos grandes
    const totalSize = validFiles.reduce((sum, f) => sum + f.file.size, 0)
    const largeFileThreshold = 5 * 1024 * 1024 // 5MB

    if (totalSize > largeFileThreshold) {
      const isConnected = await checkConnectivity()
      if (!isConnected) {
        setErrorMessage(
          "Se detectó un problema de conectividad. Los archivos son grandes y requieren una conexión estable.",
        )
        setIsErrorModalOpen(true)
        return false
      }
    }

    return true
  }, [uploadedFiles])

  // Limpiar archivos cuando cambie el tipo de novedad
  useEffect(() => {
    if (noveltyType !== "cita" && noveltyType !== "audiencia") {
      clearAllFiles()
    }
  }, [noveltyType])

  // Limpiar archivos cuando se desmonte el componente
  useEffect(() => {
    return () => {
      clearAllFiles()
    }
  }, [])

  // Memoized functions for connection aware submit hook
  const handleProgress = useCallback((stage: string) => {
    console.log("📊 Progreso del envío:", stage)
  }, [])

  const handleConnectionIssue = useCallback((issue: string) => {
    toast({
      title: "Problema de conexión",
      description: issue,
      variant: "destructive",
    })
  }, [])

  const submitFunction = useCallback(async (data: any, signal: AbortSignal) => {
    const response = await fetch("https://solicitud-permisos.sao6.com.co/api/permits/permit-request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
      body: data.formData,
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error al enviar la solicitud: ${errorData.detail || response.statusText}`)
    }

    return response.json()
  }, [])

  // Hook for smart submission with duplicate protection
  const connectionAwareSubmit = useConnectionAwareSubmit(submitFunction, {
    timeout: 45000, // 45 seconds for permit requests
    maxRetries: 3,
    retryDelay: 3000,
    deduplicationWindow: 8000, // 8 seconds for deduplication
    onProgress: handleProgress,
    onConnectionIssue: handleConnectionIssue,
  })

  useEffect(() => {
    const { regularDates } = actualIsExtemporaneous ? getExtemporaneousDates() : getFixedRangeDates()
    setWeekDates(regularDates)
  }, [actualIsExtemporaneous])

  // Función para verificar permisos existentes en todas las fechas disponibles
  const checkAllExistingPermits = useCallback(async () => {
    if (weekDates.length === 0) {
      return
    }

    setCargandoFechasExistentes(true)
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        return
      }

      const allDates = weekDates.map((date) => format(date.date, "yyyy-MM-dd"))

      // Verificar permisos existentes para el empleado seleccionado o el usuario actual
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/permits/check-existing-permits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dates: allDates,
          noveltyType: noveltyType || "all",
          userCode: selectedEmployee?.cedula // CRUCIAL: Enviar el código del empleado seleccionado
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const fechasExistentes = data.existingDates || []
        setExistingPermitDates(fechasExistentes)
        setFechasEnviadasUsuario(fechasExistentes)
        console.log("📅 Fechas con solicitudes enviadas por el usuario:", fechasExistentes)
      }
    } catch (error) {
      console.error("Error verificando permisos existentes:", error)
    } finally {
      setCargandoFechasExistentes(false)
    }
  }, [noveltyType, weekDates, selectedEmployee])

  // Verificar permisos existentes cuando cambien las fechas o el tipo de novedad
  useEffect(() => {
    checkAllExistingPermits()
  }, [checkAllExistingPermits])

  // Verificar permisos cuando se cargan las fechas de la semana
  useEffect(() => {
    if (weekDates.length > 0) {
      checkAllExistingPermits()
    }
  }, [weekDates])

  const handlePhoneDoubleClick = () => {
    setIsPhoneDialogOpen(true)
    setNewPhoneNumber(userData?.phone || "")
  }

  const updatePhoneNumber = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        throw new Error("No se encontró el token de acceso")
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aquí deberías actualizar el teléfono en el backend y luego refrescar los datos:
      await fetchUserData() // Refresca los datos reales del usuario

      setIsPhoneDialogOpen(false)
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      console.error("Error:", error)
      setErrorMessage("Ocurrió un error al actualizar el número de teléfono. Por favor, inténtelo de nuevo.")
      setIsErrorModalOpen(true)
    } finally {
    }
  }

  const handleDateSelect = async (date: Date) => {
    console.log("🗓️ handleDateSelect - noveltyType al inicio:", noveltyType)
    if (noveltyType === "semanaAM" || noveltyType === "semanaPM") {
      return // No hacer nada si es semana AM o PM
    }

    // Verificar si ya existe una solicitud para esta fecha
    const formattedDate = format(date, "yyyy-MM-dd")

    // Verificar primero en las fechas ya cargadas en el estado
    if (fechasEnviadasUsuario.includes(formattedDate)) {
      setErrorMessage(
        `¡Ya enviaste una solicitud para el ${format(date, "EEEE d 'de' MMMM", { locale: es })}! ` +
        `No puedes seleccionar esta fecha nuevamente porque ya tienes un permiso pendiente o aprobado.`
      )
      setIsErrorModalOpen(true)
      return
    }

    // Verificar también en el backend por si hay actualizaciones recientes
    const hasExistingPermit = await checkExistingPermits([formattedDate], noveltyType, selectedEmployee?.cedula)

    if (hasExistingPermit) {
      // Actualizar el estado local con esta fecha
      setFechasEnviadasUsuario(prev => [...prev, formattedDate])
      setExistingPermitDates(prev => [...prev, formattedDate])
      setErrorMessage(
        `¡Ya habías seleccionado esta fecha! El ${format(date, "EEEE d 'de' MMMM", { locale: es })} ` +
        `ya tiene una solicitud de permiso asociada. Por favor, selecciona otra fecha.`
      )
      setIsErrorModalOpen(true)
      return
    }

    setSelectedDates((prev) => {
      const isAlreadySelected = prev.some((d) => isSameDay(d, date))
      let newDates

      if (["audiencia", "cita", "diaAM", "diaPM", "tablaPartida"].includes(noveltyType)) {
        newDates = isAlreadySelected ? [] : [date]
      } else {
        newDates = isAlreadySelected ? prev.filter((d) => !isSameDay(d, date)) : [...prev, date]

        if (newDates.length >= 2 && noveltyType === "descanso") {
          setIsConfirmationDialogOpen(true)
        }

        if (noveltyType === "licencia" && newDates.length === 3 && !hasShownLicenseNotification) {
          setIsLicenseNotificationOpen(true)
          setHasShownLicenseNotification(true)
        }
      }

      return newDates
    })
  }

  const validateSubmission = useCallback(async () => {
    // Registro detallado del estado actual antes de la validación
    console.log("🔒 Validación de envío:", {
      userData: {
        code: userData?.code,
        name: userData?.name,
        phone: userData?.phone,
      },
      noveltyType,
      selectedDates: selectedDates.map((date) => format(date, "yyyy-MM-dd")),
      isSubmitting: connectionAwareSubmit.state.isSubmitting,
      descriptionValue,
      uploadedFiles: uploadedFiles.length,
    })

    // Validaciones de datos de usuario
    if (actualIsExtemporaneous) {
      // En modo extemporáneo, validar que se haya seleccionado un empleado
      if (!selectedEmployee || !selectedEmployee.cedula || !selectedEmployee.nombre) {
        setErrorMessage("Por favor, seleccione un empleado para crear la solicitud extemporánea.")
        setIsErrorModalOpen(true)
        return false
      }
    } else {
      // En modo normal, validar datos del usuario logueado
      if (!userData || !userData.code || !userData.name) {
        setErrorMessage("Datos de usuario incompletos. Por favor, inicie sesión nuevamente.")
        setIsErrorModalOpen(true)
        return false
      }
    }

    // Validación de tipo de novedad
    if (!noveltyType) {
      setErrorMessage("Debe seleccionar un tipo de novedad antes de enviar.")
      setIsErrorModalOpen(true)
      return false
    }

    // Validación de fechas según el tipo de novedad
    const requiresDates = !["semanaAM", "semanaPM"].includes(noveltyType)
    if (requiresDates && selectedDates.length === 0) {
      setErrorMessage("Debe seleccionar al menos una fecha para este tipo de solicitud.")
      setIsErrorModalOpen(true)
      return false
    }

    // Validación de archivos usando la nueva función (ahora asíncrona)
    const filesValid = await validateFilesBeforeSubmit()
    if (!filesValid) {
      return false
    }

    // Validaciones específicas para tipos de novedad
    const specificTypeValidations = {
      cita: () => (!timeValue ? "Debe indicar la hora de la cita." : null),
      audiencia: () => (!timeValue ? "Debe indicar la hora de la audiencia." : null),
      licencia: () => (!descriptionValue.trim() ? "Debe proporcionar una descripción para la licencia." : null),
      descanso: () => (!descriptionValue.trim() ? "Debe explicar el motivo del descanso." : null),
    }

    // Ejecutar validación específica si existe para el tipo de novedad
    const specificValidation = specificTypeValidations[noveltyType as keyof typeof specificTypeValidations]
    if (specificValidation) {
      const validationError = specificValidation()
      if (validationError) {
        setErrorMessage(validationError)
        setIsErrorModalOpen(true)
        return false
      }
    }

    return true
  }, [
    userData,
    noveltyType,
    selectedDates,
    connectionAwareSubmit.state.isSubmitting,
    timeValue,
    descriptionValue,
    uploadedFiles,
    validateFilesBeforeSubmit,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevenir comportamientos por defecto de manera estricta
    e.preventDefault()
    e.stopPropagation()

    // Bloquear cualquier intento de envío si ya hay un envío en progreso
    if (connectionAwareSubmit.state.isSubmitting) {
      console.warn("⚠️ Intento de envío bloqueado: Solicitud en progreso")
      return
    }

    // Validación exhaustiva antes del envío (ahora asíncrona)
    const isValid = await validateSubmission()
    if (!isValid) {
      console.error("❌ Validación fallida. Envío cancelado.")
      return
    }

    try {
      // Check for existing permits
      const formattedDates = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
      // CRUCIAL: También usar el código del empleado en la validación antes del envío
      const hasExistingPermit = await checkExistingPermits(formattedDates, noveltyType, selectedEmployee?.cedula)

      if (
        hasExistingPermit &&
        ["descanso", "cita", "licencia", "audiencia", "diaAM", "diaPM", "tablaPartida"].includes(noveltyType)
      ) {
        setErrorMessage(
          "Ya existe un permiso para una o más de las fechas seleccionadas. No se puede realizar esta solicitud.",
        )
        setIsErrorModalOpen(true)
        return
      }

      // Create FormData with FINAL validation
      // Usar datos del empleado seleccionado si estamos en modo extemporáneo
      console.log("🔍 Debug - actualIsExtemporaneous:", actualIsExtemporaneous)
      console.log("🔍 Debug - selectedEmployee:", selectedEmployee)
      console.log("🔍 Debug - userData completo:", userData)
      console.log("🔍 Debug - noveltyType:", noveltyType)
      console.log("🔍 Debug - selectedSubpolitica:", selectedSubpolitica)

      const finalUserData = actualIsExtemporaneous && selectedEmployee ? {
        code: selectedEmployee.code || selectedEmployee.cedula, // Usar code si existe, sino cedula como fallback
        name: selectedEmployee.nombre,
        phone: userData?.phone || '', // Mantener teléfono del usuario logueado
      } : {
        code: userData?.code || userData?.cedula,
        name: userData?.name || (userData as any)?.nombre,
        phone: userData?.phone || (userData as any)?.telefono,
      }

      console.log("🔍 Debug - finalUserData:", finalUserData)

      const dataToSend = {
        code: finalUserData.code,
        name: finalUserData.name,
        phone: finalUserData.phone,
        dates: formattedDates,
        noveltyType: noveltyType === "subpolitica" ? selectedSubpolitica : noveltyType,
        time: timeValue,
        description: descriptionValue,
      }

      console.log("📦 Datos finales a enviar:", dataToSend)

      // Verify no critical empty fields with better error messages
      const missingFields = []
      if (!dataToSend.code) missingFields.push("código de usuario")
      if (!dataToSend.name) missingFields.push("nombre")
      if (!dataToSend.noveltyType) missingFields.push("tipo de novedad")

      if (missingFields.length > 0) {
        console.error("❌ DATOS CRÍTICOS VACÍOS DETECTADOS:", missingFields)
        console.error("❌ userData original:", userData)
        console.error("❌ selectedEmployee:", selectedEmployee)
        console.error("❌ noveltyType:", noveltyType)
        console.error("❌ selectedSubpolitica:", selectedSubpolitica)
        setErrorMessage(`Error crítico: Faltan los siguientes datos esenciales: ${missingFields.join(', ')}. Por favor, verifica tu información de usuario y selecciona un tipo de novedad.`)
        setIsErrorModalOpen(true)
        return
      }

      const formData = new FormData()
      formData.append("code", dataToSend.code)
      formData.append("name", dataToSend.name)
      formData.append("phone", dataToSend.phone)
      formData.append("dates", JSON.stringify(dataToSend.dates))
      formData.append("noveltyType", dataToSend.noveltyType)
      formData.append("time", dataToSend.time)
      formData.append("description", descriptionValue)
      // Flag para auto-aprobar solicitudes desde el panel de administración
      formData.append("autoApprove", "true")

      // Agregar archivos al FormData con mejor manejo
      const validFiles = uploadedFiles.filter((fileInfo) => !fileInfo.error)
      console.log("📁 Archivos válidos a enviar:", validFiles.length)

      validFiles.forEach((fileInfo, index) => {
        try {
          // Agregar el archivo con un nombre más descriptivo
          const fileExtension = fileInfo.file.name.split(".").pop()
          const fileName = `${fileInfo.file.name}`

          formData.append(`files`, fileInfo.file, fileName)

          // Agregar metadatos del archivo
          formData.append(
            `file_metadata_${index}`,
            JSON.stringify({
              originalName: fileInfo.file.name,
              size: fileInfo.file.size,
              type: fileInfo.file.type,
              uploadTime: new Date().toISOString(),
            }),
          )

          console.log(`📎 Archivo ${index + 1} agregado:`, fileName, `(${formatFileSize(fileInfo.file.size)})`)
        } catch (error) {
          console.error(`❌ Error agregando archivo ${index + 1}:`, error)
          throw new Error(`Error al preparar el archivo "${fileInfo.file.name}" para envío`)
        }
      })

      // Agregar información de resumen de archivos
      formData.append(
        "files_summary",
        JSON.stringify({
          totalFiles: validFiles.length,
          totalSize: validFiles.reduce((sum, f) => sum + f.file.size, 0),
          fileTypes: validFiles.map((f) => f.file.type),
          uploadTimestamp: new Date().toISOString(),
        }),
      )

      const token = localStorage.getItem("accessToken")
      if (!token) {
        throw new Error("No se encontró el token de acceso")
      }

      // USE THE SMART CONNECTION HOOK
      console.log("📤 Enviando con protección contra duplicados...")
      const result = await connectionAwareSubmit.submit({ formData, token })

      console.log("✅ Solicitud enviada exitosamente:", result)
      setIsSuccess(true)

      // Safely reset the form
      try {
        // const form = e.target as HTMLFormElement
        // form.reset() // NO limpiar el formulario así, solo limpiar los estados controlados
      } catch (resetError) {
        console.warn("Advertencia al resetear formulario:", resetError)
      }

      setSelectedDates([])
      setNoveltyType("")
      setHasShownLicenseNotification(false)
      setTimeValue("")
      setDescriptionValue("") // Limpiar aquí después de éxito
      setUploadedFiles([]) // Limpiar archivos

      // Auto-hide success message
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("❌ Error en el envío:", error)
      setErrorMessage(`Ocurrió un error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`)
      setIsErrorModalOpen(true)
    }
  }

  const handleConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      setNoveltyType("licencia")
    } else {
      setSelectedDates((prev) => prev.slice(0, -1))
    }
    setIsConfirmationDialogOpen(false)
  }

  // Opciones de novedad según el tipo de usuario
  const getNoveltyOptions = () => {
    // Novedades para personal de mantenimiento
    if (userData?.userType === "se_maintenance") {
      return [
        {
          id: "cumpleanos",
          label: "Cumpleaños",
          description: "Celebración de cumpleaños",
          icon: User,
          color: "bg-green-50",
          iconColor: "text-green-600",
          iconBg: "bg-green-100",
        },
        {
          id: "cita",
          label: "Cita médica",
          description: "Para asistir a citas médicas",
          icon: HeartPulse,
          color: "bg-cyan-50",
          iconColor: "text-cyan-600",
          iconBg: "bg-cyan-100",
        },
        {
          id: "descanso",
          label: "Descanso",
          description: "Para un día de descanso",
          icon: Sun,
          color: "bg-green-50",
          iconColor: "text-green-600",
          iconBg: "bg-green-100",
        },
        {
          id: "licenciaMaternidad",
          label: "Licencia de maternidad",
          description: "Se debe adjuntar el documento soporte",
          icon: HeartPulse,
          color: "bg-pink-50",
          iconColor: "text-pink-600",
          iconBg: "bg-pink-100",
        },
        {
          id: "licenciaPaternidad",
          label: "Licencia de paternidad",
          description: "Se debe adjuntar el documento soporte",
          icon: User,
          color: "bg-green-50",
          iconColor: "text-green-600",
          iconBg: "bg-green-100",
        },
        {
          id: "calamidad",
          label: "Calamidad",
          description: "Para situaciones de calamidad",
          icon: AlertCircle,
          color: "bg-red-50",
          iconColor: "text-red-600",
          iconBg: "bg-red-100",
        },
        {
          id: "cambioTurno",
          label: "Cambio de turno",
          description: "Para solicitar cambio de turno",
          icon: Clock,
          color: "bg-orange-50",
          iconColor: "text-orange-600",
          iconBg: "bg-orange-100",
        },
        {
          id: "vacaciones",
          label: "Vacaciones",
          description: "Solicitud de vacaciones",
          icon: Sun,
          color: "bg-yellow-50",
          iconColor: "text-yellow-600",
          iconBg: "bg-yellow-100",
        },
        {
          id: "tramitesLegales",
          label: "Trámites legales",
          description: "Para realizar trámites legales",
          icon: FileText,
          color: "bg-gray-50",
          iconColor: "text-gray-600",
          iconBg: "bg-gray-100",
        },
        {
          id: "subpolitica",
          label: "Deseo de laborar en alguna Sub política",
          description: "Seleccionar subpolítica específica",
          icon: Briefcase,
          color: "bg-green-50",
          iconColor: "text-green-600",
          iconBg: "bg-green-100",
        },
        {
          id: "educacion",
          label: "Educación",
          description: "Entrega de notas, reuniones escolares, evaluaciones",
          icon: FileText,
          color: "bg-emerald-50",
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-100",
        },
        {
          id: "permisoEstudiar",
          label: "Permiso para estudiar",
          description: "Anexar soportes y cumplir requerimientos de SAO6",
          icon: FileText,
          color: "bg-teal-50",
          iconColor: "text-teal-600",
          iconBg: "bg-teal-100",
        },
        {
          id: "viaje",
          label: "Viaje",
          description: "Para realizar viajes",
          icon: Car,
          color: "bg-violet-50",
          iconColor: "text-violet-600",
          iconBg: "bg-violet-100",
        },
        {
          id: "licencia",
          label: "Licencia no remunerada",
          description: "Solicitud de días sin remuneración",
          icon: Briefcase,
          color: "bg-stone-50",
          iconColor: "text-stone-600",
          iconBg: "bg-stone-100",
        },
      ]
    }

    // Novedades para usuarios regulares (existentes)
    return [
      {
        id: "descanso",
        label: "Descanso",
        description: "Para un día de descanso",
        icon: Sun,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
      },
      {
        id: "licencia",
        label: "Licencia no remunerada",
        description: "Solicitud de días sin remuneración",
        icon: Briefcase,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
      },
      {
        id: "audiencia",
        label: "Audiencia o curso de tránsito",
        description: "Para asistir a audiencias o cursos",
        icon: Car,
        color: "bg-teal-50",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
      },
      {
        id: "cita",
        label: "Cita médica",
        description: "Para asistir a citas médicas",
        icon: HeartPulse,
        color: "bg-cyan-50",
        iconColor: "text-cyan-600",
        iconBg: "bg-cyan-100",
      },
      {
        id: "tablaPartida",
        label: "Tabla Partida",
        description: "Para la jornada de tabla partida",
        icon: Table2,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
      },
      {
        id: "diaAM",
        label: "Día A.M.",
        description: "Jornada de mañana un día específico",
        icon: Sun,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
      },
      {
        id: "diaPM",
        label: "Día P.M.",
        description: "Jornada de tarde un día específico",
        icon: Moon,
        color: "bg-teal-50",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
      },
    ]
  }

  const noveltyOptions = getNoveltyOptions()

  // Subpolíticas para personal de mantenimiento
  const subpoliticas = [
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR MECÁNICA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR ELÉCTRICO",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PROGRAMADO MECÁNICA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - POTENCIA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - DIAGNÓSTICO",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - BIMENSUAL ELECTROMECANICO",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - BIMENSUAL CARROCERIA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - METRO MEDELLIN",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - ALISTAMIENTO CDA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CARROCERIA MENOR",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO Y MONTAJE PUERTAS",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PISOS",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CARROCERO CHASIS",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - MECÁNICO CHASIS",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PINTURA GENERAL CARROCERÍA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PINTURA PARCIAL CARROCERÍA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - FIBRA EMBELLECIMIENTO CARROCERÍA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - FALDONES EMBELLECIMIENTO CARROCERÍA",
    },
    {
      POLÍTICA: "POLÍTICA CORRECTIVO",
      SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CHOQUES FUERTES CARROCERÍA",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - CAMBIAR DIFERENCIALES",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - HACER",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - LUBRICACION",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ALISTAMIENTO PROFUNDO",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ENGRASE",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ALISTAMIENTO CHIP Y TANQUE GAS",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL CARROCERIA",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - FRENOS ANUAL",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - GNV",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ELECTRICO ANUAL",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - REFRIGERACION ANUAL",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - PMR BIMENSUAL",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - PUERTAS BIMENSUAL",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL ELECTROMECANICO",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO LLANTAS",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - REDISEÑOS O MEJORAS TECNICAS",
    },
    {
      POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
      SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - COMPONENTES MAYORES CRC",
    },
    {
      POLÍTICA: "APOYO ADMINISTRATIVO",
      SUBPOLÍTICA: "APOYO ADMINISTRATIVO - LÍDER DE MANTENIMIENTO",
    },
    {
      POLÍTICA: "APOYO ADMINISTRATIVO",
      SUBPOLÍTICA: "APOYO ADMINISTRATIVO - AUXILIAR MANTENIMIENTO - FLOTA",
    },
  ]

  // Agrupar subpolíticas por política
  const groupedSubpoliticas = subpoliticas.reduce(
    (acc, item) => {
      if (!acc[item.POLÍTICA]) {
        acc[item.POLÍTICA] = []
      }
      acc[item.POLÍTICA].push(item.SUBPOLÍTICA)
      return acc
    },
    {} as Record<string, string[]>
  )

  // Filtrar subpolíticas basado en el término de búsqueda
  const filteredGroupedSubpoliticas = useMemo(() => {
    if (!subpoliticaSearchTerm.trim()) {
      return groupedSubpoliticas
    }

    const searchTerm = subpoliticaSearchTerm.toLowerCase().trim()
    const filtered: Record<string, string[]> = {}

    Object.entries(groupedSubpoliticas).forEach(([politica, subpoliticasList]) => {
      // Filtrar subpolíticas que contengan el término de búsqueda
      const filteredSubpoliticas = subpoliticasList.filter(subpolitica =>
        subpolitica.toLowerCase().includes(searchTerm) ||
        politica.toLowerCase().includes(searchTerm)
      )

      // Solo agregar la política si tiene subpolíticas que coinciden
      if (filteredSubpoliticas.length > 0) {
        filtered[politica] = filteredSubpoliticas
      }
    })

    return filtered
  }, [groupedSubpoliticas, subpoliticaSearchTerm])

  const selectedNoveltyLabel = noveltyType === "subpolitica"
    ? selectedSubpolitica
    : noveltyOptions.find((option) => option.id === noveltyType)?.label || "Seleccione el tipo de novedad"
  const selectedNoveltyIcon = noveltyType === "subpolitica"
    ? Briefcase
    : noveltyOptions.find((option) => option.id === noveltyType)?.icon || FileText

  // 5. Ajustar el renderizado condicional para usar el nuevo isLoading y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <FileText className="h-12 w-12 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            ></motion.div>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-xl font-medium text-green-700"
          >
            Cargando Formulario de Permisos...
          </motion.h2>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-lg font-bold text-red-600 mb-2">Error al cargar los datos del usuario</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button
            onClick={() => {
              // Eliminar token de acceso
              localStorage.removeItem("accessToken")
              // Redirigir a la página de login
              router.push("/")
            }}
            className="bg-emerald-600 text-white"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <AnimatePresence>
        {connectionAwareSubmit.state.isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-md border-green-100 shadow-lg overflow-hidden rounded-3xl">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-xl font-semibold text-green-800 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-green-600" />
                Formulario de Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Form content directly, no tabs */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Info Card */}
                <UserInfoCard
                  code={userData?.code}
                  name={userData?.name}
                  phone={userData?.phone}
                  onPhoneEdit={handlePhoneDoubleClick}
                  isExtemporaneous={actualIsExtemporaneous}
                  onEmployeeSelect={(employee) => {
                    // Al seleccionar un nuevo empleado, resetear estados para evitar errores de fechas anteriores
                    setSelectedEmployee(employee)
                    setSelectedDates([])
                    setNoveltyType("")
                    setDescriptionValue("")
                    setTimeValue("")
                    setUploadedFiles([])
                    setExistingPermitDates([])
                    setFechasEnviadasUsuario([])
                  }}
                  selectedEmployee={selectedEmployee}
                  userType={userData?.userType}
                />

                {/* Novelty Type Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="noveltyType" className="text-green-700 font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-green-600" />
                    Tipo de Novedad
                  </Label>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsTypeDialogOpen(true)} // Open the new type selection dialog
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-green-200 bg-white hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex items-center">
                      {noveltyType ? (
                        <>
                          <div className="bg-green-100 p-2 rounded-lg mr-3">
                            {React.createElement(selectedNoveltyIcon, { className: "h-5 w-5 text-green-600" })}
                          </div>
                          <span className="font-medium">{selectedNoveltyLabel}</span>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-green-100 transition-colors">
                            <FileText className="h-5 w-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                          </div>
                          <span className="text-gray-500 group-hover:text-gray-700 transition-colors">
                            Seleccione el tipo de novedad
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-green-500" />
                  </motion.button>
                </motion.div>

                {/* Time Section - Only for specific novelty types */}
                <AnimatePresence>
                  {(noveltyType === "cita" || noveltyType === "audiencia") && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 shadow-lg overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <Clock className="h-6 w-6 mr-3 text-green-600" />
                          <h3 className="text-green-800 font-bold text-xl">Hora de la Novedad</h3>
                        </div>
                        <div className="relative">
                          <Input
                            id="time"
                            type="time"
                            value={timeValue}
                            onChange={(e) => setTimeValue(e.target.value)}
                            className="pl-12 pr-4 py-3 border-green-200 focus:ring-green-500 bg-white shadow-sm rounded-xl text-base"
                            required
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500">
                            <Clock className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Calendar Section */}
                <motion.div
                  className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-green-800 font-bold text-xl flex items-center">
                      <Calendar className="h-6 w-6 mr-3 text-green-600" />
                      Fechas de Solicitud
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weekDates.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No hay fechas disponibles para esta semana.</div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 calendar-grid">
                        {/* Mensaje de guía si no hay novedad seleccionada */}
                        {!noveltyType && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="col-span-full bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-center mb-4 shadow-sm border border-yellow-200"
                          >
                            <Info className="h-5 w-5 mr-3 text-yellow-600" />
                            <p className="text-sm font-medium">
                              Por favor, selecciona primero el **Tipo de Novedad** para habilitar la selección de
                              fechas.
                            </p>
                          </motion.div>
                        )}

                        {/* Indicador de carga mientras se verifican fechas existentes */}
                        {cargandoFechasExistentes && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="col-span-full bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center mb-4 shadow-sm border border-blue-200"
                          >
                            <Loader2 className="h-5 w-5 mr-3 text-blue-600 animate-spin" />
                            <p className="text-sm font-medium">
                              Verificando tus solicitudes anteriores...
                            </p>
                          </motion.div>
                        )}

                        {/* Mensaje informativo sobre fechas ya enviadas por el usuario */}
                        {!cargandoFechasExistentes && fechasEnviadasUsuario.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="col-span-full bg-amber-50 text-amber-800 p-4 rounded-xl flex items-start mb-4 shadow-sm border border-amber-200"
                          >
                            <AlertCircle className="h-5 w-5 mr-3 mt-0.5 text-amber-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold mb-1">
                                ¡Ya tienes solicitudes enviadas!
                              </p>
                              <p className="text-sm">
                                Las fechas marcadas en <span className="text-gray-500 font-semibold">gris</span> ya tienen solicitudes de permisos
                                que enviaste previamente. No puedes seleccionar esas fechas nuevamente.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {weekDates.map((item, index) => {
                          const isDateSelected = selectedDates.some((d) => isSameDay(d, item.date))
                          const isHolidayDate = isHoliday(item.date).isHoliday
                          const isToday = isSameDay(item.date, new Date())
                          const formattedDate = format(item.date, "yyyy-MM-dd")
                          const hasExistingPermit = existingPermitDates.includes(formattedDate)
                          const isDisabled = isHolidayDate || !noveltyType || hasExistingPermit // Disable if holiday, no novelty type, or has existing permit

                          return (
                            <button
                              key={index}
                              className={`calendar-day relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-center
                                ${isDateSelected
                                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                                  : hasExistingPermit
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 opacity-60"
                                    : isDisabled
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                                      : "bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 hover:shadow-md"
                                }
                                ${isToday ? "border-2 border-green-400 ring-2 ring-green-200" : ""}
                              `}
                              onClick={(e) => {
                                e.preventDefault()
                                if (!isDisabled) {
                                  // Only allow selection if not disabled
                                  handleDateSelect(item.date)
                                }
                              }}
                              type="button"
                              disabled={isDisabled}
                            >
                              <span
                                className={`text-xs font-medium ${isDateSelected ? "text-white" : "text-green-600"} date-text capitalize`}
                              >
                                {format(item.date, "EEE", { locale: es })}
                              </span>
                              <span
                                className={`text-2xl font-bold mt-1 ${isDateSelected ? "text-white" : "text-gray-900"}`}
                              >
                                {format(item.date, "d")}
                              </span>
                              {isHolidayDate && ( // Use isHolidayDate here
                                <span className="absolute bottom-1 text-[0.6rem] font-semibold text-red-500">
                                  {isHoliday(item.date).name.split(" ")[0]}
                                </span>
                              )}
                              {hasExistingPermit && (
                                <span className="absolute bottom-1 text-[0.6rem] font-semibold text-red-600">
                                  Ya enviada
                                </span>
                              )}
                              {isDateSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 bg-white rounded-full p-0.5"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </motion.div>
                              )}
                              {hasExistingPermit && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 left-2 bg-red-500 rounded-full p-0.5"
                                >
                                  <AlertCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </motion.div>

                {/* Description Section */}
                <motion.div
                  className="bg-gradient-to-r from-green-50 to-white rounded-2xl border border-green-100 shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 mr-3 text-green-600" />
                      <h3 className="text-green-800 font-bold text-xl">Detalles Adicionales</h3>
                    </div>
                    <div className="relative group">
                      <Textarea
                        id="description"
                        value={descriptionValue}
                        onChange={(e) => setDescriptionValue(e.target.value)}
                        placeholder="Ingrese el detalle de tu solicitud (ej. motivo, duración, etc.)"
                        className="min-h-[140px] border-green-200 focus:ring-green-500 bg-white/90 shadow-sm rounded-xl p-4 text-base group-hover:border-green-300 transition-all duration-300"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Request Summary Section */}
                {(noveltyType || selectedDates.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="bg-green-50 p-5 rounded-2xl border border-green-200 shadow-md"
                  >
                    <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-green-600" />
                      Resumen de la Solicitud
                    </h3>
                    <div className="space-y-2 text-green-700">
                      <p className="text-sm">
                        <span className="font-semibold">Tipo de Novedad:</span>{" "}
                        {noveltyType ? selectedNoveltyLabel : "No seleccionado"}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Fechas Seleccionadas:</span>{" "}
                        {selectedDates.length > 0
                          ? selectedDates.map((d) => format(d, "dd/MM/yyyy")).join(", ")
                          : "No seleccionadas"}
                      </p>
                      {(noveltyType === "cita" || noveltyType === "audiencia") && (
                        <p className="text-sm">
                          <span className="font-semibold">Archivos Adjuntos:</span>{" "}
                          {uploadedFiles.filter((f) => !f.error).length} archivo(s)
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="pt-6 flex justify-center w-full"
                >
                  <Button
                    type="submit"
                    className="
                      w-full max-w-md
                       bg-gradient-to-r from-emerald-600 to-emerald-500
                       text-white
                       hover:from-emerald-700 hover:to-emerald-600
                       px-6 py-4
                       rounded-full
                       text-lg font-bold
                       transition-all duration-300
                       shadow-xl hover:shadow-emerald-500/50
                       flex items-center justify-center
                       space-x-3
                      group
                    "
                    disabled={
                      connectionAwareSubmit.state.isSubmitting ||
                      !noveltyType ||
                      (noveltyType !== "semanaAM" && noveltyType !== "semanaPM" && selectedDates.length === 0)
                    }
                  >
                    {connectionAwareSubmit.state.isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Enviando Solicitud...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-6 w-6 group-hover:animate-pulse" />
                        <span>Enviar Solicitud</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm"
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-green-100 relative overflow-hidden"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-100 rounded-full opacity-20"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-100 rounded-full opacity-20"></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </motion.svg>
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-green-200 border-t-transparent"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  ></motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-500 mb-3">
                    ¡Solicitud Enviada!
                  </h2>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-6 border border-green-200 shadow-inner">
                    <div className="flex items-start mb-3">
                      <div className="bg-white rounded-full p-1 mr-2 shadow-sm">
                        <Info className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-green-800 text-sm">Su solicitud de permiso ha sido enviada correctamente.</p>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-white rounded-full p-1 mr-2 shadow-sm">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-green-800 text-sm">
                        Recibirá una notificación cuando su solicitud sea procesada.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setIsSuccess(false)}
                        className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Entendido
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm"
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-red-100 relative overflow-hidden"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 10 }}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-red-700 mb-3">Error de Validación</h2>
                <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
                  <p className="text-red-800">{errorMessage}</p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsErrorModalOpen(false)}
                    className="bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 px-6 py-2 rounded-full shadow-md"
                  >
                    Entendido
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Dialog */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="bg-white rounded-3xl border border-green-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700 mb-4">Actualizar número de teléfono</DialogTitle>
          </DialogHeader>
          <Input
            type="tel"
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
            placeholder="Ingrese el nuevo número de teléfono"
            className="mt-2 p-3 border-green-200 focus:ring-green-500 bg-white rounded-xl text-base"
            ref={phoneInputRef}
          />
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => setIsPhoneDialogOpen(false)}
              variant="outline"
              className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button onClick={updatePhoneNumber} className="bg-green-600 text-white hover:bg-green-700 rounded-xl">
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border border-green-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700 mb-4">Cambio de tipo de solicitud</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-base leading-relaxed">
            Ha seleccionado 2 o más fechas para un descanso. Su solicitud cambiará a Licencia no remunerada. ¿Desea
            continuar?
          </p>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => handleConfirmation(false)}
              variant="outline"
              className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleConfirmation(true)}
              className="bg-green-600 text-white hover:bg-green-700 rounded-xl"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Notification Dialog */}
      <Dialog open={isLicenseNotificationOpen} onOpenChange={setIsLicenseNotificationOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border border-green-100 shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700 text-center mb-4">
              Notificación Importante
            </DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <Calendar className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-center text-lg font-semibold text-gray-800 mb-4">
              Ha seleccionado 3 o más días para una licencia no remunerada.
            </p>
            <motion.p
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, yoyo: Number.POSITIVE_INFINITY, repeatDelay: 0.5 }}
              className="text-center text-green-600 font-bold text-base"
            >
              Este requerimiento será evaluado por el coordinador de operaciones.
            </motion.p>
            <p className="text-center mt-4 text-gray-600 text-sm">
              La respuesta a su solicitud se le notificará oportunamente.
            </p>
          </motion.div>
          <DialogFooter className="mt-6 flex justify-center">
            <Button
              onClick={() => setIsLicenseNotificationOpen(false)}
              className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novelty Type Selection Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-6xl p-0 rounded-3xl overflow-hidden border-0 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 mr-5 shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-1">Seleccione el Tipo de Novedad</h2>
                  <p className="text-emerald-50 text-lg font-medium">
                    Elige el tipo de solicitud que necesitas realizar
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-gray-50/50 to-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {noveltyOptions.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                  }}
                  whileHover={{
                    scale: 1.05,
                    y: -8,
                    transition: { duration: 0.3, type: "spring", stiffness: 200 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (type.id === "subpolitica") {
                      setIsSubpoliticaDialogOpen(true)
                      setIsTypeDialogOpen(false)
                    } else {
                      setNoveltyType(type.id)
                      setHasShownLicenseNotification(false)
                      if (type.id === "semanaAM" || type.id === "semanaPM") {
                        setSelectedDates([])
                      }
                      setIsTypeDialogOpen(false)
                      setErrorMessage("")
                      setIsErrorModalOpen(false)
                      console.log("✅ Tipo de Novedad seleccionado:", type.id)
                    }
                  }}
                  className={`
                    ${type.color}
                    rounded-2xl
                    p-6
                    cursor-pointer
                    transition-all
                    duration-300
                    hover:shadow-2xl
                    border-2
                    group
                    relative
                    overflow-hidden
                    backdrop-blur-sm
                    ${noveltyType === type.id
                      ? "border-emerald-400 shadow-xl shadow-emerald-200/60 ring-4 ring-emerald-100/80 bg-gradient-to-br from-emerald-50 to-teal-50"
                      : "border-gray-200/60 hover:border-emerald-300/80 shadow-md hover:shadow-xl"
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className={`${type.iconBg} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                      >
                        <type.icon className={`h-7 w-7 ${type.iconColor} drop-shadow-sm`} />
                      </div>
                      {noveltyType === type.id && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full p-2.5 shadow-lg ring-4 ring-emerald-100"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-3 group-hover:text-emerald-700 transition-colors duration-300 leading-tight">
                        {type.label}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium group-hover:text-gray-700 transition-colors duration-300">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-8 pt-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/30 to-white">
            <div className="flex justify-end">
              <Button
                onClick={() => setIsTypeDialogOpen(false)}
                variant="outline"
                className="rounded-2xl border-2 border-emerald-300/80 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 px-10 py-3.5 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para seleccionar subpolítica */}
      <Dialog open={isSubpoliticaDialogOpen} onOpenChange={(open) => {
        setIsSubpoliticaDialogOpen(open)
        if (!open) {
          setSubpoliticaSearchTerm("") // Limpiar búsqueda al cerrar
        }
      }}>
        <DialogContent className="sm:max-w-6xl p-0 rounded-3xl overflow-hidden border-0 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 mr-5 shadow-lg">
                  <Briefcase className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold tracking-tight mb-1">Seleccione una Subpolítica</h2>
                  <p className="text-green-50 text-lg font-medium">Elige la subpolítica en la que deseas laborar</p>
                </div>
              </div>

              {/* Campo de búsqueda */}
              <div className="relative mt-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/70" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar subpolíticas..."
                  value={subpoliticaSearchTerm}
                  onChange={(e) => setSubpoliticaSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 text-lg"
                />
                {subpoliticaSearchTerm && (
                  <button
                    onClick={() => setSubpoliticaSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/70 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10 bg-gradient-to-b from-gray-50/50 to-white">
            {Object.keys(filteredGroupedSubpoliticas).length === 0 && subpoliticaSearchTerm.trim() !== "" ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                  <Search className="h-12 w-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500 mb-6">No hay subpolíticas que coincidan con "{subpoliticaSearchTerm}"</p>
                <button
                  onClick={() => setSubpoliticaSearchTerm("")}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              Object.entries(filteredGroupedSubpoliticas).map(([politica, subpoliticasList], groupIndex) => (
                <motion.div
                  key={politica}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.15, duration: 0.5, type: "spring", stiffness: 80 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 shadow-lg">
                      <Briefcase className="h-7 w-7 text-white drop-shadow-sm" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{politica}</h3>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-green-300 via-green-200 to-transparent rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subpoliticasList.map((subpolitica, index) => (
                      <motion.div
                        key={subpolitica}
                        initial={{ opacity: 0, x: -30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: groupIndex * 0.1 + index * 0.06,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 120,
                          damping: 15,
                        }}
                        whileHover={{
                          scale: 1.03,
                          y: -6,
                          transition: { duration: 0.3, type: "spring", stiffness: 200 },
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedSubpolitica(subpolitica)
                          setNoveltyType("subpolitica")
                          setIsSubpoliticaDialogOpen(false)
                          setHasShownLicenseNotification(false)
                          setSelectedDates([])
                          setErrorMessage("")
                          setIsErrorModalOpen(false)
                          console.log("✅ Subpolítica seleccionada:", subpolitica)
                        }}
                        className={`
                        rounded-2xl
                        p-6
                        cursor-pointer
                        transition-all
                        duration-300
                        hover:shadow-2xl
                        border-2
                        group
                        relative
                        overflow-hidden
                        backdrop-blur-sm
                        ${selectedSubpolitica === subpolitica
                            ? "bg-gradient-to-br from-green-50 to-green-50 border-green-400 shadow-xl shadow-green-200/60 ring-4 ring-green-100/80"
                            : "bg-gradient-to-br from-green-50/40 to-white border-green-200/60 hover:border-green-300/80 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-50/60 shadow-md hover:shadow-xl"
                          }
                      `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400"></div>

                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`
                            p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-110
                            ${selectedSubpolitica === subpolitica
                                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white ring-4 ring-green-100"
                                  : "bg-green-100 text-green-600 group-hover:bg-green-200 group-hover:text-green-700"
                                }
                          `}
                            >
                              <Briefcase className="h-6 w-6 drop-shadow-sm" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-base leading-tight group-hover:text-green-700 transition-colors duration-300">
                                {subpolitica}
                              </p>
                            </div>
                          </div>

                          {selectedSubpolitica === subpolitica && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200, damping: 12 }}
                              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full p-2.5 shadow-lg ring-4 ring-green-100"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="px-8 pb-8 pt-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/30 to-white">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => {
                  setIsSubpoliticaDialogOpen(false)
                  setIsTypeDialogOpen(true)
                }}
                variant="outline"
                className="rounded-2xl border-2 border-green-300/80 text-green-700 hover:bg-green-50 hover:border-green-400 px-8 py-3.5 font-semibold transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <span>←</span>
                <span>Volver</span>
              </Button>
              <Button
                onClick={() => setIsSubpoliticaDialogOpen(false)}
                variant="outline"
                className="rounded-2xl border-2 border-green-300/80 text-green-700 hover:bg-green-50 hover:border-green-400 px-10 py-3.5 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
