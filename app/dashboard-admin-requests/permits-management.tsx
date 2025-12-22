"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { debounce } from "lodash"
import { useRBACContext } from "@/components/RBACProvider"
import {
  RefreshCw,
  Search,
  FileText,
  Laptop,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Import components
import RequestCard from "@/components/request-card"
import WeeklyStats from "@/components/weekly-stats"
import RequestDetails from "@/components/request-details"
import { usePermits, type Request } from "@/hooks/use-permits"

// --- Premium UI Components ---

const StatCard = ({ title, value, icon, color, trend }: { title: string, value: number, icon: React.ReactNode, color: "green" | "amber" | "red" | "blue", trend?: number }) => {
  const colorStyles = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100"
  }

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorStyles[color]} transition-colors`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

const DetailedStatsCard = ({
  title,
  icon,
  stats,
}: {
  title: string;
  icon: React.ReactNode;
  stats: Record<string, number>;
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 shadow-sm">
          {icon}
        </div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-relaxed">{title}</h3>
      </div>
      <div className="space-y-3 flex-1">
        {Object.entries(stats).map(([key, value], idx) => (
          <div key={key} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{key}</span>
            <span className="text-sm font-black text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaginationComponent = memo(({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 w-10 rounded-2xl border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
        Página <span className="text-gray-900 text-sm mx-1">{currentPage}</span> de <span className="text-gray-900 text-sm mx-1">{totalPages}</span>
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-10 w-10 rounded-2xl border-gray-200 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
});

PaginationComponent.displayName = 'PaginationComponent';

// --- Main Layout ---

export default function PermitsManagement() {
  const [activeTab, setActiveTab] = useState("permits")
  const [filterType, setFilterType] = useState("all")
  const [filterCode, setFilterCode] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedZone, setSelectedZone] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Modal de detalles
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  // Selección múltiple
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set())

  const { userContext } = useRBACContext()
  const currentUserType = userContext?.userType
  const [userTypeLoaded, setUserTypeLoaded] = useState(false)

  useEffect(() => {
    if (currentUserType) {
      setUserTypeLoaded(true)
    }
  }, [currentUserType])

  const requestsPerPage = 9
  const zones = [
    "Acevedo", "Tricentenario", "Universidad-gardel", "Hospital",
    "Prado", "Cruz", "San Antonio", "Exposiciones", "Alejandro"
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
  } = usePermits(activeTab, currentUserType === 'se_maintenance' ? 'se_maintenance' : 'exclude_se_maintenance')

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilterCode(value)
        setCurrentPage(1)
      }, 300),
    [],
  )

  useEffect(() => {
    const userTypeFilter = currentUserType === 'se_maintenance' ? 'se_maintenance' : 'exclude_se_maintenance'
    applyFilters(filterType, filterCode, selectedZone, null, sortOrder, userTypeFilter)
  }, [applyFilters, filterType, filterCode, selectedZone, sortOrder, currentUserType])

  useEffect(() => {
    if (userTypeLoaded) {
      loadRequests()
    }
  }, [loadRequests, userTypeLoaded])

  // Bulk Actions
  const handleBulkAction = useCallback(async (action: "approve" | "reject") => {
    const loadingToast = toast({ title: "Procesando...", description: "Aplicando cambios masivos." })
    try {
      for (const id of selectedRequestIds) {
        await handleRequestAction(id, action, "")
      }
      setSelectedRequestIds(new Set())
      loadRequests()
      toast({ title: "Listo", description: "Acción completada exitosamente." })
    } catch (e) {
      toast({ title: "Error", description: "Hubo un problema al procesar.", variant: "destructive" })
    }
  }, [selectedRequestIds, handleRequestAction, loadRequests])

  // Pagination Logic
  const currentRequests = useMemo(() => {
    const entries = Object.entries(filteredRequests)
    const startIndex = (currentPage - 1) * requestsPerPage
    const endIndex = startIndex + requestsPerPage
    return entries.slice(startIndex, endIndex)
  }, [filteredRequests, currentPage, requestsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)
  }, [filteredRequests, requestsPerPage])

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value)
    },
    [debouncedSearch],
  )

  // Modificado: Abrir modal de detalles en lugar de solo seleccionar
  const handleRequestClick = useCallback(
    (request: Request) => {
      setSelectedRequest(request)
    },
    [],
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">

      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-[#4cc253] rounded-xl flex items-center justify-center shadow-lg shadow-[#4cc253]/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Solicitudes</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium pl-14">Administra y supervisa los permisos del sistema</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRequests}
            disabled={isLoading}
            className="h-11 px-5 rounded-xl border-gray-200 text-gray-600 hover:text-[#4cc253] hover:bg-white hover:border-[#4cc253]/30 font-bold text-xs uppercase tracking-wide transition-all shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Solicitudes"
          value={requestStats.total}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          trend={12}
        />
        <StatCard
          title="Aprobadas"
          value={requestStats.approved}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pendientes"
          value={requestStats.pending}
          icon={<AlertCircle className="h-6 w-6" />}
          color="amber"
          trend={5}
        />
        <StatCard
          title="Rechazadas"
          value={requestStats.rejected}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
      </div>

      {/* AQUI ESTÁ EL CAMBIO SOLICITADO: Desgloses arriba */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailedStatsCard
          title="Desglose de Permisos"
          icon={<FileText className="h-5 w-5 text-gray-500" />}
          stats={{
            "Total Permisos": requestStats.permits?.total || 0,
            "Pendientes de Revisión": requestStats.permits?.pending || 0,
            "Rechazados": requestStats.permits?.rejected || 0,
          }}
        />
        <DetailedStatsCard
          title="Desglose de Postulaciones"
          icon={<Laptop className="h-5 w-5 text-gray-500" />}
          stats={{
            "Total Postulaciones": requestStats.postulations?.total || 0,
            "Pendientes de Revisión": requestStats.postulations?.pending || 0,
            "Rechazados": requestStats.postulations?.rejected || 0,
          }}
        />
      </div>

      {/* Actividad Semanal ahora está abajo, ocupando todo el ancho */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center text-center">

        <div className="w-full max-w-5xl">
          <WeeklyStats requests={requests} />
        </div>
      </div>

      {/* Main Content Card - Toolbar & Grid */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-end xl:items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-gray-100/80 p-1.5 rounded-2xl h-12 w-full md:w-fit grid grid-cols-2 md:block">
              <TabsTrigger value="permits" className="rounded-xl px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#4cc253] data-[state=active]:shadow-sm transition-all">
                PERMISOS
              </TabsTrigger>
              <TabsTrigger value="equipment" className="rounded-xl px-6 h-9 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#4cc253] data-[state=active]:shadow-sm transition-all">
                POSTULACIONES
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, nombre..."
                onChange={handleSearch}
                className="pl-11 h-12 rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#4cc253] transition-all text-sm font-medium"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-12 px-6 rounded-2xl border-gray-200 hover:bg-gray-50 font-bold text-xs uppercase tracking-wide transition-all",
                showFilters && "bg-gray-50 border-[#4cc253] text-[#4cc253]"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filters Panel (Animated) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-xl z-10 relative"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tipo de Solicitud</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-11 text-xs font-bold bg-white">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todos</SelectItem>
                    {activeTab === "permits" ? ["descanso", "audiencia", "cita", "licencia"].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    )) : ["Turno pareja", "Tabla partida", "Disponible fijo"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Zona Operativa</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-11 text-xs font-bold bg-white">
                    <SelectValue placeholder="Seleccionar zona" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas las zonas</SelectItem>
                    {zones.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ordenamiento</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-11 text-xs font-bold bg-white">
                    <SelectValue placeholder="Orden" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="newest">Más recientes primero</SelectItem>
                    <SelectItem value="oldest">Más antiguos primero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-[280px] bg-white rounded-3xl border border-gray-100 animate-pulse p-6 space-y-4">
                <div className="h-10 w-10 bg-gray-100 rounded-xl" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-32 bg-gray-50 rounded-xl" />
              </div>
            ))
          ) : currentRequests.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border border-dashed border-gray-200">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No se encontraron resultados</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">Prueba ajustando los filtros de búsqueda o el término ingresado</p>
            </div>
          ) : (
            currentRequests.map(([id, reqs]) => (
              <RequestCard
                key={id}
                name={reqs[0]?.name || "Usuario"}
                requests={reqs}
                selectedRequestIds={selectedRequestIds}
                onRequestClick={handleRequestClick}
                onDelete={(request) => handleDeleteRequest(request.id)}
              />
            ))
          )}
        </div>

        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal de Detalles de Solicitud */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onAction={handleRequestAction}
        />
      )}
    </div>
  )
}