"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { FileText, Laptop, Filter, ChevronLeft, ChevronRight, Clock, Trash2, Calendar } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RequestDetails from "../../components/request-details"
import { fetchRequests, updateRequestStatus, deleteRequest } from "../utils/api"
import "./permits-management.css"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { motion, AnimatePresence } from "framer-motion"
import { groupBy } from "lodash"
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

type Request = {
  id: string
  code: string
  name: string
  type: string
  status: string
  createdAt: string
  description?: string
  zona?: string
  codeAM?: string
  codePM?: string
  shift?: string
  noveltyType?: string
  reason?: string
  dates?: string | string[]
  [key: string]: string | string[] | undefined
}

type GroupedRequests = {
  [key: string]: Request[]
}

type RequestStats = {
  total: number
  approved: number
  pending: number
  rejected: number
  permits: {
    total: number
    pending: number
    rejected: number
    descanso: number
    citaMedica: number
    audiencia: number
    licencia: number
    diaAM: number
    diaPM: number
  }
  postulations: {
    total: number
    pending: number
    rejected: number
    turnoPareja: number
    tablaPartida: number
    disponibleFijo: number
  }
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="loading-spinner"></div>
  </div>
)

const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <div className={`p-4 rounded-lg ${color}`}>
    <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
  </div>
)

const DetailedStatCard = ({
  title,
  stats,
  color,
}: { title: string; stats: { [key: string]: number }; color: string }) => (
  <div className={`p-4 rounded-lg ${color}`}>
    <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
    {Object.entries(stats).map(([key, value]) => (
      <div key={key} className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{key}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
    ))}
  </div>
)

// Define the WeeklyStatsDisplayProps type
type WeeklyStatsDisplayProps = {
  requests: Request[]
}

