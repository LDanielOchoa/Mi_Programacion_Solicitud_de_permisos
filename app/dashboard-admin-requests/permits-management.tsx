"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { 
  FileText, 
  Laptop, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trash2, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  MapPin,
  Bell,
  Star,
  Archive,
  Send,
  Plus,
  Minus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  User,
  Building,
  Phone,
  Mail,
  Globe,
  Zap,
  ArrowRight,
  Timer,
  Badge as BadgeIcon,
  Briefcase,
  Shield,
  Target,
  Layers,
  Sparkles
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RequestDetails from "../../components/request-details"
import { fetchRequests, updateRequestStatus, deleteRequest } from "../utils/api"
import "./permits-management.css"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// Ultra Modern Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-96">
    <div className="relative">
      {/* Outer ring */}
      <div className="w-20 h-20 border-4 border-emerald-100/30 rounded-full animate-spin"></div>
      {/* Middle ring */}
      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      {/* Inner ring */}
      <div className="absolute top-2 left-2 w-16 h-16 border-4 border-green-300 border-t-transparent rounded-full animate-spin animation-delay-150"></div>
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"></div>
    </div>
  </div>
)

// Premium Stat Card with Glass Morphism
const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = "emerald",
  description,
  onClick 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  color?: "emerald" | "green" | "teal" | "lime" | "amber" | "red"
  description?: string
  onClick?: () => void
}) => {
  const colorClasses = {
    emerald: "from-emerald-500/90 to-emerald-600/90 shadow-emerald-500/20 border-emerald-200/50",
    green: "from-green-500/90 to-green-600/90 shadow-green-500/20 border-green-200/50",
    teal: "from-teal-500/90 to-teal-600/90 shadow-teal-500/20 border-teal-200/50",
    lime: "from-lime-500/90 to-lime-600/90 shadow-lime-500/20 border-lime-200/50",
    amber: "from-amber-500/90 to-amber-600/90 shadow-amber-500/20 border-amber-200/50",
    red: "from-red-500/90 to-red-600/90 shadow-red-500/20 border-red-200/50"
  }

  return (
    <motion.div 
      className={`
        relative overflow-hidden rounded-3xl bg-gradient-to-br ${colorClasses[color]}
        backdrop-blur-xl border p-8 text-white shadow-2xl transition-all duration-500 
        hover:scale-105 hover:shadow-3xl group cursor-pointer
      `}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-black tracking-tight">{value.toLocaleString()}</p>
            {description && (
              <p className="text-sm text-white/70 font-medium">{description}</p>
            )}
          </div>
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center space-x-2 mt-4">
            <div className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">+{trend}%</span>
            </div>
            <span className="text-xs text-white/70">vs mes anterior</span>
          </div>
        )}
      </div>
      
      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </motion.div>
  )
}

