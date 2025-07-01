"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface StatsDisplayProps {
  stats: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  className?: string
}

type DayData = {
  day: string
  date: Date
  count: number
  dayName: string
}

export function StatsDisplay({ stats, className }: StatsDisplayProps) {
  const [weekData, setWeekData] = useState<DayData[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const statItems = [
    {
      label: "Total de solicitude",
      value: stats.total,
      className: "text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100",
      valueClassName: "text-gray-900",
    },
    {
      label: "Aprobadas",
      value: stats.approved,
      className: "text-emerald-900 bg-gradient-to-br from-emerald-50 to-emerald-100",
      valueClassName: "text-emerald-600",
    },
    {
      label: "Pendientes",
      value: stats.pending,
      className: "text-amber-900 bg-gradient-to-br from-amber-50 to-amber-100",
      valueClassName: "text-amber-600",
    },
    {
      label: "Rechazadas",
      value: stats.rejected,
      className: "text-red-900 bg-gradient-to-br from-red-50 to-red-100",
      valueClassName: "text-red-600",
    },
  ]

  // Función para obtener el primer día de la semana (lunes)
  const getFirstDayOfWeek = (offset = 0) => {
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // Convertir domingo (0) a 7
    const diff = today.getDate() - dayOfWeek + 1 // Ajustar al lunes

    const firstDay = new Date(today)
    firstDay.setDate(diff + offset * 7)
    return firstDay
  }

  // Función para generar los datos de la semana completa
  const generateWeekData = (firstDay: Date, requestsData: any[]) => {
    const days = []
    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    // Crear un mapa para contar solicitudes por fecha
    const requestCountByDate: Record<string, number> = {}

    // Procesar cada solicitud para contar por fecha
    requestsData.forEach((request) => {
      // Comprobar si hay fechas en el request
      if (request.dates) {
        // Convertir fechas de string a array si es necesario
        const datesArray = typeof request.dates === "string" ? request.dates.split(",") : request.dates

        // Normalizar y contar cada fecha
        datesArray.forEach((dateStr: string) => {
          const dateKey = dateStr.trim()
          if (dateKey) {
            requestCountByDate[dateKey] = (requestCountByDate[dateKey] || 0) + 1
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

      days.push({
        day: String(date.getDate()).padStart(2, "0"),
        date: date,
        dayName: dayNames[i],
        count: requestCountByDate[dateKey] || 0,
      })
    }

    return days
  }

  // Cargar datos de la API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/requests")
        if (!response.ok) throw new Error("Error al obtener los datos")
        const data = await response.json()

        const firstDay = getFirstDayOfWeek(weekOffset)
        const weekData = generateWeekData(firstDay, data)
        setWeekData(weekData)
      } catch (error) {
        console.error("Error:", error)
        // En caso de error, generar datos vacíos para la semana
        const firstDay = getFirstDayOfWeek(weekOffset)
        const emptyWeekData = generateWeekData(firstDay, [])
        setWeekData(emptyWeekData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [weekOffset])

  // Función para cambiar de semana
  const changeWeek = (direction: number) => {
    setWeekOffset((prev) => prev + direction)
  }

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
    if (count === 0) return "from-gray-50 to-gray-100 text-gray-500"
    if (count < 3) return "from-blue-50 to-blue-100 text-blue-700"
    if (count < 5) return "from-amber-50 to-amber-100 text-amber-700"
    return "from-rose-50 to-rose-100 text-rose-700"
  }

  return (
    <Card className={cn("bg-white shadow-lg", className)}>
      <CardContent className="p-6">
        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <AnimatePresence mode="wait">
            {statItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
              >
                <div className={cn("rounded-lg p-4 transition-all duration-200 hover:shadow-md", item.className)}>
                  <p className="text-sm font-medium mb-1">{item.label}</p>
                  <motion.p
                    className={cn("text-3xl font-bold tracking-tight", item.valueClassName)}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.1 + 0.2,
                    }}
                  >
                    {item.value}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Título de solicitudes por día con navegación */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Solicitudes por Día</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeWeek(-1)}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center text-sm font-medium">
              <Calendar className="h-4 w-4 mr-1 text-gray-500" />
              {getDateRangeText()}
            </div>
            <button
              onClick={() => changeWeek(1)}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visualización por días de la semana */}
        <div className="grid grid-cols-7 gap-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="col-span-7 flex justify-center py-6">
                <div className="animate-pulse bg-gray-200 h-36 w-full rounded-lg"></div>
              </div>
            ) : (
              <>
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
                      className={cn(
                        "w-full rounded-lg p-3 flex flex-col items-center bg-gradient-to-b shadow-sm",
                        getColorClass(dayData.count),
                      )}
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
              </>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
