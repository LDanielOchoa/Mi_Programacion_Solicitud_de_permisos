"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, getWeek } from "date-fns"
import { es } from "date-fns/locale"
import { useRBACContext } from "./RBACProvider"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileText,
  Laptop,
  Timer,
  Calendar,
  Shield,
  Clock,
  Users,
  Target,
  Briefcase,
  X,
  TrendingUp,
  Eye,
  Filter,
  Download,
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Zap,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Request } from "../hooks/use-permits"

interface WeeklyStatsProps {
  requests: Request[]
}

interface DayModalProps {
  isOpen: boolean
  onClose: () => void
  dayData: {
    day: string
    date: Date
    dayName: string
    count: number
    requests: Request[]
    dateKey: string
  } | null
}

const DayModal: React.FC<DayModalProps> = ({ isOpen, onClose, dayData }) => {
  const [filterType, setFilterType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview")

  const getTypeIcon = useCallback((type: string) => {
    const icons: Record<string, React.ReactNode> = {
      descanso: <Timer className="h-5 w-5" />,
      cita: <Calendar className="h-5 w-5" />,
      audiencia: <Shield className="h-5 w-5" />,
      licencia: <FileText className="h-5 w-5" />,
      diaAM: <Clock className="h-5 w-5" />,
      diaPM: <Clock className="h-5 w-5" />,
      "Turno pareja": <Users className="h-5 w-5" />,
      "Tabla partida": <Target className="h-5 w-5" />,
      "Disponible fijo": <Briefcase className="h-5 w-5" />,
    }
    return icons[type] || <FileText className="h-5 w-5" />
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-200 shadow-amber-100"
      case "approved":
        return "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200 shadow-emerald-100"
      case "rejected":
        return "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-red-100"
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border-gray-200 shadow-gray-100"
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendiente"
      case "approved":
        return "Aprobada"
      case "rejected":
        return "Rechazada"
      default:
        return status
    }
  }, [])

  const getTypeName = useCallback((type: string) => {
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
  }, [])

  const filteredRequests = useMemo(() => {
    if (!dayData) return []
    if (filterType === "all") return dayData.requests
    return dayData.requests.filter(request => request.type === filterType)
  }, [dayData, filterType])

  const typeStats = useMemo(() => {
    if (!dayData) return {}
    const stats: Record<string, { count: number; approved: number; pending: number; rejected: number }> = {}
    
    dayData.requests.forEach(request => {
      if (!stats[request.type]) {
        stats[request.type] = { count: 0, approved: 0, pending: 0, rejected: 0 }
      }
      stats[request.type].count++
      stats[request.type][request.status.toLowerCase() as keyof typeof stats[string]]++
    })
    
    return stats
  }, [dayData])

  const uniqueTypes = useMemo(() => {
    if (!dayData) return []
    return Array.from(new Set(dayData.requests.map(r => r.type)))
  }, [dayData])

  const statusCounts = useMemo(() => {
    if (!dayData) return { approved: 0, pending: 0, rejected: 0 }
    return dayData.requests.reduce((acc, req) => {
      const status = req.status.toLowerCase()
      if (status === 'approved') acc.approved++
      else if (status === 'pending') acc.pending++
      else if (status === 'rejected') acc.rejected++
      return acc
    }, { approved: 0, pending: 0, rejected: 0 })
  }, [dayData])

  if (!dayData) return null

  const modalContent = (
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
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-white/20"
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
                    <Calendar className="h-10 w-10 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-bold mb-2 tracking-tight"
                    >
                      {format(dayData.date, "EEEE", { locale: es }).charAt(0).toUpperCase() + format(dayData.date, "EEEE", { locale: es }).slice(1)}
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl text-emerald-100 font-medium"
                    >
                      {format(dayData.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </motion.p>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center space-x-4 mt-3"
                    >
                      <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-semibold">{dayData.count} Solicitudes</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                        <Star className="h-4 w-4" />
                        <span className="font-semibold">{uniqueTypes.length} Tipos</span>
                      </div>
                    </motion.div>
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

            <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
              {/* Premium Stats Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              >
                <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Total</p>
                        <p className="text-3xl font-bold text-emerald-800 mt-1">{dayData.count}</p>
                      </div>
                      <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <BarChart3 className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Aprobadas</p>
                        <p className="text-3xl font-bold text-green-800 mt-1">{statusCounts.approved}</p>
                      </div>
                      <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Pendientes</p>
                        <p className="text-3xl font-bold text-amber-800 mt-1">{statusCounts.pending}</p>
                      </div>
                      <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <AlertCircle className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Rechazadas</p>
                        <p className="text-3xl font-bold text-red-800 mt-1">{statusCounts.rejected}</p>
                      </div>
                      <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <XCircle className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Tabs */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex space-x-2 mb-8 bg-gray-100 p-2 rounded-2xl"
              >
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    activeTab === "overview"
                      ? "bg-white text-emerald-700 shadow-lg"
                      : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Resumen</span>
                </button>
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    activeTab === "details"
                      ? "bg-white text-emerald-700 shadow-lg"
                      : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  <Eye className="h-5 w-5" />
                  <span>Detalles</span>
                </button>
              </motion.div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Type Statistics */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-3 text-2xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            Estadísticas por Tipo
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Object.entries(typeStats).map(([type, stats], index) => (
                            <motion.div
                              key={type}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    {React.cloneElement(getTypeIcon(type) as React.ReactElement, {
                                      className: "h-6 w-6 text-white",
                                    })}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{getTypeName(type)}</h4>
                                    <p className="text-sm text-gray-600">Total: {stats.count}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                  <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                  <p className="text-sm font-bold text-emerald-800">{stats.approved}</p>
                                  <p className="text-xs text-emerald-600">Aprobadas</p>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
                                  <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                  <p className="text-sm font-bold text-amber-800">{stats.pending}</p>
                                  <p className="text-xs text-amber-600">Pendientes</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
                                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                                  <p className="text-sm font-bold text-red-800">{stats.rejected}</p>
                                  <p className="text-xs text-red-600">Rechazadas</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center justify-between mb-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Filter className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-gray-800">Filtrar por tipo:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                        <Button
                          variant={filterType === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("all")}
                          className={`rounded-xl font-semibold transition-all duration-300 ${
                            filterType === "all" 
                              ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg" 
                              : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                          }`}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Todos ({dayData.count})
                        </Button>
                        {uniqueTypes.map(type => (
                          <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(type)}
                            className={`rounded-xl font-semibold transition-all duration-300 ${
                              filterType === type 
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg" 
                                : "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                            }`}
                          >
                            {React.cloneElement(getTypeIcon(type) as React.ReactElement, {
                              className: "h-4 w-4 mr-2",
                            })}
                            {getTypeName(type)} ({typeStats[type]?.count || 0})
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Requests List */}
                    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-3 text-2xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Solicitudes ({filteredRequests.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {filteredRequests.map((request, index) => (
                            <motion.div
                              key={request.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-6 rounded-2xl border border-gray-200 hover:border-emerald-300 bg-gradient-to-br from-white to-gray-50 hover:from-emerald-50 hover:to-green-50 transition-all duration-300 group shadow-lg hover:shadow-xl"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    {React.cloneElement(getTypeIcon(request.type) as React.ReactElement, {
                                      className: "h-7 w-7 text-white",
                                    })}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{request.name}</h4>
                                    <p className="text-sm text-gray-600 font-medium">Código: {request.code}</p>
                                  </div>
                                </div>
                                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border shadow-sm ${getStatusColor(request.status)}`}>
                                  {getStatusIcon(request.status)}
                                  <span className="font-bold text-sm">{getStatusText(request.status)}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Solicitud</p>
                                  <div className="flex items-center space-x-2">
                                    {React.cloneElement(getTypeIcon(request.type) as React.ReactElement, {
                                      className: "h-4 w-4 text-emerald-600",
                                    })}
                                    <p className="text-sm font-semibold text-gray-800">{getTypeName(request.type)}</p>
                                  </div>
                                </div>
                                {request.dates && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fechas Solicitadas</p>
                                    <p className="text-sm text-gray-700 font-medium">
                                      {typeof request.dates === 'string' 
                                        ? request.dates.split(',').length > 1 
                                          ? `${request.dates.split(',').length} fechas seleccionadas`
                                          : request.dates
                                        : Array.isArray(request.dates) 
                                          ? `${request.dates.length} fechas seleccionadas`
                                          : 'No especificado'
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {request.description && (
                                <div className="pt-4 border-t border-gray-200">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción</p>
                                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">{request.description}</p>
                                </div>
                              )}
                            </motion.div>
                          ))}
                          
                          {filteredRequests.length === 0 && (
                            <div className="text-center py-12">
                              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-10 w-10 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes</h3>
                              <p className="text-gray-500">No se encontraron solicitudes para los filtros seleccionados</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Footer */}
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Mostrando {filteredRequests.length} de {dayData.count} solicitudes
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-300" />
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {format(dayData.date, "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="rounded-xl font-semibold hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-300">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    onClick={onClose} 
                    className="rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg transition-all duration-300"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}

const WeeklyStats = React.memo(({ requests }: WeeklyStatsProps) => {
  const [selectedDay, setSelectedDay] = useState<{
    day: string
    date: Date
    dayName: string
    count: number
    requests: Request[]
    dateKey: string
  } | null>(null)

  // Use RBAC context instead of localStorage
  const { userContext } = useRBACContext()
  const currentUserType = userContext?.userType

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

  const generateGlobalDayData = useCallback(() => {
    const requestsByDate: Record<string, Request[]> = {}
    // Filter requests by userType based on current user type
    let filteredRequests = requests
    if (currentUserType === 'se_maintenance') {
      // For se_maintenance users: show only se_maintenance requests
      filteredRequests = requests.filter(request => (request as any).userType === 'se_maintenance')
    } else if (currentUserType && currentUserType !== 'se_maintenance') {
      // For non-se_maintenance users: show all requests EXCEPT se_maintenance
      filteredRequests = requests.filter(request => (request as any).userType !== 'se_maintenance')
    }
    
    filteredRequests.forEach((request) => {
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
  }, [requests, currentUserType])

  const allDaysData = useMemo(() => generateGlobalDayData(), [generateGlobalDayData])

  // Calculate filtered requests count for display
  const filteredRequestsCount = useMemo(() => {
    if (currentUserType === 'se_maintenance') {
      return requests.filter(request => (request as any).userType === 'se_maintenance').length
    } else if (currentUserType && currentUserType !== 'se_maintenance') {
      return requests.filter(request => (request as any).userType !== 'se_maintenance').length
    }
    return requests.length
  }, [requests, currentUserType])

  const weeklyData = useMemo(() => {
    const weekMap: Record<string, { weekNumber: number; year: number; days: typeof allDaysData; startDate: Date; endDate: Date }> = {}
    
    // First, create weeks from existing data
    allDaysData.forEach(dayData => {
      const weekNumber = getWeek(dayData.date, { weekStartsOn: 1 })
      const year = dayData.date.getFullYear()
      const weekKey = `${year}-W${String(weekNumber).padStart(2, "0")}`
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekNumber,
          year,
          days: [],
          startDate: startOfWeek(dayData.date, { weekStartsOn: 1 }),
          endDate: endOfWeek(dayData.date, { weekStartsOn: 1 }),
        }
      }
    })
    
    // Now fill each week with all 7 days
    Object.keys(weekMap).forEach(weekKey => {
      const week = weekMap[weekKey]
      const fullWeekDays: typeof allDaysData = []
      
      // Generate all 7 days for this week
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(week.startDate)
        currentDate.setDate(week.startDate.getDate() + i)
        
        // Find existing data for this day
        const existingDay = allDaysData.find(d => 
          d.date.toDateString() === currentDate.toDateString()
        )
        
        if (existingDay) {
          fullWeekDays.push(existingDay)
        } else {
          // Create empty day data
          fullWeekDays.push({
            day: String(currentDate.getDate()).padStart(2, "0"),
            date: currentDate,
            dayName: format(currentDate, "EEEE", { locale: es }),
            count: 0,
            requests: [],
            dateKey: currentDate.toISOString().split('T')[0],
          })
        }
      }
      
      week.days = fullWeekDays
    })
    
    return weekMap
  }, [allDaysData])

  const sortedWeeklyData = useMemo(() => {
    return Object.entries(weeklyData).sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
  }, [weeklyData])

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [[direction, currentKey], setSlideDirection] = useState<[number, string]>(() => [
    0,
    sortedWeeklyData[0]?.[0] ?? "",
  ])

  const navigateWeeks = useCallback(
    (newDirection: number) => {
      const newIndex = currentWeekIndex + newDirection
      if (newIndex >= 0 && newIndex < sortedWeeklyData.length) {
        setCurrentWeekIndex(newIndex)
        setSlideDirection([newDirection, sortedWeeklyData[newIndex][0]])
      }
    },
    [currentWeekIndex, sortedWeeklyData],
  )

  const getIntensityClass = useCallback((count: number, type: "bg" | "text" | "border" = "bg") => {
    const intensityMap = [
      { limit: 0, bg: "bg-gray-200", text: "text-gray-500", border: "border-gray-300" },
      { limit: 3, bg: "bg-emerald-200", text: "text-emerald-800", border: "border-emerald-300" },
      { limit: 5, bg: "bg-emerald-400", text: "text-white", border: "border-emerald-500" },
      { limit: 10, bg: "bg-emerald-600", text: "text-white", border: "border-emerald-700" },
      { limit: Number.POSITIVE_INFINITY, bg: "bg-emerald-800", text: "text-white", border: "border-emerald-900" },
    ]
    const style = intensityMap.find((i) => count <= i.limit) ?? intensityMap[intensityMap.length - 1]
    return style[type]
  }, [])

  const handleDayClick = useCallback((dayData: typeof allDaysData[0]) => {
    setSelectedDay(dayData)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-0.5">Actividad por Fecha</h3>
            <p className="text-gray-600 text-sm">Distribución temporal de solicitudes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1 text-xs font-semibold">
            <BarChart3 className="h-3 w-3 mr-1" />
            {allDaysData.length} días
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-1 text-xs font-semibold">
            <FileText className="h-3 w-3 mr-1" />
            {filteredRequestsCount} total
          </Badge>
        </div>
      </div>

      <Card className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-b border-emerald-100 p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeeks(1)}
              disabled={currentWeekIndex >= sortedWeeklyData.length - 1}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              {sortedWeeklyData.length > 0 && (
                <div>
                  <CardTitle className="font-bold text-lg text-gray-800 mb-1">
                    Semana del {format(sortedWeeklyData[currentWeekIndex][1].startDate, "d 'de' MMM", { locale: es })} al
                    {" "}
                  {format(sortedWeeklyData[currentWeekIndex][1].endDate, "d 'de' MMM, yyyy", { locale: es })}
                  </CardTitle>
                  <p className="text-emerald-600 font-medium text-sm">
                    Semana {sortedWeeklyData[currentWeekIndex][1].weekNumber} de {sortedWeeklyData[currentWeekIndex][1].year}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeeks(-1)}
              disabled={currentWeekIndex <= 0}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative h-[350px] overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentKey}
                custom={direction}
                variants={{
                  enter: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (direction: number) => ({ x: direction < 0 ? "-100%" : "100%", opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute w-full"
              >
                {sortedWeeklyData.length > 0 &&
                  (() => {
                    const weekDays = sortedWeeklyData[currentWeekIndex][1].days
                    const maxCount = Math.max(...weekDays.map((d) => d.count), 1)
                    return (
                      <TooltipProvider delayDuration={0}>
                        <div className="flex justify-center space-x-8 px-8">
                          {weekDays
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .map((dayData, index) => (
                              <motion.div
                                key={`${dayData.dateKey}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => dayData.count > 0 && handleDayClick(dayData)}
                                className={`group p-6 rounded-2xl transition-all duration-300 border border-transparent ${
                                  dayData.count > 0 
                                    ? 'cursor-pointer hover:bg-gradient-to-b hover:from-emerald-50 hover:to-green-50 hover:border-emerald-200 hover:shadow-lg'
                                    : 'cursor-default opacity-60'
                                }`}
                                whileHover={dayData.count > 0 ? { scale: 1.03 } : {}}
                                whileTap={dayData.count > 0 ? { scale: 0.97 } : {}}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center space-y-2">
                                      <div className="flex-1 flex flex-col items-center">
                                        <div className="w-24 h-48 bg-gray-100 rounded-2xl overflow-hidden shadow-inner relative flex items-end">
                                          <motion.div
                                            className={`w-full ${getIntensityClass(dayData.count, "bg")} rounded-2xl flex items-end justify-center pb-3 relative overflow-hidden`}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(dayData.count / maxCount) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                                          >
                                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-2xl" />
                                            <span
                                              className={`font-bold text-sm ${getIntensityClass(dayData.count, "text")} relative z-10`}
                                            >
                                              {dayData.count}
                                            </span>
                                          </motion.div>
                                        </div>
                                        <div className="mt-4 text-center">
                                          <p className="font-bold text-gray-800 capitalize text-base mb-1">
                                            {dayData.dayName.substring(0, 3)}
                                          </p>
                                          <p className="text-emerald-600 font-medium text-sm">
                                            {format(dayData.date, "d MMM", { locale: es })}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="w-16 flex justify-center">
                                        <div className="w-8 h-8 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                          <Eye className="h-4 w-4 text-emerald-600" />
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 p-2 rounded-lg">
                                    <p className="font-semibold text-sm">
                                      {dayData.count === 0 ? 'Sin solicitudes' : `${dayData.count} solicitudes`}
                                    </p>
                                    {dayData.count > 0 && <p className="text-gray-300 text-xs">Clic para detalles</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </motion.div>
                            ))}
                        </div>
                      </TooltipProvider>
                    )
                  })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <DayModal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        dayData={selectedDay}
      />
    </div>
  )
})

WeeklyStats.displayName = "WeeklyStats"

export default WeeklyStats