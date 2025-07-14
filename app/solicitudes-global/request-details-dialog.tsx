"use client"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, Phone, MapPin, Users, User, MessageSquare, X } from "lucide-react"
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
  // Evitar el desplazamiento del cuerpo cuando el diálogo está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500"
      case "rejected":
        return "bg-red-500"
      case "pending":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobada"
      case "rejected":
        return "Rechazada"
      case "pending":
        return "Pendiente"
      default:
        return "Desconocido"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-xl sm:max-w-md w-[95%] h-auto">
        {/* Encabezado con color según estado */}
        <div className={`${getStatusColor(request.status)} p-4 text-white relative flex-shrink-0`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-lg font-bold mb-2 pr-8">{request.tipo_novedad}</DialogTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              #{request.code}
            </Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {getStatusText(request.status)}
            </Badge>
          </div>
        </div>

        <div style={{ maxHeight: '40vh', overflowY: 'scroll', padding: '16px', touchAction: 'auto' }}>
          <div className="space-y-4">
            {/* Mi Solicitud */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-3">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-blue-800">Mi Solicitud</h3>
              </div>

              {/* Información básica */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-gray-600">Fecha de creación:</span>
                  <span className="ml-2 font-medium">{formatDate(request.createdAt)}</span>
                </div>

                {request.fecha && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Fecha solicitada:</span>
                    <span className="ml-2 font-medium">{request.fecha}</span>
                  </div>
                )}

                {request.hora && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Horario:</span>
                    <span className="ml-2 font-medium">{request.hora}</span>
                  </div>
                )}

                {request.telefono && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-2 font-medium">{request.telefono}</span>
                  </div>
                )}

                {request.zona && (
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Zona:</span>
                    <span className="ml-2 font-medium">{request.zona}</span>
                  </div>
                )}

                {(request.comp_am || request.comp_pm) && (
                  <div className="text-sm">
                    <div className="flex items-center mb-2">
                      <Users className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-gray-600">Equipo:</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {request.comp_am && (
                        <div className="text-sm">
                          <span className="text-gray-500">AM:</span>
                          <span className="ml-2 font-medium">{request.comp_am}</span>
                        </div>
                      )}
                      {request.comp_pm && (
                        <div className="text-sm">
                          <span className="text-gray-500">PM:</span>
                          <span className="ml-2 font-medium">{request.comp_pm}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {request.turno && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Turno:</span>
                    <span className="ml-2 font-medium">{request.turno}</span>
                  </div>
                )}
              </div>

              {/* Descripción de mi solicitud */}
              {request.description && (
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Descripción:</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{request.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Respuesta (solo si existe) */}
            {request.respuesta && (
              <div
                className={`rounded-lg p-4 border ${
                  request.status === "approved"
                    ? "bg-emerald-50 border-emerald-200"
                    : request.status === "rejected"
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`p-2 rounded-lg mr-3 ${
                      request.status === "approved"
                        ? "bg-emerald-500"
                        : request.status === "rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <h3
                    className={`font-semibold ${
                      request.status === "approved"
                        ? "text-emerald-800"
                        : request.status === "rejected"
                          ? "text-red-800"
                          : "text-amber-800"
                    }`}
                  >
                    Respuesta del Administrador
                  </h3>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{request.respuesta}</p>
                </div>
              </div>
            )}

            {/* Si no hay respuesta y está pendiente */}
            {!request.respuesta && request.status === "pending" && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
                <div className="bg-amber-500 p-2 rounded-lg w-fit mx-auto mb-2">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-amber-800 font-medium">Tu solicitud está siendo revisada</p>
                <p className="text-xs text-amber-600 mt-1">Recibirás una respuesta pronto</p>
              </div>
            )}
          </div>
        </div>

        {/* Botón de cerrar */}
        <div className="p-4 border-t border-gray-200">
          <Button variant="outline" className="w-full rounded-lg" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
