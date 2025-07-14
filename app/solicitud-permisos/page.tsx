"use client"

import { Label } from "@/components/ui/label"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, Variants, Transition, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  Info,
  Briefcase,
  HeartPulse,
  Car,
  Sun,
  Moon,
  User,
  Phone,
  Shield,
  ChevronRight,
  List,
  Bell,
  Settings,
} from "lucide-react"
import { format, addDays, isSameDay, startOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import BottomNavigation from '@/components/BottomNavigation'
// Inlined UserInfoCard component
interface UserInfoCardProps {
  code: string | undefined
  name: string | undefined
  phone: string | undefined
  onPhoneEdit: () => void
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ code, name, phone, onPhoneEdit }) => {
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

  return (
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
            <p className="text-sm text-green-700 group-hover:underline">Teléfono: {phone || "N/A"}</p>
          </div>
        </div>
      </div>
    </motion.div>
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
  const diff = (day === 0 ? -6 : 1 - day)
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

  // Common holidays in Colombia
  // January 1 - New Year
  if (month === 0 && day === 1) return { isHoliday: true, name: "Año Nuevo" }
  // May 1 - Labor Day
  if (month === 5 && day === 2) return { isHoliday: true, name: " Dia de la Ascensión" }
  // June 30 - San Pedro y San Pablo
  if (month === 6 && day === 30) return { isHoliday: true, name: "San Pedro y San Pablo" }
  // July 20 - Independence Day
  if (month === 6 && day === 30) return { isHoliday: true, name: "Día de la Independencia" }
  // August 7 - Battle of Boyacá
  if (month === 7 && day === 7) return { isHoliday: true, name: "Batalla de Boyacá" }
  // December 8 - Immaculate Conception
  if (month === 11 && day === 8) return { isHoliday: true, name: "Inmaculada Concepción" }
  // December 25 - Christmas
  if (month === 11 && day === 25) return { isHoliday: true, name: "Navidad" }

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

// Nueva función para fechas del 21 al 27 del mes actual
const getFixedRangeDates = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const dates = []
  for (let day = 21; day <= 27; day++) {
    const date = new Date(year, month, day)
    dates.push({
      date,
      formattedDate: format(date, "EEEE d 'de' MMMM", { locale: es }),
      shortDate: format(date, "EEE d MMM", { locale: es }),
    })
  }
  return {
    regularDates: dates,
    allDates: dates,
  }
}

const checkExistingPermits = async (dates: string[]) => {
  try {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      throw new Error("No se encontró el token de acceso")
    }
    const response = await fetch("https://solicitud-permisos.sao6.com.co/api/check-existing-permits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dates }),
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
import useUserData from '../hooks/useUserData'

export default function PermitRequestForm() {
  const router = useRouter()
  // 2. Usar el hook para obtener los datos reales del usuario
  const { userData, isLoading, error, fetchUserData } = useUserData()
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
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [weekDates, setWeekDates] = useState<DateInfo[]>([])

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

  // 4. Eliminar el useEffect que simulaba la carga de usuario
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       setTimeout(() => {
  //         const token = localStorage.getItem("accessToken")
  //         if (token) {
  //           // Simulate API call
  //           setUserData({
  //             name: "Carlos Rodríguez",
  //             code: "CR-2023",
  //             phone: "3001234567",
  //           })
  //         } else {
  //           setUserData({
  //             name: "Carlos Rodríguez",
  //             code: "CR-2023",
  //             phone: "3001234567",
  //           })
  //         }
  //         setIsLoading(false)
  //       }, 1200)
  //   } catch (error) {
  //     console.error("Error fetching user data:", error)
  //     setIsLoading(false)
  //   }
  //   }
  //   fetchUserData()
  // }, [])

  useEffect(() => {
    const { regularDates } = getFixedRangeDates()
    setWeekDates(regularDates)
  }, [])

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

  const handleDateSelect = (date: Date) => {
    console.log("🗓️ handleDateSelect - noveltyType al inicio:", noveltyType)
    if (noveltyType === "semanaAM" || noveltyType === "semanaPM") {
      return // Do nothing if semana AM or PM is selected
    }
    setSelectedDates((prev) => {
      const isAlreadySelected = prev.some((d) => isSameDay(d, date))
      let newDates
      if (["audiencia", "cita", "diaAM", "diaPM"].includes(noveltyType)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log("🔍 Validando datos antes del envío...")
    console.log("📊 Estado actual:", { 
      noveltyType, 
      selectedDatesLength: selectedDates.length,
      userDataCode: userData?.code,
      userDataName: userData?.name,
    })

    // 1. Validate user data
    if (!userData || !userData.code || !userData.name || userData.code.trim() === "" || userData.name.trim() === "") {
      setErrorMessage("Datos de usuario no válidos. Por favor, vuelve a iniciar sesión.")
      setIsErrorModalOpen(true)
      console.error("❌ Datos de usuario vacíos o inválidos")
      return
    }

    // 2. Validate novelty type
    if (!noveltyType || noveltyType.trim() === "") {
      setErrorMessage("Debe seleccionar el tipo de solicitud.")
      setIsErrorModalOpen(true)
      console.error("❌ Tipo de solicitud no seleccionado")
      return
    }

    // 3. Validate dates based on novelty type
    const requiresDates = !["semanaAM", "semanaPM"].includes(noveltyType)
    if (requiresDates && selectedDates.length === 0) {
      setErrorMessage("Debe seleccionar al menos una fecha para este tipo de solicitud.")
      setIsErrorModalOpen(true)
      console.error("❌ No se seleccionaron fechas para tipo que las requiere:", noveltyType)
      return
    }

    // 4. Validate specific fields based on type
    const formElement = e.target as HTMLFormElement
    const timeValue = formElement.time?.value?.trim() || ""
    const descriptionValue = formElement.description?.value?.trim() || ""

    // Types that require specific time
    if (["cita", "audiencia"].includes(noveltyType) && !timeValue) {
      setErrorMessage("La hora es requerida para este tipo de solicitud.")
      setIsErrorModalOpen(true)
      console.error("❌ Hora requerida no proporcionada para:", noveltyType)
      return
    }

    // Validate description for certain types
    if (["licencia", "cita", "audiencia", "descanso", "diaAM", "diaPM"].includes(noveltyType) && !descriptionValue) {
      setErrorMessage("La descripción es requerida para este tipo de solicitud.")
      setIsErrorModalOpen(true)
      console.error("❌ Descripción requerida no proporcionada para:", noveltyType)
      return
    }

    console.log("✅ Todas las validaciones pasaron correctamente")

    try {
    // Check for existing permits
    const formattedDates = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
    const hasExistingPermit = await checkExistingPermits(formattedDates)
    if (hasExistingPermit && ["descanso", "cita", "licencia", "audiencia", "diaAM", "diaPM"].includes(noveltyType)) {
        setErrorMessage("Ya existe un permiso para la fecha seleccionada. No se puede realizar esta solicitud.")
        setIsErrorModalOpen(true)
      return
    }

      
      // Create FormData with FINAL validation
      const dataToSend = {
        code: userData.code,
        name: userData.name,
        phone: userData.phone,
        dates: formattedDates,
        noveltyType: noveltyType,
        time: timeValue,
        description: descriptionValue,
      }
      console.log("📦 Datos finales a enviar:", dataToSend)

      // Verify no critical empty fields
      if (!dataToSend.code || !dataToSend.name || !dataToSend.noveltyType) {
        console.error("❌ DATOS CRÍTICOS VACÍOS DETECTADOS")
        setErrorMessage("Error crítico: Datos esenciales faltantes. No se puede enviar la solicitud.")
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
      formData.append("description", dataToSend.description)

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
      const form = e.target as HTMLFormElement
      form.reset()
      } catch (resetError) {
        console.warn("Advertencia al resetear formulario:", resetError)
      }
      setSelectedDates([])
      setNoveltyType("")
      setHasShownLicenseNotification(false)

      // Auto-hide success message
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("❌ Error enviando solicitud:", error)
      const msg = error instanceof Error ? error.message : "Error desconocido"

      if (!msg.includes("duplicado") && !msg.includes("esperar")) {
        setErrorMessage(`Ocurrió un error al enviar la solicitud: ${msg}`)
        setIsErrorModalOpen(true)
      }
    } finally {
      // setIsLoading(false) // This line is removed as per the edit hint
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

  // Actualizar el diseño de las opciones de novedad
  const noveltyOptions = [
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
      id: "semanaAM",
      label: "Semana A.M.",
      description: "Jornada de mañana toda la semana",
      icon: Sun,
      color: "bg-lime-50",
      iconColor: "text-lime-600",
      iconBg: "bg-lime-100",
    },
    {
      id: "semanaPM",
      label: "Semana P.M.",
      description: "Jornada de tarde toda la semana",
      icon: Moon,
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

  const selectedNoveltyLabel =
    noveltyOptions.find((option) => option.id === noveltyType)?.label || "Seleccione el tipo de novedad"
  const selectedNoveltyIcon = noveltyOptions.find((option) => option.id === noveltyType)?.icon || FileText

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
          <Button onClick={fetchUserData} className="bg-emerald-600 text-white">Reintentar</Button>
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

      {/* Header */}
      <div className="bg-green-500 text-white rounded-b-[40px] shadow-lg">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -mb-16 -ml-16"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
      <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
                className="mr-4 bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-lg"
              >
                <FileText className="h-7 w-7" />
              </motion.div>
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-3xl font-bold">Solicitud de Permisos</h1>
                <p className="text-green-100 text-sm mt-1">Gestiona tus permisos laborales</p>
              </motion.div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-lg">
                    {userData.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
                      </div>
                    </div>
                    </div>
      </div>

      {/* Additional space between header and content */}
      <div className="h-10"></div>

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
                      <div className="text-center text-gray-500 py-8">
                        No hay fechas disponibles para esta semana.
                      </div>
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
                            <p className="text-sm font-medium">Por favor, selecciona primero el **Tipo de Novedad** para habilitar la selección de fechas.</p>
                          </motion.div>
                        )}
                        {weekDates.map((item, index) => {
                          const isDateSelected = selectedDates.some((d) => isSameDay(d, item.date))
                          const isHolidayDate = isHoliday(item.date).isHoliday
                          const isToday = isSameDay(item.date, new Date())
                          const isDisabled = isHolidayDate || !noveltyType // Disable if holiday or no novelty type selected
                        
                        return (
                          <button
                            key={index}
                              className={`calendar-day relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-center
                                ${isDateSelected ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                                  : isDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                                  : "bg-white hover:bg-green-50 border border-green-200 hover:border-green-300 hover:shadow-md"}
                                ${isToday ? "border-2 border-blue-400 ring-2 ring-blue-200" : ""}
                              `}
                            onClick={(e) => {
                                e.preventDefault()
                                if (!isDisabled) { // Only allow selection if not disabled
                                  handleDateSelect(item.date)
                                }
                              }}
                              type="button"
                            disabled={isDisabled}
                          >
                              <span className={`text-xs font-medium ${isDateSelected ? "text-white" : "text-green-600"} date-text capitalize`}>
                                {format(item.date, "EEE", { locale: es })}
                            </span>
                              <span className={`text-2xl font-bold mt-1 ${isDateSelected ? "text-white" : "text-gray-900"}`}>
                                {format(item.date, "d")}
                            </span>
                              {isHolidayDate && ( // Use isHolidayDate here
                                <span className="absolute bottom-1 text-[0.6rem] font-semibold text-red-500">
                                  {isHoliday(item.date).name.split(" ")[0]}
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
              transition={{ duration: 0.4, delay: 0.4 }}
            >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 mr-3 text-green-600" />
                      <h3 className="text-green-800 font-bold text-xl">Detalles Adicionales</h3>
                    </div>
                <div className="relative group">
                  <Textarea
                    id="description"
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
                    transition={{ duration: 0.4, delay: 0.5 }}
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
                      {/* Add more summary details here if needed, e.g., time, description snippet */}
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
    disabled={connectionAwareSubmit.state.isSubmitting || !noveltyType || ((noveltyType !== "semanaAM" && noveltyType !== "semanaPM") && selectedDates.length === 0)}
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

      {/* Novelty Type Selection Dialog (based on image) */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-3xl overflow-hidden border-0 shadow-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 mr-3 text-white/80" />
              <h2 className="text-2xl font-bold">Seleccione el Tipo de Novedad</h2>
          </div>
            <p className="text-sm text-white/70 mt-2">Elige el tipo de solicitud que necesitas</p>
              </div>

          {/* Novelty Types - Grid Layout */}
          <div className="p-6 grid grid-cols-2 gap-4">
            {noveltyOptions.map((type) => (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setNoveltyType(type.id)
                  setHasShownLicenseNotification(false)
                  if (type.id === "semanaAM" || type.id === "semanaPM") {
                    setSelectedDates([])
                  }
                  setIsTypeDialogOpen(false)
                  setErrorMessage("") // Clear error message
                  setIsErrorModalOpen(false) // Close error modal
                  console.log("✅ Tipo de Novedad seleccionado:", type.id)
                }}
                className={`
                  ${type.color} 
                  rounded-2xl 
                  p-4 
                  flex 
                  items-center 
                  cursor-pointer 
                  transition-all 
                  duration-200 
                  hover:shadow-md 
                  border 
                  border-transparent 
                  hover:border-emerald-200
                  ${noveltyType === type.id ? 'ring-2 ring-emerald-500 border-emerald-200' : ''}
                `}
              >
                <div className={`${type.iconBg} p-3 rounded-xl mr-4`}>
                  <type.icon className={`h-6 w-6 ${type.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-base">{type.label}</h3>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </div>
                {noveltyType === type.id && (
                  <div className="ml-auto bg-emerald-500 text-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <DialogFooter className="p-6 border-t border-gray-100 flex justify-end">
            <Button
              onClick={() => setIsTypeDialogOpen(false)}
              variant="outline"
              className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNavigation hasNewNotification={hasNewNotification} />
    </div>
  )
}
