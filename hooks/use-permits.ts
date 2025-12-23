"use client"

import { useState, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { updateRequestStatus, deleteRequest } from "../app/utils/api"
import { groupBy } from "lodash"

export type Request = {
  id: string
  code: string
  name: string
  type: string
  time: string
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

export type GroupedRequests = {
  [key: string]: Request[]
}

export type RequestStats = {
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

export const usePermits = (activeTab: string, userTypeFilter?: string | null) => {
  const [requests, setRequests] = useState<Request[]>([])
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequests>({})
  const [filteredRequests, setFilteredRequests] = useState<GroupedRequests>({})
  const [isLoading, setIsLoading] = useState(true)
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

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("accessToken")

      if (!token) {
        // Si no hay token, simplemente no cargar datos sin mostrar error
        // Esto evita errores molestos durante el logout
        setRequests([])
        setGroupedRequests({})
        setFilteredRequests({})
        return
      }

      const url = new URL("solicitud-permisos.sao6.com.co/api/admin/requests")
      url.searchParams.append("limit", "-1")

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage =
          responseData.message || responseData.error || "Error desconocido al obtener las solicitudes"

        if (response.status === 401) {
          // Intentar renovar el token automáticamente
          try {
            const refreshResponse = await fetch("solicitud-permisos.sao6.com.co/api/auth/refresh", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              localStorage.setItem("accessToken", refreshData.accessToken)

              // Reintentar la petición original con el nuevo token
              const retryResponse = await fetch(url.toString(), {
                headers: {
                  Authorization: `Bearer ${refreshData.accessToken}`,
                  "Content-Type": "application/json",
                },
              })

              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                const fetchedRequests: Request[] = Array.isArray(retryData.data) ? retryData.data : []
                setRequests(fetchedRequests)
                // Continuar con el procesamiento normal...
                return
              }
            }
          } catch (refreshError) {
            console.error("Error al renovar token:", refreshError)
          }

          // Si la renovación falla, mostrar error y redirigir
          toast({
            title: "Error de autenticación",
            description: "Su sesión ha expirado. Será redirigido a la página de inicio de sesión.",
            variant: "destructive",
            duration: 5000,
          })

          setTimeout(() => {
            localStorage.clear()
            window.location.href = "/"
          }, 3000)
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }

        setRequests([])
        setGroupedRequests({})
        return
      }

      const fetchedRequests: Request[] = Array.isArray(responseData.data) ? responseData.data : []
      setRequests(fetchedRequests)

      // Calculate request stats
      const stats: RequestStats = {
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
        postulations: { total: 0, pending: 0, rejected: 0, turnoPareja: 0, tablaPartida: 0, disponibleFijo: 0 },
      }

      // Filter requests for statistics based on userTypeFilter
      let requestsForStats = fetchedRequests
      if (userTypeFilter === 'se_maintenance') {
        // For se_maintenance users: show only se_maintenance requests
        requestsForStats = fetchedRequests.filter(req => (req as any).userType === 'se_maintenance')
      } else if (userTypeFilter === 'exclude_se_maintenance') {
        // For non-se_maintenance users: show all requests EXCEPT se_maintenance
        requestsForStats = fetchedRequests.filter(req => (req as any).userType !== 'se_maintenance')
      }

      requestsForStats.forEach((req: Request) => {
        stats.total++
        if (req.status === "approved") stats.approved++
        else if (req.status === "pending") stats.pending++
        else if (req.status === "rejected") stats.rejected++

        if (["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(req.type)) {
          stats.permits.total++
          if (req.status === "pending") stats.permits.pending++
          else if (req.status === "rejected") stats.permits.rejected++

          if (req.type === "descanso") stats.permits.descanso++
          else if (req.type === "cita") stats.permits.citaMedica++
          else if (req.type === "audiencia") stats.permits.audiencia++
          else if (req.type === "licencia") stats.permits.licencia++
          else if (req.type === "diaAM") stats.permits.diaAM++
          else if (req.type === "diaPM") stats.permits.diaPM++
        } else if (["Turno pareja", "Tabla partida", "Disponible fijo"].includes(req.type)) {
          stats.postulations.total++
          if (req.status === "pending") stats.postulations.pending++
          else if (req.status === "rejected") stats.postulations.rejected++

          if (req.type === "Turno pareja") stats.postulations.turnoPareja++
          else if (req.type === "Tabla partida") stats.postulations.tablaPartida++
          else if (req.type === "Disponible fijo") stats.postulations.disponibleFijo++
        }
      })

      setRequestStats(stats)

      // Filter requests based on active tab and status
      const filteredData = fetchedRequests.filter((req: Request) => {
        const isPermit = ["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(req.type)
        // Las solicitudes de se_maintenance siempre van a Permisos
        const isMaintenanceRequest = (req as any).userType === 'se_maintenance'
        const shouldShowInPermits = isPermit || isMaintenanceRequest
        return (activeTab === "permits" ? shouldShowInPermits : !shouldShowInPermits) && req.status === "pending"
      })

      // Group by name instead of code
      const grouped = groupBy(filteredData, "name")
      setGroupedRequests(grouped)
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "Error",
        description: "Error al cargar las solicitudes. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, userTypeFilter])

  const handleRequestAction = useCallback(
    async (id: string, action: "approve" | "reject", reason: string) => {
      try {
        await updateRequestStatus(id, action, reason)
        await loadRequests()
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
    },
    [loadRequests],
  )

  const handleDeleteRequest = useCallback(
    async (request: Request) => {
      try {
        await deleteRequest(request.id)
        await loadRequests()
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
      }
    },
    [loadRequests],
  )

  const applyFilters = useCallback(
    (filterType: string, filterCode: string, selectedZone: string, weekFilter: string | null, sortOrder: string, userTypeFilter?: string | null) => {
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
          const filteredReqs = reqs.filter(
            (req) =>
              req.code.toLowerCase().includes(filterCode.toLowerCase()) ||
              req.name.toLowerCase().includes(filterCode.toLowerCase()),
          )
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

      // Filter by userType if specified
      if (userTypeFilter) {
        console.log('Applying userType filter:', userTypeFilter)
        console.log('Requests before filtering:', Object.keys(filtered).length)

        filtered = Object.entries(filtered).reduce((acc, [name, reqs]) => {
          const filteredReqs = reqs.filter((req) => {
            console.log('Checking request:', req.id, 'userType:', (req as any).userType)

            if (userTypeFilter === 'se_maintenance') {
              // For se_maintenance users: show only se_maintenance requests
              return (req as any).userType === 'se_maintenance'
            } else if (userTypeFilter === 'exclude_se_maintenance') {
              // For non-se_maintenance users: show all requests EXCEPT se_maintenance
              return (req as any).userType !== 'se_maintenance'
            }

            // Default case: show all requests
            return true
          })
          if (filteredReqs.length > 0) {
            acc[name] = filteredReqs
          }
          return acc
        }, {} as GroupedRequests)

        console.log('Requests after filtering:', Object.keys(filtered).length)
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
    },
    [groupedRequests],
  )

  return {
    requests,
    groupedRequests,
    filteredRequests,
    isLoading,
    requestStats,
    loadRequests,
    handleRequestAction,
    handleDeleteRequest,
    applyFilters,
  }
}
