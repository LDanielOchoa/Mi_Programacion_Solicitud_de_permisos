"use client"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  FileText,
  Phone,
  MapPin,
  Users,
  User,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Star,
  Shield,
  Zap,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect } from "react"

interface Request {
  id: number
  code: string
  name: string
  request_type: "permiso" | "postulaciones"
  tipo_novedad: string
  createdAt: string
  status: "approved" | "rejected" | "pending"
  telefono?: string
  fecha?: string
  hora?: string
  zona?: string
  comp_am?: string
  comp_pm?: string
  turno?: string
  description?: string
  respuesta?: string
}

interface RequestDetailsProps {
  request: Request
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDetailsDialog({ request, open, onOpenChange }: RequestDetailsProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          icon: CheckCircle2,
          text: "Aprobada",
          cardBg: "bg-green-50",
          cardBorder: "border-green-200",
          iconBg: "bg-green-600",
        }
      case "rejected":
        return {
          bgColor: "bg-green-50", 
          textColor: "text-green-700",
          icon: XCircle,
          text: "Rechazada",
          cardBg: "bg-green-50",
          cardBorder: "border-green-200",
          iconBg: "bg-green-500",
        }
      case "pending":
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          icon: AlertCircle,
          text: "Pendiente", 
          cardBg: "bg-green-50",
          cardBorder: "border-green-200",
          iconBg: "bg-green-400",
        }
      default:
        return {
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          icon: AlertCircle,
          text: "Desconocido",
          cardBg: "bg-green-50", 
          cardBorder: "border-green-200",
          iconBg: "bg-green-300",
        }
    }
  }

  const statusConfig = getStatusConfig(request.status)
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 rounded-3xl sm:max-w-2xl w-[95%] max-h-[85vh] sm:max-h-[90vh] shadow-2xl border-0 bg-white overflow-hidden flex flex-col">
        <div
          className={`${statusConfig.bgColor} ${statusConfig.textColor} p-8 relative flex-shrink-0 overflow-hidden`}
        >
          {/* Simple decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-200 rounded-full translate-y-12 -translate-x-12"></div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 text-current hover:bg-white/20 rounded-full h-10 w-10 transition-all duration-300 hover:scale-110 z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6 pr-16">
              <div className="bg-white p-3 rounded-2xl border border-green-200 shadow-lg">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold mb-2 text-balance leading-tight">
                  {request.tipo_novedad}
                </DialogTitle>
                <p className="text-base opacity-90 font-medium">Solicitud de {request.request_type}</p>
                <p className="text-sm opacity-75 mt-1">Solicitante: {request.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge
                variant="outline"
                className="bg-white text-green-700 border-green-300 rounded-full px-4 py-2 font-semibold text-sm"
              >
                #{request.code}
              </Badge>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-green-300">
                <StatusIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">{statusConfig.text}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-green-50">
          {/* Main request details card */}
          <div className="bg-white rounded-3xl p-8 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            {/* Simple corner element */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-10 translate-x-10"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="bg-green-600 p-4 rounded-2xl shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800">Detalles de la Solicitud</h3>
                <p className="text-gray-600">Información completa de tu solicitud</p>
              </div>
            </div>

            <div className="grid gap-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-gray-600 block font-medium">Fecha de creación</span>
                  <span className="font-bold text-gray-800 text-lg">{formatDate(request.createdAt)}</span>
                </div>
              </div>

              {request.fecha && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block font-medium">Fecha solicitada</span>
                    <span className="font-bold text-gray-800 text-lg">{request.fecha}</span>
                  </div>
                </div>
              )}

              {request.hora && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block font-medium">Horario</span>
                    <span className="font-bold text-gray-800 text-lg">{request.hora}</span>
                  </div>
                </div>
              )}

              {request.telefono && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block font-medium">Teléfono de contacto</span>
                    <span className="font-bold text-gray-800 text-lg">{request.telefono}</span>
                  </div>
                </div>
              )}

              {request.zona && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block font-medium">Zona de trabajo</span>
                    <span className="font-bold text-gray-800 text-lg">{request.zona}</span>
                  </div>
                </div>
              )}

              {(request.comp_am || request.comp_pm) && (
                <div className="p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-800 text-lg">Equipo de trabajo</span>
                  </div>
                  <div className="space-y-3 ml-16">
                    {request.comp_am && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200/30">
                        <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                          AM
                        </span>
                        <span className="font-semibold text-gray-800">{request.comp_am}</span>
                      </div>
                    )}
                    {request.comp_pm && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-green-200/30">
                        <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                          PM
                        </span>
                        <span className="font-semibold text-gray-800">{request.comp_pm}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {request.turno && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-green-200 hover:border-green-300 transition-all duration-200">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-600 block font-medium">Turno asignado</span>
                    <span className="font-bold text-gray-800 text-lg">{request.turno}</span>
                  </div>
                </div>
              )}
            </div>

            {request.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-800 text-lg">Descripción detallada</span>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-pretty font-medium text-lg">
                    {request.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {request.respuesta && (
            <div
              className={`${statusConfig.cardBg} rounded-3xl p-8 border-2 ${statusConfig.cardBorder} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`${statusConfig.iconBg} p-4 rounded-2xl shadow-lg`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">Respuesta Oficial</h3>
                  <p className="text-gray-600 font-medium">Decisión del administrador sobre tu solicitud</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-lg relative z-10">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-pretty font-medium text-lg">
                  {request.respuesta}
                </p>
              </div>
            </div>
          )}

          {!request.respuesta && request.status === "pending" && (
            <div className="bg-green-50 rounded-3xl p-8 border-2 border-green-200 text-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-green-100 opacity-20"></div>

              <div className="relative z-10">
                <div className="bg-green-600 p-6 rounded-3xl w-fit mx-auto mb-6 shadow-lg">
                  <Clock className="w-8 h-8 text-white mx-auto" />
                </div>
                <h3 className="font-bold text-2xl text-gray-800 mb-3">Solicitud en Revisión</h3>
                <p className="text-gray-600 mb-2 font-medium text-lg">
                  Tu solicitud está siendo evaluada por nuestro equipo
                </p>
                <p className="text-gray-600 font-medium">Te notificaremos cuando tengamos una respuesta</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-green-200 bg-white">
          <Button
            className="w-full rounded-xl h-12 font-bold text-base bg-green-600 text-white hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => onOpenChange(false)}
          >
            Cerrar Solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
