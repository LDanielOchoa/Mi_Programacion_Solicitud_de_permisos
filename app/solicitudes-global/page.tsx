"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Calendar,
  Clock,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Eye,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  BarChartBig as ChartBar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import dynamic from "next/dynamic"

// Lazy loaded components
const BottomNavigation = dynamic(() => import("@/components/BottomNavigation"), {
  ssr: false,
  loading: () => <div className="h-16 w-full fixed bottom-0 bg-white border-t border-gray-100 animate-pulse" />
})

import { RequestDetailsDialog } from "./request-details-dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/drawer"
import { Skeleton } from "@/components/ui/skeleton"

interface Request {
  id: number
  code: string
  name: string
  tipo_novedad: string
  description: string
  status: "approved" | "rejected" | "pending"
  respuesta: string
  zona?: string
  createdAt: string
  request_type: "permiso" | "postulaciones"
  fecha: string
  telefono?: string
  hora?: string
  comp_am?: string
  comp_pm?: string
  turno?: string
  [key: string]: string | number | undefined
}

export default function Solicitudes() {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortOrder, setSortOrder] = useState("desc")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [userName, setUserName] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [isEmptyState, setIsEmptyState] = useState(false)

  // Referencias para animaciones de scroll
  const summaryRef = useRef(null)
  const filtersRef = useRef(null)
  const listRef = useRef(null)

  const summaryInView = useInView(summaryRef, { once: true, amount: 0.3 })
  const filtersInView = useInView(filtersRef, { once: true, amount: 0.3 })
  const listInView = useInView(listRef, { once: true, amount: 0.1 })

  const fetchRequests = async () => {
    try {
      setIsRefreshing(true)
      const token = localStorage.getItem("accessToken")
      if (!token) return

      // Intentar obtener datos del usuario
      try {
        const userResponse = await fetch("https://solicitud-permisos.sao6.com.co/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserName(userData.name || "Usuario")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setUserName("Usuario")
      }

      // Obtener solicitudes
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/admin/solicitudes", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const typedData = data.map((req: any) => ({
          ...req,
          status: req.status as "approved" | "rejected" | "pending",
        }))
        setRequests(typedData)
        setFilteredRequests(typedData)
        setIsEmptyState(typedData.length === 0)
      }

      // Check for notifications
      const storedNotifications = localStorage.getItem("dashboardNotifications")
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications)
        setHasNewNotification(parsedNotifications.some((n: any) => n.isNew))
      }
    } catch (error) {
      console.error("Error fetching data:", error)

      // Datos de demostración en caso de error
      const mockData: Request[] = [
        {
          id: 1,
          code: "P001",
          name: "Carlos Rodríguez",
          tipo_novedad: "Permiso de vacaciones",
          description:
            "Solicitud de vacaciones para el período de verano. Necesito tomar dos semanas para un viaje familiar planificado con anticipación.",
          status: "approved",
          respuesta: "Aprobado según política de vacaciones. Disfrute su descanso.",
          createdAt: new Date().toISOString(),
          request_type: "permiso",
          fecha: "2023-07-15",
          telefono: "555-123-4567",
          hora: "09:00 - 18:00",
        },
        {
          id: 2,
          code: "P002",
          name: "Carlos Rodríguez",
          tipo_novedad: "Cambio de horario",
          description:
            "Solicitud de cambio de horario por motivos personales. Necesito ajustar mi horario para poder asistir a clases en la universidad.",
          status: "rejected",
          respuesta: "No es posible realizar el cambio por necesidades operativas del departamento en este momento.",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          request_type: "permiso",
          fecha: "2023-07-10",
          telefono: "555-123-4567",
          hora: "10:00 - 19:00",
        },
        {
          id: 3,
          code: "P003",
          name: "Carlos Rodríguez",
          tipo_novedad: "Turno pareja",
          description:
            "Solicitud de turno pareja con Juan Pérez para el proyecto Acevedo. Hemos trabajado juntos anteriormente con buenos resultados.",
          status: "pending",
          respuesta: "",
          zona: "Acevedo",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          request_type: "postulaciones",
          fecha: "2023-07-05",
          comp_am: "Juan Pérez",
          comp_pm: "Carlos Rodríguez",
          turno: "Rotativo",
        },
        {
          id: 4,
          code: "P004",
          name: "Carlos Rodríguez",
          tipo_novedad: "Permiso médico",
          description: "Solicitud de permiso para cita médica programada. Adjunto comprobante de la cita.",
          status: "approved",
          respuesta: "Permiso aprobado. Por favor presente el comprobante de asistencia a su regreso.",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          request_type: "permiso",
          fecha: "2023-07-03",
          telefono: "555-123-4567",
          hora: "11:00 - 13:00",
        },
        {
          id: 5,
          code: "P005",
          name: "Carlos Rodríguez",
          tipo_novedad: "Postulación proyecto especial",
          description:
            "Me interesa participar en el proyecto especial de innovación tecnológica. Tengo experiencia en proyectos similares y puedo aportar conocimientos en desarrollo de software.",
          status: "pending",
          respuesta: "",
          zona: "Central",
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          request_type: "postulaciones",
          fecha: "2023-06-28",
          turno: "Diurno",
        },
      ]
      setRequests(mockData)
      setFilteredRequests(mockData)
      setIsEmptyState(false)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchRequests()
  }, [])

  useEffect(() => {
    let filtered = [...requests]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          req.tipo_novedad.toLowerCase().includes(term) ||
          req.description?.toLowerCase().includes(term) ||
          (req.zona && req.zona.toLowerCase().includes(term)),
      )
    }

    // Filtrar por período
    if (filterPeriod !== "all") {
      const now = new Date()
      const periodStart = new Date()
      switch (filterPeriod) {
        case "day":
          periodStart.setDate(now.getDate() - 1)
          break
        case "week":
          periodStart.setDate(now.getDate() - 7)
          break
        case "month":
          periodStart.setMonth(now.getMonth() - 1)
          break
        case "year":
          periodStart.setFullYear(now.getFullYear() - 1)
          break
      }
      filtered = filtered.filter((req) => new Date(req.createdAt) >= periodStart)
    }

    // Filtrar por estado
    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus)
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.request_type === filterType)
    }

    // Filtrar por tab activo
    if (activeTab !== "all") {
      if (activeTab === "approved") {
        filtered = filtered.filter((req) => req.status === "approved")
      } else if (activeTab === "rejected") {
        filtered = filtered.filter((req) => req.status === "rejected")
      } else if (activeTab === "pending") {
        filtered = filtered.filter((req) => req.status === "pending")
      } else if (activeTab === "permisos") {
        filtered = filtered.filter((req) => req.request_type === "permiso")
      } else if (activeTab === "postulaciones") {
        filtered = filtered.filter((req) => req.request_type === "postulaciones")
      }
    }

    // Ordenar
    filtered.sort((a, b) => {
      return sortOrder === "desc"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    setFilteredRequests(filtered)
  }, [requests, filterPeriod, filterStatus, filterType, sortOrder, searchTerm, activeTab])

  // Obtener iniciales del usuario para el avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5" />
      case "rejected":
        return <XCircle className="h-5 w-5" />
      case "pending":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-[#4cc253]/10 text-[#4cc253]"
      case "rejected":
        return "bg-red-50 text-red-600"
      case "pending":
        return "bg-amber-50 text-amber-600"
      default:
        return "bg-gray-50 text-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobada"
      case "rejected":
        return "Rechazada"
      case "pending":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "permiso":
        return <Calendar className="h-5 w-5" />
      case "postulaciones":
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "permiso":
        return "bg-[#4cc253]/10 text-[#4cc253]"
      case "postulaciones":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "permiso":
        return "Permiso"
      case "postulaciones":
        return "Postulación"
      default:
        return type
    }
  }

  const renderRequestCard = (request: Request, index: number) => {
    const delay = Math.min(index * 0.05, 0.5)

    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className="mb-4"
      >
        <Card className="group overflow-hidden border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 rounded-3xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${request.status === "approved"
                    ? "bg-[#4cc253]/10 text-[#4cc253]"
                    : request.status === "pending"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-red-50 text-red-600"
                    }`}
                >
                  {getStatusIcon(request.status)}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 tracking-tight leading-tight">{request.tipo_novedad}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    #{request.code} • {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${getTypeColor(request.request_type)} border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full`}
              >
                {getTypeText(request.request_type)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {request.fecha && (
                <div className="flex items-center p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <Calendar className="w-4 h-4 text-[#4cc253] mr-3" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha</p>
                    <p className="text-sm font-bold text-gray-700">{request.fecha}</p>
                  </div>
                </div>
              )}

              {request.zona && (
                <div className="flex items-center p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-[#4cc253] mr-3" />
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Zona</p>
                    <p className="text-sm font-bold text-gray-700">{request.zona}</p>
                  </div>
                </div>
              )}
            </div>

            {request.description && (
              <div className="mb-4 p-4 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Descripción</p>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{request.description}"</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${request.status === "approved" ? "bg-[#4cc253]" :
                  request.status === "pending" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${request.status === "approved" ? "text-[#4cc253]" :
                  request.status === "pending" ? "text-amber-600" : "text-red-600"
                  }`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4cc253] hover:text-[#4cc253] hover:bg-[#4cc253]/5 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedRequest(request)
                }}
              >
                Detalles
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 px-4 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200"
    >
      <div className="bg-white p-8 rounded-[32px] shadow-sm mb-6 border border-gray-100">
        <FileSpreadsheet className="h-16 w-16 text-[#4cc253]" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No hay solicitudes</h3>
      <p className="text-gray-400 max-w-sm text-sm font-medium leading-relaxed">
        No se encontraron resultados con los filtros actuales. Intenta ajustar tu búsqueda para encontrar lo que necesitas.
      </p>
    </motion.div>
  )

  const renderSkeletonCard = (index: number) => (
    <div key={index} className="mb-4">
      <Card className="overflow-hidden rounded-3xl border border-gray-100 animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl mt-4" />
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Premium Limpio */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 h-20">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => window.history.back()}
                className="cursor-pointer bg-gray-50 p-2.5 rounded-2xl hover:bg-[#4cc253]/10 hover:text-[#4cc253] transition-all text-gray-400"
              >
                <List className="h-5 w-5" />
              </motion.div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Mis Solicitudes</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                  Control Operacional
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-[#4cc253] hover:bg-gray-50 rounded-full transition-all"
                onClick={() => {
                  setIsRefreshing(true)
                  fetchRequests()
                }}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              <div className="hidden md:flex items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">Usuario:</span>
                <span className="text-xs font-black text-gray-600">{userName}</span>
              </div>

              <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-sm">
                <AvatarFallback className="bg-[#4cc253] text-white text-sm font-black">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="mb-10" ref={summaryRef}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-40 group hover:border-[#4cc253]/30 transition-all duration-300">
              <div className="bg-gray-50 w-10 h-10 flex items-center justify-center rounded-xl text-[#4cc253] mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {filteredRequests.filter((r) => r.status === "approved").length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aprobadas</p>
              </div>
            </Card>

            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-40 group hover:border-amber-100 transition-all duration-300">
              <div className="bg-amber-50 w-10 h-10 flex items-center justify-center rounded-xl text-amber-600 mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {filteredRequests.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendientes</p>
              </div>
            </Card>

            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-40 group hover:border-red-100 transition-all duration-300">
              <div className="bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl text-red-600 mb-2">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {filteredRequests.filter((r) => r.status === "rejected").length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rechazadas</p>
              </div>
            </Card>

            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-40 group hover:border-[#4cc253]/30 transition-all duration-300">
              <div className="bg-gray-50 w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {filteredRequests.filter((r) => r.request_type === "permiso").length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permisos</p>
              </div>
            </Card>

            <Card className="bg-white border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between h-40 group hover:border-[#4cc253]/30 transition-all duration-300">
              <div className="bg-gray-50 w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {filteredRequests.filter((r) => r.request_type === "postulaciones").length}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Postulaciones</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Barra de búsqueda y filtros para móvil */}
        <div className="md:hidden mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar solicitudes..."
                className="pl-10 border-green-200 focus:border-green-500 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="border-green-200 text-green-700 rounded-xl bg-transparent">
                  <Filter className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="p-4 rounded-t-3xl bg-white">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-800 flex items-center">
                    <SlidersHorizontal className="h-5 w-5 mr-2 text-green-600" />
                    Filtros
                  </h3>

                  <div className="space-y-3">
                    <Select onValueChange={setFilterPeriod} defaultValue="all">
                      <SelectTrigger className="w-full border-green-200 rounded-xl">
                        <Calendar className="h-4 w-4 mr-2 text-green-600" />
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="week">Última semana</SelectItem>
                        <SelectItem value="month">Último mes</SelectItem>
                        <SelectItem value="year">Último año</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setFilterStatus} defaultValue="all">
                      <SelectTrigger className="w-full border-green-200 rounded-xl">
                        <AlertCircle className="h-4 w-4 mr-2 text-green-600" />
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="approved">Aprobadas</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="rejected">Rechazadas</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setFilterType} defaultValue="all">
                      <SelectTrigger className="w-full border-green-200 rounded-xl">
                        <FileText className="h-4 w-4 mr-2 text-green-600" />
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="permiso">Permisos</SelectItem>
                        <SelectItem value="postulaciones">Postulaciones</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 rounded-xl"
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      {sortOrder === "desc" ? "Más recientes primero" : "Más antiguos primero"}
                    </Button>
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full h-14 bg-[#4cc253] hover:bg-[#43ae4a] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#4cc253]/20"
                      onClick={() => setIsFilterDrawerOpen(false)}
                    >
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        {/* Filtros para desktop */}
        <div className="hidden md:block" ref={filtersRef}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={filtersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-white border-gray-100 shadow-sm overflow-hidden rounded-[32px]">
              <CardHeader className="pb-2 pt-5 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                  <SlidersHorizontal className="h-4 w-4 mr-3 text-[#4cc253]" />
                  Filtros de búsqueda
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:bg-gray-50 hover:text-[#4cc253] rounded-xl font-black uppercase tracking-widest text-[10px]"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  {isFilterOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Mostrar
                    </>
                  )}
                </Button>
              </CardHeader>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Buscar solicitudes..."
                            className="pl-10 border-green-200 focus:border-green-500 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Select onValueChange={setFilterPeriod} defaultValue="all">
                            <SelectTrigger className="w-[150px] border-gray-100 rounded-xl text-[11px] font-bold">
                              <Calendar className="h-3 w-3 mr-2 text-[#4cc253]" />
                              <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="week">Última semana</SelectItem>
                              <SelectItem value="month">Último mes</SelectItem>
                              <SelectItem value="year">Último año</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select onValueChange={setFilterStatus} defaultValue="all">
                            <SelectTrigger className="w-[150px] border-gray-100 rounded-xl text-[11px] font-bold">
                              <AlertCircle className="h-3 w-3 mr-2 text-[#4cc253]" />
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="approved">Aprobadas</SelectItem>
                              <SelectItem value="pending">Pendientes</SelectItem>
                              <SelectItem value="rejected">Rechazadas</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select onValueChange={setFilterType} defaultValue="all">
                            <SelectTrigger className="w-[150px] border-gray-100 rounded-xl text-[11px] font-bold">
                              <FileText className="h-3 w-3 mr-2 text-[#4cc253]" />
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="permiso">Permisos</SelectItem>
                              <SelectItem value="postulaciones">Postulaciones</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                            className="border-gray-100 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                          >
                            <ArrowUpDown className="mr-2 h-3 w-3" />
                            {sortOrder === "desc" ? "Recientes" : "Antiguos"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>

        {/* Tabs y Lista de Solicitudes */}
        <div ref={listRef} className="pb-10">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="bg-gray-100/50 p-1 rounded-2xl h-12 inline-flex w-auto min-w-full md:min-w-0 justify-start">
                  <TabsTrigger
                    value="all"
                    className="rounded-xl px-4 md:px-6 flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-[#4cc253] data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest"
                  >
                    Todas
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="rounded-xl px-4 md:px-6 flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-[#4cc253] data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest"
                  >
                    Aprobadas
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="rounded-xl px-4 md:px-6 flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest"
                  >
                    Pendientes
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="rounded-xl px-4 md:px-6 flex-1 md:flex-none data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm text-[10px] font-black uppercase tracking-widest"
                  >
                    Rechazadas
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="relative group w-full md:w-auto md:min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#4cc253] transition-colors" />
                <Input
                  placeholder="Buscar por tipo o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-white border-gray-100 focus:border-[#4cc253] focus:ring-[#4cc253]/20 h-12 rounded-2xl shadow-sm transition-all text-sm"
                />
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 gap-4">
                {isLoading
                  ? Array(5).fill(0).map((_, index) => renderSkeletonCard(index))
                  : filteredRequests.length === 0
                    ? renderEmptyState()
                    : filteredRequests.map((request, index) => renderRequestCard(request, index))}
              </div>
            </TabsContent>

            {["approved", "pending", "rejected"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="grid grid-cols-1 gap-4">
                  {isLoading
                    ? Array(5).fill(0).map((_, index) => renderSkeletonCard(index))
                    : filteredRequests.filter((r) => r.status === tab).length === 0
                      ? renderEmptyState()
                      : filteredRequests.filter((r) => r.status === tab).map((request, index) => renderRequestCard(request, index))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Diálogo de detalles */}
      {selectedRequest && (
        <RequestDetailsDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation hasNewNotification={hasNewNotification} />
    </div>
  )
}