// Modificar el componente WeeklyStatsDisplay para mostrar detalles de las solicitudes por día
const WeeklyStatsDisplay = ({ requests }: WeeklyStatsDisplayProps) => {
  const [weekOffset, setWeekOffset] = useState(0)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  // Función para obtener el primer día de la semana (lunes)
  const getFirstDayOfWeek = (offset = 0) => {
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // Convertir domingo (0) a 7
    const diff = today.getDate() - dayOfWeek + 1 // Ajustar al lunes

    const firstDay = new Date(today)
    firstDay.setDate(diff + offset * 7)
    return firstDay
  }

  // Generar datos de la semana
  const generateWeekData = () => {
    const firstDay = getFirstDayOfWeek(weekOffset)
    const days = []
    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    // Crear un mapa para agrupar solicitudes por fecha
    const requestsByDate: Record<string, Request[]> = {}

    // Procesar cada solicitud para agrupar por fecha
    requests.forEach((request) => {
      // Comprobar si hay fechas en el request
      if (request.dates) {
        // Convertir fechas de string a array si es necesario
        const datesArray = typeof request.dates === "string" ? request.dates.split(",") : request.dates

        // Normalizar y agrupar cada fecha
        datesArray.forEach((dateStr: string) => {
          const dateKey = dateStr.trim()
          if (dateKey) {
            if (!requestsByDate[dateKey]) {
              requestsByDate[dateKey] = []
            }
            requestsByDate[dateKey].push(request)
          }
        })
      }
    })

    // Generar datos para cada día de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay)
      date.setDate(firstDay.getDate() + i)

      // Formatear fecha como YYYY-MM-DD para comparar con los datos
      const dateKey = date.toISOString().split("T")[0]
      const dayRequests = requestsByDate[dateKey] || []

      days.push({
        day: String(date.getDate()).padStart(2, "0"),
        date: date,
        dayName: dayNames[i],
        count: dayRequests.length,
        requests: dayRequests,
        dateKey: dateKey,
      })
    }

    return days
  }

  const weekData = generateWeekData()

  // Obtener el rango de fechas para el título
  const getDateRangeText = () => {
    if (weekData.length === 0) return ""

    const firstDate = weekData[0].date
    const lastDate = weekData[6].date

    const formatDate = (date: Date) => {
      return `${date.getDate()} ${date.toLocaleString("es", { month: "short" })}`
    }

    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
  }

  // Obtener color de fondo según el conteo
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-gray-50 text-gray-500"
    if (count < 3) return "bg-blue-50 text-blue-700"
    if (count < 5) return "bg-amber-50 text-amber-700"
    return "bg-rose-50 text-rose-700"
  }

  // Manejar clic en un día para expandir/contraer detalles
  const handleDayClick = (dateKey: string) => {
    if (expandedDay === dateKey) {
      setExpandedDay(null)
    } else {
      setExpandedDay(dateKey)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm font-medium">
          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
          {getDateRangeText()}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev - 1)} className="h-8 px-2">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)} className="h-8 px-2">
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        <AnimatePresence mode="wait">
          {weekData.map((dayData, index) => (
            <motion.div
              key={dayData.dayName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <p className="text-xs font-medium text-gray-500 mb-1">{dayData.dayName}</p>
              <div
                className={`w-full rounded-lg p-3 flex flex-col items-center shadow-sm ${getColorClass(dayData.count)} ${
                  dayData.count > 0 ? "cursor-pointer hover:shadow-md transition-shadow" : ""
                }`}
                onClick={() => dayData.count > 0 && handleDayClick(dayData.dateKey)}
              >
                <p className="text-sm font-bold">{dayData.day}</p>
                <motion.div
                  className="mt-2 text-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-2xl font-bold">{dayData.count}</p>
                  <p className="text-xs">solicitudes</p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detalles de solicitudes para el día seleccionado */}
      <AnimatePresence>
        {expandedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 bg-white rounded-lg shadow-sm p-4 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">
                Solicitudes para el {format(new Date(expandedDay), "d 'de' MMMM, yyyy", { locale: es })}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setExpandedDay(null)}>
                Cerrar
              </Button>
            </div>

            {/* Resumen de tipos de solicitudes */}
            {(() => {
              const dayRequests = weekData.find((day) => day.dateKey === expandedDay)?.requests || []

              // Conteo por tipo de solicitud
              const typeCounts: Record<string, number> = {}
              dayRequests.forEach((req) => {
                typeCounts[req.type] = (typeCounts[req.type] || 0) + 1
              })

              // Separar en categorías
              const permitTypes = ["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"]
              const postulationTypes = ["Turno pareja", "Tabla partida", "Disponible fijo"]

              const permitCounts = Object.entries(typeCounts)
                .filter(([type]) => permitTypes.includes(type))
                .sort((a, b) => b[1] - a[1])

              const postulationCounts = Object.entries(typeCounts)
                .filter(([type]) => postulationTypes.includes(type))
                .sort((a, b) => b[1] - a[1])

              const otherCounts = Object.entries(typeCounts)
                .filter(([type]) => !permitTypes.includes(type) && !postulationTypes.includes(type))
                .sort((a, b) => b[1] - a[1])

              // Función para mostrar el nombre amigable del tipo
              const getTypeName = (type: string) => {
                const typeNames: Record<string, string> = {
                  descanso: "Descansos",
                  cita: "Citas médicas",
                  audiencia: "Audiencias",
                  licencia: "Licencias no remuneradas",
                  diaAM: "Día AM",
                  diaPM: "Día PM",
                  "Turno pareja": "Turnos pareja",
                  "Tabla partida": "Tablas partidas",
                  "Disponible fijo": "Disponibles fijos",
                }
                return typeNames[type] || type
              }

              return (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumen de solicitudes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Permisos */}
                    {permitCounts.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-green-800 mb-2">Permisos</h5>
                        <div className="space-y-1">
                          {permitCounts.map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{getTypeName(type)}</span>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Postulaciones */}
                    {postulationCounts.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Postulaciones</h5>
                        <div className="space-y-1">
                          {postulationCounts.map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{getTypeName(type)}</span>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Otros tipos */}
                    {otherCounts.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-800 mb-2">Otros</h5>
                        <div className="space-y-1">
                          {otherCounts.map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{type}</span>
                              <Badge variant="outline" className="bg-gray-100">
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Separador */}
            <Separator className="my-3" />

            {/* Lista de solicitudes individuales */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle de solicitudes</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {weekData
                .find((day) => day.dateKey === expandedDay)
                ?.requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{request.name}</p>
                        <p className="text-sm text-gray-500">Código: {request.code}</p>
                      </div>
                      <Badge
                        className={
                          request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {request.status === "approved"
                          ? "Aprobada"
                          : request.status === "rejected"
                            ? "Rechazada"
                            : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">
                        Tipo: <span className="font-normal">{request.type}</span>
                      </p>
                      {request.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              {weekData.find((day) => day.dateKey === expandedDay)?.requests.length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay solicitudes para este día</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PermitsManagement() {
  const [activeTab, setActiveTab] = useState("permits")
  const [requests, setRequests] = useState<Request[]>([])
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequests>({})
  const [filteredRequests, setFilteredRequests] = useState<GroupedRequests>({})
  const [filterType, setFilterType] = useState("all")
  const [filterCode, setFilterCode] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")
  const [selectedRequests, setSelectedRequests] = useState<Request[] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestStats, setRequestStats] = useState<RequestStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    permits: {
      total: 0,
      pending: 0,
      rejected: 0,
      descanso: 0,
      citaMedica: 0,
      audiencia: 0,
      licencia: 0,
      diaAM: 0,
      diaPM: 0,
    },
    postulations: {
      total: 0,
      pending: 0,
      rejected: 0,
      turnoPareja: 0,
      tablaPartida: 0,
      disponibleFijo: 0,
    },
  })
  const [isVerticalView, setIsVerticalView] = useState(false)
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set())
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false)
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<"approve" | "reject" | null>(null)
  const [bulkActionProgress, setBulkActionProgress] = useState(0)
  const [isBulkActionProcessing, setIsBulkActionProcessing] = useState(false)
  const [customResponse, setCustomResponse] = useState("")
  const [weekFilter, setWeekFilter] = useState<string | null>(null)
  const requestsPerPage = 8

  const zones = [
    "Acevedo",
    "Tricentenario",
    "Universidad-gardel",
    "Hospital",
    "Prado",
    "Cruz",
    "San Antonio",
    "Exposiciones",
    "Alejandro",
  ]

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchRequests()
      setRequests(data)

      // Calculate request stats
      const stats: RequestStats = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        permits: {
          total: 0,
          pending: 0,
          rejected: 0,
          descanso: 0,
          citaMedica: 0,
          audiencia: 0,
          licencia: 0,
          diaAM: 0,
          diaPM: 0,
        },
        postulations: {
          total: 0,
          pending: 0,
          rejected: 0,
          turnoPareja: 0,
          tablaPartida: 0,
          disponibleFijo: 0,
        },
      }

      data.forEach((req: Request) => {
        stats.total++
        if (req.status === "approved") stats.approved++
        else if (req.status === "pending") stats.pending++
        else if (req.status === "rejected") stats.rejected++

        if (["descanso", "cita", "audiencia"].includes(req.type)) {
          stats.permits.total++
          if (req.status === "pending") stats.permits.pending++
          else if (req.status === "rejected") stats.permits.rejected++
          if (req.type === "descanso") stats.permits.descanso++
          else if (req.type === "cita") stats.permits.citaMedica++
          else if (req.type === "audiencia") stats.permits.audiencia++
          else if (req.type === "licencia") stats.permits.licencia++
          else if (req.type === "diaAM") stats.permits.diaAM++
          else if (req.type === "diaPM") stats.permits.diaPM++
        } else if (["Turno pareja", "Tabla partida", "Disponible fijo"].includes(req.type)) {
          stats.postulations.total++
          if (req.status === "pending") stats.postulations.pending++
          else if (req.status === "rejected") stats.postulations.rejected++
          if (req.type === "Turno pareja") stats.postulations.turnoPareja++
          else if (req.type === "Tabla partida") stats.postulations.tablaPartida++
          else if (req.type === "Disponible fijo") stats.postulations.disponibleFijo++
        }
      })

      setRequestStats(stats)

      // Filter requests based on active tab and status
      const filteredData = data.filter((req: Request) => {
        const isPermit = ["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(req.type)
        return (activeTab === "permits" ? isPermit : !isPermit) && req.status === "pending"
      })

      // Group by name instead of code
      const grouped = groupBy(filteredData, "name")
      setGroupedRequests(grouped)
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Error al cargar las solicitudes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  useEffect(() => {
    let filtered = { ...groupedRequests }

    if (filterType !== "all") {
      filtered = Object.entries(filtered).reduce((acc, [name, reqs]) => {
        const filteredReqs = reqs.filter((req) => req.type === filterType)
        if (filteredReqs.length > 0) {
          acc[name] = filteredReqs
        }
        return acc
      }, {} as GroupedRequests)
    }

    if (filterCode) {
      filtered = Object.entries(filtered).reduce((acc, [name, reqs]) => {
        const filteredReqs = reqs.filter((req) => req.code.toLowerCase().includes(filterCode.toLowerCase()))
        if (filteredReqs.length > 0) {
          acc[name] = filteredReqs
        }
        return acc
      }, {} as GroupedRequests)
    }

    if (selectedZone !== "all") {
      filtered = Object.entries(filtered).reduce((acc, [name, reqs]) => {
        const filteredReqs = reqs.filter((req) => req.zona === selectedZone)
        if (filteredReqs.length > 0) {
          acc[name] = filteredReqs
        }
        return acc
      }, {} as GroupedRequests)
    }

    if (weekFilter) {
      filtered = Object.entries(filtered).reduce((acc, [name, reqs]) => {
        const filteredReqs = reqs.filter((req) => {
          const requestDate = new Date(req.createdAt)
          const [start, end] = weekFilter.split(" - ").map((date) => new Date(date))
          return requestDate >= start && requestDate <= end
        })
        if (filteredReqs.length > 0) {
          acc[name] = filteredReqs
        }
        return acc
      }, {} as GroupedRequests)
    }

    Object.keys(filtered).forEach((name) => {
      filtered[name].sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
      })
    })

    setFilteredRequests(filtered)

    // Calculate the new total pages
    const newTotalPages = Math.ceil(Object.keys(filtered).length / requestsPerPage)

    // Adjust current page if it's greater than the new total pages
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(newTotalPages, 1))
    }
  }, [groupedRequests, filterType, filterCode, sortOrder, currentPage, selectedZone, weekFilter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftKeyPressed(true)
      if (e.key === "Escape") setSelectedRequestIds(new Set())
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftKeyPressed(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handleRequestAction = async (id: string, action: "approve" | "reject", reason: string) => {
    try {
      // Aquí se llama a updateRequestStatus que ahora envía { status, respuesta } al backend.
      await updateRequestStatus(id, action, reason)
      await loadRequests()
      setSelectedRequests(null)
      setCustomResponse("")
      toast({
        title: "Éxito",
        description: `Solicitud ${action === "approve" ? "aprobada" : "rechazada"} exitosamente`,
      })
    } catch (error) {
      console.error("Error updating request:", error)
      toast({
        title: "Error",
        description: `Error al ${action === "approve" ? "aprobar" : "rechazar"} la solicitud. Por favor, inténtelo de nuevo.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRequest = async (request: Request) => {
    try {
      await deleteRequest(request.id)
      await loadRequests()

      const currentPageRequests = Object.values(filteredRequests).flat().length - (currentPage - 1) * requestsPerPage

      if (currentPageRequests <= 1 && currentPage > 1 && Object.keys(filteredRequests).length > 0) {
        setCurrentPage((prev) => Math.max(1, prev - 1))
      }

      toast({
        title: "Éxito",
        description: "Solicitud eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error deleting request:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la solicitud",
        variant: "destructive",
      })
    } finally {
      setRequestToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE d 'de' MMMM, yyyy", { locale: es })
  }

  const handleRequestClick = (request: Request) => {
    if (isShiftKeyPressed) {
      setSelectedRequestIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(request.id)) {
          newSet.delete(request.id)
        } else {
          newSet.add(request.id)
        }
        return newSet
      })
    } else {
      setSelectedRequests([request])
    }
  }

  const handleBulkAction = async (action: "approve" | "reject") => {
    setIsBulkActionProcessing(true)
    setBulkActionProgress(0)
    const totalRequests = selectedRequestIds.size
    let processedRequests = 0

    const message = await new Promise<string>((resolve) => {
      const response = prompt(`Ingrese el motivo para ${action === "approve" ? "aprobar" : "rechazar"} la solicitud:`)
      resolve(
        response ||
          (action === "approve" ? "Su solicitud ha sido aprobada." : "Lo sentimos, su solicitud ha sido rechazada."),
      )
    })
    try {
      for (const id of selectedRequestIds) {
        await handleRequestAction(id, action, message)
        processedRequests++
        setBulkActionProgress((processedRequests / totalRequests) * 100)
      }

      setSelectedRequestIds(new Set())
      toast({
        title: "Éxito",
        description: `${totalRequests} solicitudes ${action === "approve" ? "aprobadas" : "rechazadas"} exitosamente`,
      })
    } catch (error) {
      console.error("Error en acción masiva:", error)
      toast({
        title: "Error",
        description: `Hubo un problema al procesar las solicitudes. Por favor, inténtelo de nuevo.`,
        variant: "destructive",
      })
    } finally {
      setIsBulkActionProcessing(false)
      setBulkActionDialogOpen(false)
      setBulkActionType(null)
    }
  }

  const renderGroupedRequestCard = ([name, requests]: [string, Request[]]) => {
    const isEquipmentRequest = !["descanso", "cita", "audiencia"].includes(requests[0].type)

    return (
      <motion.div
        key={`${name}-${requests[0].id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="group h-full"
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <Card
              className={`h-full bg-white shadow-sm hover:shadow-md transition-all duration-300 ${
                requests.some((req) => selectedRequestIds.has(req.id)) ? "ring-2 ring-green-500" : ""
              }`}
            >
              <CardHeader className="space-y-2">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="outline"
                    className={`${
                      isEquipmentRequest
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-green-50 text-green-700 border-green-300"
                    }`}
                  >
                    {isEquipmentRequest ? "Postulación" : "Permiso"}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold">{name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {requests.length} solicitud{requests.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div key={request.id} className="space-y-2">
                      <button
                        className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                          selectedRequestIds.has(request.id) ? "bg-green-100" : ""
                        }`}
                        onClick={() => handleRequestClick(request)}
                      >
                        <div className="flex-shrink-0">
                          <Clock className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{request.type}</p>
                          <p className="text-xs text-gray-500">
                            {request.createdAt ? format(new Date(request.createdAt), "d MMM, yyyy", { locale: es }) : 'Fecha no disponible'}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {requests.map((request) => (
              <ContextMenuItem
                key={request.id}
                onClick={() => {
                  setRequestToDelete(request)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar solicitud de {request.type}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      </motion.div>
    )
  }

  const renderPaginationButton = (page: number) => (
    <Button
      key={page}
      variant={currentPage === page ? "default" : "outline"}
      className={`w-10 h-10 rounded-full ${
        currentPage === page ? "bg-green-500 text-white" : "hover:bg-green-100 hover:text-green-700"
      }`}
      onClick={() => setCurrentPage(page)}
    >
      {page}
    </Button>
  )

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(renderPaginationButton(i))
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(renderPaginationButton(i))
        }
        pageNumbers.push(
          <span key="ellipsis-end" className="mx-1">
            ...
          </span>,
        )
        pageNumbers.push(renderPaginationButton(totalPages))
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(renderPaginationButton(1))
        pageNumbers.push(
          <span key="ellipsis-start" className="mx-1">
            ...
          </span>,
        )
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(renderPaginationButton(i))
        }
      } else {
        pageNumbers.push(renderPaginationButton(1))
        pageNumbers.push(
          <span key="ellipsis-start" className="mx-1">
            ...
          </span>,
        )
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(renderPaginationButton(i))
        }
        pageNumbers.push(
          <span key="ellipsis-end" className="mx-1">
            ...
          </span>,
        )
        pageNumbers.push(renderPaginationButton(totalPages))
      }
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-full w-10 h-10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pageNumbers}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-full w-10 h-10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const totalPages = Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)
  const currentRequests = Object.entries(filteredRequests).slice(
    (currentPage - 1) * requestsPerPage,
    currentPage * requestsPerPage,
  )

  const totalFilteredRequests = Object.values(filteredRequests).reduce((sum, requests) => sum + requests.length, 0)
  const startIndex = (currentPage - 1) * requestsPerPage + 1
  const endIndex = Math.min(startIndex + currentRequests.length - 1, totalFilteredRequests)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setFilterCode(value)
    const filtered = Object.entries(groupedRequests).reduce((acc, [name, reqs]) => {
      const filteredReqs = reqs.filter((req) => req.code.toLowerCase().includes(value))
      if (filteredReqs.length > 0) {
        acc[name] = filteredReqs
      }
      return acc
    }, {} as GroupedRequests)
    setFilteredRequests(filtered)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 text-center text-gray-900"
        >
          Gestión de Solicitudes Pendientes
        </motion.h1>

        <div className="mb-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Resumen de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard title="Total de solicitudes" value={requestStats.total} color="bg-green-100 text-green-800" />
                <StatCard title="Aprobadas" value={requestStats.approved} color="bg-blue-100 text-blue-800" />
                <StatCard title="Pendientes" value={requestStats.pending} color="bg-yellow-100 text-yellow-800" />
                <StatCard title="Rechazadas" value={requestStats.rejected} color="bg-red-100 text-red-800" />
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailedStatCard
                  title="Permisos"
                  stats={{
                    Total: requestStats.permits.total,
                    Pendientes: requestStats.permits.pending,
                    Rechazados: requestStats.permits.rejected,
                    Descansos: requestStats.permits.descanso,
                    "Citas médicas": requestStats.permits.citaMedica,
                    Audiencias: requestStats.permits.audiencia,
                    Licencias: requestStats.permits.licencia,
                    "Día AM": requestStats.permits.diaAM,
                    "Día PM": requestStats.permits.diaPM,
                  }}
                  color="bg-green-50"
                />
                <DetailedStatCard
                  title="Postulaciones"
                  stats={{
                    Total: requestStats.postulations.total,
                    Pendientes: requestStats.postulations.pending,
                    Rechazados: requestStats.postulations.rejected,
                    "Turno pareja": requestStats.postulations.turnoPareja,
                    "Tabla partida": requestStats.postulations.tablaPartida,
                    "Disponible fijo": requestStats.postulations.disponibleFijo,
                  }}
                  color="bg-blue-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Solicitudes por Día de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyStatsDisplay requests={requests} />
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full md:w-auto mb-2 md:mb-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            {isFilterOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
          <Button variant="outline" onClick={() => setIsVerticalView(!isVerticalView)} className="w-full md:w-auto">
            {isVerticalView ? "Vista paginada" : "Vista vertical"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="permits" className="data-[state=active]:bg-green-100">
              <FileText className="w-5 h-5 mr-2" />
              Permisos
            </TabsTrigger>
            <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-100">
              <Laptop className="w-5 h-5 mr-2" />
              Postulaciones
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 bg-white p-4 rounded-lg shadow-sm"
            >
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de solicitud" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {activeTab === "permits" ? (
                    <>
                      <SelectItem value="descanso">Descanso</SelectItem>
                      <SelectItem value="audiencia">Audiencia</SelectItem>
                      <SelectItem value="cita">Cita médica</SelectItem>
                      <SelectItem value="licencia">Licencia</SelectItem>
                      <SelectItem value="diaAM">Día AM</SelectItem>
                      <SelectItem value="diaPM">Día PM</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Turno pareja">Turno pareja</SelectItem>
                      <SelectItem value="Tabla partida">Tabla partida</SelectItem>
                      <SelectItem value="Disponible fijo">Disponible fijo</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              <Input placeholder="Buscar por código" value={filterCode} onChange={handleSearch} />

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={weekFilter || ""} onValueChange={setWeekFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las semanas</SelectItem>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const start = startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 })
                    const end = endOfWeek(start, { weekStartsOn: 1 })
                    const value = `${format(start, "yyyy-MM-dd")} - ${format(end, "yyyy-MM-dd")}`
                    return (
                      <SelectItem key={`week-${i}-${value}`} value={value}>
                        {format(start, "d MMM")} - {format(end, "d MMM")}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <LoadingSpinner />
        ) : Object.keys(filteredRequests).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes pendientes</h3>
            <p className="text-gray-500">No se encontraron solicitudes que coincidan con los filtros seleccionados</p>
          </motion.div>
        ) : (
          <>
            {isVerticalView ? (
              <div className="space-y-4">{Object.entries(filteredRequests).map(renderGroupedRequestCard)}</div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  Mostrando solicitudes {startIndex} - {endIndex} de {totalFilteredRequests}
                </div>
                <div className="relative">
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                    <AnimatePresence>{currentRequests.map(renderGroupedRequestCard)}</AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!isVerticalView && totalPages > 1 && renderPagination()}
      </div>

      {selectedRequests && (
        <RequestDetails
          requests={selectedRequests as any}
          onClose={() => setSelectedRequests(null)}
          onAction={handleRequestAction}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la solicitud
              {requestToDelete && ` de ${requestToDelete.type} para ${requestToDelete.name}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar acción masiva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {bulkActionType === "approve" ? "aprobar" : "rechazar"} las siguientes
              solicitudes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto">
            {Array.from(selectedRequestIds).map((id) => {
              const request = requests.find((r) => r.id === id)
              return request ? (
                <div key={id} className="py-2 border-b last:border-b-0">
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-gray-500">
                    {request.code} - {request.type}
                  </p>
                </div>
              ) : null
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkActionType && handleBulkAction(bulkActionType)}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedRequestIds.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50">
          <h3 className="text-lg font-semibold mb-2">Acciones masivas ({selectedRequestIds.size} seleccionadas)</h3>
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                setBulkActionType("approve")
                setBulkActionDialogOpen(true)
              }}
            >
              Aprobar seleccionados
            </Button>
            <Button
              onClick={() => {
                setBulkActionType("reject")
                setBulkActionDialogOpen(true)
              }}
              variant="destructive"
            >
              Rechazar seleccionados
            </Button>
          </div>
        </div>
      )}

      {isBulkActionProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Procesando solicitudes...</h3>
            <Progress value={bulkActionProgress} className="w-64 mb-4" />
            <p className="text-sm text-gray-500">{Math.round(bulkActionProgress)}% completado</p>
          </div>
        </div>
      )}
    </div>
  )
}
