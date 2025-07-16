"use client"

import React, { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, getWeek, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
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
} from "lucide-react" // Added more icons
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Added Tooltip imports
import type { Request } from "../hooks/use-permits"

interface WeeklyStatsProps {
  requests: Request[]
}

const WeeklyStats = React.memo(({ requests }: WeeklyStatsProps) => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  // Helper to get icons for request types (reused from RequestCard)
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
  }, [requests])

  const allDaysData = useMemo(() => generateGlobalDayData(), [generateGlobalDayData])

  const weeklyData = useMemo(() => {
    return allDaysData.reduce(
      (acc, dayData) => {
        const weekNumber = getWeek(dayData.date, { weekStartsOn: 1 })
        const year = dayData.date.getFullYear()
        const weekKey = `${year}-W${String(weekNumber).padStart(2, "0")}`
        if (!acc[weekKey]) {
          acc[weekKey] = {
            weekNumber,
            year,
            days: [],
            startDate: startOfWeek(dayData.date, { weekStartsOn: 1 }),
            endDate: endOfWeek(dayData.date, { weekStartsOn: 1 }),
          }
        }
        acc[weekKey].days.push(dayData)
        return acc
      },
      {} as Record<
        string,
        { weekNumber: number; year: number; days: typeof allDaysData; startDate: Date; endDate: Date }
      >,
    )
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
      { limit: 3, bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
      { limit: 5, bg: "bg-emerald-300", text: "text-emerald-800", border: "border-emerald-400" },
      { limit: 10, bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600" },
      { limit: Number.POSITIVE_INFINITY, bg: "bg-emerald-700", text: "text-white", border: "border-emerald-800" },
    ]
    const style = intensityMap.find((i) => count <= i.limit) ?? intensityMap[intensityMap.length - 1] // Changed to <= for correct mapping
    return style[type]
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "approved":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-md">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Actividad por Fecha</h3>
          <p className="text-gray-600 text-sm">Distribución temporal de solicitudes</p>
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <CardHeader className="p-0 pb-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeeks(1)}
              disabled={currentWeekIndex >= sortedWeeklyData.length - 1}
              className="h-9 w-9 text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              {sortedWeeklyData.length > 0 && (
                <CardTitle className="font-bold text-lg text-gray-800">
                  Semana del {format(sortedWeeklyData[currentWeekIndex][1].startDate, "d 'de' MMM", { locale: es })} al{" "}
                  {format(sortedWeeklyData[currentWeekIndex][1].endDate, "d 'de' MMM, yyyy", { locale: es })}
                </CardTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeeks(-1)}
              disabled={currentWeekIndex <= 0}
              className="h-9 w-9 text-gray-600 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[300px] overflow-hidden">
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
                        <ul className="space-y-4 p-2">
                          {weekDays
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .map((dayData) => (
                              <li
                                key={dayData.dateKey}
                                onClick={() => setExpandedDay(expandedDay === dayData.dateKey ? null : dayData.dateKey)}
                                className="cursor-pointer group"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-4">
                                      <div className="w-28 text-right flex-shrink-0">
                                        <p className="font-semibold text-gray-700 capitalize text-sm">
                                          {dayData.dayName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {format(dayData.date, "d 'de' MMMM", { locale: es })}
                                        </p>
                                      </div>
                                      <div className="flex-1">
                                        <div className="h-8 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                          <motion.div
                                            className={`h-full ${getIntensityClass(dayData.count, "bg")} rounded-full flex items-center px-3`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(dayData.count / maxCount) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                          >
                                            <span
                                              className={`font-bold text-sm ${getIntensityClass(dayData.count, "text")}`}
                                            >
                                              {dayData.count}
                                            </span>
                                          </motion.div>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{dayData.count} solicitudes</p>
                                  </TooltipContent>
                                </Tooltip>
                              </li>
                            ))}
                        </ul>
                      </TooltipProvider>
                    )
                  })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {expandedDay && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-emerald-800">
              Detalle del {format(new Date(expandedDay), "d 'de' MMMM, yyyy", { locale: es })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedDay(null)}
              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-200 rounded-lg h-8 px-3 text-sm"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permitCounts.length > 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 shadow-sm">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base font-bold text-emerald-800 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Permisos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-2">
                          {permitCounts.map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-emerald-700">{getTypeName(type)}</span>
                              <Badge
                                variant="outline"
                                className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs"
                              >
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {postulationCounts.length > 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-teal-200 shadow-sm">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base font-bold text-teal-800 flex items-center">
                          <Laptop className="h-4 w-4 mr-2" />
                          Postulaciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="space-y-2">
                          {postulationCounts.map(([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between items-center p-2 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-teal-700">{getTypeName(type)}</span>
                              <Badge
                                variant="outline"
                                className="bg-teal-100 text-teal-800 border-teal-300 font-semibold text-xs"
                              >
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {dayRequests.slice(0, 10).map((request) => (
                    <motion.div
                      key={request.id}
                      className="p-3 rounded-xl border border-emerald-200 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {React.cloneElement(getTypeIcon(request.type) as React.ReactElement, {
                              className: "h-4 w-4 text-emerald-600",
                            })}
                            <p className="font-bold text-emerald-900 text-sm">{request.name}</p>
                          </div>
                          <p className="text-xs text-emerald-600">Código: {request.code}</p>
                          <p className="text-xs font-medium text-emerald-700">
                            Tipo: <span className="font-normal">{request.type}</span>
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} font-semibold text-xs`}>
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                      {request.description && (
                        <div className="mt-2 pt-2 border-t border-emerald-200/50">
                          <p className="text-xs text-emerald-600 line-clamp-2">{request.description}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {dayRequests.length > 10 && (
                    <div className="text-center pt-2">
                      <Badge variant="outline" className="text-xs">
                        +{dayRequests.length - 10} solicitudes más
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}
    </div>
  )
})

WeeklyStats.displayName = "WeeklyStats"

export default WeeklyStats
