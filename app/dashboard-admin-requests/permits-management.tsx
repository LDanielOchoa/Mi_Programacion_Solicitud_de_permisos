"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { debounce } from "lodash"
import {
  RefreshCw,
  Settings,
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
  Shield,
  Clock,
  TrendingUp,
  Activity,
  Database,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  User,
  Loader2,
  Bell,
  Sparkles,
  Zap,
  Star,
  Layers
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
import StatCard from "@/components/stat-card"
import RequestCard from "@/components/request-card"
import WeeklyStats from "@/components/weekly-stats"
import RequestDetails from "@/components/request-details"
import { usePermits, type Request } from "@/hooks/use-permits"

// Background Animation Component optimized with memo
const BackgroundAnimation = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full blur-3xl"
    />
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 35,
        repeat: Infinity,
        ease: "linear"
      }}
      className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-full blur-3xl"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50/10 to-green-50/10 rounded-full blur-2xl"
    />
  </div>
))

BackgroundAnimation.displayName = 'BackgroundAnimation'

// Quick Actions Panel Component optimized with memo
const QuickActionsPanel = memo(
  ({
    onRefresh,
    onExport,
    onSettings,
    selectedCount,
    isLoading,
  }: {
    onRefresh: () => void
    onExport: () => void
    onSettings: () => void
    selectedCount: number
    isLoading?: boolean
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-200/50 p-8 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <motion.div
              className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Shield className="h-8 w-8 text-white drop-shadow-sm" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 bg-clip-text text-transparent">
                Panel de Control
              </h2>
              <p className="text-emerald-600 font-medium">Gestión avanzada de solicitudes</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="p-4 bg-green-100 hovgreen-200 rounded-2xl transition-all duration-300 shadow-md disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                    ) : (
                      <RefreshCw className="h-6 w-6 text-green-600" />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actualizar datos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {selectedCount > 0 && (
          <motion.div
            className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-3 h-3 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <p className="font-semibold text-emerald-700">
                  {selectedCount} solicitud{selectedCount !== 1 ? "es" : ""} seleccionada{selectedCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1 rounded-full font-semibold">
                Activo
              </Badge>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  ),
)

QuickActionsPanel.displayName = "QuickActionsPanel"

// Enhanced Pagination Component
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

  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center space-x-2 mt-12"
    >
      <motion.button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-3 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>

      {getPageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-4 py-3 text-emerald-400 font-medium">...</span>
          ) : (
            <motion.button
              onClick={() => onPageChange(page as number)}
              className={`px-4 py-3 rounded-2xl font-semibold transition-all shadow-lg ${
                currentPage === page
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-200'
                  : 'bg-white/95 backdrop-blur-sm border-2 border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {page}
            </motion.button>
          )}
        </React.Fragment>
      ))}

      <motion.button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-3 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>
    </motion.div>
  );
});

PaginationComponent.displayName = 'PaginationComponent';

// Enhanced Detailed Stats Card
const DetailedStatsCard = memo(({ 
  title, 
  icon, 
  stats, 
  color = "emerald" 
}: { 
  title: string; 
  icon: React.ReactNode; 
  stats: Record<string, number>; 
  color?: string;
}) => {
  const colorClasses = {
    emerald: {
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700'
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-200/50 p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-6">
          <motion.div 
            className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-2xl shadow-lg`}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-bold text-emerald-800">{title}</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(stats).map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl"
            >
              <span className="font-medium text-emerald-700">{key}</span>
              <span className="font-bold text-emerald-800">{value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

DetailedStatsCard.displayName = 'DetailedStatsCard';

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
  
  // Get user data from localStorage to check userType
  const [currentUserType, setCurrentUserType] = useState<string | null>(() => {
    // Only access localStorage on client side to avoid SSR errors
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('userData')
        if (userData) {
          const parsedUserData = JSON.parse(userData)
          return parsedUserData.userType || null
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    return null
  })
  
  const [userTypeLoaded, setUserTypeLoaded] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    console.log('Raw userData from localStorage:', userData)
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData)
        console.log('Parsed userData:', parsedUserData)
        console.log('UserType found:', parsedUserData.userType)
        setCurrentUserType(parsedUserData.userType || null)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    setUserTypeLoaded(true)
  }, [])

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
  } = usePermits(activeTab, currentUserType === 'se_maintenance' ? 'se_maintenance' : 'exclude_se_maintenance')

  // Debounced search function optimized with useMemo
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilterCode(value)
      }, 300),
    [],
  )

  // Apply filters when dependencies change, including userType filter
  useEffect(() => {
    // Apply userType filter based on current user type
    const userTypeFilter = currentUserType === 'se_maintenance' ? 'se_maintenance' : 'exclude_se_maintenance'
    console.log('Current userType:', currentUserType)
    console.log('UserType filter applied:', userTypeFilter)
    applyFilters(filterType, filterCode, selectedZone, weekFilter, sortOrder, userTypeFilter)
  }, [applyFilters, filterType, filterCode, selectedZone, weekFilter, sortOrder, currentUserType])

  // Load requests only after userType is determined
  useEffect(() => {
    // Only load requests after we've confirmed userType status
    if (userTypeLoaded) {
      loadRequests()
    }
  }, [loadRequests, userTypeLoaded])

  // Definir los handlers fuera del useEffect
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift") setIsShiftKeyPressed(true)
    if (e.key === "Escape") setSelectedRequestIds(new Set())
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift") setIsShiftKeyPressed(false)
  }, [])

  // Keyboard event handlers optimizados con useCallback
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

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

  const totalPages = useMemo(() => {
    return Math.ceil(Object.keys(filteredRequests).length / requestsPerPage)
  }, [filteredRequests, requestsPerPage])

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
    setCurrentPage(1)
  }, [])

  const handleExport = useCallback(() => {
    toast({ 
      title: "Exportando", 
      description: "Preparando archivo de exportación...",
    })
  }, [])

  const handleSettings = useCallback(() => {
    toast({ 
      title: "Configuración", 
      description: "Abriendo panel de configuración...",
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 relative">
      <BackgroundAnimation />
      
      <div className="relative max-w-8xl mx-auto px-6 py-12">
        {/* Enhanced Quick Actions Panel */}
        <div className="mb-12">
          <QuickActionsPanel
            onRefresh={loadRequests}
            onExport={handleExport}
            onSettings={handleSettings}
            selectedCount={selectedRequestIds.size}
            isLoading={isLoading}
          />
        </div>

        {/* Premium Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatCard
            title="Total de Solicitudes"
            value={requestStats.total}
            icon={<Users className="h-6 w-6 text-white" />}
            color="emerald"
            trend={12}
          />
          <StatCard
            title="Aprobadas"
            value={requestStats.approved}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            color="emerald"
            trend={8}
          />
          <StatCard
            title="Pendientes"
            value={requestStats.pending}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="amber"
          />
          <StatCard
            title="Rechazadas"
            value={requestStats.rejected}
            icon={<XCircle className="h-6 w-6 text-white" />}
            color="red"
          />
        </motion.div>

        {/* Enhanced Detailed Stats */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <DetailedStatsCard
            title="Análisis de Permisos"
            icon={<FileText className="h-6 w-6 text-white" />}
            stats={{
              "Total": requestStats.permits?.total || 0,
              "Pendientes": requestStats.permits?.pending || 0,
              "Rechazados": requestStats.permits?.rejected || 0,
            }}
            color="emerald"
          />
          <DetailedStatsCard
            title="Análisis de Postulaciones"
            icon={<Laptop className="h-6 w-6 text-white" />}
            stats={{
              "Total": requestStats.postulations?.total || 0,
              "Pendientes": requestStats.postulations?.pending || 0,
              "Rechazados": requestStats.postulations?.rejected || 0,
            }}
            color="blue"
          />
        </motion.div>

        {/* Enhanced Weekly Stats */}
        <motion.div
          className="mb-12 bg-white/95 backdrop-blur-xl border-2 border-emerald-200/50 shadow-2xl rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="p-8">
            <WeeklyStats requests={requests} />
          </div>
        </motion.div>

        {/* Ultra Modern Controls */}
        <motion.div 
          className="flex flex-wrap items-center justify-between gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`
                border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl px-6 py-3 font-semibold transition-all duration-300 shadow-lg
                ${isFilterOpen ? "bg-emerald-100 border-emerald-400 shadow-emerald-200" : "bg-white/95 backdrop-blur-sm"}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-5 h-5 mr-3" />
              {isFilterOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </motion.button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-400 h-5 w-5" />
              <Input
                placeholder="Buscar solicitudes..."
                onChange={handleSearch}
                className="pl-12 w-80 border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/95 backdrop-blur-sm font-medium shadow-lg"
              />
            </div>
          </div>
        </motion.div>

        {/* Premium Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 bg-white/95 backdrop-blur-xl border-2 border-emerald-200 rounded-2xl p-2 shadow-2xl">
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
        </motion.div>

        {/* Enhanced Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12 p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-200/50"
            >
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/95 backdrop-blur-sm font-medium shadow-lg">
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
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/95 backdrop-blur-sm font-medium shadow-lg">
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
                <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 rounded-2xl py-3 bg-white/95 backdrop-blur-sm font-medium shadow-lg">
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
              
              <motion.button
                onClick={handleClearFilters}
                className="border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl py-3 font-semibold bg-white/95 backdrop-blur-sm transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Limpiar filtros</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Database className="h-12 w-12 text-white" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: '96px', height: '96px', margin: 'auto' }}
              />
              <h3 className="text-2xl font-bold text-emerald-800 mb-2">Cargando solicitudes...</h3>
              <p className="text-emerald-600">Obteniendo los datos más recientes</p>
            </div>
          </motion.div>
        ) : Object.keys(filteredRequests).length === 0 ? (
          <motion.div
            className="text-center py-24 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-emerald-200/50 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-32 translate-x-32 blur-2xl"></div>
            <div className="relative z-10">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <FileText className="w-16 h-16 text-white drop-shadow-lg" />
              </motion.div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 bg-clip-text text-transparent mb-6">
                No hay solicitudes pendientes
              </h3>
              <p className="text-xl text-emerald-600 max-w-2xl mx-auto leading-relaxed mb-8">
                No se encontraron solicitudes que coincidan con los filtros seleccionados. Prueba ajustando los criterios
                de búsqueda o verifica que haya solicitudes pendientes.
              </p>
              <motion.button
                onClick={handleClearFilters}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all font-semibold shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Limpiar filtros
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="mb-8 flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center space-x-4">
                <p className="text-lg font-medium text-emerald-700">
                  Mostrando {currentRequests.length} de {Object.keys(filteredRequests).length} grupos
                </p>
                <div className="h-6 w-px bg-emerald-300"></div>
                <p className="text-sm text-emerald-600">{totalFilteredRequests} solicitudes en total</p>
              </div>
              {selectedRequestIds.size > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-full font-semibold border-2 border-emerald-200 shadow-lg">
                  {selectedRequestIds.size} seleccionadas
                </Badge>
              )}
            </motion.div>

            <motion.div 
              className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <AnimatePresence mode="popLayout">
                {currentRequests.map(([name, requests], index) => (
                  <motion.div
                    key={`${name}-${requests[0]?.id}-${requests.length}`}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 120,
                      damping: 20
                    }}
                  >
                    <RequestCard
                      name={name}
                      requests={requests}
                      onRequestClick={handleRequestClick}
                      selectedRequestIds={selectedRequestIds}
                      onDelete={(request) => {
                        setRequestToDelete(request)
                        setDeleteDialogOpen(true)
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        <PaginationComponent 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Enhanced Bulk Actions */}
        <AnimatePresence>
          {selectedRequestIds.size > 0 && (
            <motion.div
              className="fixed bottom-8 right-8 bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 border-emerald-200/50 z-50 max-w-sm"
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <motion.div 
                    className="w-3 h-3 bg-emerald-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <h3 className="text-lg font-bold text-emerald-800">Acciones masivas</h3>
                </div>
                <p className="text-sm text-emerald-600 mb-6">
                  {selectedRequestIds.size} solicitud{selectedRequestIds.size !== 1 ? "es" : ""} seleccionada
                  {selectedRequestIds.size !== 1 ? "s" : ""}
                </p>
                <div className="flex space-x-3">
                  <motion.button
                    onClick={() => {
                      setBulkActionType("approve")
                      setBulkActionDialogOpen(true)
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-2xl rounded-2xl flex-1 py-3 font-semibold flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Aprobar</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setBulkActionType("reject")
                      setBulkActionDialogOpen(true)
                    }}
                    className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-2xl rounded-2xl flex-1 py-3 font-semibold flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Request Details Modal */}
      <AnimatePresence mode="wait" initial={false}>
        {selectedRequests && (
          <RequestDetails
            key="request-details-modal"
            request={selectedRequests[0]}
            onClose={() => setSelectedRequests(null)}
            onAction={handleRequestAction}
            onPrevRequest={selectedRequests.length > 1 ? () => {
              // Implementar navegación a solicitud anterior
              const currentIndex = selectedRequests.findIndex(req => req.id === selectedRequests[0].id);
              if (currentIndex > 0) {
                setSelectedRequests([...selectedRequests.slice(currentIndex - 1, currentIndex), ...selectedRequests.slice(0, currentIndex - 1), ...selectedRequests.slice(currentIndex)]);
              }
            } : undefined}
            onNextRequest={selectedRequests.length > 1 ? () => {
              // Implementar navegación a solicitud siguiente
              const currentIndex = selectedRequests.findIndex(req => req.id === selectedRequests[0].id);
              if (currentIndex < selectedRequests.length - 1) {
                setSelectedRequests([...selectedRequests.slice(currentIndex + 1, currentIndex + 2), ...selectedRequests.slice(0, currentIndex), ...selectedRequests.slice(currentIndex + 2)]);
              }
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-800">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-emerald-600 leading-relaxed">
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
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-2xl px-6 py-3 font-semibold shadow-2xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-800">Confirmar acción masiva</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-emerald-600 leading-relaxed">
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
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-2xl px-6 py-3 font-semibold shadow-2xl"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-2xl px-6 py-3 font-semibold shadow-2xl"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Processing Modal */}
      <AnimatePresence>
        {isBulkActionProcessing && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border-2 border-emerald-200/50 max-w-lg w-full mx-6 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="text-center relative z-10">
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <RefreshCw className="h-10 w-10 text-white animate-spin" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 bg-clip-text text-transparent">
                  Procesando solicitudes...
                </h3>
                <Progress value={bulkActionProgress} className="w-full mb-6 h-4 rounded-full" />
                <p className="text-xl font-semibold text-emerald-600">{Math.round(bulkActionProgress)}% completado</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}