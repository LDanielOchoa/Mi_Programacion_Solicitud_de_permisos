"use client"

import React, { useState, useCallback, memo, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Timer,
  Calendar,
  Shield,
  Clock,
  Users,
  Target,
  Briefcase,
  AlertCircle,
  MapPin,
  ArrowRight,
  Eye,
  Edit,
  Download,
  Trash2,
  MoreVertical,
  Sparkles,
  Zap,
  Star,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Phone,
  Mail,
  Building2,
  Hash,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  MessageSquare,
  Paperclip,
  Send,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import type { Request } from "@/hooks/use-permits"

interface RequestCardProps {
  name: string
  requests: Request[]
  onRequestClick: (request: Request) => void
  selectedRequestIds: Set<string>
  onDelete: (request: Request) => void
}

// Unified date formatting function
const formatDateForCard = (dateString: string) => {
  if (!dateString) return "Fecha no disponible"
  try {
    if (dateString.includes(",")) {
      const fechas = dateString.split(",").map((fecha) => {
        const fechaTrim = fecha.trim()
        try {
          const date = parseISO(fechaTrim)
          return isValid(date) ? format(date, "d MMM", { locale: es }) : fechaTrim
        } catch {
          return fechaTrim
        }
      })
      return fechas.join(", ")
    }
    const date = parseISO(dateString)
    if (!isValid(date)) {
      const matches = dateString.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (matches) {
        const [_, day, month, year] = matches
        const newDate = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
        if (isValid(newDate)) {
          return format(newDate, "d MMM", { locale: es })
        }
      }
      return dateString
    }
    return format(date, "d MMM", { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error, dateString)
    return dateString
  }
}

// Enhanced User Avatar Component
const UserAvatar = memo(({ name, photoUrl, size = "md", showStatus = true }: {
  name: string;
  photoUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-20 h-20 text-lg"
  }

  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
      {photoUrl && !imageError ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center animate-pulse">
              <User className="h-1/2 w-1/2 text-emerald-600" />
            </div>
          )}
          <img
            src={photoUrl}
            alt={`Foto de ${name}`}
            className={`w-full h-full rounded-2xl object-cover border-2 border-white shadow-lg ring-2 ring-emerald-100 transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            loading="lazy"
          />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-emerald-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <span className="relative z-10 drop-shadow-sm">{initials}</span>
        </div>
      )}

      {showStatus && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-2 w-2 text-white" />
        </motion.div>
      )}
    </div>
  )
})

UserAvatar.displayName = "UserAvatar"

// Enhanced Status Badge Component
const StatusBadge = memo(({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-600'
        }
      case 'rechazado':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        }
      case 'pendiente':
      default:
        return {
          icon: AlertTriangle,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600'
        }
    }
  }

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm'
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <Badge className={`${config.color} border-2 ${sizeClasses[size]} rounded-xl font-semibold shadow-sm flex items-center space-x-1.5`}>
      <IconComponent className={`h-3.5 w-3.5 ${config.iconColor}`} />
      <span className="capitalize">{status}</span>
    </Badge>
  )
})

StatusBadge.displayName = "StatusBadge"

// Request Statistics Component
const RequestStats = memo(({ requests }: { requests: Request[] }) => {
  const stats = useMemo(() => {
    const total = requests.length
    const byType = requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byStatus = requests.reduce((acc, req) => {
      const status = req.status || 'pendiente'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, byType, byStatus }
  }, [requests])

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border-2 border-emerald-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <h4 className="font-semibold text-emerald-800">Total</h4>
        </div>
        <p className="text-2xl font-bold text-emerald-900">{stats.total}</p>
        <p className="text-sm text-emerald-600">Solicitudes</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border-2 border-blue-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <PieChart className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-blue-800">Tipos</h4>
        </div>
        <p className="text-2xl font-bold text-blue-900">{Object.keys(stats.byType).length}</p>
        <p className="text-sm text-blue-600">Diferentes</p>
      </div>
    </div>
  )
})

RequestStats.displayName = "RequestStats"

// Detailed Request Item Component
const DetailedRequestItem = memo(({
  request,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  onRequestClick
}: {
  request: Request;
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
  isSelected: boolean;
  onSelect: (request: Request) => void;
  onRequestClick: (request: Request) => void;
}) => {
  const getTypeIcon = useCallback((type: string) => {
    const icons: Record<string, React.ReactNode> = {
      descanso: <Timer className="h-4 w-4" />,
      cita: <Calendar className="h-4 w-4" />,
      audiencia: <Shield className="h-4 w-4" />,
      licencia: <FileText className="h-4 w-4" />,
      diaAM: <Clock className="h-4 w-4" />,
      diaPM: <Clock className="h-4 w-4" />,
      "Turno pareja": <Users className="h-4 w-4" />,
      "Tabla partida": <Target className="h-4 w-4" />,
      "Disponible fijo": <Briefcase className="h-4 w-4" />,
    }
    return icons[type] || <FileText className="h-4 w-4" />
  }, [])

  const getTypeColor = useCallback((type: string) => {
    const colors: Record<string, { bg: string; gradient: string }> = {
      descanso: { bg: "bg-blue-500", gradient: "from-blue-500 to-blue-600" },
      cita: { bg: "bg-purple-500", gradient: "from-purple-500 to-purple-600" },
      audiencia: { bg: "bg-orange-500", gradient: "from-orange-500 to-orange-600" },
      licencia: { bg: "bg-pink-500", gradient: "from-pink-500 to-pink-600" },
      diaAM: { bg: "bg-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
      diaPM: { bg: "bg-violet-500", gradient: "from-violet-500 to-violet-600" },
      "Turno pareja": { bg: "bg-teal-500", gradient: "from-teal-500 to-teal-600" },
      "Tabla partida": { bg: "bg-cyan-500", gradient: "from-cyan-500 to-cyan-600" },
      "Disponible fijo": { bg: "bg-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
    }
    return colors[type] || { bg: "bg-gray-500", gradient: "from-gray-500 to-gray-600" }
  }, [])

  const typeColor = getTypeColor(request.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isSelected
        ? 'bg-emerald-50 border-emerald-300 shadow-lg shadow-emerald-100'
        : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-md'
        }`}
      onClick={() => onRequestClick(request)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <motion.div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColor.gradient} flex items-center justify-center shadow-lg text-white`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {getTypeIcon(request.type)}
          </motion.div>
          <div>
            <h4 className="font-bold text-gray-900">{request.type}</h4>
            <p className="text-sm text-gray-500">#{request.code}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <StatusBadge status={request.status || 'pendiente'} size="xs" />
          <div className="flex space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(request)
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                  >
                    <Edit className="h-3 w-3 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar solicitud</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(request)
                    }}
                    className="h-8 w-8 p-0 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar solicitud</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>
            {request.dates
              ? Array.isArray(request.dates)
                ? request.dates.length > 1
                  ? `${formatDateForCard(request.dates[0])} - ${formatDateForCard(request.dates[request.dates.length - 1])}`
                  : formatDateForCard(request.dates[0])
                : formatDateForCard(request.dates.toString())
              : "Fecha no disponible"}
          </span>
        </div>

        {request.zona && (
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>{request.zona}</span>
          </div>
        )}
      </div>

      {request.description && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
        </div>
      )}
    </motion.div>
  )
})

DetailedRequestItem.displayName = "DetailedRequestItem"

// Enhanced Detailed View Modal
const DetailedViewModal = memo(({
  name,
  requests,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRequestClick
}: {
  name: string;
  requests: Request[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
  onRequestClick: (request: Request) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesFilter = filterType === "all" || request.type === filterType

      return matchesSearch && matchesFilter
    })
  }, [requests, searchTerm, filterType])

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRequests, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(requests.map(r => r.type)))
  }, [requests])

  const handleSelectRequest = useCallback((request: Request) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(request.id)) {
        newSet.delete(request.id)
      } else {
        newSet.add(request.id)
      }
      return newSet
    })
  }, [])

  // Auto-close modal when any request is selected
  const handleRequestClickWithAutoClose = useCallback((request: Request) => {
    onRequestClick(request)
    // Close modal immediately when any request is clicked
    onClose()
  }, [onRequestClick, onClose])

  const handleSelectAll = useCallback(() => {
    if (selectedRequests.size === paginatedRequests.length) {
      setSelectedRequests(new Set())
    } else {
      setSelectedRequests(new Set(paginatedRequests.map(r => r.id)))
    }
  }, [selectedRequests.size, paginatedRequests])

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
        style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <UserAvatar name={name} size="lg" showStatus={false} />
                <div className="text-white">
                  <h2 className="text-3xl font-bold drop-shadow-sm">{name}</h2>
                  <p className="text-emerald-100 text-lg">
                    {requests.length} solicitud{requests.length !== 1 ? "es" : ""} registrada{requests.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Statistics */}
            <RequestStats requests={requests} />

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-emerald-400 rounded-xl"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:outline-none bg-white"
              >
                <option value="all">Todos los tipos</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <Button
                onClick={handleSelectAll}
                variant="outline"
                className="border-2 border-emerald-200 hover:bg-emerald-50 rounded-xl"
              >
                {selectedRequests.size === paginatedRequests.length ? (
                  <>
                    <Minus className="h-4 w-4 mr-2" />
                    Deseleccionar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Seleccionar todo
                  </>
                )}
              </Button>
            </div>

            {/* Selected count */}
            {selectedRequests.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl"
              >
                <p className="text-emerald-800 font-semibold">
                  {selectedRequests.size} solicitud{selectedRequests.size !== 1 ? "es" : ""} seleccionada{selectedRequests.size !== 1 ? "s" : ""}
                </p>
              </motion.div>
            )}

            {/* Requests Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <AnimatePresence mode="popLayout">
                {paginatedRequests.map((request) => (
                  <DetailedRequestItem
                    key={request.id}
                    request={request}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isSelected={selectedRequests.has(request.id)}
                    onSelect={handleSelectRequest}
                    onRequestClick={handleRequestClickWithAutoClose}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* No results */}
            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron solicitudes</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
})

DetailedViewModal.displayName = "DetailedViewModal"

// Main RequestCard Component - Completely Redesigned
const RequestCard = memo(
  React.forwardRef<HTMLDivElement, RequestCardProps>(
    ({ name, requests, onRequestClick, selectedRequestIds, onDelete }, ref) => {
      const [showDetailedView, setShowDetailedView] = useState(false)
      const [isExpanded, setIsExpanded] = useState(false)

      const isEquipmentRequest = !["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(
        requests[0]?.type || "",
      )
      const hasSelectedRequests = requests.some((req) => selectedRequestIds.has(req.id))
      const primaryRequest = requests[0]
      const employeePhotoUrl = "/placeholder.svg?height=100&width=100"

      const getTypeIcon = useCallback((type: string) => {
        const icons: Record<string, React.ReactNode> = {
          descanso: <Timer className="h-4 w-4" />,
          cita: <Calendar className="h-4 w-4" />,
          audiencia: <Shield className="h-4 w-4" />,
          licencia: <FileText className="h-4 w-4" />,
          diaAM: <Clock className="h-4 w-4" />,
          diaPM: <Clock className="h-4 w-4" />,
          "Turno pareja": <Users className="h-4 w-4" />,
          "Tabla partida": <Target className="h-4 w-4" />,
          "Disponible fijo": <Briefcase className="h-4 w-4" />,
        }
        return icons[type] || <FileText className="h-4 w-4" />
      }, [])

      const getTypeColor = useCallback((type: string) => {
        const colors: Record<string, { bg: string; gradient: string }> = {
          descanso: { bg: "bg-blue-500", gradient: "from-blue-500 to-blue-600" },
          cita: { bg: "bg-purple-500", gradient: "from-purple-500 to-purple-600" },
          audiencia: { bg: "bg-orange-500", gradient: "from-orange-500 to-orange-600" },
          licencia: { bg: "bg-pink-500", gradient: "from-pink-500 to-pink-600" },
          diaAM: { bg: "bg-indigo-500", gradient: "from-indigo-500 to-indigo-600" },
          diaPM: { bg: "bg-violet-500", gradient: "from-violet-500 to-violet-600" },
          "Turno pareja": { bg: "bg-teal-500", gradient: "from-teal-500 to-teal-600" },
          "Tabla partida": { bg: "bg-cyan-500", gradient: "from-cyan-500 to-cyan-600" },
          "Disponible fijo": { bg: "bg-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
        }
        return colors[type] || { bg: "bg-gray-500", gradient: "from-gray-500 to-gray-600" }
      }, [])

      const handleViewAll = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setShowDetailedView(true)
      }, [])

      const handleEditRequest = useCallback((request: Request) => {
        // Handle edit logic here
        console.log('Edit request:', request)
      }, [])

      if (!requests.length) return null

      return (
        <>
          <motion.div
            ref={ref}
            className="group h-full"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 120,
              damping: 20
            }}
            whileHover={{
              scale: 1.02,
              y: -8,
              transition: { duration: 0.2 }
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <Card
                  className={`
                    relative h-full rounded-3xl shadow-lg hover:shadow-2xl border-2
                    transition-all duration-500 overflow-hidden backdrop-blur-sm
                    ${hasSelectedRequests
                      ? "ring-4 ring-emerald-300/50 shadow-emerald-200/50 border-emerald-300 bg-emerald-50/50"
                      : "border-gray-200/50 bg-white/95 hover:border-emerald-200"
                    }
                    ${isEquipmentRequest ? "border-l-4 border-l-teal-500" : "border-l-4 border-l-emerald-500"}
                  `}
                >
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-full translate-y-12 -translate-x-12 blur-2xl"></div>

                  {/* Compact Header */}
                  <CardHeader className="p-4 pb-3 bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-emerald-50/80 border-b border-emerald-100/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>

                    <div className="flex justify-between items-center mb-3 relative z-10">
                      <Badge
                        className={`
                          px-3 py-1.5 rounded-xl font-semibold text-xs border-2 shadow-sm
                          ${isEquipmentRequest
                            ? "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border-teal-200"
                            : "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200"
                          }
                        `}
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mr-2"
                        >
                          {isEquipmentRequest ? <Briefcase className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        </motion.div>
                        {isEquipmentRequest ? "Postulación" : "Permiso"}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <StatusBadge status="Pendiente" size="xs" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-7 w-7 p-0 rounded-xl hover:bg-white/80 shadow-sm"
                              >
                                <MoreVertical className="h-3 w-3 text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Más opciones</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Compact User Info */}
                    <div className="flex items-center space-x-3 relative z-10">
                      <UserAvatar name={name} photoUrl={employeePhotoUrl} size="sm" />

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors duration-300">
                          {name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-xs text-emerald-600">
                          <div className="flex items-center space-x-1">
                            <motion.div
                              className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="font-medium">
                              {requests.length} solicitud{requests.length !== 1 ? "es" : ""}
                            </span>
                          </div>
                          <div className="h-3 w-px bg-emerald-200"></div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-2.5 w-2.5 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600">Alta</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 relative z-10">
                    {/* Primary Request - More Compact */}
                    <motion.div
                      className={`
                        p-3 rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden
                        border-2 hover:shadow-md group/request
                        ${selectedRequestIds.has(primaryRequest.id)
                          ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-emerald-100"
                          : "bg-gradient-to-br from-gray-50/80 to-white border-gray-200/50 hover:border-emerald-200 hover:from-emerald-50/30 hover:to-green-50/30"
                        }
                      `}
                      onClick={() => onRequestClick(primaryRequest)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            className={`
                              w-8 h-8 rounded-xl bg-gradient-to-br ${getTypeColor(primaryRequest.type).gradient}
                              flex items-center justify-center shadow-md text-white
                            `}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            {React.cloneElement(getTypeIcon(primaryRequest.type) as React.ReactElement, {
                              className: "h-3.5 w-3.5",
                            })}
                          </motion.div>

                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{primaryRequest.type}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Calendar className="h-2.5 w-2.5" />
                              <span>
                                {primaryRequest.dates
                                  ? Array.isArray(primaryRequest.dates)
                                    ? primaryRequest.dates.length > 1
                                      ? `${formatDateForCard(primaryRequest.dates[0])} - ${formatDateForCard(primaryRequest.dates[primaryRequest.dates.length - 1])}`
                                      : formatDateForCard(primaryRequest.dates[0])
                                    : formatDateForCard(primaryRequest.dates.toString())
                                  : "--"}
                              </span>
                              {primaryRequest.zona && (
                                <>
                                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>{primaryRequest.zona}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5 font-mono bg-white/80 border-emerald-200 text-emerald-700"
                          >
                            #{primaryRequest.code}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-emerald-500 group-hover/request:text-emerald-600 transition-colors" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Additional Requests - More Compact */}
                    <AnimatePresence>
                      {requests.length > 1 && (
                        <motion.div
                          className="mt-3 space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {requests.slice(1, isExpanded ? requests.length : 2).map((request, index) => (
                            <motion.div
                              key={request.id}
                              className="p-2 rounded-lg bg-gray-50/80 border border-gray-200/50 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-300 cursor-pointer"
                              onClick={() => onRequestClick(request)}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.01, x: 2 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getTypeColor(request.type).gradient} flex items-center justify-center shadow-sm`}
                                  >
                                    {React.cloneElement(getTypeIcon(request.type) as React.ReactElement, {
                                      className: "h-3 w-3 text-white",
                                    })}
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-gray-800">{request.type}</span>
                                    <p className="text-xs text-gray-500">
                                      {request.dates
                                        ? Array.isArray(request.dates)
                                          ? request.dates.length > 1
                                            ? `${formatDateForCard(request.dates[0])} - ${formatDateForCard(request.dates[request.dates.length - 1])}`
                                            : formatDateForCard(request.dates[0])
                                          : formatDateForCard(request.dates.toString())
                                        : "--"}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1.5 py-0.5 font-mono bg-white/60"
                                >
                                  #{request.code}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}

                          {requests.length > 2 && (
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsExpanded(!isExpanded)
                                }}
                                className="text-xs text-emerald-600 hover:bg-emerald-50 h-6 px-3 rounded-lg"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Mostrar menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    +{requests.length - 2} más
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>

                  {/* Compact Footer */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between pt-3 border-t border-emerald-100/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewAll}
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-7 px-3 text-xs font-semibold rounded-xl shadow-sm border border-emerald-200/50 hover:border-emerald-300 transition-all duration-300"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver todo
                      </Button>
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                    initial={false}
                  />
                </Card>
              </ContextMenuTrigger>

              {/* Enhanced Context Menu */}
              <ContextMenuContent className="w-56 rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl p-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {requests.map((request) => (
                    <ContextMenuItem
                      key={request.id}
                      onClick={() => onDelete(request)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-3 p-3 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="font-medium">Eliminar {request.type}</span>
                    </ContextMenuItem>
                  ))}
                </motion.div>
              </ContextMenuContent>
            </ContextMenu>
          </motion.div>

          {/* Detailed View Modal */}
          <DetailedViewModal
            name={name}
            requests={requests}
            isOpen={showDetailedView}
            onClose={() => setShowDetailedView(false)}
            onEdit={handleEditRequest}
            onDelete={onDelete}
            onRequestClick={onRequestClick}
          />
        </>
      )
    },
  ),
)

RequestCard.displayName = "RequestCard"

export default RequestCard