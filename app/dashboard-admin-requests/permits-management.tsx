"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { debounce } from "lodash"
import {
  RefreshCw,
  Settings,
  Zap,
  Download,
  Filter,
  Search,
  FileText,
  Laptop,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Sparkles,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { toast } from "@/hooks/use-toast"

// Import components
import LoadingSpinner from "@/components/loading-spinner"
import StatCard, { DetailedStatCard } from "@/components/stat-card"
import RequestCard from "@/components/request-card"
import WeeklyStats from "@/components/weekly-stats"
import RequestDetails from "@/components/request-details"
import { usePermits, type Request } from "@/hooks/use-permits"

// Quick Actions Panel Component
const QuickActionsPanel = React.memo(
  ({
    onRefresh,
    onExport,
    onSettings,
    selectedCount,
  }: {
    onRefresh: () => void
    onExport: () => void
    onSettings: () => void
    selectedCount: number
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
  
      {selectedCount > 0 && (
        <motion.div
          className="mt-3 p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl border border-emerald-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-xs font-medium text-emerald-700">
              {selectedCount} solicitud{selectedCount !== 1 ? "es" : ""} seleccionada{selectedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  ),
)

QuickActionsPanel.displayName = "QuickActionsPanel"

export default function PermitsManagement() {
  const [activeTab, setActiveTab] = useState("permits")
  const [filterType, setFilterType] = useState("all")
  const [filterCode, setFilterCode] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")
  const [selectedRequests, setSelectedRequests] = useState<Request[] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState("all")
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set())
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false)
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<"approve" | "reject" | null>(null)
  const [bulkActionProgress, setBulkActionProgress] = useState(0)
  const [isBulkActionProcessing, setIsBulkActionProcessing] = useState(false)
  const [weekFilter, setWeekFilter] = useState<string | null>(null)

  const requestsPerPage = 12
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

  const {
    requests,
    filteredRequests,
    isLoading,
    requestStats,
    loadRequests,
    handleRequestAction,
    handleDeleteRequest,
    applyFilters,
  } = usePermits(activeTab)

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilterCode(value)
      }, 300),
    [],
  )

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters(filterType, filterCode, selectedZone, weekFilter, sortOrder)
  }, [applyFilters, filterType, filterCode, selectedZone, weekFilter, sortOrder])

  // Load requests on tab change
  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  // Keyboard event handlers
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

  const handleRequestClick = useCallback(
    (request: Request) => {
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
    },
    [isShiftKeyPressed],
  )

  const handleBulkAction = useCallback(
    async (action: "approve" | "reject") => {
      setIsBulkActionProcessing(true)
      setBulkActionProgress(0)
      const totalRequests = selectedRequestIds.size
      let processedRequests = 0

      const message =
        prompt(`Ingrese el motivo para ${action === "approve" ? "aprobar" : "rechazar"} la solicitud:`) ||
        (action === "approve" ? "Su solicitud ha sido aprobada." : "Lo sentimos, su solicitud ha sido rechazada.")

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
          description: "Hubo un problema al procesar las solicitudes.",
          variant: "destructive",
        })
      } finally {
        setIsBulkActionProcessing(false)
        setBulkActionDialogOpen(false)
        setBulkActionType(null)
      }
    },
    [selectedRequestIds, handleRequestAction],
  )

  const currentRequests = useMemo(() => {
    const entries = Object.entries(filteredRequests)
    const startIndex = (currentPage - 1) * requestsPerPage
    const endIndex = startIndex + requestsPerPage
    return entries.slice(startIndex, endIndex)
  }, [filteredRequests, currentPage, requestsPerPage])

  const totalFilteredRequests = useMemo(() => {
    return Object.values(filteredRequests).reduce((sum, requests) => sum + requests.length, 0)
  }, [filteredRequests])

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      debouncedSearch(value)
    },
    [debouncedSearch],
  )

  const handleClearFilters = useCallback(() => {
    setFilterType("all")
    setFilterCode("")
    setSelectedZone("all")
    setSortOrder("newest")
    setWeekFilter(null)
  }, [])

  const renderPagination = useCallback(() => {
    const totalPages = Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded-lg h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={`rounded-lg h-9 w-9 p-0 ${
              currentPage === page ? "bg-emerald-500 text-white hover:bg-emerald-600" : "hover:bg-emerald-50"
            }`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)),
            )
          }
          disabled={currentPage === Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)}
          className="rounded-lg h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }, [filteredRequests, currentPage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50/30 to-teal-50/30 relative">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), 
            radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.05) 0%, transparent 70%)
          `,
          }}
        ></div>
      </div>

      <div className="relative max-w-8xl mx-auto px-6 py-12">

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
              Total: requestStats.permits.total,
              Pendientes: requestStats.permits.pending,
              Rechazados: requestStats.permits.rejected,
              Descansos: requestStats.permits.descanso,
              "Citas médicas": requestStats.permits.citaMedica,
              Audiencias: requestStats.permits.audiencia,
            }}
            icon={<FileText className="h-6 w-6" />}
          />
          <DetailedStatCard
            title="Análisis de Postulaciones"
            stats={{
              Total: requestStats.postulations.total,
              Pendientes: requestStats.postulations.pending,
              Rechazados: requestStats.postulations.rejected,
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
            <WeeklyStats requests={requests} />
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
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 h-5 w-5" />
              <Input
                placeholder="Buscar solicitudes..."
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
                onClick={handleClearFilters}
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
              No se encontraron solicitudes que coincidan con los filtros seleccionados. Prueba ajustando los criterios
              de búsqueda o verifica que haya solicitudes pendientes.
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
                <p className="text-sm text-gray-600">{totalFilteredRequests} solicitudes en total</p>
              </div>
              {selectedRequestIds.size > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-full font-semibold border border-emerald-200">
                  {selectedRequestIds.size} seleccionadas
                </Badge>
              )}
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {currentRequests.map(([name, requests]) => (
                  <RequestCard
                    key={`${name}-${requests[0]?.id}-${requests.length}`}
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
              <h3 className="text-lg font-bold text-gray-800">Acciones masivas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {selectedRequestIds.size} solicitud{selectedRequestIds.size !== 1 ? "es" : ""} seleccionada
              {selectedRequestIds.size !== 1 ? "s" : ""}
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
      <AnimatePresence mode="wait" initial={false}>
        {selectedRequests && (
          <RequestDetails
            key="request-details-modal"
            requests={selectedRequests}
            onClose={() => setSelectedRequests(null)}
            onAction={handleRequestAction}
          />
        )}
      </AnimatePresence>

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
              ¿Estás seguro de que deseas {bulkActionType === "approve" ? "aprobar" : "rechazar"} las{" "}
              {selectedRequestIds.size} solicitudes seleccionadas?
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
