"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import {
  CalendarDays,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  FileText,
  ClipboardList,
  Search,
  Download,
  RefreshCw,
  X,
  SlidersHorizontal,
  Calendar,
  RotateCcw,
  ChevronDown,
  Users,
  TrendingUp,
  AlertCircle,
  WifiOff,
} from "lucide-react"
import UserAvatar from "../UserAvatar/page"
import RequestDetails from "../request-details"
import * as XLSX from "xlsx"

// Tipos de datos mejorados
interface RequestData {
  id: string
  userName: string
  userCode: string
  userAvatar: string
  requestType: string
  requestDate: string
  requestedDates: string
  status: string
  days: number
  submittedTime: string
  requestedTime: string
  department: string
  priority: string
  reason: string
  description: string
  createdAt?: string
}

interface FilterOptions {
  statuses: string[]
  types: string[]
  priorities: string[]
}

interface Filters {
  status: string
  type: string
  priority: string
  dateFrom: string
  dateTo: string
  daysMin: string
  daysMax: string
  search: string
}

interface GlobalStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

// Hook personalizado para detectar conexión
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar estado inicial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

export default function RequestDashboard() {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [requests, setRequests] = useState<RequestData[]>([])
  const [allFilteredRequests, setAllFilteredRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<string | null>(null)

  // Estado para el modal de detalles de solicitud
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null)
  const [showRequestDetails, setShowRequestDetails] = useState(false)

  // Estado para información del usuario actual
  const [currentUser, setCurrentUser] = useState<{ userType?: string; code?: string } | null>(null)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRequests, setTotalRequests] = useState(0)
  const [limit] = useState(50)

  // Estados de estadísticas globales
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Estados para opciones de filtros globales
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: ["Todos", "Pendiente", "Aprobado", "Rechazado"],
    types: ["Todos"],
    priorities: ["Todos", "Urgente", "Alta", "Media", "Baja"],
  })

  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    status: "Todos",
    type: "Todos",
    priority: "Todos",
    dateFrom: "",
    dateTo: "",
    daysMin: "",
    daysMax: "",
    search: "",
  })

  // Hook para detectar conexión
  const isOnline = useOnlineStatus()

  // Referencias para control de rate limiting y cleanup
  const lastRequestTime = useRef<number>(0)
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const MIN_REQUEST_INTERVAL = 1000

  // Referencias para inicialización
  const isInitialized = useRef(false)

  // Función para obtener información del usuario actual
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken")
      console.log('DEBUG fetchCurrentUser: Token encontrado:', !!token)
      if (!token) {
        console.log('DEBUG fetchCurrentUser: No hay token, saliendo')
        return
      }

      console.log('DEBUG fetchCurrentUser: Haciendo petición a /auth/user')
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('DEBUG fetchCurrentUser: Response status:', response.status)
      if (response.ok) {
        const userData = await response.json()
        console.log('DEBUG fetchCurrentUser: User data received:', userData)
        setCurrentUser(userData)
        // Persistir datos del usuario en localStorage para que otros componentes puedan acceder
        localStorage.setItem('userData', JSON.stringify(userData))
        console.log('DEBUG: userData guardado en localStorage:', userData)
      } else {
        console.log('DEBUG fetchCurrentUser: Response not ok:', response.statusText)
      }
    } catch (error) {
      console.error('DEBUG fetchCurrentUser: Error:', error)
    }
  }, [])

  // Efecto para obtener información del usuario actual
  useEffect(() => {
    console.log('DEBUG: Ejecutando useEffect para fetchCurrentUser')
    fetchCurrentUser()
  }, [fetchCurrentUser])

  // Función mejorada para obtener opciones de filtros
  const fetchFilterOptions = useCallback(async () => {
    if (!isOnline) {
      console.warn("Sin conexión a internet, usando opciones por defecto")
      return
    }

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        console.warn("No hay token de autenticación disponible")
        return
      }

      // Rate limiting
      const now = Date.now()
      if (now - lastRequestTime.current < MIN_REQUEST_INTERVAL) {
        console.log("Rate limiting: esperando antes de hacer request de filtros")
        return
      }
      lastRequestTime.current = now

      // Crear AbortController para cancelar requests
      const abortController = new AbortController()

      const response = await fetch(`/api/admin/filter-options`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,
        // Timeout de 10 segundos
      })

      if (response.status === 429) {
        console.warn("Rate limit alcanzado para filtros, usando valores por defecto")
        return
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Validar estructura de datos
      if (data && typeof data === "object") {
        setFilterOptions({
          statuses: ["Todos", ...(Array.isArray(data.statuses) ? data.statuses : [])],
          types: ["Todos", ...(Array.isArray(data.types) ? data.types : [])],
          priorities: ["Todos", ...(Array.isArray(data.priorities) ? data.priorities : [])],
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request de filtros cancelado")
        return
      }
      console.error("Error al obtener opciones de filtros:", error)
      // Mantener opciones por defecto en caso de error
    }
  }, [isOnline])

  // Función mejorada para obtener datos de la API
  const fetchRequests = useCallback(
    async (page = 1, retryCount = 0) => {
      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController()

      try {
        setLoading(true)
        setError(null)

        if (!isOnline) {
          throw new Error("Sin conexión a internet. Verifica tu conexión y vuelve a intentar.")
        }

        const token = localStorage.getItem("accessToken")
        if (!token) {
          throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
        }

        // Rate limiting mejorado
        const now = Date.now()
        const timeSinceLastRequest = now - lastRequestTime.current
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
          console.log(`Rate limiting: esperando ${waitTime}ms antes del siguiente request`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
        lastRequestTime.current = Date.now()

        // Validar y sanitizar página
        const pageNumber = Math.max(1, Math.floor(Number(page)) || 1)
        console.log("Enviando solicitud con página:", pageNumber)

        // Verificar filtros activos
        const hasActiveFilters =
          (filters.dateFrom && filters.dateFrom.trim()) ||
          (filters.dateTo && filters.dateTo.trim()) ||
          (filters.status && filters.status !== "Todos") ||
          (filters.type && filters.type !== "Todos") ||
          (filters.priority && filters.priority !== "Todos") ||
          (filters.search && filters.search.trim())

        // Construir parámetros de URL
        const params = new URLSearchParams({
          page: hasActiveFilters ? "1" : pageNumber.toString(),
          limit: hasActiveFilters ? "-1" : Math.min(limit, 100).toString(), // Limitar máximo
        })

        // Agregar filtros con validación
        if (filters.dateFrom && filters.dateFrom.trim()) {
          // Validar formato de fecha
          const dateFrom = new Date(filters.dateFrom)
          if (!isNaN(dateFrom.getTime())) {
            params.append("dateFrom", filters.dateFrom)
          }
        }
        if (filters.dateTo && filters.dateTo.trim()) {
          const dateTo = new Date(filters.dateTo)
          if (!isNaN(dateTo.getTime())) {
            params.append("dateTo", filters.dateTo)
          }
        }
        if (filters.status && filters.status !== "Todos") {
          params.append("status", filters.status)
        }
        if (filters.type && filters.type !== "Todos") {
          params.append("type", filters.type)
        }
        if (filters.priority && filters.priority !== "Todos") {
          params.append("priority", filters.priority)
        }
        if (filters.search && filters.search.trim()) {
          // Sanitizar búsqueda
          const sanitizedSearch = filters.search.trim().substring(0, 100)
          params.append("search", sanitizedSearch)
        }

        // Agregar filtro de userType si el usuario es se_maintenance
        console.log('DEBUG: Current user data:', currentUser)
        if (currentUser?.userType === 'se_maintenance') {
          console.log('DEBUG: Agregando filtro userType=se_maintenance')
          params.append("userType", "se_maintenance")
        } else {
          console.log('DEBUG: Usuario no es se_maintenance, userType:', currentUser?.userType)
        }

        const url = `/api/admin/requests?${params.toString()}`
        console.log("URL con filtros:", url)

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortControllerRef.current.signal,
        })

        // Manejo específico del error 429 con backoff exponencial
        if (response.status === 429) {
          if (retryCount < 3) {
            const retryDelay = Math.pow(2, retryCount) * 2000
            console.warn(`Rate limit alcanzado. Reintentando en ${retryDelay}ms (intento ${retryCount + 1}/3)`)
            setRateLimitInfo(`Reintentando en ${retryDelay / 1000} segundos... (${retryCount + 1}/3)`)
            setError(null)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            setRateLimitInfo(null)
            return fetchRequests(page, retryCount + 1)
          } else {
            setRateLimitInfo(null)
            throw new Error(
              "El servidor está muy ocupado. Por favor, espera unos minutos antes de intentar nuevamente.",
            )
          }
        }

        // Manejo de otros errores HTTP
        if (response.status === 401) {
          localStorage.removeItem("accessToken")
          throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.")
        }

        if (response.status === 403) {
          throw new Error("No tienes permisos para acceder a esta información.")
        }

        if (response.status >= 500) {
          throw new Error("Error del servidor. Por favor, intenta más tarde.")
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const response_data = await response.json()

        // Validar estructura de respuesta
        if (!response_data || typeof response_data !== "object") {
          throw new Error("Respuesta inválida del servidor")
        }

        const data = Array.isArray(response_data.data) ? response_data.data : []

        // Validar y procesar paginación
        const responsePage = Math.max(1, Math.floor(Number(response_data.page)) || 1)
        const responseTotalPages = Math.max(1, Math.floor(Number(response_data.totalPages)) || 1)
        const responseTotal = Math.max(0, Math.floor(Number(response_data.total)) || 0)

        console.log("Respuesta del servidor - página:", response_data.page, "procesada como:", responsePage)

        if (hasActiveFilters) {
          setCurrentPage(pageNumber)
          const totalFilteredRequests = data.length
          setTotalRequests(totalFilteredRequests)
          setTotalPages(Math.ceil(totalFilteredRequests / limit))
        } else {
          setCurrentPage(responsePage)
          setTotalPages(responseTotalPages)
          setTotalRequests(responseTotal)
        }

        // Actualizar estadísticas globales con validación
        if (response_data.stats && typeof response_data.stats === "object") {
          setGlobalStats({
            total: Math.max(0, Math.floor(Number(response_data.stats.total)) || 0),
            pending: Math.max(0, Math.floor(Number(response_data.stats.pending)) || 0),
            approved: Math.max(0, Math.floor(Number(response_data.stats.approved)) || 0),
            rejected: Math.max(0, Math.floor(Number(response_data.stats.rejected)) || 0),
          })
        }

        // Extraer tipos únicos con validación
        const uniqueTypes = Array.from(
          new Set(
            data
              .map((item: any) => item?.type)
              .filter((type): type is string => typeof type === "string" && type.length > 0),
          )
        ) as string[]

        setFilterOptions((prev) => ({
          ...prev,
          types: ["Todos", ...uniqueTypes],
        }))

        // Transformar datos con validación exhaustiva
        const transformedData: RequestData[] = data
          .filter((item: any) => item && typeof item === "object" && item.id)
          .map((item: any) => {
            // Formatear fechas de manera segura
            let formattedDates = "N/A"
            try {
              if (item.dates && typeof item.dates === "string") {
                const dateArray = item.dates
                  .split(",")
                  .map((d: string) => d.trim())
                  .filter((d: string) => d && d.length > 0)

                if (dateArray.length > 0) {
                  const formattedDateArray = dateArray
                    .map((dateStr) => {
                      try {
                        const date = new Date(dateStr)
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        }
                        return dateStr
                      } catch {
                        return dateStr
                      }
                    })
                    .filter((date) => date && date.length > 0)

                  formattedDates = formattedDateArray.join(", ")
                } else {
                  formattedDates = item.dates.trim()
                }
              } else if (item.dates) {
                formattedDates = String(item.dates).trim()
              } else if (item.zona) {
                formattedDates = String(item.zona).trim()
              }
            } catch (error) {
              console.warn("Error al formatear fechas:", error, item.dates)
              formattedDates = item.dates ? String(item.dates).trim() : "N/A"
            }

            // Determinar tipo de solicitud
            const requestType = item.type && typeof item.type === "string" ? item.type.trim() : "Solicitud"

            // Calcular días de manera segura
            let calculatedDays = 1
            try {
              if (item.dates && typeof item.dates === "string") {
                const dateArray = item.dates
                  .split(",")
                  .map((d: string) => d.trim())
                  .filter((d: string) => d && d.length > 0)
                calculatedDays = Math.max(1, dateArray.length)
              } else if (Array.isArray(item.dates)) {
                calculatedDays = Math.max(1, item.dates.length)
              } else if (typeof item.days === "number" && item.days > 0) {
                calculatedDays = Math.floor(item.days)
              }
            } catch (error) {
              console.warn("Error al calcular días:", error)
              calculatedDays = 1
            }

            // Formatear fecha de solicitud
            let requestDate = "N/A"
            try {
              if (item.createdAt) {
                const date = new Date(item.createdAt)
                if (!isNaN(date.getTime())) {
                  requestDate = date.toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                }
              }
            } catch (error) {
              console.warn("Error al formatear fecha de solicitud:", error)
            }

            // Usar hora solicitada por el usuario (campo time del backend)
            let requestedTime = ""
            if (item.time && typeof item.time === "string") {
              requestedTime = item.time.trim()
            }

            // Formatear hora de envío para mostrar en la UI
            let submittedTime = "N/A"
            try {
              if (item.createdAt) {
                const date = new Date(item.createdAt)
                if (!isNaN(date.getTime())) {
                  submittedTime = date.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              }
            } catch (error) {
              console.warn("Error al formatear hora:", error)
            }

            // Determinar estado de manera segura
            let status = "Pendiente"
            if (typeof item.status === "string") {
              const statusLower = item.status.toLowerCase().trim()
              if (statusLower === "approved") {
                status = "Aprobado"
              } else if (statusLower === "rejected") {
                status = "Rechazado"
              }
            }

            return {
              id: String(item.id || Math.random()),
              userName:
                item.name && typeof item.name === "string"
                  ? item.name.trim() || "Usuario Desconocido"
                  : "Usuario Desconocido",
              userCode: item.code && typeof item.code === "string" ? item.code.trim() || "N/A" : "N/A",
              userAvatar: item.password && typeof item.password === "string" ? item.password.trim() || "N/A" : "N/A",
              requestType,
              requestDate,
              requestedDates: formattedDates,
              status,
              days: calculatedDays,
              submittedTime,
              requestedTime,
              department: "General", // Valor por defecto
              priority: status === "Pendiente" ? "Alta" : "Media",
              reason: item.reason && typeof item.reason === "string" ? item.reason.trim() : "",
              description: item.description && typeof item.description === "string" ? item.description.trim() : "",
              createdAt: item.createdAt || null,
            }
          })

        // Manejar paginación
        if (hasActiveFilters) {
          setAllFilteredRequests(transformedData)
          const startIndex = (pageNumber - 1) * limit
          const endIndex = startIndex + limit
          const paginatedData = transformedData.slice(startIndex, endIndex)
          setRequests(paginatedData)
        } else {
          setRequests(transformedData)
          setAllFilteredRequests([])
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("Request cancelado")
          return
        }

        console.error("Error fetching requests:", err)
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar los datos"
        setError(errorMessage)
        setRateLimitInfo(null)

        // En caso de error, mantener datos existentes si los hay
        if (requests.length === 0) {
          setRequests([])
          setAllFilteredRequests([])
        }
      } finally {
        setLoading(false)
      }
    },
    [filters, limit, isOnline, requests.length, currentUser],
  )

  // Función para manejar paginación en frontend cuando hay filtros
  const handleFilteredPagination = useCallback(
    (page: number) => {
      if (allFilteredRequests.length > 0) {
        const validPage = Math.max(1, Math.min(page, Math.ceil(allFilteredRequests.length / limit)))
        const startIndex = (validPage - 1) * limit
        const endIndex = startIndex + limit
        const paginatedData = allFilteredRequests.slice(startIndex, endIndex)
        setRequests(paginatedData)
        setCurrentPage(validPage)
      }
    },
    [allFilteredRequests, limit],
  )

  // Función debounced mejorada para fetchRequests
  const debouncedFetchRequests = useCallback(
    (page = 1) => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
      }

      requestTimeoutRef.current = setTimeout(() => {
        const validPage = Math.max(1, Math.floor(Number(page)) || 1)
        fetchRequests(validPage)
      }, 300)
    },
    [fetchRequests],
  )

  // Inicialización mejorada del componente
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      console.log("Inicializando dashboard...")

      // Cargar opciones de filtros primero
      fetchFilterOptions()

      // Luego cargar datos con un pequeño delay
      const initTimeout = setTimeout(() => {
        fetchRequests(1)
      }, 500)

      return () => clearTimeout(initTimeout)
    }
  }, [fetchFilterOptions, fetchRequests])

  // Manejar cambios de página con validación
  useEffect(() => {
    if (isInitialized.current && currentPage > 1) {
      const hasActiveFilters =
        (filters.dateFrom && filters.dateFrom.trim()) ||
        (filters.dateTo && filters.dateTo.trim()) ||
        (filters.status && filters.status !== "Todos") ||
        (filters.type && filters.type !== "Todos") ||
        (filters.priority && filters.priority !== "Todos") ||
        (filters.search && filters.search.trim())

      if (hasActiveFilters && allFilteredRequests.length > 0) {
        handleFilteredPagination(currentPage)
      } else {
        debouncedFetchRequests(currentPage)
      }
    }
  }, [currentPage, debouncedFetchRequests, handleFilteredPagination, allFilteredRequests.length, filters])

  // Manejar cambios de filtros con debounce mejorado
  useEffect(() => {
    if (isInitialized.current) {
      console.log("Filtros cambiaron, reseteando página y recargando datos")
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        debouncedFetchRequests(1)
      }
    }
  }, [filters, debouncedFetchRequests, currentPage])

  // Cleanup mejorado de timeouts y requests
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Cálculos de estadísticas con validación
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((req) => req.status === "Pendiente").length
    const approved = requests.filter((req) => req.status === "Aprobado").length
    const rejected = requests.filter((req) => req.status === "Rechazado").length
    return { total, pending, approved, rejected }
  }, [requests])

  // Función mejorada para configuración de estado
  const getStatusConfig = (status: string) => {
    const configs = {
      Pendiente: {
        bg: "bg-gradient-to-r from-amber-50 to-orange-50",
        text: "text-amber-800",
        border: "border-amber-200",
        icon: Hourglass,
        dot: "bg-amber-400",
      },
      Aprobado: {
        bg: "bg-gradient-to-r from-green-50 to-emerald-50",
        text: "text-green-800",
        border: "border-green-200",
        icon: CheckCircle,
        dot: "bg-green-400",
      },
      Rechazado: {
        bg: "bg-gradient-to-r from-red-50 to-rose-50",
        text: "text-red-800",
        border: "border-red-200",
        icon: XCircle,
        dot: "bg-red-400",
      },
    }
    return configs[status as keyof typeof configs] || configs["Pendiente"]
  }

  // Tarjetas de resumen con datos dinámicos
  const summaryCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total de Solicitudes",
        value: globalStats.total,
        icon: ClipboardList,
        gradient: "from-green-500 to-green-600",
        bgGradient: "from-green-50 to-green-100",
        description: "Solicitudes registradas",
      },
      {
        id: "pending",
        title: "Pendientes",
        value: globalStats.pending,
        icon: Hourglass,
        gradient: "from-amber-500 to-amber-600",
        bgGradient: "from-amber-50 to-amber-100",
        description: "Requieren revisión",
      },
      {
        id: "approved",
        title: "Aprobadas",
        value: globalStats.approved,
        icon: CheckCircle,
        gradient: "from-emerald-500 to-emerald-600",
        bgGradient: "from-emerald-50 to-emerald-100",
        description: "Confirmadas",
      },
      {
        id: "rejected",
        title: "Rechazadas",
        value: globalStats.rejected,
        icon: XCircle,
        gradient: "from-red-500 to-red-600",
        bgGradient: "from-red-50 to-red-100",
        description: "No aprobadas",
      },
    ],
    [globalStats],
  )

  // Filtrado local mejorado con validación
  const filteredRequests = useMemo(() => {
    console.log("=== FILTRADO LOCAL (solo búsqueda) ===")
    console.log("Total requests from backend:", requests.length)
    console.log("Search term:", searchTerm)

    if (!searchTerm || searchTerm.trim().length === 0) {
      console.log("No search term, returning all requests")
      return requests
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const filtered = requests.filter((request) => {
      try {
        return [
          request.userName || "",
          request.userCode || "",
          request.requestType || "",
          request.requestedDates || "",
          request.description || "",
        ].some((field) => typeof field === "string" && field.toLowerCase().includes(searchLower))
      } catch (error) {
        console.warn("Error al filtrar request:", error, request)
        return false
      }
    })

    console.log("Requests filtrados:", filtered.length)
    return filtered
  }, [searchTerm, requests])

  // Función para manejar la selección de una solicitud y mostrar sus detalles
  const handleSelectRequest = useCallback((request: RequestData) => {
    setSelectedRequest(request)
    setShowRequestDetails(true)
  }, [])

  // Función para cerrar el modal de detalles
  const handleCloseRequestDetails = useCallback(() => {
    setShowRequestDetails(false)
    setSelectedRequest(null)
  }, [])

  // Función para manejar acciones en el modal de detalles
  const handleRequestAction = useCallback((id: string, action: "approve" | "reject", reason: string) => {
    console.log(`Acción ${action} para solicitud ${id} con razón: ${reason}`)
    // Aquí puedes implementar la lógica para aprobar o rechazar solicitudes
    // Por ejemplo, hacer una llamada a la API

    // Después de la acción, cerrar el modal y refrescar los datos
    setShowRequestDetails(false)
    setSelectedRequest(null)
    fetchRequests(currentPage)
  }, [currentPage])

  // Función mejorada para actualizar filtros con validación
  const updateFilter = useCallback((key: string, value: string) => {
    if (typeof key !== "string" || typeof value !== "string") {
      console.warn("Parámetros inválidos para updateFilter:", key, value)
      return
    }

    setFilters((prev) => {
      // Validaciones específicas por tipo de filtro
      let validatedValue = value

      if (key === "dateFrom" || key === "dateTo") {
        // Validar formato de fecha
        if (value && value.trim()) {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            console.warn("Fecha inválida:", value)
            return prev
          }
        }
      }

      if (key === "daysMin" || key === "daysMax") {
        // Validar números
        if (value && value.trim()) {
          const num = Number(value)
          if (isNaN(num) || num < 0) {
            console.warn("Número inválido:", value)
            return prev
          }
          validatedValue = Math.floor(num).toString()
        }
      }

      if (key === "search") {
        // Limitar longitud de búsqueda
        validatedValue = value.substring(0, 100)
      }

      return { ...prev, [key]: validatedValue }
    })
  }, [])

  // Función mejorada para limpiar filtros
  const clearAllFilters = useCallback(() => {
    setFilters({
      status: "Todos",
      type: "Todos",
      priority: "Todos",
      dateFrom: "",
      dateTo: "",
      daysMin: "",
      daysMax: "",
      search: "",
    })
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  // Función mejorada para formatear fechas
  const formatDisplayDates = useCallback((dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A"

    try {
      const dates = dateString
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d && d !== "N/A")

      return dates
        .map((dateStr) => {
          try {
            const dateWithTime = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`
            const date = new Date(dateWithTime)

            if (!isNaN(date.getTime())) {
              return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
            }
            return dateStr
          } catch {
            return dateStr
          }
        })
        .filter((date) => date && date.length > 0)
        .join(", ")
    } catch (error) {
      console.error("Error al formatear fechas:", error, dateString)
      return dateString
    }
  }, [])

  // Calcular filtros activos de manera más precisa
  const activeFiltersCount = useMemo(() => {
    let count = 0

    if (filters.status !== "Todos") count++
    if (filters.type !== "Todos") count++
    if (filters.priority !== "Todos") count++

    if (filters.daysMin && filters.daysMin.trim() !== "") count++
    if (filters.daysMax && filters.daysMax.trim() !== "") count++
    if (filters.dateFrom && filters.dateFrom.trim() !== "") count++
    if (filters.dateTo && filters.dateTo.trim() !== "") count++

    if (searchTerm && searchTerm.trim() !== "") count++

    return count
  }, [filters, searchTerm])

  // Función mejorada para exportar a Excel
  const exportToExcel = useCallback(() => {
    try {
      const dataToExport = (allFilteredRequests.length > 0 ? allFilteredRequests : filteredRequests).map((req) => {
        let fechaSolicitud = req.requestDate || "N/A"

        if (fechaSolicitud === "N/A" && req.createdAt) {
          try {
            const dateWithTime = req.createdAt.includes("T") ? req.createdAt : `${req.createdAt}T00:00:00`
            const date = new Date(dateWithTime)
            if (!isNaN(date.getTime())) {
              fechaSolicitud = `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
            }
          } catch (error) {
            console.error("Error al formatear fecha de solicitud:", error, req.createdAt)
          }
        }


        return {
          ID: req.id || "N/A",
          Nombre: req.userName || "N/A",
          Código: req.userCode || "N/A",
          Tipo: req.requestType || "N/A",
          Descripción: req.description || "Sin descripción",
          Fecha: fechaSolicitud,
          "Fechas Solicitadas": formatDisplayDates(req.requestedDates),
          Días: req.days || 0,
          Hora: req.requestedTime || "",
          Estado: req.status || "N/A",
          Respuesta: req.reason || "Sin respuesta",
        }
      })

      if (dataToExport.length === 0) {
        alert("No hay datos para exportar.")
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitudes")

      // Estilos mejorados
      const headerStyle = {
        fill: { fgColor: { rgb: "FF2E7D32" } },
        font: { color: { rgb: "FFFFFFFF" }, bold: true, sz: 12 },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "FF1B5E20" } },
          bottom: { style: "thin", color: { rgb: "FF1B5E20" } },
          left: { style: "thin", color: { rgb: "FF1B5E20" } },
          right: { style: "thin", color: { rgb: "FF1B5E20" } },
        },
      }

      const evenRowStyle = {
        fill: { fgColor: { rgb: "FFE8F5E9" } },
        font: { sz: 11 },
        alignment: {
          vertical: "center",
          wrapText: true,
        },
      }

      const oddRowStyle = {
        fill: { fgColor: { rgb: "FFFFFFFF" } },
        font: { sz: 11 },
        alignment: {
          vertical: "center",
          wrapText: true,
        },
      }

      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

      // Aplicar estilos
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1"
        if (worksheet[address]) {
          worksheet[address].s = headerStyle
        }
      }

      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const rowStyle = R % 2 === 0 ? evenRowStyle : oddRowStyle
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C })
          if (!worksheet[address]) {
            worksheet[address] = { t: "s", v: "" }
          }
          worksheet[address].s = rowStyle
        }
      }

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 10 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 50 },
        { wch: 15 },
        { wch: 30 },
        { wch: 8 },
        { wch: 10 },
        { wch: 15 },
        { wch: 30 },
      ]
      worksheet["!cols"] = columnWidths

      // Ajustar alto de filas
      worksheet["!rows"] = [{ hpt: 25 }]
      for (let i = 0; i < dataToExport.length; i++) {
        worksheet["!rows"].push({ hpt: 20 })
      }

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `Solicitudes_${timestamp}.xlsx`

      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error("Error al exportar Excel:", error)
      alert("Error al exportar los datos. Por favor, intenta nuevamente.")
    }
  }, [allFilteredRequests, filteredRequests, formatDisplayDates])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 text-gray-900 p-2 sm:p-4 lg:p-6 relative overflow-hidden"
      style={{ scrollBehavior: "auto" }}
    >
      {/* Elementos decorativos de fondo mejorados */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-green-100/30 to-emerald-200/30 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[250px] sm:w-[350px] lg:w-[400px] h-[250px] sm:h-[350px] lg:h-[400px] bg-gradient-to-tr from-green-200/20 to-white/40 rounded-full blur-3xl animate-float-reverse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] bg-gradient-to-r from-emerald-100/20 to-green-100/20 rounded-full blur-3xl animate-pulse-slow"></div>

      {/* Indicador de conexión */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2"
        >
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">Sin conexión a internet</span>
        </motion.div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Mejorado y Responsive */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 sm:mb-8 space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <motion.div
                className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl sm:rounded-3xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Sistema de Gestión
                </h1>
                <p className="text-base sm:text-lg text-gray-600 font-medium">
                  Control profesional y seguimiento inteligente de solicitudes empresariales
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => debouncedFetchRequests(currentPage)}
                disabled={loading || !isOnline}
                className="flex items-center justify-center px-4 sm:px-6 py-3 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-green-300 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{loading ? "Actualizando..." : "Actualizar"}</span>
                <span className="sm:hidden">{loading ? "..." : "Actualizar"}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToExcel}
                disabled={filteredRequests.length === 0}
                className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Excel</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tarjetas de Resumen Mejoradas y Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3 + index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3 },
              }}
              className={`bg-gradient-to-br ${card.bgGradient} border-2 border-white/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-white/20 rounded-full -translate-y-8 sm:-translate-y-10 lg:-translate-y-12 translate-x-8 sm:translate-x-10 lg:translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute bottom-0 left-0 w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-white/10 rounded-full translate-y-6 sm:translate-y-7 lg:translate-y-8 -translate-x-6 sm:-translate-x-7 lg:-translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>

              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <motion.div
                    className={`p-2 sm:p-3 bg-gradient-to-br ${card.gradient} rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                  <div className="text-right">
                    <div className="flex items-center text-xs sm:text-sm font-bold text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded-full">
                      <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      +0%
                    </div>
                  </div>
                </div>
                <div>
                  <motion.h3
                    className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-1"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {card.value}
                  </motion.h3>
                  <p className="text-sm sm:text-base font-bold text-gray-700 mb-1">{card.title}</p>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">{card.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Barra de Búsqueda y Filtros Mejorada y Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-gray-200/50 shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"></div>
          <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:space-x-8">
            {/* Búsqueda Mejorada y Responsive */}
            <div className="relative flex-1 w-full lg:max-w-lg group">
              <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-green-500 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength={100}
                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-gray-50/50 focus:bg-white text-sm sm:text-base font-medium placeholder-gray-400"
              />
              <motion.div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Botones de Filtros Mejorados y Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('🔍 Filter button clicked, current state:', isFilterModalOpen)
                  setIsFilterModalOpen(!isFilterModalOpen)
                  console.log('🔍 Filter modal toggled to:', !isFilterModalOpen)
                }}
                className={`relative flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl transition-all font-bold text-sm sm:text-base shadow-lg ${activeFiltersCount > 0
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-green-500/25"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-green-300"
                  }`}
              >
                <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">Filtros Avanzados</span>
                <span className="sm:hidden">Filtros</span>
                {activeFiltersCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </motion.div>
                )}
              </motion.button>
              {activeFiltersCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFilters}
                  className="flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl sm:rounded-2xl hover:bg-red-100 transition-all font-bold"
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Limpiar
                </motion.button>
              )}
            </div>
          </div>

          {/* Información de resultados mejorada y responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-6 border-t-2 border-gray-100 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center text-base sm:text-lg font-bold text-gray-700">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                Resultados: {filteredRequests.length}
              </div>
              {activeFiltersCount > 0 && (
                <div className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo
                  {activeFiltersCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 font-medium">
              <span className="hidden sm:inline">Última actualización: </span>
              {new Date().toLocaleString("es-ES")}
            </div>
          </div>
        </motion.div>

        {/* Tabla Mejorada y Completamente Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-gray-200/50 shadow-2xl overflow-hidden"
        >
          {/* Estado de conexión */}
          {!isOnline && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WifiOff className="h-5 w-5 text-orange-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700 font-medium">
                    <strong>Sin conexión:</strong> Mostrando datos guardados localmente
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Los datos pueden no estar actualizados. Verifica tu conexión a internet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de rate limiting */}
          {rateLimitInfo && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 font-medium">
                    <strong>Rate Limit:</strong> {rateLimitInfo}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    El servidor está limitando las solicitudes. Reintentando automáticamente...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de carga */}
          {loading && !rateLimitInfo && (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-base sm:text-lg font-semibold text-gray-600">Cargando solicitudes...</p>
              </div>
            </div>
          )}

          {/* Estado de error */}
          {error && !loading && (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center max-w-md px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Error al cargar datos</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setError(null)
                    debouncedFetchRequests(currentPage)
                  }}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
                >
                  Reintentar
                </motion.button>
              </div>
            </div>
          )}

          {/* Estado sin datos */}
          {!loading && !error && requests.length === 0 && (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No hay solicitudes</h3>
                <p className="text-sm sm:text-base text-gray-600">No se encontraron solicitudes en el sistema.</p>
              </div>
            </div>
          )}

          {/* Tabla con datos - Completamente Responsive */}
          {!loading && !error && requests.length > 0 && (
            <>
              {/* Vista de tabla para pantallas grandes */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Tipo de Solicitud
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Fechas Solicitadas
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-black text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100">
                    <AnimatePresence>
                      {filteredRequests.map((request, index) => {
                        const statusConfig = getStatusConfig(request.status)
                        return (
                          <motion.tr
                            key={request.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            whileHover={{
                              backgroundColor: "rgba(34, 197, 94, 0.05)",
                              transition: { duration: 0.2 },
                            }}
                            onClick={() => handleSelectRequest(request)}
                            className="group cursor-pointer"
                          >
                            {/* Empleado */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div className="flex items-center space-x-5">
                                <motion.div
                                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden border-2 border-green-200 shadow-lg group-hover:border-green-400 transition-colors duration-300"
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <UserAvatar
                                    cedula={request.userAvatar}
                                    alt={request.userName}
                                    className="h-full w-full object-cover rounded-xl"
                                    defaultAvatar=""
                                  />
                                </motion.div>
                                <div>
                                  <div className="font-bold text-gray-900 text-lg mb-1">{request.userName}</div>
                                  <div className="text-sm text-gray-500 flex items-center font-medium">
                                    <Tag className="h-4 w-4 mr-2" />
                                    {request.userCode}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Tipo de Solicitud */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div>
                                <div className="font-bold text-gray-900 text-lg mb-2">{request.requestType}</div>
                                <div className="text-sm text-gray-500 flex items-center mb-1 font-medium">
                                  <Clock className="h-4 w-4 mr-2" />
                                  {request.requestDate} - {request.submittedTime}
                                </div>
                                <div className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full inline-block">
                                  {request.days} día{request.days !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </td>

                            {/* Fechas Solicitadas */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div className="flex items-center text-lg font-bold text-gray-700">
                                <CalendarDays className="h-6 w-6 mr-3 text-green-600" />
                                <div className="flex flex-wrap gap-1">
                                  {formatDisplayDates(request.requestedDates)
                                    .split(", ")
                                    .map((date, index) => (
                                      <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-green-100 text-green-700 text-sm rounded-lg border border-green-200 font-medium"
                                      >
                                        {date}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </td>

                            {/* Descripción */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <div className="max-w-xs">
                                {request.description ? (
                                  <div
                                    className={`p-3 rounded-lg text-sm font-medium ${statusConfig.bg} ${statusConfig.text} border-l-4 ${statusConfig.border}`}
                                  >
                                    {request.description}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 italic text-sm">Sin descripción</div>
                                )}
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="px-4 sm:px-6 py-4 sm:py-5">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border-2 shadow-lg`}
                              >
                                <motion.div
                                  className={`w-3 h-3 ${statusConfig.dot} rounded-full mr-3`}
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                />
                                {request.status}
                              </motion.div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Vista de tarjetas para pantallas medianas y pequeñas */}
              <div className="lg:hidden space-y-4 p-4 sm:p-6">
                <AnimatePresence>
                  {filteredRequests.map((request, index) => {
                    const statusConfig = getStatusConfig(request.status)
                    return (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{
                          scale: 1.02,
                          transition: { duration: 0.2 },
                        }}
                        onClick={() => handleSelectRequest(request)}
                        className="bg-white rounded-xl border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-3 sm:p-4 space-y-3 cursor-pointer"
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden border-2 border-green-200 shadow-md"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.3 }}
                            >
                              <UserAvatar
                                cedula={request.userAvatar}
                                alt={request.userName}
                                className="h-full w-full object-cover rounded-xl"
                                defaultAvatar=""
                              />
                            </motion.div>
                            <div>
                              <div className="font-bold text-gray-900 text-base sm:text-lg">{request.userName}</div>
                              <div className="text-sm text-gray-500 flex items-center font-medium">
                                <Tag className="h-3 w-3 mr-1" />
                                {request.userCode}
                              </div>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border shadow-md`}
                          >
                            <motion.div
                              className={`w-2 h-2 ${statusConfig.dot} rounded-full mr-2`}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            />
                            {request.status}
                          </motion.div>
                        </div>

                        {/* Información de la solicitud */}
                        <div className="space-y-3">
                          <div>
                            <div className="font-bold text-gray-900 text-base mb-1">{request.requestType}</div>
                            <div className="text-sm text-gray-500 flex items-center mb-2 font-medium">
                              <Clock className="h-3 w-3 mr-1" />
                              {request.requestDate} - {request.submittedTime}
                            </div>
                            <div className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-lg inline-block">
                              {request.days} día{request.days !== 1 ? "s" : ""}
                            </div>
                          </div>

                          {/* Fechas solicitadas */}
                          <div>
                            <div className="flex items-center text-sm font-bold text-gray-700 mb-2">
                              <CalendarDays className="h-4 w-4 mr-2 text-green-600" />
                              Fechas Solicitadas:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {formatDisplayDates(request.requestedDates)
                                .split(", ")
                                .map((date, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200 font-medium"
                                  >
                                    {date}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Descripción */}
                          {request.description && (
                            <div>
                              <div className="text-sm font-bold text-gray-700 mb-1">Descripción:</div>
                              <div
                                className={`p-3 rounded-lg text-sm font-medium ${statusConfig.bg} ${statusConfig.text} border-l-4 ${statusConfig.border}`}
                              >
                                {request.description}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Información de Paginación y Controles - Responsive */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg p-4 sm:p-6 mt-6"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center text-sm sm:text-base lg:text-lg font-bold text-gray-700">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                    <span className="hidden sm:inline">Mostrando </span>
                    {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRequests)} de {totalRequests}
                    <span className="hidden sm:inline"> solicitudes</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <div className="text-xs sm:text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                      {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo
                      {activeFiltersCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Controles de paginación responsive */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">Ant</span>
                  </motion.button>

                  <div className="px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base">
                    <span className="hidden sm:inline">Página </span>
                    {currentPage} / {totalPages}
                  </div>

                  <motion.button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="sm:hidden">Sig</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Modal de Filtros Profesional Mejorado - COMPLETAMENTE RESPONSIVE */}
      {isFilterModalOpen && createPortal(
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
          }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsFilterModalOpen(false)}
            style={{ zIndex: 99998 }}
          />

          {/* Modal Container - Centrado en viewport visible y responsive */}
          <div className="flex min-h-screen items-center justify-center p-2 sm:p-4" style={{ zIndex: 99999 }}>
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{
                duration: 0.4,
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 z-10 my-2 sm:my-4"
              onClick={(e) => e.stopPropagation()}
              style={{ zIndex: 100000 }}
            >
              {/* Header Profesional Responsive */}
              <div className="relative bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 px-4 sm:px-6 py-4 sm:py-6 text-white overflow-hidden">
                {/* Patrón de fondo sutil */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fillRule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fillOpacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-6">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="p-2 sm:p-3 lg:p-4 bg-white/15 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20"
                    >
                      <SlidersHorizontal className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2">Centro de Filtros</h2>
                      <p className="text-green-100 text-sm sm:text-base lg:text-lg font-medium opacity-90">
                        <span className="hidden sm:inline">
                          Herramientas profesionales para análisis de datos precisos
                        </span>
                        <span className="sm:hidden">Filtros avanzados</span>
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFilterModalOpen(false)}
                    className="p-2 sm:p-3 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20"
                  >
                    <X className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                  </motion.button>
                </div>
              </div>

              {/* Contenido Principal Responsive */}
              <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(90vh-140px)] bg-gradient-to-br from-gray-50/50 to-white">
                {/* Barra de Progreso de Filtros Responsive */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border-2 border-gray-100 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Estado de Filtros</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-600">{activeFiltersCount} filtros activos</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((activeFiltersCount / 8) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Resultados encontrados:{" "}
                    <span className="font-bold text-green-600">{filteredRequests.length}</span> de {requests.length}{" "}
                    solicitudes
                  </p>
                </motion.div>

                {/* Grid de Filtros Completamente Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Columna 1: Filtros Básicos */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3 sm:mr-4"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filtros Básicos</h3>
                      </div>
                      {/* Estado Mejorado y Responsive */}
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Estado de Solicitud
                        </label>
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                          {filterOptions.statuses.map((status) => (
                            <motion.button
                              key={status}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => updateFilter("status", status)}
                              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 text-left font-medium text-sm sm:text-base ${filters.status === status
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-green-300"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{status}</span>
                                {filters.status === status && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-white rounded-full"
                                  />
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      {/* Tipo de Solicitud Mejorado y Responsive */}
                      <div className="space-y-3 sm:space-y-4">
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Tipo de Solicitud
                        </label>
                        <div className="relative">
                          <select
                            value={filters.type}
                            onChange={(e) => updateFilter("type", e.target.value)}
                            className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-gray-50 font-medium text-sm sm:text-base lg:text-lg appearance-none hover:bg-white"
                          >
                            {filterOptions.types.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Columna 3: Filtros de Rango */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3 sm:mr-4"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filtros de Rango</h3>
                      </div>
                      {/* Rango de Fechas Mejorado y Responsive */}
                      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                          Rango de Fechas
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          <div className="relative">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Fecha Desde</label>
                            <Calendar className="absolute left-3 top-10 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <input
                              type="date"
                              value={filters.dateFrom}
                              onChange={(e) => updateFilter("dateFrom", e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-gray-50 font-medium text-sm sm:text-base"
                            />
                          </div>
                          <div className="relative">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Fecha Hasta</label>
                            <Calendar className="absolute left-3 top-10 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <input
                              type="date"
                              value={filters.dateTo}
                              onChange={(e) => updateFilter("dateTo", e.target.value)}
                              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-gray-50 font-medium text-sm sm:text-base"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Resumen de Filtros Activos Responsive */}
                {activeFiltersCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                      <h4 className="text-lg sm:text-xl font-bold text-green-800 flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                        Filtros Activos ({activeFiltersCount})
                      </h4>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearAllFilters}
                        className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                      >
                        Limpiar Todo
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {Object.entries(filters).map(([key, value]) => {
                        if (value && value !== "Todos") {
                          const keyLabels: { [key: string]: string } = {
                            status: "Estado",
                            type: "Tipo",
                            department: "Departamento",
                            priority: "Prioridad",
                            dateFrom: "Desde",
                            dateTo: "Hasta",
                            daysMin: "Días mín",
                            daysMax: "Días máx",
                          }
                          return (
                            <motion.div
                              key={key}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center bg-white text-green-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold border-2 border-green-200 shadow-sm"
                            >
                              <span className="mr-2">
                                {keyLabels[key]}: <span className="text-green-600">{value}</span>
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.2, backgroundColor: "#ef4444" }}
                                onClick={() =>
                                  updateFilter(key, key.includes("date") || key.includes("days") ? "" : "Todos")
                                }
                                className="hover:bg-red-500 hover:text-white rounded-full p-1 transition-all duration-200"
                              >
                                <X className="h-2 w-2 sm:h-3 sm:w-3" />
                              </motion.button>
                            </motion.div>
                          )
                        }
                        return null
                      })}
                      {searchTerm && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center bg-white text-green-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold border-2 border-green-200 shadow-sm"
                        >
                          <span className="mr-2">
                            Búsqueda: <span className="text-green-600">{searchTerm}</span>
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2, backgroundColor: "#ef4444" }}
                            onClick={() => setSearchTerm("")}
                            className="hover:bg-red-500 hover:text-white rounded-full p-1 transition-all duration-200"
                          >
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Botones de Acción Responsive */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 mt-6 sm:mt-8 border-t-2 border-gray-200 space-y-4 sm:space-y-0"
                >
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-lg sm:text-xl font-bold text-gray-800">
                      <span className="text-green-600">{filteredRequests.length}</span> de {requests.length}{" "}
                      <span className="hidden sm:inline">solicitudes</span>
                    </div>
                    <div className="h-0 sm:h-6 w-full sm:w-px bg-gray-300"></div>
                    <div className="text-sm text-gray-500">
                      {requests.length > 0 ? ((filteredRequests.length / requests.length) * 100).toFixed(1) : 0}% del
                      total
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearAllFilters}
                      className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all font-bold text-base sm:text-lg shadow-lg"
                    >
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" />
                      Restablecer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsFilterModalOpen(false)}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all font-bold text-base sm:text-lg shadow-xl"
                    >
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" />
                      Aplicar Filtros
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
          }
        @keyframes float-reverse {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-180deg);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animate-float {
          animation: float 25s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 30s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
        
        /* Estilos para asegurar que el modal esté por encima de todo */
        .modal-overlay {
          z-index: 99999 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        
        /* Asegurar que ningún elemento tenga z-index mayor */
        body > * {
          position: relative;
        }
        
        body > *:not([class*="z-[99"]) {
          z-index: auto;
        }
      `}</style>

      {/* Modal de detalles de solicitud */}
      <AnimatePresence>
        {showRequestDetails && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <button
                onClick={handleCloseRequestDetails}
                className="absolute right-4 top-4 z-10 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              <RequestDetails
                request={{
                  ...selectedRequest,
                  code: selectedRequest.userCode,
                  name: selectedRequest.userName,
                  type: selectedRequest.requestType,
                  time: selectedRequest.requestedTime || selectedRequest.submittedTime,
                  createdAt: selectedRequest.createdAt || new Date().toISOString()
                }}
                onClose={handleCloseRequestDetails}
                onAction={handleRequestAction}
                onPrevRequest={() => console.log('Anterior solicitud')}
                onNextRequest={() => console.log('Siguiente solicitud')}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

