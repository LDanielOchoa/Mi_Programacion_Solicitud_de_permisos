"use client"

import React from "react"
import {
  FileText,
  Timer,
  Calendar,
  Shield,
  Clock,
  Users,
  Target,
  Briefcase,
  AlertCircle,
  MapPin,
  ArrowRight,
  Eye,
  Edit,
  Download,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Added Card imports
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import type { Request } from "@/hooks/use-permits"

interface RequestCardProps {
  name: string
  requests: Request[]
  onRequestClick: (request: Request) => void
  selectedRequestIds: Set<string>
  onDelete: (request: Request) => void
}

const RequestCard = React.memo(
  React.forwardRef<HTMLDivElement, RequestCardProps>(
    ({ name, requests, onRequestClick, selectedRequestIds, onDelete }, ref) => {
      const isEquipmentRequest = !["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(
        requests[0]?.type || "",
      )
      const hasSelectedRequests = requests.some((req) => selectedRequestIds.has(req.id))
      const primaryRequest = requests[0]
      const employeePhotoUrl = "/placeholder.svg?height=100&width=100" // Placeholder for employee photo

      const getTypeIcon = React.useCallback((type: string) => {
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

      const getTypeColor = React.useCallback((type: string) => {
        const colors: Record<string, string> = {
          descanso: "bg-blue-500",
          cita: "bg-purple-500",
          audiencia: "bg-orange-500",
          licencia: "bg-pink-500",
          diaAM: "bg-indigo-500",
          diaPM: "bg-violet-500",
          "Turno pareja": "bg-teal-500",
          "Tabla partida": "bg-cyan-500",
          "Disponible fijo": "bg-emerald-500",
        }
        return colors[type] || "bg-gray-500"
      }, [])

      if (!requests.length) return null

      return (
        <div ref={ref} className="group h-full">
          <ContextMenu>
            <ContextMenuTrigger>
              <Card
                className={`
                  relative h-full border-l-4 rounded-2xl shadow-lg hover:shadow-xl
                  transition-all duration-300 hover:scale-[1.01] overflow-hidden
                  ${hasSelectedRequests ? "ring-2 ring-emerald-400/50 shadow-emerald-200/50" : ""}
                  ${isEquipmentRequest ? "border-l-teal-500" : "border-l-emerald-500"}
                `}
              >
                {/* Header */}
                <CardHeader className="p-4 pb-3 bg-gradient-to-br from-emerald-50 to-green-50 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="outline"
                      className={`
                        px-3 py-1 rounded-full font-medium text-xs border-0
                        ${isEquipmentRequest ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700"}
                      `}
                    >
                      {isEquipmentRequest ? "Postulación" : "Permiso"}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-amber-100 text-amber-700 border-0 px-3 py-1 rounded-full font-medium text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* User Info with Photo */}
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={employeePhotoUrl || "/placeholder.svg"}
                        alt={`Foto de ${name}`}
                        className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg absolute top-0 left-0 hidden border-2 border-white shadow-md">
                        {name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                        {name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        <span>
                          {requests.length} solicitud{requests.length !== 1 ? "es" : ""}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Primary Request */}
                  <div
                    className={`
                      p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-all duration-200 cursor-pointer
                      border border-gray-200/50 hover:border-emerald-300/50 hover:shadow-sm
                      ${selectedRequestIds.has(primaryRequest.id) ? "bg-emerald-50/80 border-emerald-400/50" : ""}
                    `}
                    onClick={() => onRequestClick(primaryRequest)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`
                            w-9 h-9 rounded-lg ${getTypeColor(primaryRequest.type)}
                            flex items-center justify-center shadow-sm text-white
                          `}
                        >
                          {getTypeIcon(primaryRequest.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-800 text-sm">{primaryRequest.type}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {primaryRequest.createdAt
                                  ? new Date(primaryRequest.createdAt).toLocaleDateString("es-ES")
                                  : "N/A"}
                              </span>
                            </span>
                            {primaryRequest.zona && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{primaryRequest.zona}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
                          {primaryRequest.code}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                    {primaryRequest.description && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {primaryRequest.description}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Additional Requests Preview */}
                  {requests.length > 1 && (
                    <div className="mt-3 space-y-2">
                      {requests.slice(1, 3).map((request, index) => (
                        <div
                          key={request.id}
                          className="p-3 rounded-lg bg-gray-50/50 border border-gray-200/30 hover:bg-gray-100/50 transition-colors cursor-pointer"
                          onClick={() => onRequestClick(request)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-6 h-6 rounded-md ${getTypeColor(request.type)} flex items-center justify-center`}
                              >
                                {React.cloneElement(getTypeIcon(request.type) as React.ReactElement, {
                                  className: "h-3 w-3 text-white",
                                })}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{request.type}</span>
                            </div>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono">
                              {request.code}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {requests.length > 3 && (
                        <div className="text-center pt-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{requests.length - 3} más
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                {/* Footer */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 hover:bg-emerald-50 h-7 px-3 text-xs font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle "Ver todo" action
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver todo
                    </Button>
                  </div>
                </div>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48 rounded-xl border-0 shadow-xl bg-white/95 backdrop-blur-xl">
              <ContextMenuItem className="flex items-center space-x-2 p-2 rounded-lg">
                <Eye className="h-4 w-4" />
                <span>Ver detalles</span>
              </ContextMenuItem>
              <ContextMenuItem className="flex items-center space-x-2 p-2 rounded-lg">
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </ContextMenuItem>
              <ContextMenuItem className="flex items-center space-x-2 p-2 rounded-lg">
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </ContextMenuItem>
              <ContextMenuSeparator className="my-1" />
              {requests.map((request) => (
                <ContextMenuItem
                  key={request.id}
                  onClick={() => onDelete(request)}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center space-x-2 p-2 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar {request.type}</span>
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )
    },
  ),
)

RequestCard.displayName = "RequestCard"

export default RequestCard
