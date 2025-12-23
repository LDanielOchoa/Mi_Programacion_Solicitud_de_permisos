"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Download,
  Search,
  FileSpreadsheet,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  CalendarIcon,
  FileDown,
  Save,
  MoreHorizontal,
  Trash,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart4,
  Users,
  Calendar,
  Layers,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface Record {
  id: number
  code: string
  name: string
  telefono: string
  tipo: "permiso" | "solicitud" | "equipo"
  novedad: string
  hora: string
  fecha_inicio: string
  fecha_fin: string
  description: string
  respuesta: string
  solicitud: string
  request_type: "permiso" | "solicitud"
  estado?: "aprobado" | "rechazado" | "pendiente"
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface SortConfig {
  key: keyof Record | null
  direction: "asc" | "desc"
}

interface SavedFilter {
  id: string
  name: string
  filters: {
    searchTerm: string
    filterType: string
    filterStatus: string
    dateRange: DateRange
  }
}

export default function HistoricalRecords() {
  // State
  const [records, setRecords] = useState<Record[]>([])
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [weekFilter, setWeekFilter] = useState<string>(() => getCurrentWeek())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  })
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    code: true,
    name: true,
    telefono: true,
    novedad: true,
    fecha_inicio: true,
    fecha_fin: true,
    hora: true,
    description: true,
    respuesta: true,
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  })
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState("todos")
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [newFilterName, setNewFilterName] = useState("")
  const [exportFormat, setExportFormat] = useState<"simple" | "detailed" | "formatted">("formatted")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards" | "stats">("table")
  const [exportProgress, setExportProgress] = useState(0)
  const [debugMode, setDebugMode] = useState(false)

  const tableRef = useRef<HTMLDivElement>(null)

  // Helper functions
  function getCurrentWeek() {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
    return week.toString()
  }

  // Improved date formatting with validation
  function formatDate(dateString: string) {
    if (!dateString) return ""

    try {
      // Handle different date formats
      let date: Date | null = null

      if (dateString.includes(",")) {
        dateString = dateString.split(",")[0].trim()
      }

      if (dateString.includes("/")) {
        const parts = dateString.split("/")
        if (parts.length === 3) {
          // Handle DD/MM/YYYY format
          date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
        }
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
        const dateWithTime = `${dateString}T00:00:00`
        date = new Date(dateWithTime)

        // Usar métodos UTC para evitar problemas de zona horaria
        if (isValid(date)) {
          return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`
        }
      } else {
        // Try to parse ISO format
        date = parseISO(dateString)
      }

      if (!date || !isValid(date)) {
        // If we couldn't parse a valid date, try one more method
        date = new Date(dateString)
      }

      if (!date || !isValid(date)) return dateString

      return format(date, "dd/MM/yyyy", { locale: es })
    } catch (e) {
      console.warn("Error formatting date:", e, dateString)
      return dateString
    }
  }

  // Function to parse a date string into a Date object
  function parseDate(dateString: string): Date | null {
    if (!dateString) return null

    try {
      // Handle different date formats
      if (dateString.includes(",")) {
        dateString = dateString.split(",")[0].trim()
      }

      let date: Date | null = null

      if (dateString.includes("/")) {
        const parts = dateString.split("/")
        if (parts.length === 3) {
          // Para formato DD/MM/YYYY
          date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
        }
      } else {
        // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Añadir T00:00:00 para forzar UTC y evitar el desplazamiento de día
          const dateWithTime = `${dateString}T00:00:00`
          date = new Date(dateWithTime)
        } else {
          date = parseISO(dateString)
        }
      }

      if (!date || !isValid(date)) {
        // Último intento con constructor estándar
        date = new Date(dateString)
      }

      return isValid(date) ? date : null
    } catch (e) {
      console.warn("Error parsing date:", e, dateString)
      return null
    }
  }

  // Date range presets
  const applyDateRangePreset = (preset: string) => {
    const today = new Date()
    let from: Date | undefined = undefined
    let to: Date | undefined = undefined

    switch (preset) {
      case "today":
        from = today
        to = today
        break
      case "yesterday":
        from = addDays(today, -1)
        to = addDays(today, -1)
        break
      case "thisWeek":
        from = startOfWeek(today, { locale: es })
        to = endOfWeek(today, { locale: es })
        break
      case "lastWeek":
        from = startOfWeek(addDays(today, -7), { locale: es })
        to = endOfWeek(addDays(today, -7), { locale: es })
        break
      case "thisMonth":
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
      case "lastMonth":
        from = startOfMonth(addDays(startOfMonth(today), -1))
        to = endOfMonth(addDays(startOfMonth(today), -1))
        break
      case "last30Days":
        from = addDays(today, -30)
        to = today
        break
      case "last90Days":
        from = addDays(today, -90)
        to = today
        break
      case "thisYear":
        from = new Date(today.getFullYear(), 0, 1)
        to = new Date(today.getFullYear(), 11, 31)
        break
      case "clear":
        // Just leave undefined to clear
        break
    }

    setDateRange({ from, to })
    setIsDatePickerOpen(false)
  }

  // Función mejorada para determinar el tipo de registro
  const determineRecordType = (record: any): "permiso" | "solicitud" | "equipo" => {
    // Si el registro ya tiene un tipo definido, usarlo
    if (record.tipo && ["permiso", "solicitud", "equipo"].includes(record.tipo)) {
      return record.tipo as "permiso" | "solicitud" | "equipo"
    }

    // Si tiene request_type, usarlo
    if (record.request_type && ["permiso", "solicitud"].includes(record.request_type)) {
      return record.request_type as "permiso" | "solicitud"
    }

    // Intentar determinar por la novedad o descripción
    const novedadLower = (record.novedad || "").toLowerCase()
    const descriptionLower = (record.description || "").toLowerCase()

    if (
      novedadLower.includes("permiso") ||
      novedadLower.includes("licencia") ||
      novedadLower.includes("vacaciones") ||
      descriptionLower.includes("permiso")
    ) {
      return "permiso"
    }

    if (
      novedadLower.includes("solicitud") ||
      novedadLower.includes("petición") ||
      descriptionLower.includes("solicitud")
    ) {
      return "solicitud"
    }

    if (
      novedadLower.includes("equipo") ||
      novedadLower.includes("herramienta") ||
      descriptionLower.includes("equipo")
    ) {
      return "equipo"
    }

    // Por defecto, asignar como permiso
    return "permiso"
  }

  // Función mejorada para determinar el estado del registro
  const determineRecordStatus = (record: any): "aprobado" | "rechazado" | "pendiente" => {
    // Si el registro ya tiene un estado definido en español, usarlo
    if (record.estado && ["aprobado", "rechazado", "pendiente"].includes(record.estado)) {
      return record.estado as "aprobado" | "rechazado" | "pendiente"
    }

    // Verificar el campo solicitud (que viene del API)
    if (record.solicitud) {
      const solicitudLower = record.solicitud.toLowerCase()

      if (solicitudLower === "approved") return "aprobado"
      if (solicitudLower === "rejected") return "rechazado"
      if (solicitudLower === "pending") return "pendiente"
    }

    // Por defecto, marcar como pendiente
    return "pendiente"
  }

  // Modificar la función fetchRecords para usar el endpoint original y procesar correctamente los datos
  const fetchRecords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Determinar qué endpoint usar
      // Por defecto usamos el endpoint general
      let url = "solicitud-permisos.sao6.com.co/api/excel"

      // Si estamos filtrando por estado "aprobado", podemos usar el endpoint específico
      if (filterStatus === "aprobado") {
        url = "solicitud-permisos.sao6.com.co/api/excel-novedades"
      }

      const params = new URLSearchParams()

      if (weekFilter) {
        params.append("week", weekFilter)
      }

      if (dateRange.from && dateRange.to) {
        params.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
        params.append("endDate", format(dateRange.to, "yyyy-MM-dd"))
      }

      // Solo añadimos el parámetro de estado si no estamos usando el endpoint de novedades
      // ya que ese endpoint ya filtra por aprobados
      if (filterStatus !== "all" && url !== "solicitud-permisos.sao6.com.co/api/excel-novedades") {
        const apiStatus =
          filterStatus === "aprobado" ? "approved" : filterStatus === "rechazado" ? "rejected" : "pending"
        params.append("status", apiStatus)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("Fetching data from:", url)
      const response = await fetch(url)
      const contentType = response.headers.get("content-type")

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        console.log("Raw data from API:", data)

        // Procesar los datos para asegurar que tengan el formato correcto
        const processedData = data.map((record: any, index: number) => {
          // Asignar un ID único si no existe
          const id = record.id || index + 1

          // Determinar el tipo de registro basado en la novedad
          let tipo: "permiso" | "solicitud" | "equipo" = "permiso" // Por defecto es permiso

          const novedadLower = (record.novedad || "").toLowerCase()
          if (
            novedadLower.includes("descanso") ||
            novedadLower.includes("licencia") ||
            novedadLower.includes("permiso")
          ) {
            tipo = "permiso"
          } else if (novedadLower.includes("solicitud") || novedadLower.includes("petición")) {
            tipo = "solicitud"
          } else if (novedadLower.includes("equipo") || novedadLower.includes("herramienta")) {
            tipo = "equipo"
          }

          // Determinar el estado del registro
          // Para el endpoint excel-novedades, sabemos que todos son aprobados
          let estado: "aprobado" | "rechazado" | "pendiente" = "pendiente" // Por defecto es pendiente

          if (url === "solicitud-permisos.sao6.com.co/api/excel-novedades") {
            estado = "aprobado" // Todos los registros de este endpoint son aprobados
          } else {
            // Para el endpoint general, intentamos inferir el estado
            // Si tiene respuesta, asumimos que está aprobado o rechazado
            if (record.respuesta && record.respuesta.trim() !== "") {
              // Si la respuesta contiene palabras negativas, asumimos que está rechazado
              const respuestaLower = record.respuesta.toLowerCase()
              if (
                respuestaLower.includes("rechaz") ||
                respuestaLower.includes("deneg") ||
                respuestaLower.includes("no aprob") ||
                respuestaLower.includes("no se aprob")
              ) {
                estado = "rechazado"
              } else {
                estado = "aprobado"
              }
            }
            // Si no tiene respuesta, se queda como pendiente
          }

          return {
            ...record,
            id,
            tipo,
            estado,
            // Asegurar que estos campos existan para evitar errores
            telefono: record.telefono || "",
            hora: record.hora || "",
            description: record.description || "",
            respuesta: record.respuesta || "",
            // Añadir campo solicitud para compatibilidad
            solicitud: estado === "aprobado" ? "approved" : estado === "rechazado" ? "rejected" : "pending",
          }
        })

        console.log("Processed data:", processedData)
        setRecords(processedData)
        setFilteredRecords(processedData)
      } else {
        throw new Error("La respuesta no es JSON")
      }
    } catch (error) {
      console.error("Error al cargar registros:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar datos")

      // Datos de ejemplo para desarrollo solo si hay error
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        code: `C${1000 + i}`,
        name: `Usuario ${i + 1}`,
        telefono: `31${Math.floor(Math.random() * 10000000)}`,
        tipo: ["permiso", "solicitud", "equipo"][Math.floor(Math.random() * 3)] as "permiso" | "solicitud" | "equipo",
        novedad: ["Vacaciones", "Permiso médico", "Licencia", "Capacitación"][Math.floor(Math.random() * 4)],
        hora: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        fecha_inicio: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
          .toISOString()
          .split("T")[0],
        fecha_fin: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
          .toISOString()
          .split("T")[0],
        description: `Descripción detallada del registro ${i + 1}`,
        respuesta: Math.random() > 0.3 ? `Respuesta al registro ${i + 1}` : "",
        solicitud: ["approved", "rejected", "pending"][Math.floor(Math.random() * 3)],
        request_type: ["permiso", "solicitud"][Math.floor(Math.random() * 2)] as "permiso" | "solicitud",
        estado: ["aprobado", "rechazado", "pendiente"][Math.floor(Math.random() * 3)] as
          | "aprobado"
          | "rechazado"
          | "pendiente",
      }))

      setRecords(mockData)
      setFilteredRecords(mockData)
    } finally {
      setLoading(false)
    }
  }, [weekFilter, dateRange, filterStatus])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Enhanced filtering logic with date range improvements
  const filterRecords = useCallback(() => {
    let filtered = [...records]

    // Search filter - enhanced to search across more fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (record) =>
          record.code.toLowerCase().includes(searchLower) ||
          record.name.toLowerCase().includes(searchLower) ||
          record.novedad.toLowerCase().includes(searchLower) ||
          record.description.toLowerCase().includes(searchLower) ||
          record.telefono.toLowerCase().includes(searchLower) ||
          (record.respuesta && record.respuesta.toLowerCase().includes(searchLower)),
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((record) => record.tipo === filterType)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((record) => record.estado === filterStatus)
    }

    // Tab filter
    if (activeTab === "permisos") {
      filtered = filtered.filter((record) => record.tipo === "permiso")
    } else if (activeTab === "solicitudes") {
      filtered = filtered.filter((record) => record.tipo === "solicitud")
    } else if (activeTab === "equipos") {
      filtered = filtered.filter((record) => record.tipo === "equipo")
    }

    // Simplified date range filter - only show records between start and end date
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((record) => {
        const startDate = parseDate(record.fecha_inicio)
        if (!startDate) return false

        // Check if the record's start date is between the selected date range
        return startDate >= dateRange.from! && startDate <= dateRange.to!
      })
    } else if (dateRange.from) {
      // If only from date is provided
      filtered = filtered.filter((record) => {
        const startDate = parseDate(record.fecha_inicio)
        if (!startDate) return false
        return startDate >= dateRange.from!
      })
    } else if (dateRange.to) {
      // If only to date is provided
      filtered = filtered.filter((record) => {
        const startDate = parseDate(record.fecha_inicio)
        if (!startDate) return false
        return startDate <= dateRange.to!
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Record] ?? ""
        const bValue = b[sortConfig.key as keyof Record] ?? ""

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredRecords(filtered)
  }, [searchTerm, filterType, filterStatus, records, dateRange, sortConfig, activeTab])

  useEffect(() => {
    filterRecords()
  }, [searchTerm, filterType, filterStatus, records, dateRange, sortConfig, activeTab, filterRecords])

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const paginatedRecords = filteredRecords.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Selection handling
  useEffect(() => {
    setIsAllSelected(
      paginatedRecords.length > 0 && paginatedRecords.every((record) => selectedRecords.includes(record.id)),
    )
  }, [paginatedRecords, selectedRecords])

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRecords((prev) => prev.filter((id) => !paginatedRecords.some((record) => record.id === id)))
    } else {
      setSelectedRecords((prev) => [
        ...prev,
        ...paginatedRecords.map((record) => record.id).filter((id) => !prev.includes(id)),
      ])
    }
  }

  const toggleSelectRecord = (id: number) => {
    setSelectedRecords((prev) => (prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]))
  }

  // Get selected records data
  const getSelectedRecordsData = () => {
    return records.filter((record) => selectedRecords.includes(record.id))
  }

  // Sorting
  const requestSort = (key: keyof Record) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
  }

  // Saved filters
  const saveCurrentFilters = () => {
    if (!newFilterName.trim()) return

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName,
      filters: {
        searchTerm,
        filterType,
        filterStatus,
        dateRange: { ...dateRange },
      },
    }

    setSavedFilters((prev) => [...prev, newFilter])
    setNewFilterName("")
  }

  const applySavedFilter = (filter: SavedFilter) => {
    setSearchTerm(filter.filters.searchTerm)
    setFilterType(filter.filters.filterType)
    setFilterStatus(filter.filters.filterStatus)
    setDateRange(filter.filters.dateRange)
  }

  const deleteSavedFilter = (id: string) => {
    setSavedFilters((prev) => prev.filter((filter) => filter.id !== id))
  }

  // Excel export functions with enhanced formatting
  const exportToExcel = async () => {
    try {
      setIsExporting(true)
      setExportProgress(10)

      // Determine which records to export
      let recordsToExport = filteredRecords
      if (selectedRecords.length > 0) {
        recordsToExport = getSelectedRecordsData()
      }

      setExportProgress(30)

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Prepare data for the main sheet
      const exportData = recordsToExport.map((record) => {
        const data: { [key: string]: any } = {}

        if (visibleColumns.code) data["Código"] = record.code
        if (visibleColumns.name) data["Nombre"] = record.name
        if (visibleColumns.telefono) data["Teléfono"] = record.telefono
        if (visibleColumns.novedad) data["Novedad"] = record.novedad
        if (visibleColumns.hora) data["Hora"] = record.hora

        // Formatear fechas correctamente para evitar problemas de zona horaria
        if (visibleColumns.fecha_inicio) {
          try {
            if (record.fecha_inicio && record.fecha_inicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
              const dateWithTime = `${record.fecha_inicio}T00:00:00`;
              const date = new Date(dateWithTime);
              if (isValid(date)) {
                data["Fecha Inicio"] = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
              } else {
                data["Fecha Inicio"] = formatDate(record.fecha_inicio);
              }
            } else {
              data["Fecha Inicio"] = formatDate(record.fecha_inicio);
            }
          } catch (error) {
            console.error("Error al formatear fecha inicio:", error, record.fecha_inicio);
            data["Fecha Inicio"] = formatDate(record.fecha_inicio);
          }
        }

        if (visibleColumns.fecha_fin) {
          try {
            if (record.fecha_fin && record.fecha_fin.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
              const dateWithTime = `${record.fecha_fin}T00:00:00`;
              const date = new Date(dateWithTime);
              if (isValid(date)) {
                data["Fecha Fin"] = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
              } else {
                data["Fecha Fin"] = formatDate(record.fecha_fin);
              }
            } else {
              data["Fecha Fin"] = formatDate(record.fecha_fin);
            }
          } catch (error) {
            console.error("Error al formatear fecha fin:", error, record.fecha_fin);
            data["Fecha Fin"] = formatDate(record.fecha_fin);
          }
        }

        if (visibleColumns.description) data["Descripción"] = record.description
        if (visibleColumns.respuesta) data["Respuesta"] = record.respuesta
        data["Tipo"] = record.tipo
        data["Estado"] = record.estado

        return data
      })

      setExportProgress(50)

      // Create main worksheet
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Enhanced formatting for the detailed or formatted export
      if (exportFormat === "detailed" || exportFormat === "formatted") {
        // Set column widths
        const colWidths = [
          { wch: 10 }, // Código
          { wch: 25 }, // Nombre
          { wch: 15 }, // Teléfono
          { wch: 20 }, // Novedad
          { wch: 10 }, // Hora
          { wch: 15 }, // Fecha Inicio
          { wch: 15 }, // Fecha Fin
          { wch: 40 }, // Descripción
          { wch: 40 }, // Respuesta
          { wch: 12 }, // Tipo
          { wch: 12 }, // Estado
        ]
        ws["!cols"] = colWidths
      }

      setExportProgress(70)

      // Add the main worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Registros")

      // For detailed export, add summary sheets
      if (exportFormat === "detailed") {
        // Add a summary sheet
        const summaryData = [
          { Estadística: "Total de registros", Valor: recordsToExport.length },
          { Estadística: "Aprobados", Valor: recordsToExport.filter((r) => r.estado === "aprobado").length },
          { Estadística: "Rechazados", Valor: recordsToExport.filter((r) => r.estado === "rechazado").length },
          { Estadística: "Pendientes", Valor: recordsToExport.filter((r) => r.estado === "pendiente").length },
          { Estadística: "Permisos", Valor: recordsToExport.filter((r) => r.tipo === "permiso").length },
          { Estadística: "Solicitudes", Valor: recordsToExport.filter((r) => r.tipo === "solicitud").length },
          { Estadística: "Equipos", Valor: recordsToExport.filter((r) => r.tipo === "equipo").length },
        ]

        const summaryWs = XLSX.utils.json_to_sheet(summaryData)
        summaryWs["!cols"] = [{ wch: 20 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen")

        // Add sheets separated by type
        const permisosData = recordsToExport.filter((r) => r.tipo === "permiso")
        if (permisosData.length > 0) {
          const permisosWs = XLSX.utils.json_to_sheet(
            permisosData.map((p) => ({
              Código: p.code,
              Nombre: p.name,
              "Fecha Inicio": formatDate(p.fecha_inicio),
              "Fecha Fin": formatDate(p.fecha_fin),
              Novedad: p.novedad,
              Estado: p.estado,
            })),
          )
          XLSX.utils.book_append_sheet(wb, permisosWs, "Permisos")
        }

        const solicitudesData = recordsToExport.filter((r) => r.tipo === "solicitud")
        if (solicitudesData.length > 0) {
          const solicitudesWs = XLSX.utils.json_to_sheet(
            solicitudesData.map((p) => ({
              Código: p.code,
              Nombre: p.name,
              Fecha: formatDate(p.fecha_inicio),
              Solicitud: p.solicitud || p.novedad,
              Respuesta: p.respuesta,
              Estado: p.estado,
            })),
          )
          XLSX.utils.book_append_sheet(wb, solicitudesWs, "Solicitudes")
        }
      }

      setExportProgress(90)

      // Add metadata
      if (exportFormat === "formatted" || exportFormat === "detailed") {
        wb.Props = {
          Title: "Registros Históricos",
          Subject: "Exportación de datos",
          Author: "Sistema de Registros",
          CreatedDate: new Date(),
        }
      }

      // Write file with a descriptive filename
      const dateStr = format(new Date(), "yyyyMMdd_HHmmss")
      XLSX.writeFile(wb, `registros_historicos_${dateStr}.xlsx`)
      setExportProgress(100)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      setError(error instanceof Error ? error.message : "Error al exportar a Excel")
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    }
  }

  const exportToExcelPermisos = async () => {
    try {
      setIsExporting(true)
      setExportProgress(20)

      // Filter records to include only permisos
      const permisosRecords = records.filter((record) => record.tipo === "permiso")

      if (permisosRecords.length === 0) {
        setError("No hay registros de permisos para exportar")
        return
      }

      setExportProgress(40)

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Create formatted data for the permisos worksheet
      const permisosData = permisosRecords.map((record) => {
        // Formatear fechas correctamente para evitar problemas de zona horaria
        let startDate = "";
        let endDate = "";

        try {
          if (record.fecha_inicio) {
            if (record.fecha_inicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
              const dateWithTime = `${record.fecha_inicio}T00:00:00`;
              const date = new Date(dateWithTime);
              if (isValid(date)) {
                startDate = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
              } else {
                startDate = formatDate(record.fecha_inicio);
              }
            } else {
              startDate = formatDate(record.fecha_inicio);
            }
          }

          if (record.fecha_fin) {
            if (record.fecha_fin.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Para formato YYYY-MM-DD, añadir T00:00:00 para evitar problemas de zona horaria
              const dateWithTime = `${record.fecha_fin}T00:00:00`;
              const date = new Date(dateWithTime);
              if (isValid(date)) {
                endDate = `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
              } else {
                endDate = formatDate(record.fecha_fin);
              }
            } else {
              endDate = formatDate(record.fecha_fin);
            }
          }
        } catch (error) {
          console.error("Error al formatear fechas:", error, record.fecha_inicio, record.fecha_fin);
          startDate = formatDate(record.fecha_inicio);
          endDate = formatDate(record.fecha_fin);
        }

        return {
          Código: record.code,
          Nombre: record.name,
          Teléfono: record.telefono,
          "Fecha Inicio": startDate,
          "Fecha Fin": endDate,
          Novedad: record.novedad,
          Estado: record.estado || "Pendiente",
          Hora: record.hora || "",
          Observaciones: record.description || "",
        }
      })

      setExportProgress(60)

      // Create worksheet with custom formatting
      const ws = XLSX.utils.json_to_sheet(permisosData)

      // Set column widths
      ws["!cols"] = [
        { wch: 10 }, // Código
        { wch: 25 }, // Nombre
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Fecha Inicio
        { wch: 15 }, // Fecha Fin
        { wch: 25 }, // Novedad
        { wch: 15 }, // Estado
        { wch: 10 }, // Hora
        { wch: 40 }, // Observaciones
      ]

      setExportProgress(80)

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Novedades Conductor")

      // Add metadata
      wb.Props = {
        Title: "Permisos y Novedades",
        Subject: "Reporte de Permisos",
        Author: "Sistema de Registros",
        CreatedDate: new Date(),
      }

      // Write file with date in filename
      const dateStr = format(new Date(), "yyyyMMdd")
      XLSX.writeFile(wb, `Novedad_conductor_${dateStr}.xlsx`)
      setExportProgress(100)
    } catch (error) {
      console.error("Error al exportar permisos a Excel:", error)
      setError(error instanceof Error ? error.message : "Error al exportar permisos")
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setFilterStatus("all")
    setDateRange({ from: undefined, to: undefined })
    setWeekFilter(getCurrentWeek())
    setSortConfig({ key: null, direction: "asc" })
    setPage(1)
  }

  // Scroll to top of table
  const scrollToTop = () => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Generate week options
  const generateWeekOptions = () => {
    const options = []
    for (let i = 1; i <= 52; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          Semana {i}
        </SelectItem>,
      )
    }
    return options
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobado":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Aprobado
          </Badge>
        )
      case "rechazado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rechazado
          </Badge>
        )
      case "pendiente":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pendiente
          </Badge>
        )
      default:
        return null
    }
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "permiso":
        return (
          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
            Permiso
          </Badge>
        )
      case "solicitud":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
            Solicitud
          </Badge>
        )
      case "equipo":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 font-medium">
            Equipo
          </Badge>
        )
      default:
        return null
    }
  }

  // Determine if the current filters are active
  const hasActiveFilters = () => {
    return (
      searchTerm !== "" ||
      filterType !== "all" ||
      filterStatus !== "all" ||
      dateRange.from !== undefined ||
      dateRange.to !== undefined ||
      sortConfig.key !== null
    )
  }

  // Bulk actions
  const deleteSelectedRecords = () => {
    // This would typically call an API to delete records
    // For this demo, we'll just filter them out of our state
    setRecords((prev) => prev.filter((record) => !selectedRecords.includes(record.id)))
    setSelectedRecords([])
  }

  const updateSelectedRecordsStatus = (newStatus: "aprobado" | "rechazado" | "pendiente") => {
    // Update status of selected records
    setRecords((prev) =>
      prev.map((record) => (selectedRecords.includes(record.id) ? { ...record, estado: newStatus } : record)),
    )
  }

  // Estadísticas para el dashboard
  const stats = {
    total: records.length,
    aprobados: records.filter((r) => r.estado === "aprobado").length,
    rechazados: records.filter((r) => r.estado === "rechazado").length,
    pendientes: records.filter((r) => r.estado === "pendiente").length,
    permisos: records.filter((r) => r.tipo === "permiso").length,
    solicitudes: records.filter((r) => r.tipo === "solicitud").length,
    equipos: records.filter((r) => r.tipo === "equipo").length,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full shadow-lg border-t-4 border-t-emerald-500">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Registro Histórico
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  Consulta y exporta el historial de registros
                </CardDescription>
              </div>

              <div className="flex flex-col gap-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                  <TabsList className="grid grid-cols-4 w-full md:w-auto bg-emerald-100 dark:bg-emerald-800">
                    <TabsTrigger
                      value="todos"
                      className="text-xs md:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300"
                    >
                      Todos
                    </TabsTrigger>
                    <TabsTrigger
                      value="permisos"
                      className="text-xs md:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300"
                    >
                      Permisos
                    </TabsTrigger>
                    <TabsTrigger
                      value="solicitudes"
                      className="text-xs md:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300"
                    >
                      Solicitudes
                    </TabsTrigger>
                    <TabsTrigger
                      value="equipos"
                      className="text-xs md:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-300"
                    >
                      Equipos
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex gap-2 justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "table" ? "default" : "outline"}
                          size="icon"
                          onClick={() => setViewMode("table")}
                          className={
                            viewMode === "table"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "border-emerald-200 text-emerald-700"
                          }
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de tabla</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "cards" ? "default" : "outline"}
                          size="icon"
                          onClick={() => setViewMode("cards")}
                          className={
                            viewMode === "cards"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "border-emerald-200 text-emerald-700"
                          }
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de tarjetas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "stats" ? "default" : "outline"}
                          size="icon"
                          onClick={() => setViewMode("stats")}
                          className={
                            viewMode === "stats"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "border-emerald-200 text-emerald-700"
                          }
                        >
                          <BarChart4 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de estadísticas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              {/* Search and filters */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-emerald-600" />
                      <Input
                        placeholder="Buscar por código, nombre, novedad o descripción..."
                        className="pl-8 border-emerald-200 focus-visible:ring-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("gap-2 border-emerald-200 text-emerald-700", showFilters && "bg-emerald-100")}
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden md:inline">Filtros</span>
                          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{showFilters ? "Ocultar filtros" : "Mostrar filtros"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={!hasActiveFilters()}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden md:inline">Reiniciar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reiniciar filtros</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden md:inline">Columnas</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <h4 className="font-medium text-emerald-800">Mostrar columnas</h4>
                        <Separator className="bg-emerald-100" />
                        <div className="grid gap-2">
                          {Object.entries({
                            code: "Código",
                            name: "Nombre",
                            telefono: "Teléfono",
                            novedad: "Novedad",
                            fecha_inicio: "Fecha Inicio",
                            fecha_fin: "Fecha Fin",
                            hora: "Hora",
                            description: "Descripción",
                            respuesta: "Respuesta",
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`column-${key}`}
                                checked={visibleColumns[key]}
                                onCheckedChange={(checked) => {
                                  setVisibleColumns({
                                    ...visibleColumns,
                                    [key]: !!checked,
                                  })
                                }}
                                className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                              />
                              <Label htmlFor={`column-${key}`}>{label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Botón de modo debug */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={debugMode ? "default" : "outline"}
                          size="icon"
                          onClick={() => setDebugMode(!debugMode)}
                          className={
                            debugMode ? "bg-amber-600 hover:bg-amber-700" : "border-emerald-200 text-emerald-700"
                          }
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Modo debug</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Saved filters */}
                {savedFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-emerald-700 pt-2">Filtros guardados:</span>
                    {savedFilters.map((filter) => (
                      <Badge
                        key={filter.id}
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-2 cursor-pointer hover:bg-emerald-100"
                        onClick={() => applySavedFilter(filter)}
                      >
                        {filter.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSavedFilter(filter.id)
                          }}
                          className="text-emerald-500 hover:text-emerald-700"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Debug info */}
                {debugMode && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                    <h3 className="font-medium text-amber-800 mb-2">Información de depuración</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-amber-700 mb-1">Estadísticas</h4>
                        <ul className="text-xs space-y-1">
                          <li>Total de registros: {records.length}</li>
                          <li>Registros filtrados: {filteredRecords.length}</li>
                          <li>Aprobados: {stats.aprobados}</li>
                          <li>Rechazados: {stats.rechazados}</li>
                          <li>Pendientes: {stats.pendientes}</li>
                          <li>Permisos: {stats.permisos}</li>
                          <li>Solicitudes: {stats.solicitudes}</li>
                          <li>Equipos: {stats.equipos}</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-amber-700 mb-1">Filtros activos</h4>
                        <ul className="text-xs space-y-1">
                          <li>Búsqueda: {searchTerm || "Ninguna"}</li>
                          <li>Tipo: {filterType}</li>
                          <li>Estado: {filterStatus}</li>
                          <li>Pestaña: {activeTab}</li>
                          <li>Fecha inicio: {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "No definida"}</li>
                          <li>Fecha fin: {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "No definida"}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-amber-700 mb-1">Primer registro (muestra)</h4>
                      {records.length > 0 ? (
                        <pre className="text-xs bg-white p-2 rounded border border-amber-200 overflow-auto max-h-40">
                          {JSON.stringify(records[0], null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs">No hay registros disponibles</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Advanced filters panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="filter-type" className="text-emerald-700">
                            Tipo de registro
                          </Label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger id="filter-type" className="border-emerald-200 focus:ring-emerald-500">
                              <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los tipos</SelectItem>
                              <SelectItem value="permiso">Permiso</SelectItem>
                              <SelectItem value="solicitud">Solicitud</SelectItem>
                              <SelectItem value="equipo">Equipo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="filter-status" className="text-emerald-700">
                            Estado
                          </Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger id="filter-status" className="border-emerald-200 focus:ring-emerald-500">
                              <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los estados</SelectItem>
                              <SelectItem value="aprobado">Aprobado</SelectItem>
                              <SelectItem value="rechazado">Rechazado</SelectItem>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="filter-week" className="text-emerald-700">
                            Semana
                          </Label>
                          <Select value={weekFilter} onValueChange={setWeekFilter}>
                            <SelectTrigger id="filter-week" className="border-emerald-200 focus:ring-emerald-500">
                              <SelectValue placeholder="Filtrar por semana" />
                            </SelectTrigger>
                            <SelectContent>{generateWeekOptions()}</SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-6 space-y-2">
                          <Label className="text-emerald-700">Rango de fechas</Label>
                          <div className="relative">
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  id="date"
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal border-emerald-200 focus:ring-emerald-500"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                                  {dateRange.from ? (
                                    dateRange.to ? (
                                      <>
                                        {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                                        {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                                      </>
                                    ) : (
                                      format(dateRange.from, "dd/MM/yyyy", { locale: es })
                                    )
                                  ) : (
                                    <span>Selecciona un rango de fechas</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-3 border-b border-emerald-100">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-800">Presets rápidos</h4>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("today")}
                                      >
                                        Hoy
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("yesterday")}
                                      >
                                        Ayer
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("thisWeek")}
                                      >
                                        Esta semana
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("lastWeek")}
                                      >
                                        Semana pasada
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("thisMonth")}
                                      >
                                        Este mes
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("lastMonth")}
                                      >
                                        Mes pasado
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => applyDateRangePreset("clear")}
                                      >
                                        Limpiar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <CalendarComponent
                                  mode="range"
                                  selected={{ from: dateRange.from, to: dateRange.to }}
                                  onSelect={(range) => {
                                    setDateRange({
                                      from: range?.from,
                                      to: range?.to ?? undefined,
                                    })
                                    if (range?.to) {
                                      setIsDatePickerOpen(false)
                                    }
                                  }}
                                  locale={es}
                                  className="rounded-md border-0"
                                  classNames={{
                                    day_selected: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white",
                                    day_today: "bg-emerald-100 text-emerald-900",
                                    day_range_middle: "bg-emerald-100 text-emerald-900",
                                    day_range_end: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white",
                                    day_range_start: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white",
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <p className="text-xs text-emerald-600 mt-1">
                            Se mostrarán registros con fecha de inicio entre las fechas seleccionadas
                          </p>
                        </div>

                        <div className="md:col-span-12 flex flex-col md:flex-row md:justify-between gap-3">
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Nombre para guardar este filtro"
                              value={newFilterName}
                              onChange={(e) => setNewFilterName(e.target.value)}
                              className="border-emerald-200 focus-visible:ring-emerald-500"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              onClick={saveCurrentFilters}
                              disabled={!newFilterName.trim() || !hasActiveFilters()}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            variant="default"
                            onClick={resetFilters}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                            disabled={!hasActiveFilters()}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reiniciar filtros
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                      disabled={isExporting || filteredRecords.length === 0}
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar a Excel
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-emerald-800">Exportar a Excel</DialogTitle>
                      <DialogDescription>Selecciona las opciones para exportar los registros a Excel</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="export-type" className="text-emerald-700">
                          ¿Qué deseas exportar?
                        </Label>
                        <Select defaultValue="filtered">
                          <SelectTrigger id="export-type" className="border-emerald-200 focus:ring-emerald-500">
                            <SelectValue placeholder="Selecciona qué exportar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filtered">Registros filtrados ({filteredRecords.length})</SelectItem>
                            <SelectItem value="selected">Registros seleccionados ({selectedRecords.length})</SelectItem>
                            <SelectItem value="all">Todos los registros ({records.length})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="export-format" className="text-emerald-700">
                          Formato de exportación
                        </Label>
                        <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                          <SelectTrigger id="export-format" className="border-emerald-200 focus:ring-emerald-500">
                            <SelectValue placeholder="Selecciona el formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple</SelectItem>
                            <SelectItem value="formatted">Con formato mejorado</SelectItem>
                            <SelectItem value="detailed">Detallado (con hojas múltiples)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-emerald-700">Columnas a exportar</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries({
                            code: "Código",
                            name: "Nombre",
                            telefono: "Teléfono",
                            novedad: "Novedad",
                            fecha_inicio: "Fecha Inicio",
                            fecha_fin: "Fecha Fin",
                            hora: "Hora",
                            description: "Descripción",
                            respuesta: "Respuesta",
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`export-${key}`}
                                checked={visibleColumns[key]}
                                onCheckedChange={(checked) => {
                                  setVisibleColumns({
                                    ...visibleColumns,
                                    [key]: !!checked,
                                  })
                                }}
                                className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                              />
                              <Label htmlFor={`export-${key}`} className="text-emerald-700">
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {isExporting && (
                        <div className="space-y-2">
                          <Label className="text-emerald-700">Progreso</Label>
                          <Progress
                            value={exportProgress}
                            className="h-2 bg-emerald-100 [&>div]:bg-emerald-600"
                          />
                          <p className="text-xs text-emerald-600 text-right">{exportProgress}%</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="border-emerald-200 text-emerald-700">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={exportToExcel}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={exportToExcelPermisos}
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  disabled={isExporting || filteredRecords.filter((r) => r.tipo === "permiso").length === 0}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel Permisos
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="ml-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => fetchRecords()}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Actualizar
                </Button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error al cargar los datos</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Bulk actions for selected records */}
              {selectedRecords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="text-emerald-700">
                    <span className="font-medium">{selectedRecords.length}</span>{" "}
                    {selectedRecords.length === 1 ? "registro seleccionado" : "registros seleccionados"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-700"
                      onClick={() => updateSelectedRecordsStatus("aprobado")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-700"
                      onClick={() => updateSelectedRecordsStatus("rechazado")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rechazar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-emerald-700"
                      onClick={() => updateSelectedRecordsStatus("pendiente")}
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Marcar pendiente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700"
                      onClick={deleteSelectedRecords}
                    >
                      <Trash className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={exportToExcel}
                    >
                      <FileDown className="mr-1 h-4 w-4" />
                      Exportar selección
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700"
                      onClick={() => setSelectedRecords([])}
                    >
                      Deseleccionar
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Content based on view mode */}
              <div className="rounded-md border border-emerald-200 shadow-sm overflow-hidden" ref={tableRef}>
                {viewMode === "stats" ? (
                  <div className="p-6 bg-white">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-4">Resumen de Registros</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-emerald-600">Total de Registros</p>
                              <h3 className="text-3xl font-bold text-emerald-800">{stats.total}</h3>
                            </div>
                            <div className="bg-emerald-200 p-3 rounded-full">
                              <FileText className="h-6 w-6 text-emerald-700" />
                            </div>
                          </div>
                          <Progress
                            value={100}
                            className="h-1 mt-4 bg-emerald-200"
                            style={{ '--progress-indicator-color': 'bg-emerald-500' } as React.CSSProperties}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-blue-600">Permisos</p>
                              <h3 className="text-3xl font-bold text-blue-800">{stats.permisos}</h3>
                            </div>
                            <div className="bg-blue-200 p-3 rounded-full">
                              <Calendar className="h-6 w-6 text-blue-700" />
                            </div>
                          </div>
                          <Progress
                            value={stats.total ? (stats.permisos / stats.total) * 100 : 0}
                            className="h-1 mt-4 bg-blue-200"
                            style={{ '--progress-indicator-color': 'bg-blue-500' } as React.CSSProperties}
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-purple-600">Solicitudes</p>
                              <h3 className="text-3xl font-bold text-purple-800">{stats.solicitudes}</h3>
                            </div>
                            <div className="bg-purple-200 p-3 rounded-full">
                              <FileText className="h-6 w-6 text-purple-700" />
                            </div>
                          </div>
                          <Progress
                            value={stats.total ? (stats.solicitudes / stats.total) * 100 : 0}
                            className="h-1 mt-4 bg-purple-200"
                            style={{ '--progress-indicator-color': 'bg-purple-500' } as React.CSSProperties}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <h4 className="text-md font-semibold text-emerald-800 mb-3">Estado de Registros</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="border-emerald-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-emerald-600">Aprobados</p>
                              <h3 className="text-3xl font-bold text-emerald-800">{stats.aprobados}</h3>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {stats.total ? Math.round((stats.aprobados / stats.total) * 100) : 0}%
                            </Badge>
                          </div>
                          <Progress
                            value={stats.total ? (stats.aprobados / stats.total) * 100 : 0}
                            className="h-1 mt-4 bg-emerald-100 [&>div]:bg-emerald-500"
                          />
                        </CardContent>
                      </Card>

                      <Card className="border-amber-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-amber-600">Pendientes</p>
                              <h3 className="text-3xl font-bold text-amber-800">{stats.pendientes}</h3>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              {stats.total ? Math.round((stats.pendientes / stats.total) * 100) : 0}%
                            </Badge>
                          </div>
                          <Progress
                            value={stats.total ? (stats.pendientes / stats.total) * 100 : 0}
                            className="h-1 mt-4 bg-amber-100 [&>div]:bg-amber-500"
                          />
                        </CardContent>
                      </Card>

                      <Card className="border-red-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-red-600">Rechazados</p>
                              <h3 className="text-3xl font-bold text-red-800">{stats.rechazados}</h3>
                            </div>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">
                              <XCircle className="w-4 h-4 mr-1" />
                              {stats.total ? Math.round((stats.rechazados / stats.total) * 100) : 0}%
                            </Badge>
                          </div>
                          <Progress
                            value={stats.total ? (stats.rechazados / stats.total) * 100 : 0}
                            className="h-1 mt-4 bg-red-100 [&>div]:bg-red-500"
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-emerald-800 mb-3">Registros Recientes</h4>
                      <Table>
                        <TableHeader className="bg-emerald-50">
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.slice(0, 5).map((record) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.code}</TableCell>
                              <TableCell>{record.name}</TableCell>
                              <TableCell>{getTypeBadge(record.tipo)}</TableCell>
                              <TableCell>{getStatusBadge(record.estado || "pendiente")}</TableCell>
                              <TableCell>{formatDate(record.fecha_inicio)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : viewMode === "cards" ? (
                  <div className="p-4 bg-emerald-50/30">
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <Skeleton className="h-6 w-1/3 mb-2" />
                              <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex justify-between pt-2">
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                  <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : paginatedRecords.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-emerald-500 dark:text-emerald-400">
                          <Search className="h-12 w-12 mb-4 text-emerald-300 dark:text-emerald-600" />
                          <p className="text-lg font-medium">No se encontraron registros</p>
                          <p className="text-sm text-emerald-600">Intenta cambiar los filtros de búsqueda</p>
                          <Button variant="link" onClick={resetFilters} className="mt-2 text-emerald-600">
                            Reiniciar filtros
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedRecords.map((record) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              className={cn(
                                "overflow-hidden border-l-4 hover:shadow-md transition-shadow",
                                record.estado === "aprobado"
                                  ? "border-l-emerald-500"
                                  : record.estado === "rechazado"
                                    ? "border-l-red-500"
                                    : "border-l-amber-500",
                              )}
                            >
                              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-bold">{record.name}</CardTitle>
                                  <CardDescription className="text-sm">
                                    Código: {record.code} | Tel: {record.telefono}
                                  </CardDescription>
                                </div>
                                <Checkbox
                                  checked={selectedRecords.includes(record.id)}
                                  onCheckedChange={() => toggleSelectRecord(record.id)}
                                  aria-label={`Seleccionar registro ${record.id}`}
                                  className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                                />
                              </CardHeader>
                              <CardContent className="p-4 pt-2">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium text-emerald-700">Tipo:</span>
                                    <span>{getTypeBadge(record.tipo)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium text-emerald-700">Estado:</span>
                                    <span>{getStatusBadge(record.estado || "pendiente")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium text-emerald-700">Novedad:</span>
                                    <span className="text-sm text-right">{record.novedad}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium text-emerald-700">Fecha:</span>
                                    <span className="text-sm">{formatDate(record.fecha_inicio)}</span>
                                  </div>
                                  {record.description && (
                                    <div className="pt-2">
                                      <span className="text-sm font-medium text-emerald-700">Descripción:</span>
                                      <p className="text-sm mt-1 text-gray-600 line-clamp-2">{record.description}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter className="p-4 pt-2 flex justify-between bg-emerald-50/50">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200">
                                      <Eye className="h-4 w-4 mr-1" />
                                      Detalles
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Detalles del Registro</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Código</h4>
                                          <p>{record.code}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Nombre</h4>
                                          <p>{record.name}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Teléfono</h4>
                                          <p>{record.telefono}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Tipo</h4>
                                          <p>{getTypeBadge(record.tipo)}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Estado</h4>
                                          <p>{getStatusBadge(record.estado || "pendiente")}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Novedad</h4>
                                          <p>{record.novedad}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Fecha Inicio</h4>
                                          <p>{formatDate(record.fecha_inicio)}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Fecha Fin</h4>
                                          <p>{formatDate(record.fecha_fin)}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-emerald-700">Descripción</h4>
                                        <p className="text-sm mt-1">{record.description}</p>
                                      </div>
                                      {record.respuesta && (
                                        <div>
                                          <h4 className="text-sm font-medium text-emerald-700">Respuesta</h4>
                                          <p className="text-sm mt-1">{record.respuesta}</p>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-emerald-700">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-44" align="end">
                                    <div className="grid gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => updateSelectedRecordsStatus("aprobado")}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aprobar
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => updateSelectedRecordsStatus("rechazado")}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rechazar
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-red-700 hover:bg-red-50"
                                      >
                                        <Trash className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-emerald-50 dark:bg-emerald-900">
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Seleccionar todos"
                              className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                            />
                          </TableHead>

                          {visibleColumns.code && (
                            <TableHead className="w-[100px]">
                              <Button
                                variant="ghost"
                                className="p-0 font-medium flex items-center gap-1 hover:text-emerald-700"
                                onClick={() => requestSort("code")}
                              >
                                Código
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                            </TableHead>
                          )}

                          {visibleColumns.name && (
                            <TableHead>
                              <Button
                                variant="ghost"
                                className="p-0 font-medium flex items-center gap-1 hover:text-emerald-700"
                                onClick={() => requestSort("name")}
                              >
                                Nombre
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                            </TableHead>
                          )}

                          {visibleColumns.telefono && <TableHead>Teléfono</TableHead>}

                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>

                          {visibleColumns.novedad && <TableHead>Novedad</TableHead>}

                          {visibleColumns.fecha_inicio && (
                            <TableHead>
                              <Button
                                variant="ghost"
                                className="p-0 font-medium flex items-center gap-1 hover:text-emerald-700"
                                onClick={() => requestSort("fecha_inicio")}
                              >
                                Fecha Inicio
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                            </TableHead>
                          )}

                          {visibleColumns.fecha_fin && <TableHead>Fecha Fin</TableHead>}

                          {visibleColumns.hora && <TableHead>Hora</TableHead>}

                          {visibleColumns.description && <TableHead>Descripción</TableHead>}

                          {visibleColumns.respuesta && <TableHead>Respuesta</TableHead>}

                          <TableHead className="w-[50px]">
                            <span className="sr-only">Acciones</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index} className="animate-pulse">
                              <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 3}>
                                <div className="h-6 bg-emerald-100 dark:bg-emerald-800/50 rounded w-full"></div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : paginatedRecords.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={Object.values(visibleColumns).filter(Boolean).length + 3}
                              className="text-center py-8"
                            >
                              <div className="flex flex-col items-center justify-center text-emerald-500 dark:text-emerald-400">
                                <Search className="h-10 w-10 mb-2 text-emerald-300 dark:text-emerald-600" />
                                <p className="font-medium">No se encontraron registros</p>
                                <p className="text-sm">Intenta cambiar los filtros de búsqueda</p>
                                <Button variant="link" onClick={resetFilters} className="mt-2 text-emerald-600">
                                  Reiniciar filtros
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedRecords.map((record) => (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "group hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                                selectedRecords.includes(record.id) && "bg-emerald-50 dark:bg-emerald-900/20",
                              )}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedRecords.includes(record.id)}
                                  onCheckedChange={() => toggleSelectRecord(record.id)}
                                  aria-label={`Seleccionar registro ${record.id}`}
                                  className="border-emerald-300 data-[state=checked]:bg-emerald-600"
                                />
                              </TableCell>

                              {visibleColumns.code && <TableCell className="font-medium">{record.code}</TableCell>}

                              {visibleColumns.name && <TableCell>{record.name}</TableCell>}

                              {visibleColumns.telefono && <TableCell>{record.telefono}</TableCell>}

                              <TableCell>{getTypeBadge(record.tipo)}</TableCell>
                              <TableCell>{getStatusBadge(record.estado || "pendiente")}</TableCell>

                              {visibleColumns.novedad && <TableCell>{record.novedad}</TableCell>}

                              {visibleColumns.fecha_inicio && <TableCell>{formatDate(record.fecha_inicio)}</TableCell>}

                              {visibleColumns.fecha_fin && <TableCell>{formatDate(record.fecha_fin)}</TableCell>}

                              {visibleColumns.hora && <TableCell>{record.hora}</TableCell>}

                              {visibleColumns.description && (
                                <TableCell className="max-w-[200px] truncate">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help">{record.description}</span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        <p>{record.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                              )}

                              {visibleColumns.respuesta && (
                                <TableCell className="max-w-[200px] truncate">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help">{record.respuesta}</span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        <p>{record.respuesta}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                              )}

                              <TableCell>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="opacity-0 group-hover:opacity-100 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-44" align="end">
                                    <div className="grid gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-emerald-700 hover:bg-emerald-50"
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver detalles
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-emerald-700 hover:bg-emerald-50"
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copiar información
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start text-left text-emerald-700 hover:bg-emerald-50"
                                      >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Imprimir
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredRecords.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    Mostrando {(page - 1) * itemsPerPage + 1} a {Math.min(page * itemsPerPage, filteredRecords.length)}{" "}
                    de {filteredRecords.length} registros
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number.parseInt(value))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[100px] border-emerald-200 focus:ring-emerald-500">
                        <SelectValue placeholder="Mostrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 / pág</SelectItem>
                        <SelectItem value="10">10 / pág</SelectItem>
                        <SelectItem value="20">20 / pág</SelectItem>
                        <SelectItem value="50">50 / pág</SelectItem>
                        <SelectItem value="100">100 / pág</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPage(1)
                          scrollToTop()
                        }}
                        disabled={page === 1}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <span className="sr-only">Primera página</span>
                        <ChevronLeft className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPage(page - 1)
                          scrollToTop()
                        }}
                        disabled={page === 1}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <span className="sr-only">Página anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="text-sm mx-2 text-emerald-700">
                        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPage(page + 1)
                          scrollToTop()
                        }}
                        disabled={page === totalPages}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <span className="sr-only">Página siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setPage(totalPages)
                          scrollToTop()
                        }}
                        disabled={page === totalPages}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <span className="sr-only">Última página</span>
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-emerald-50 dark:bg-emerald-900 border-t border-emerald-100 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div className="text-sm text-emerald-600 dark:text-emerald-400">
              {selectedRecords.length > 0 ? (
                <span>
                  <strong>{selectedRecords.length}</strong>{" "}
                  {selectedRecords.length === 1 ? "registro seleccionado" : "registros seleccionados"}
                </span>
              ) : (
                <span>Selecciona registros para realizar acciones en lote</span>
              )}
            </div>

            {hasActiveFilters() && (
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <FilterIcon className="h-4 w-4" />
                <span>Filtros aplicados</span>
                <Button variant="link" size="sm" onClick={resetFilters} className="text-emerald-700 h-auto p-0 pl-1">
                  Reiniciar
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Este componente ayuda a mostrar el íncono de filtro en el footer
function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
