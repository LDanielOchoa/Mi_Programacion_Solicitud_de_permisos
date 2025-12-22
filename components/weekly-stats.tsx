"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
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
            {/* Header Simplificado */}
            <div className="relative bg-gradient-to-r from-[#4cc253] to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {format(dayData.date, "EEEE", { locale: es }).charAt(0).toUpperCase() + format(dayData.date, "EEEE", { locale: es }).slice(1)}
                    </h2>
                    <p className="text-white/80 text-sm font-medium">
                      {format(dayData.date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-1.5 text-xs bg-white/20 rounded-full px-3 py-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="font-semibold">{dayData.count} Solicitudes</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs bg-white/20 rounded-full px-3 py-1">
                        <Star className="h-3.5 w-3.5" />
                        <span className="font-semibold">{uniqueTypes.length} Tipos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>


            <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
              {/* Stats Cards Simplificadas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-emerald-50 border-emerald-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase">Total</p>
                        <p className="text-2xl font-bold text-emerald-800">{dayData.count}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase">Aprobadas</p>
                        <p className="text-2xl font-bold text-green-800">{statusCounts.approved}</p>
                      </div>
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-amber-600 uppercase">Pendientes</p>
                        <p className="text-2xl font-bold text-amber-800">{statusCounts.pending}</p>
                      </div>
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase">Rechazadas</p>
                        <p className="text-2xl font-bold text-red-800">{statusCounts.rejected}</p>
                      </div>
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs Simplificados */}
              <div className="flex space-x-2 mb-6 bg-gray-100 p-1.5 rounded-xl">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${activeTab === "overview"
                    ? "bg-white text-[#4cc253] shadow-sm"
                    : "text-gray-600 hover:text-[#4cc253]"
                    }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Resumen</span>
                </button>
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${activeTab === "details"
                    ? "bg-white text-[#4cc253] shadow-sm"
                    : "text-gray-600 hover:text-[#4cc253]"
                    }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>Detalles</span>
                </button>
              </div>

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
                              className="group relative bg-white rounded-[2rem] border border-gray-100 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden"
                            >
                              {/* Background subtle decoration */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-100/50 transition-colors duration-500" />

                              <div className="relative flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-500">
                                  {React.cloneElement(getTypeIcon(type) as React.ReactElement, {
                                    className: "h-7 w-7 text-[#4cc253]",
                                  })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-black text-gray-900 truncate leading-tight">
                                    {getTypeName(type)}
                                  </h4>
                                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                                    {stats.count} solicitudes totales
                                  </p>
                                </div>
                              </div>

                              <div className="relative space-y-3">
                                {/* Status rows - cleaner and more elegant */}
                                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-[#4cc253]" />
                                    <span className="text-xs font-bold text-emerald-800">Aprobadas</span>
                                  </div>
                                  <span className="text-sm font-black text-emerald-900">{stats.approved}</span>
                                </div>

                                <div className="flex items-center justify-between px-3 py-2 bg-amber-50/50 rounded-xl group-hover:bg-amber-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs font-bold text-amber-800">Pendientes</span>
                                  </div>
                                  <span className="text-sm font-black text-amber-900">{stats.pending}</span>
                                </div>

                                <div className="flex items-center justify-between px-3 py-2 bg-red-50/50 rounded-xl group-hover:bg-red-50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs font-bold text-red-800">Rechazadas</span>
                                  </div>
                                  <span className="text-sm font-black text-red-900">{stats.rejected}</span>
                                </div>
                              </div>

                              {/* Simple visual indicator (mini progress bar) */}
                              <div className="mt-5 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden flex">
                                {stats.approved > 0 && (
                                  <div
                                    style={{ width: `${(stats.approved / stats.count) * 100}%` }}
                                    className="h-full bg-[#4cc253]"
                                  />
                                )}
                                {stats.pending > 0 && (
                                  <div
                                    style={{ width: `${(stats.pending / stats.count) * 100}%` }}
                                    className="h-full bg-amber-400"
                                  />
                                )}
                                {stats.rejected > 0 && (
                                  <div
                                    style={{ width: `${(stats.rejected / stats.count) * 100}%` }}
                                    className="h-full bg-red-400"
                                  />
                                )}
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
                          className={`rounded-xl font-semibold transition-all duration-300 ${filterType === "all"
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
                            className={`rounded-xl font-semibold transition-all duration-300 ${filterType === type
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

  const { userContext } = useRBACContext()
  const currentUserType = userContext?.userType

  const generateGlobalDayData = useCallback(() => {
    const requestsByDate: Record<string, Request[]> = {}

    let filteredRequests = requests
    if (currentUserType === 'se_maintenance') {
      filteredRequests = requests.filter(request => (request as any).userType === 'se_maintenance')
    } else if (currentUserType && currentUserType !== 'se_maintenance') {
      filteredRequests = requests.filter(request => (request as any).userType !== 'se_maintenance')
    }

    filteredRequests.forEach((request) => {
      if (request.dates) {
        const datesArray = typeof request.dates === "string" ? request.dates.split(",") : request.dates
        datesArray.forEach((dateStr: string) => {
          let dateKey = dateStr.trim()

          if (dateKey.includes('/')) {
            const parts = dateKey.split('/');
            if (parts.length === 3) {
              dateKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }

          if (dateKey) {
            // Force reliable parsing by appending time to ensure local interpretation if needed, 
            // but actually standard yyyy-mm-dd is best kept as string key.
            // We just need to validate it's date-like.
            const dateObj = new Date(`${dateKey}T12:00:00`);

            if (!isNaN(dateObj.getTime())) {
              const standardizedKey = format(dateObj, 'yyyy-MM-dd');
              if (!requestsByDate[standardizedKey]) {
                requestsByDate[standardizedKey] = []
              }
              requestsByDate[standardizedKey].push(request)
            }
          }
        })
      }
    })

    const allDaysData = Object.keys(requestsByDate)
      .map((dateKey) => {
        // dateKey is strictly 'yyyy-MM-dd'
        const date = new Date(`${dateKey}T12:00:00`);

        return {
          day: format(date, 'dd'),
          date: date,
          dayName: format(date, "EEEE", { locale: es }),
          count: requestsByDate[dateKey].length,
          requests: requestsByDate[dateKey],
          dateKey: dateKey,
        }
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return allDaysData
  }, [requests, currentUserType])

  const allDaysData = useMemo(() => generateGlobalDayData(), [generateGlobalDayData])

  const weeklyData = useMemo(() => {
    const weekMap: Record<string, { weekNumber: number; year: number; days: typeof allDaysData; startDate: Date; endDate: Date }> = {}

    const registerWeek = (date: Date) => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
      const weekNumber = getWeek(date, { weekStartsOn: 1 })
      // Use year of the week start to avoid end-of-year crossover confusion in keys
      const weekKey = `${format(weekStart, 'yyyy')}-W${String(weekNumber).padStart(2, "0")}`;

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekNumber,
          year: parseInt(format(weekStart, 'yyyy')),
          days: [],
          startDate: weekStart,
          endDate: weekEnd,
        }
      }
      return weekKey;
    }

    // 1. Ensure CURRENT WEEK always exists
    registerWeek(new Date());

    // 2. Register weeks from data
    allDaysData.forEach(dayData => {
      registerWeek(dayData.date);
    })

    // 3. Fill days
    Object.keys(weekMap).forEach(weekKey => {
      const week = weekMap[weekKey]
      const fullWeekDays: typeof allDaysData = []

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(week.startDate);
        currentDate.setDate(week.startDate.getDate() + i);
        // Normalize time to noon to avoiding midnight boundary shift issues
        currentDate.setHours(12, 0, 0, 0);

        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const existingDay = allDaysData.find(d => d.dateKey === dateKey)

        if (existingDay) {
          fullWeekDays.push(existingDay)
        } else {
          fullWeekDays.push({
            day: format(currentDate, 'dd'),
            date: currentDate,
            dayName: format(currentDate, "EEEE", { locale: es }),
            count: 0,
            requests: [],
            dateKey: dateKey,
          })
        }
      }
      week.days = fullWeekDays.sort((a, b) => a.date.getTime() - b.date.getTime());
    })

    return weekMap
  }, [allDaysData])

  const sortedWeeklyData = useMemo(() => {
    return Object.entries(weeklyData).sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
  }, [weeklyData])

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  // Default to Showing Today's week
  useEffect(() => {
    if (sortedWeeklyData.length > 0) {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const todayIndex = sortedWeeklyData.findIndex(([key, week]) => {
        const start = format(week.startDate, 'yyyy-MM-dd');
        const end = format(week.endDate, 'yyyy-MM-dd');
        return todayKey >= start && todayKey <= end;
      });

      if (todayIndex !== -1) {
        setCurrentWeekIndex(todayIndex);
      } else {
        setCurrentWeekIndex(0);
      }
    }
  }, [sortedWeeklyData]);

  // Removiendo redundancia con el useEffect de abajo que ya maneja esto mejor
  const navigateWeeks = useCallback(
    (newDirection: number) => {
      const newIndex = currentWeekIndex + newDirection
      if (newIndex >= 0 && newIndex < sortedWeeklyData.length) {
        setCurrentWeekIndex(newIndex)
      }
    },
    [currentWeekIndex, sortedWeeklyData],
  )

  const currentWeek = sortedWeeklyData[currentWeekIndex]?.[1];

  if (!currentWeek) return null;

  const maxCount = Math.max(...currentWeek.days.map(d => d.count), 5); // Minimum scale of 5 for visual balance

  return (
    <div className="space-y-4">
      <Card className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeeks(1)}
            disabled={currentWeekIndex >= sortedWeeklyData.length - 1}
            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Semana {currentWeek.weekNumber}
            </h4>
            <p className="text-xs font-medium text-gray-500 mt-1">
              {format(currentWeek.startDate, "d MMM", { locale: es })} - {format(currentWeek.endDate, "d MMM, yyyy", { locale: es })}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeeks(-1)}
            disabled={currentWeekIndex <= 0}
            className="h-9 w-9 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex items-end justify-between h-48 gap-2 md:gap-4">
            {currentWeek.days.map((day, idx) => {
              const count = Number(day.count) || 0;
              const safeMax = maxCount || 5;
              const percentage = Math.min(100, Math.max(0, (count / safeMax) * 100));
              const isToday = isSameDay(day.date, new Date());

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full h-32 flex items-end justify-center mb-4">
                    {/* Cantidad arriba de la barra */}
                    {count > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#4cc253] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md z-10">
                        {count}
                      </div>
                    )}

                    {/* Unified Bar Container */}
                    <div className="relative w-full md:w-16 h-full bg-gray-50 rounded-xl overflow-hidden group-hover:bg-gray-100 transition-colors">
                      {/* Active Fill */}
                      {count > 0 && (
                        <div
                          style={{ height: `${Math.max(percentage, 5)}%` }} // Minimum 5% to ensure visibility
                          className="absolute bottom-0 left-0 right-0 bg-[#4cc253] rounded-t-lg transition-all duration-700 ease-out"
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${isToday ? "text-[#4cc253]" : "text-gray-400"}`}>
                      {day.dayName.substring(0, 3)}
                    </span>
                    <span className={`text-xs font-bold block ${isToday ? "text-gray-900 bg-[#4cc253]/10 px-2 py-0.5 rounded-md" : "text-gray-900"}`}>
                      {day.day}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>


  )
})

WeeklyStats.displayName = "WeeklyStats"

export default WeeklyStats