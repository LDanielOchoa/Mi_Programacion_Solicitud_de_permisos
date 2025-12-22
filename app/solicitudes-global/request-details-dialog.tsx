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
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Shield,
  Zap,
  ChevronRight,
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
          bgColor: "bg-[#4cc253]/10",
          textColor: "text-[#4cc253]",
          borderColor: "border-[#4cc253]/20",
          icon: CheckCircle,
          text: "Aprobada",
        }
      case "rejected":
        return {
          bgColor: "bg-red-50",
          textColor: "text-red-600",
          borderColor: "border-red-100",
          icon: XCircle,
          text: "Rechazada",
        }
      case "pending":
        return {
          bgColor: "bg-amber-50",
          textColor: "text-amber-600",
          borderColor: "border-amber-100",
          icon: AlertCircle,
          text: "Pendiente",
        }
      default:
        return {
          bgColor: "bg-gray-50",
          textColor: "text-gray-600",
          borderColor: "border-gray-100",
          icon: AlertCircle,
          text: "Desconocido",
        }
    }
  }

  const statusConfig = getStatusConfig(request.status)
  const StatusIcon = statusConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 rounded-[40px] sm:max-w-3xl w-[95%] max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col bg-white">
        {/* Header Premium */}
        <div className="bg-white p-8 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <FileText className="w-7 h-7 text-[#4cc253]" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-1">
                  {request.tipo_novedad}
                </DialogTitle>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
                  Solicitud #{request.code}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 w-12 rounded-2xl hover:bg-gray-100 text-gray-500 flex items-center justify-center p-0"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={`${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border px-3 py-1 text-[10px] font-black uppercase tracking-widest`}
            >
              <StatusIcon className="w-3 h-3 mr-1.5" />
              {statusConfig.text}
            </Badge>
            <Badge className="bg-gray-50 text-gray-600 border-gray-100 border px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              {request.request_type === "permiso" ? "Permiso" : "Postulación"}
            </Badge>
          </div>
        </div>

        {/* Content Area con Scroll */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
          {/* Información del Solicitante */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-[#4cc253]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Solicitante</h3>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#4cc253] flex items-center justify-center text-white font-black text-sm mr-4">
                {request.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{request.name}</p>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Empleado</p>
              </div>
            </div>
          </div>

          {/* Detalles de la Solicitud */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-50 rounded-xl">
                <Activity className="w-5 h-5 text-[#4cc253]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Detalles</h3>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Fecha de Creación</p>
                  <p className="font-bold text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
              </div>

              {request.fecha && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Fecha Solicitada</p>
                    <p className="font-bold text-gray-900">{request.fecha}</p>
                  </div>
                </div>
              )}

              {request.hora && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Horario</p>
                    <p className="font-bold text-gray-900">{request.hora}</p>
                  </div>
                </div>
              )}

              {request.telefono && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Teléfono</p>
                    <p className="font-bold text-gray-900">{request.telefono}</p>
                  </div>
                </div>
              )}

              {request.zona && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Zona</p>
                    <p className="font-bold text-gray-900">{request.zona}</p>
                  </div>
                </div>
              )}

              {(request.comp_am || request.comp_pm) && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-[#4cc253]" />
                    </div>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Equipo de Trabajo</p>
                  </div>
                  <div className="space-y-2 ml-13">
                    {request.comp_am && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[9px] bg-[#4cc253] text-white px-2 py-1 rounded-full font-black uppercase">
                          AM
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{request.comp_am}</span>
                      </div>
                    )}
                    {request.comp_pm && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[9px] bg-amber-500 text-white px-2 py-1 rounded-full font-black uppercase">
                          PM
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{request.comp_pm}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {request.turno && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Zap className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Turno</p>
                    <p className="font-bold text-gray-900">{request.turno}</p>
                  </div>
                </div>
              )}
            </div>

            {request.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <FileText className="w-4 h-4 text-[#4cc253]" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Descripción</h4>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-gray-800 leading-relaxed font-medium text-sm">{request.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Respuesta del Administrador */}
          {request.respuesta && (
            <div className={`${statusConfig.bgColor} rounded-3xl p-6 border-2 ${statusConfig.borderColor} shadow-sm`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Shield className="w-5 h-5 text-[#4cc253]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Respuesta Oficial</h3>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                    Decisión del Administrador
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-gray-800 leading-relaxed font-medium text-sm">{request.respuesta}</p>
              </div>
            </div>
          )}

          {/* Estado Pendiente */}
          {!request.respuesta && request.status === "pending" && (
            <div className="bg-amber-50 rounded-3xl p-8 border-2 border-amber-100 text-center shadow-sm">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center border border-amber-100 shadow-sm">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">En Revisión</h3>
              <p className="text-gray-600 text-sm font-medium mb-1">
                Tu solicitud está siendo evaluada por el equipo
              </p>
              <p className="text-gray-500 text-xs font-medium">Te notificaremos cuando tengamos una respuesta</p>
            </div>
          )}
        </div>

        {/* Footer con Botón de Cerrar */}
        <div className="flex-shrink-0 p-6 border-t border-gray-100 bg-white">
          <Button
            className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-900 text-white hover:bg-black transition-all shadow-lg"
            onClick={() => onOpenChange(false)}
          >
            Cerrar Detalles
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