// Ultra Modern Request Card
const ModernRequestCard = ({ 
  name, 
  requests, 
  onRequestClick, 
  selectedRequestIds, 
  onDelete 
}: {
  name: string
  requests: Request[]
  onRequestClick: (request: Request) => void
  selectedRequestIds: Set<string>
  onDelete: (request: Request) => void
}) => {
  const isEquipmentRequest = !["descanso", "cita", "audiencia"].includes(requests[0].type)
  const hasSelectedRequests = requests.some(req => selectedRequestIds.has(req.id))
  
  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      descanso: <Timer className="h-4 w-4" />,
      cita: <Calendar className="h-4 w-4" />,
      audiencia: <Shield className="h-4 w-4" />,
      licencia: <FileText className="h-4 w-4" />,
      diaAM: <Clock className="h-4 w-4" />,
      diaPM: <Clock className="h-4 w-4" />,
      "Turno pareja": <Users className="h-4 w-4" />,
      "Tabla partida": <Target className="h-4 w-4" />,
      "Disponible fijo": <Briefcase className="h-4 w-4" />
    }
    return icons[type] || <FileText className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      descanso: "from-blue-500 to-blue-600",
      cita: "from-purple-500 to-purple-600", 
      audiencia: "from-orange-500 to-orange-600",
      licencia: "from-pink-500 to-pink-600",
      diaAM: "from-indigo-500 to-indigo-600",
      diaPM: "from-violet-500 to-violet-600",
      "Turno pareja": "from-teal-500 to-teal-600",
      "Tabla partida": "from-cyan-500 to-cyan-600",
      "Disponible fijo": "from-emerald-500 to-emerald-600"
    }
    return colors[type] || "from-gray-500 to-gray-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group h-full"
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`
              relative h-full bg-white/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl 
              transition-all duration-700 hover:scale-[1.02] rounded-3xl overflow-hidden
              ${hasSelectedRequests ? "ring-4 ring-emerald-400/50 shadow-emerald-200/50" : ""}
              ${isEquipmentRequest ? "border-l-4 border-l-teal-500" : "border-l-4 border-l-emerald-500"}
            `}
          >
            {/* Gradient Background Overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-700
              ${isEquipmentRequest ? "from-teal-500 to-cyan-500" : "from-emerald-500 to-green-500"}
            `} />
            
            {/* Floating Decorative Elements */}
            <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-emerald-100/30 to-green-100/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-teal-100/20 to-emerald-100/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            {/* Header Section */}
            <div className="p-8 pb-4 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-3 rounded-2xl bg-gradient-to-br shadow-lg
                    ${isEquipmentRequest ? "from-teal-500 to-cyan-500" : "from-emerald-500 to-green-500"}
                  `}>
                    {isEquipmentRequest ? (
                      <Laptop className="h-6 w-6 text-white" />
                    ) : (
                      <FileText className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`
                        px-4 py-2 rounded-full font-semibold border-2 text-sm
                        ${isEquipmentRequest 
                          ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }
                      `}
                    >
                      {isEquipmentRequest ? "Postulación" : "Permiso"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 px-4 py-2 rounded-full font-semibold shadow-lg">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Pendiente
                  </Badge>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* User Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-800 transition-colors">
                      {name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <Layers className="h-4 w-4" />
                      <span>{requests.length} solicitud{requests.length !== 1 ? "es" : ""}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests List */}
            <div className="px-8 pb-8 space-y-4 relative z-10">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-5 rounded-2xl bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm
                    hover:from-white/80 hover:to-gray-50/80 transition-all duration-300 cursor-pointer 
                    group/item border border-gray-200/50 hover:border-emerald-300/50 hover:shadow-lg
                    ${selectedRequestIds.has(request.id) ? "bg-emerald-100/80 border-emerald-400/50" : ""}
                  `}
                  onClick={() => onRequestClick(request)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`
                        w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(request.type)} 
                        flex items-center justify-center shadow-lg group-hover/item:shadow-xl transition-shadow
                      `}>
                        {getTypeIcon(request.type)}
                        <span className="text-white text-xs font-bold ml-1">
                          {getTypeIcon(request.type)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800 group-hover/item:text-emerald-800 transition-colors">
                          {request.type}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {request.createdAt ? new Date(request.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                            </span>
                          </span>
                          {request.zona && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{request.zona}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {request.code}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover/item:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                  
                  {request.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Action Footer */}
            <div className="px-8 pb-6 relative z-10">
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Última actualización: hace 2 min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver todo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-56 rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <ContextMenuItem className="flex items-center space-x-3 p-3 rounded-xl">
            <Eye className="h-4 w-4" />
            <span>Ver detalles completos</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center space-x-3 p-3 rounded-xl">
            <Edit className="h-4 w-4" />
            <span>Editar solicitud</span>
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center space-x-3 p-3 rounded-xl">
            <Download className="h-4 w-4" />
            <span>Descargar PDF</span>
          </ContextMenuItem>
          <ContextMenuSeparator className="my-2" />
          {requests.map((request) => (
            <ContextMenuItem
              key={request.id}
              onClick={() => onDelete(request)}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center space-x-3 p-3 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar {request.type}</span>
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  )
}

// Enhanced Detailed Stat Card
const DetailedStatCard = ({
  title,
  stats,
  icon,
  color = "emerald"
}: { 
  title: string
  stats: { [key: string]: number }
  icon: React.ReactNode
  color?: string
}) => (
  <motion.div 
    className="rounded-3xl bg-white/90 backdrop-blur-xl p-8 shadow-2xl border border-gray-200/50 hover:shadow-3xl transition-all duration-500"
    whileHover={{ scale: 1.02, y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="flex items-center space-x-4 mb-8">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">Análisis detallado</p>
      </div>
    </div>
    
    <div className="space-y-5">
      {Object.entries(stats).map(([key, value], index) => (
        <motion.div 
          key={key} 
          className="flex justify-between items-center group p-3 rounded-xl hover:bg-emerald-50/50 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-800 transition-colors">
            {key}
          </span>
          <div className="flex items-center space-x-3">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((value / Math.max(...Object.values(stats))) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="font-bold text-gray-800 min-w-[2rem] text-right">{value}</span>
            <div className={`w-3 h-3 rounded-full ${
              value > 0 ? 'bg-emerald-400 shadow-lg shadow-emerald-200' : 'bg-gray-300'
            } transition-colors`}></div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
)

// Enhanced Weekly Stats Display
const WeeklyStatsDisplay = ({ requests }: { requests: Request[] }) => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const generateGlobalDayData = () => {
    const requestsByDate: Record<string, Request[]> = {}

    requests.forEach((request) => {
      if (request.dates) {
        const datesArray = typeof request.dates === "string" ? request.dates.split(",") : request.dates
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

    const allDaysData = Object.keys(requestsByDate)
      .map((dateKey) => {
        const date = new Date(dateKey)
        const dayRequests = requestsByDate[dateKey]
        return {
          day: String(date.getDate()).padStart(2, "0"),
          date: date,
          dayName: format(date, "EEEE", { locale: es }),
          count: dayRequests.length,
          requests: dayRequests,
          dateKey: dateKey,
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return allDaysData
  }

  const allDaysData = generateGlobalDayData()

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-400 border-gray-200"
    if (count < 3) return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-emerald-100"
    if (count < 5) return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-green-100"
    if (count < 10) return "bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200 shadow-teal-100"
    return "bg-lime-100 text-lime-700 hover:bg-lime-200 border-lime-200 shadow-lime-100"
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Actividad por Fecha</h3>
          <p className="text-gray-600">Distribución temporal de solicitudes</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        <AnimatePresence mode="wait">
          {allDaysData.map((dayData, index) => (
            <motion.div
              key={dayData.dateKey}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex flex-col items-center space-y-3 group cursor-pointer"
              onClick={() => setExpandedDay(expandedDay === dayData.dateKey ? null : dayData.dateKey)}
            >
              <span className="text-sm font-semibold text-gray-600 capitalize">{dayData.dayName}</span>
              <span className="text-xs text-gray-500">{format(dayData.date, "dd MMM", { locale: es })}</span>
              <motion.div
                className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-xl border-2
                  transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-xl
                  ${getIntensityClass(dayData.count)}
                `}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {dayData.count}
              </motion.div>
              <span className="text-xs text-gray-500 font-medium">solicitudes</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {expandedDay && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl border border-emerald-200 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-emerald-800">
              Detalle del {format(new Date(expandedDay), "d 'de' MMMM, yyyy", { locale: es })}
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpandedDay(null)}
              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-200 rounded-xl"
            >
              Cerrar
            </Button>
          </div>
          
          {(() => {
            const dayRequests = allDaysData.find((day) => day.dateKey === expandedDay)?.requests || []
            const typeCounts: Record<string, number> = {}
            dayRequests.forEach((req) => {
              typeCounts[req.type] = (typeCounts[req.type] || 0) + 1
            })

            const permitTypes = ["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"]
            const postulationTypes = ["Turno pareja", "Tabla partida", "Disponible fijo"]

            const permitCounts = Object.entries(typeCounts)
              .filter(([type]) => permitTypes.includes(type))
              .sort((a, b) => b[1] - a[1])

            const postulationCounts = Object.entries(typeCounts)
              .filter(([type]) => postulationTypes.includes(type))
              .sort((a, b) => b[1] - a[1])

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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {permitCounts.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200">
                      <h5 className="text-lg font-bold text-emerald-800 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-3" />
                        Permisos
                      </h5>
                      <div className="space-y-3">
                        {permitCounts.map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
                            <span className="text-sm font-medium text-emerald-700">{getTypeName(type)}</span>
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {postulationCounts.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-teal-200">
                      <h5 className="text-lg font-bold text-teal-800 mb-4 flex items-center">
                        <Laptop className="h-5 w-5 mr-3" />
                        Postulaciones
                      </h5>
                      <div className="space-y-3">
                        {postulationCounts.map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center p-3 rounded-xl hover:bg-teal-50 transition-colors">
                            <span className="text-sm font-medium text-teal-700">{getTypeName(type)}</span>
                            <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 font-semibold">
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {dayRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="p-4 rounded-2xl border border-emerald-200 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <p className="font-bold text-emerald-900">{request.name}</p>
                          <p className="text-sm text-emerald-600">Código: {request.code}</p>
                          <p className="text-sm font-medium text-emerald-700">
                            Tipo: <span className="font-normal">{request.type}</span>
                          </p>
                        </div>
                        <Badge
                          className={
                            request.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }
                        >
                          {request.status === "approved"
                            ? "Aprobada"
                            : request.status === "rejected"
                              ? "Rechazada"
                              : "Pendiente"}
                        </Badge>
                      </div>
                      {request.description && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/50">
                          <p className="text-sm text-emerald-600 line-clamp-2">{request.description}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}
    </div>
  )
}

// Enhanced Quick Actions Panel
const QuickActionsPanel = ({ 
  onRefresh, 
  onExport, 
  onSettings,
  selectedCount 
}: {
  onRefresh: () => void
  onExport: () => void
  onSettings: () => void
  selectedCount: number
}) => (
  <motion.div 
    className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-200/50"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Acciones Rápidas</h3>
          <p className="text-sm text-gray-600">Herramientas de gestión</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefresh} 
                className="text-emerald-600 hover:bg-emerald-100 rounded-xl p-3"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Actualizar datos</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExport} 
                className="text-emerald-600 hover:bg-emerald-100 rounded-xl p-3"
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar datos</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSettings} 
                className="text-emerald-600 hover:bg-emerald-100 rounded-xl p-3"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Configuración</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
    
    {selectedCount > 0 && (
      <motion.div 
        className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl border border-emerald-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium text-emerald-700">
            {selectedCount} solicitud{selectedCount !== 1 ? "es" : ""} seleccionada{selectedCount !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>
    )}
  </motion.div>
)

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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
      const token = localStorage.getItem("accessToken")
      const response = await fetch("https://solicitud-permisos.sao6.com.co/api/admin/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      const responseData = await response.json() // Parsear siempre la respuesta JSON

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || "Error desconocido al obtener las solicitudes";
        console.error("Error del backend o de autenticación:", { status: response.status, details: responseData });
        
        if (response.status === 401) {
          toast({
            title: "Error de autenticación",
            description: "Su sesión ha expirado o no está autorizado. Por favor, inicie sesión de nuevo.",
            variant: "destructive",
            duration: 5000,
          });
          // Opcional: Redirigir al login si el token es inválido
          // router.push("/login"); 
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setRequests([]); // Asegurarse de que requests sea un array vacío en caso de error
        setGroupedRequests({});
        setRequestStats({
          total: 0, approved: 0, pending: 0, rejected: 0,
          permits: { total: 0, pending: 0, rejected: 0, descanso: 0, citaMedica: 0, audiencia: 0, licencia: 0, diaAM: 0, diaPM: 0 },
          postulations: { total: 0, pending: 0, rejected: 0, turnoPareja: 0, tablaPartida: 0, disponibleFijo: 0 },
        });
        return; // Salir de la función si hay un error
      }

      // Asegurarse de que responseData.data sea un array
      const fetchedRequests: Request[] = Array.isArray(responseData.data) ? responseData.data : [];
      setRequests(fetchedRequests);

      // Calculate request stats
      const stats: RequestStats = {
        total: 0, approved: 0, pending: 0, rejected: 0,
        permits: { total: 0, pending: 0, rejected: 0, descanso: 0, citaMedica: 0, audiencia: 0, licencia: 0, diaAM: 0, diaPM: 0 },
        postulations: { total: 0, pending: 0, rejected: 0, turnoPareja: 0, tablaPartida: 0, disponibleFijo: 0 },
      };

      fetchedRequests.forEach((req: Request) => {
        stats.total++;
        if (req.status === "approved") stats.approved++;
        else if (req.status === "pending") stats.pending++;
        else if (req.status === "rejected") stats.rejected++;

        if (["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(req.type)) {
          stats.permits.total++;
          if (req.status === "pending") stats.permits.pending++;
          else if (req.status === "rejected") stats.permits.rejected++;
          if (req.type === "descanso") stats.permits.descanso++;
          else if (req.type === "cita") stats.permits.citaMedica++;
          else if (req.type === "audiencia") stats.permits.audiencia++;
          else if (req.type === "licencia") stats.permits.licencia++;
          else if (req.type === "diaAM") stats.permits.diaAM++;
          else if (req.type === "diaPM") stats.permits.diaPM++;
        } else if (["Turno pareja", "Tabla partida", "Disponible fijo"].includes(req.type)) {
          stats.postulations.total++;
          if (req.status === "pending") stats.postulations.pending++;
          else if (req.status === "rejected") stats.postulations.rejected++;
          if (req.type === "Turno pareja") stats.postulations.turnoPareja++;
          else if (req.type === "Tabla partida") stats.postulations.tablaPartida++;
          else if (req.type === "Disponible fijo") stats.postulations.disponibleFijo++;
        }
      });

      setRequestStats(stats);

      // Filtrar solicitudes según la pestaña activa y el estado
      const filteredData = fetchedRequests.filter((req: Request) => {
        const isPermit = ["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(req.type);
        return (activeTab === "permits" ? isPermit : !isPermit) && req.status === "pending";
      });

      // Agrupar por nombre en lugar de código
      const grouped = groupBy(filteredData, "name");
      setGroupedRequests(grouped);
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

  const renderPagination = () => {
    const totalPages = Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)
    
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-3 mt-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-2xl w-12 h-12 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={`
              w-12 h-12 rounded-2xl transition-all duration-300 font-semibold
              ${currentPage === page 
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-xl shadow-emerald-200" 
                : "border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              }
            `}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-2xl w-12 h-12 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  const currentRequests = Object.entries(filteredRequests).slice(
    (currentPage - 1) * requestsPerPage,
    currentPage * requestsPerPage,
  )

  const totalPages = Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)
  const totalFilteredRequests = Object.values(filteredRequests).reduce((sum, requests) => sum + requests.length, 0)
  const startIndex = (currentPage - 1) * requestsPerPage + 1
  const endIndex = Math.min(startIndex + currentRequests.length - 1, totalFilteredRequests)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setFilterCode(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/30 to-teal-50/30 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), 
            radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.05) 0%, transparent 70%)
          `
        }}></div>
      </div>
      
      <div className="relative max-w-8xl mx-auto px-6 py-12">
        {/* Ultra Modern Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-2xl shadow-emerald-200">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="h-16 w-1 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
            <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-2xl shadow-teal-200">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-emerald-800 via-green-600 to-teal-700 bg-clip-text text-transparent mb-6 leading-tight">
            Sistema de Gestión
          </h1>
          <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
            Plataforma avanzada para la administración inteligente de permisos y postulaciones con análisis en tiempo real
          </p>
        </motion.div>

        {/* Enhanced Quick Actions Panel */}
        <div className="mb-12">
          <QuickActionsPanel
            onRefresh={loadRequests}
            onExport={() => toast({ title: "Exportando", description: "Preparando archivo de exportación..." })}
            onSettings={() => toast({ title: "Configuración", description: "Abriendo panel de configuración..." })}
            selectedCount={selectedRequestIds.size}
          />
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard
            title="Total de Solicitudes"
            value={requestStats.total}
            icon={<Users className="h-8 w-8" />}
            color="emerald"
            trend={12}
            description="Todas las solicitudes registradas"
          />
          <StatCard
            title="Aprobadas"
            value={requestStats.approved}
            icon={<CheckCircle className="h-8 w-8" />}
            color="green"
            trend={8}
            description="Solicitudes procesadas exitosamente"
          />
          <StatCard
            title="Pendientes"
            value={requestStats.pending}
            icon={<AlertCircle className="h-8 w-8" />}
            color="amber"
            description="Requieren atención inmediata"
          />
          <StatCard
            title="Rechazadas"
            value={requestStats.rejected}
            icon={<XCircle className="h-8 w-8" />}
            color="red"
            description="No cumplieron criterios"
          />
        </div>

        {/* Enhanced Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <DetailedStatCard
            title="Análisis de Permisos"
            stats={{
              "Total": requestStats.permits.total,
              "Pendientes": requestStats.permits.pending,
              "Rechazados": requestStats.permits.rejected,
              "Descansos": requestStats.permits.descanso,
              "Citas médicas": requestStats.permits.citaMedica,
              "Audiencias": requestStats.permits.audiencia,
            }}
            icon={<FileText className="h-6 w-6" />}
          />
          <DetailedStatCard
            title="Análisis de Postulaciones"
            stats={{
              "Total": requestStats.postulations.total,
              "Pendientes": requestStats.postulations.pending,
              "Rechazados": requestStats.postulations.rejected,
              "Turno pareja": requestStats.postulations.turnoPareja,
              "Tabla partida": requestStats.postulations.tablaPartida,
              "Disponible fijo": requestStats.postulations.disponibleFijo,
            }}
            icon={<Laptop className="h-6 w-6" />}
          />
        </div>

        {/* Enhanced Weekly Stats */}
        <motion.div 
          className="mb-12 bg-white/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-8">
            <WeeklyStatsDisplay requests={requests} />
          </div>
        </motion.div>

        {/* Ultra Modern Controls */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`
                border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-6 py-3 font-semibold transition-all duration-300
                ${isFilterOpen ? "bg-emerald-100 border-emerald-400 shadow-lg" : "bg-white/80 backdrop-blur-sm"}
              `}
            >
              <Filter className="w-5 h-5 mr-3" />
              {isFilterOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsVerticalView(!isVerticalView)}
              className="border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-6 py-3 font-semibold bg-white/80 backdrop-blur-sm transition-all duration-300"
            >
              {isVerticalView ? <Grid3X3 className="w-5 h-5 mr-3" /> : <List className="w-5 h-5 mr-3" />}
              {isVerticalView ? "Vista cuadrícula" : "Vista lista"}
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 h-5 w-5" />
              <Input
                placeholder="Buscar solicitudes..."
                value={filterCode}
                onChange={handleSearch}
                className="pl-12 w-80 border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/80 backdrop-blur-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-12">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 bg-white/90 backdrop-blur-xl border-2 border-emerald-200 rounded-2xl p-2 shadow-xl">
            <TabsTrigger 
              value="permits" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl transition-all duration-300 font-semibold py-3"
            >
              <FileText className="w-5 h-5 mr-3" />
              Permisos
            </TabsTrigger>
            <TabsTrigger 
              value="equipment" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-xl transition-all duration-300 font-semibold py-3"
            >
              <Laptop className="w-5 h-5 mr-3" />
              Postulaciones
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Enhanced Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12 p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200"
            >
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/80 backdrop-blur-sm font-medium">
                  <SelectValue placeholder="Tipo de solicitud" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
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

              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/80 backdrop-blur-sm font-medium">
                  <SelectValue placeholder="Filtrar por zona" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/80 backdrop-blur-sm font-medium">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <SortDesc className="w-4 h-4 mr-2" />
                      Más recientes
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center">
                      <SortAsc className="w-4 h-4 mr-2" />
                      Más antiguos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl py-3 font-semibold bg-white/80 backdrop-blur-sm transition-all duration-300"
                onClick={() => {
                  setFilterType("all")
                  setFilterCode("")
                  setSelectedZone("all")
                  setSortOrder("newest")
                  setWeekFilter(null)
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : Object.keys(filteredRequests).length === 0 ? (
          <motion.div 
            className="text-center py-24 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center shadow-xl">
              <FileText className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold text-emerald-800 mb-4">No hay solicitudes pendientes</h3>
            <p className="text-xl text-emerald-600 max-w-2xl mx-auto leading-relaxed">
              No se encontraron solicitudes que coincidan con los filtros seleccionados. 
              Prueba ajustando los criterios de búsqueda o verifica que haya solicitudes pendientes.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <p className="text-lg font-medium text-gray-700">
                  Mostrando {currentRequests.length} de {Object.keys(filteredRequests).length} grupos
                </p>
                <div className="h-6 w-px bg-gray-300"></div>
                <p className="text-sm text-gray-600">
                  {totalFilteredRequests} solicitudes en total
                </p>
              </div>
              {selectedRequestIds.size > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-full font-semibold border border-emerald-200">
                  {selectedRequestIds.size} seleccionadas
                </Badge>
              )}
            </div>
            
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <AnimatePresence>
                {currentRequests.map(([name, requests]) => (
                  <ModernRequestCard
                    key={`${name}-${requests[0].id}`}
                    name={name}
                    requests={requests}
                    onRequestClick={handleRequestClick}
                    selectedRequestIds={selectedRequestIds}
                    onDelete={(request) => {
                      setRequestToDelete(request)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {renderPagination()}

        {/* Enhanced Bulk Actions */}
        {selectedRequestIds.size > 0 && (
          <motion.div 
            className="fixed bottom-8 right-8 bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-emerald-200 z-50 max-w-sm"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-gray-800">
                Acciones masivas
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {selectedRequestIds.size} solicitud{selectedRequestIds.size !== 1 ? "es" : ""} seleccionada{selectedRequestIds.size !== 1 ? "s" : ""}
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setBulkActionType("approve")
                  setBulkActionDialogOpen(true)
                }}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl rounded-2xl flex-1 py-3 font-semibold"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                onClick={() => {
                  setBulkActionType("reject")
                  setBulkActionDialogOpen(true)
                }}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-xl rounded-2xl flex-1 py-3 font-semibold"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequests && (
        <RequestDetails
          requests={selectedRequests as any}
          onClose={() => setSelectedRequests(null)}
          onAction={handleRequestAction}
        />
      )}

      {/* Enhanced Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-600 leading-relaxed">
              Esta acción no se puede deshacer. Se eliminará permanentemente la solicitud
              {requestToDelete && ` de ${requestToDelete.type} para ${requestToDelete.name}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-4">
            <AlertDialogCancel className="border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl px-6 py-3 font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-2xl px-6 py-3 font-semibold shadow-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">Confirmar acción masiva</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-600 leading-relaxed">
              ¿Estás seguro de que deseas {bulkActionType === "approve" ? "aprobar" : "rechazar"} las {selectedRequestIds.size} solicitudes seleccionadas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-4">
            <AlertDialogCancel className="border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl px-6 py-3 font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (bulkActionType) handleBulkAction(bulkActionType)
              }}
              className={
                bulkActionType === "approve" 
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-2xl px-6 py-3 font-semibold shadow-xl"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-2xl px-6 py-3 font-semibold shadow-xl"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Processing Modal */}
      {isBulkActionProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            className="bg-white/95 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-emerald-200 max-w-lg w-full mx-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Procesando solicitudes...</h3>
              <Progress value={bulkActionProgress} className="w-full mb-6 h-4 rounded-full" />
              <p className="text-lg font-medium text-gray-600">{Math.round(bulkActionProgress)}% completado</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}