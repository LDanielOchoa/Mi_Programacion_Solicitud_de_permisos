"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import {
  X,
  Download,
  FileText,
  ImageIcon,
  FileIcon,
  Calendar,
  Clock,
  Phone,
  Type,
  CheckCircle,
  XCircle,
  Paperclip,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  AlertTriangle,
  Info,
  History,
  MessageSquare,
  Settings,
  Loader2,
  Building,
  Hash,
  BadgeIcon as IdCard,
  Briefcase,
  Mail,
  MapPin,
  UserCheck,
  Shield,
  Award,
  Clock3,
} from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Types
type FileInfo = {
  fileName: string
  fileUrl: string
}

type Request = {
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
  dates?: string[] | string
  files?: string[] | FileInfo[]
  file_name?: string[]
  file_url?: string[]
  noveltyType?: string
  reason?: string
  phone?: string
  cargo?: string
  fechaIngreso?: string
  operatorId?: string
  password?: string
  [key: string]: any
}

type HistoryItem = {
  id: string
  type: string
  createdAt: string
  status: string
  description?: string
  requestedDates?: string
  requestId?: string
  requestType?: string
}

type RequestDetailsProps = {
  requests: Request[]
  onClose: () => void
  onAction: (id: string, action: "approve" | "reject", reason: string) => void
}

// Utility Functions
const processFiles = (request: Request): FileInfo[] => {
  if (!request.files && !request.file_name && !request.file_url) return []
  try {
    if (Array.isArray(request.files) && request.files.length > 0 && typeof request.files[0] === "object") {
      return request.files as FileInfo[]
    }
    if (Array.isArray(request.file_name) && Array.isArray(request.file_url)) {
      return request.file_name.map((name, index) => ({
        fileName: name,
        fileUrl: request.file_url![index],
      }))
    }
    if (Array.isArray(request.files)) {
      return request.files.map((file) => ({
        fileName: Array.isArray(file) ? file[0] : file,
        fileUrl: Array.isArray(file) ? file[0] : file,
      }))
    }
  } catch (error) {
    console.error("Error processing files:", error)
  }
  return []
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Fecha no disponible"
  try {
    if (dateString.includes(",")) {
      const fechas = dateString.split(",").map((fecha) => {
        const fechaTrim = fecha.trim()
        try {
          const date = parseISO(fechaTrim)
          return isValid(date) ? format(date, "dd/MM/yyyy", { locale: es }) : fechaTrim
        } catch {
          return fechaTrim
        }
      })
      return fechas.join(", ")
    }
    const date = parseISO(dateString)
    if (!isValid(date)) {
      const matches = dateString.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (matches) {
        const [_, day, month, year] = matches
        const newDate = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
        if (isValid(newDate)) {
          return format(newDate, "dd/MM/yyyy", { locale: es })
        }
      }
      return dateString
    }
    return format(date, "dd/MM/yyyy", { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error, dateString)
    return dateString
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200"
    case "created":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "notified":
      return "bg-purple-50 text-purple-700 border-purple-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "Pendiente"
    case "approved":
      return "Aprobado"
    case "rejected":
      return "Rechazado"
    case "created":
      return "Creada"
    case "notified":
      return "Notificada"
    default:
      return status
  }
}

const isImage = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  return ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension || "")
}

const isPDF = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  return extension === "pdf"
}

// File Preview Components
const FilePreviewThumbnail = React.memo(
  ({
    fileName,
    fileUrl,
    onClick,
  }: {
    fileName: string
    fileUrl: string
    onClick: () => void
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
      setImageLoaded(false)
      setImageError(false)
    }, [fileUrl])

    return (
      <div
        className="relative group aspect-square overflow-hidden bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
        onClick={onClick}
      >
        {isImage(fileName) && !imageError ? (
          <>
            <img
              src={fileUrl || "/placeholder.svg"}
              alt={fileName}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            )}
          </>
        ) : isPDF(fileName) ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <FileText className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-xs font-medium text-red-600">PDF</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <FileIcon className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-xs font-medium text-gray-600">
              {fileName.split(".").pop()?.toUpperCase() || "FILE"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </div>
    )
  },
)
FilePreviewThumbnail.displayName = "FilePreviewThumbnail"

const FilePreviewModal = React.memo(({ file, onClose }: { file: FileInfo; onClose: () => void }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
  }, [file.fileUrl])

  const handleDownload = useCallback(() => {
    window.open(file.fileUrl, "_blank")
  }, [file.fileUrl])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] mx-auto my-auto shadow-2xl border border-gray-200/80 relative flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                {isImage(file.fileName) ? (
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                ) : isPDF(file.fileName) ? (
                  <FileText className="w-5 h-5 text-emerald-600" />
                ) : (
                  <FileIcon className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 truncate max-w-[300px]">{file.fileName}</h3>
                <p className="text-sm text-gray-500">Vista previa del archivo</p>
              </div>
            </div>
            {/* Close Button */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {loading && (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="mt-3 text-gray-600">Cargando archivo...</p>
                  </div>
                )}
                {error ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-red-600 mb-2 text-lg font-semibold">{error}</p>
                    <p className="text-gray-500 max-w-md mb-4">
                      No se pudo cargar el archivo. Intente descargar el archivo para verlo.
                    </p>
                    <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Archivo
                    </Button>
                  </div>
                ) : isImage(file.fileName) ? (
                  <img
                    src={file.fileUrl || "/placeholder.svg"}
                    alt={file.fileName}
                    className="max-w-full max-h-[calc(90vh-150px)] object-contain"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false)
                      setError("No se pudo cargar la imagen")
                    }}
                    style={{ display: loading ? "none" : "block" }}
                  />
                ) : isPDF(file.fileName) ? (
                  <div className="w-full h-[calc(90vh-150px)]">
                    <iframe
                      src={file.fileUrl}
                      width="100%"
                      height="100%"
                      onLoad={() => setLoading(false)}
                      onError={() => {
                        setLoading(false)
                        setError("No se pudo cargar el PDF")
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileIcon className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-700 mb-2 text-lg font-semibold">Vista previa no disponible</p>
                    <p className="text-gray-500 max-w-md mb-4">
                      No se puede mostrar una vista previa para este tipo de archivo.
                    </p>
                    <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Archivo
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})
FilePreviewModal.displayName = "FilePreviewModal"

const PhotoModal = React.memo(
  ({ photoUrl, employeeName, onClose }: { photoUrl: string; employeeName: string; onClose: () => void }) => {
  return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-4xl max-h-[90vh] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoUrl || "/placeholder.svg"}
              alt={`Foto de ${employeeName}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  },
)
PhotoModal.displayName = "PhotoModal"

// Enhanced Personal Info Component
const PersonalInfoCard = React.memo(
  ({
    operatorInfo,
    request,
    isLoading,
    onPhotoClick,
  }: {
    operatorInfo: any
    request: Request
    isLoading: boolean
    onPhotoClick?: (photoUrl: string) => void
  }) => {
    return (
      <Card className="border border-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xl">Información Personal del Solicitante</span>
            </CardTitle>
          </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-gray-600">Cargando información personal...</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Photo and Basic Info Section */}
              <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-8 mb-8">
                {/* Photo Section */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative mb-4">
                    {operatorInfo?.foto ? (
                      <div
                        className="relative cursor-pointer"
                        onClick={() => onPhotoClick && onPhotoClick(operatorInfo.foto)}
                      >
                        <img
                          src={operatorInfo.foto || "/placeholder.svg"}
                          alt={`Foto de ${operatorInfo.nombre || request.name}`}
                          className="w-32 h-32 rounded-2xl object-cover border-4 border-emerald-200 shadow-lg hover:shadow-xl transition-shadow duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            target.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                        <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl absolute top-0 left-0 hidden border-4 border-emerald-200 shadow-lg">
                          {operatorInfo?.nombre
                            ? operatorInfo.nombre
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                            : request.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                        </div>
                        <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl border-4 border-emerald-200 shadow-lg">
                        {operatorInfo?.nombre
                          ? operatorInfo.nombre
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : request.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1 font-semibold">
                    Empleado Activo
                  </Badge>
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{operatorInfo?.nombre || request.name}</h2>
                    <p className="text-lg text-emerald-600 font-semibold">
                      {operatorInfo?.cargo || "Cargo no especificado"}
                    </p>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                          <IdCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                          <p className="text-sm text-gray-500 font-medium">Número de Cédula</p>
                          <p className="text-lg font-bold text-gray-900">{operatorInfo?.cedula || request.code}</p>
                        </div>
              </div>
            </div>

                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Hash className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                          <p className="text-sm text-gray-500 font-medium">ID de Empleado</p>
                          <p className="text-lg font-bold text-gray-900">{operatorInfo?.id || "N/A"}</p>
                        </div>
              </div>
            </div>

            {request.phone && (
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
              <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                            <p className="text-sm text-gray-500 font-medium">Teléfono</p>
                            <p className="text-lg font-bold text-gray-900">{request.phone}</p>
                          </div>
                </div>
              </div>
            )}

            {request.zona && (
                      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
              <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                            <p className="text-sm text-gray-500 font-medium">Zona de Trabajo</p>
                            <p className="text-lg font-bold text-gray-900">{request.zona}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Employment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    <span>Información Laboral</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fecha de Ingreso</p>
                        <p className="text-sm text-gray-900">
                          {operatorInfo?.fechaIngreso ? formatDate(operatorInfo.fechaIngreso) : "No disponible"}
                        </p>
                      </div>
                    </div>

                    {operatorInfo?.departamento && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Departamento</p>
                          <p className="text-sm text-gray-900">{operatorInfo.departamento}</p>
                        </div>
                      </div>
                    )}

                    {operatorInfo?.supervisor && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <UserCheck className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Supervisor</p>
                          <p className="text-sm text-gray-900">{operatorInfo.supervisor}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <span>Información de Contacto</span>
                  </h3>

                  <div className="space-y-3">
                    {request.phone && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Teléfono Principal</p>
                          <p className="text-sm text-gray-900">{request.phone}</p>
                        </div>
                      </div>
                    )}

                    {operatorInfo?.email && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Correo Electrónico</p>
                          <p className="text-sm text-gray-900">{operatorInfo.email}</p>
                        </div>
                      </div>
                    )}

                    {operatorInfo?.direccion && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Dirección</p>
                          <p className="text-sm text-gray-900">{operatorInfo.direccion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-emerald-600" />
                    <span>Información Adicional</span>
                  </h3>

                  <div className="space-y-3">
                    {operatorInfo?.turno && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Clock3 className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Turno de Trabajo</p>
                          <p className="text-sm text-gray-900">{operatorInfo.turno}</p>
                        </div>
                      </div>
                    )}

                    {operatorInfo?.estado && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Activity className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Estado</p>
                          <Badge
                            className={`text-xs ${
                              operatorInfo.estado === "Activo"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {operatorInfo.estado}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {operatorInfo?.nivel && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Award className="w-4 h-4 text-gray-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nivel</p>
                          <p className="text-sm text-gray-900">{operatorInfo.nivel}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    )
  },
)
PersonalInfoCard.displayName = "PersonalInfoCard"

// Section Components
const InfoSection = React.memo(
  ({
    request,
    operatorInfo,
    isLoadingOperator,
    onPhotoClick,
  }: {
    request: Request
    operatorInfo: any
    isLoadingOperator: boolean
    onPhotoClick?: (photoUrl: string) => void
  }) => {
    return (
      <div className="space-y-6">
        {/* Enhanced Personal Information */}
        <PersonalInfoCard
          operatorInfo={operatorInfo}
          request={request}
          isLoading={isLoadingOperator}
          onPhotoClick={onPhotoClick}
        />

        {/* Request Details */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              <FileText className="w-5 h-5" />
              <span>Detalles de la Solicitud</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Type className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de solicitud</p>
                  <p className="font-semibold text-gray-900 capitalize">{request.type}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado actual</p>
                  <Badge className={`${getStatusColor(request.status)} border font-medium`}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de solicitud</p>
                <p className="font-semibold text-gray-900">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                  <p className="text-sm text-gray-500">Hora de solicitud</p>
                <p className="font-semibold text-gray-900">{request.time}</p>
                </div>
              </div>
            </div>

            {/* Rango de Fechas Solicitadas */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Rango de Fechas Solicitadas</h4>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                {request.dates ? (
                  Array.isArray(request.dates) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {request.dates.map((date: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-emerald-800">{formatDate(date)}</span>
              </div>
                      ))}
              </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-800">{formatDate(request.dates)}</span>
            </div>
                  )
                ) : (
                  <p className="text-gray-500 italic">No hay fechas especificadas</p>
                )}
              </div>
            </div>

            {/* Respuesta del Administrador */}
            {request.reason && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Respuesta del Administrador</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{request.reason}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
      {request.description && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              <MessageSquare className="w-5 h-5" />
              <span>Descripción de la Solicitud</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{request.description}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
  },
)
InfoSection.displayName = "InfoSection"

const DatesSection = React.memo(({ dates }: { dates?: string[] | string }) => (
  <Card className="border border-gray-200 shadow-sm">
    <CardHeader className="bg-emerald-50 border-b border-emerald-100">
      <CardTitle className="flex items-center space-x-2 text-emerald-800">
        <CalendarIcon className="w-5 h-5" />
        <span>Fechas Solicitadas</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      {Array.isArray(dates) && dates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dates.map((date: string, index: number) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-800">{formatDate(date)}</span>
            </div>
          ))}
        </div>
      ) : typeof dates === "string" ? (
        <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CalendarIcon className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-emerald-800">{formatDate(dates)}</span>
        </div>
      ) : (
        <div className="text-center py-8">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hay fechas disponibles</p>
        </div>
      )}
    </CardContent>
  </Card>
))
DatesSection.displayName = "DatesSection"

const FilesSection = React.memo(
  ({
    files,
    onFileSelect,
  }: {
    files: FileInfo[]
    onFileSelect: (file: FileInfo) => void
  }) => (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-emerald-50 border-b border-emerald-100">
        <CardTitle className="flex items-center space-x-2 text-emerald-800">
          <Paperclip className="w-5 h-5" />
          <span>Archivos Adjuntos ({files.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {files.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={`${file.fileUrl}-${index}`} className="space-y-2">
                <FilePreviewThumbnail
                  fileName={file.fileName}
                  fileUrl={file.fileUrl}
                  onClick={() => onFileSelect(file)}
                />
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-700 font-medium truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <div className="flex items-center mt-1 space-x-1">
                    <Eye className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Click para ver</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay archivos adjuntos</p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
)
FilesSection.displayName = "FilesSection"

const ActionSection = React.memo(
  ({
    reason,
    onReasonChange,
    onApprove,
    onReject,
  }: {
    reason: string
    onReasonChange: (reason: string) => void
    onApprove: () => void
    onReject: () => void
  }) => (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-emerald-50 border-b border-emerald-100">
        <CardTitle className="flex items-center space-x-2 text-emerald-800">
          <Settings className="w-5 h-5" />
          <span>Acción Requerida</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de la decisión <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="Escriba aquí la razón detallada para su decisión..."
            onChange={(e) => onReasonChange(e.target.value)}
            value={reason}
            className="min-h-[120px] border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">Este comentario será visible para el solicitante</p>
        </div>
        <Separator />
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onReject}
            className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
            disabled={!reason.trim()}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rechazar Solicitud
          </Button>
          <Button onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700" disabled={!reason.trim()}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprobar Solicitud
          </Button>
        </div>
      </CardContent>
    </Card>
  ),
)
ActionSection.displayName = "ActionSection"

const HistorySection = React.memo(
  ({
    isLoading,
    error,
    history,
  }: {
    isLoading: boolean
    error: string | null
    history: HistoryItem[]
  }) => {
    // Agrupar por estado
    const grouped = useMemo(() => {
      return {
        approved: history.filter(h => h.status === 'approved'),
        rejected: history.filter(h => h.status === 'rejected'),
        pending: history.filter(h => h.status === 'pending'),
      }
    }, [history])

    // Estadísticas
    const stats = useMemo(() => {
      const totalRequests = history.filter(h => h.status === 'created').length
      const approvedRequests = history.filter(h => h.status === 'approved').length
      const rejectedRequests = history.filter(h => h.status === 'rejected').length
      const pendingRequests = history.filter(h => h.status === 'pending').length
      return {
        total: totalRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        pending: pendingRequests
      }
    }, [history])

    // Renderizar lista de items
    const renderItems = (items: HistoryItem[]) => (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'created' ? 'bg-blue-500' :
                item.status === 'approved' ? 'bg-green-500' :
                item.status === 'rejected' ? 'bg-red-500' :
                item.status === 'pending' ? 'bg-amber-500' :
                item.status === 'notified' ? 'bg-purple-500' :
                'bg-gray-500'
              }`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{item.type}</h4>
                <Badge className={`${getStatusColor(item.status)} border text-xs`}>
                  {getStatusText(item.status)}
                </Badge>
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              )}
              {item.requestedDates && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 font-medium">Fechas solicitadas:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.requestedDates.split(',').map((fecha, idx) => (
                      <span 
                        key={idx} 
                        className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md border border-emerald-200"
                      >
                        {formatDate(fecha.trim())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )

    return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-emerald-50 border-b border-emerald-100">
        <CardTitle className="flex items-center space-x-2 text-emerald-800">
          <History className="w-5 h-5" />
          <span>Historial de Actividades</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
          {/* Estadísticas del historial */}
          {history.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen de Solicitudes</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-xs text-gray-600">Aprobadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-xs text-gray-600">Rechazadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-gray-600">Pendientes</div>
                </div>
              </div>
            </div>
          )}
          {/* Scrollable area para historial */}
          <div className="max-h-[400px] overflow-y-auto space-y-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-gray-600 mt-2">Cargando historial...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        ) : history.length > 0 ? (
              <>
                {grouped.approved.length > 0 && (
                  <div>
                    <h3 className="text-green-700 font-bold mb-2">Aprobadas</h3>
                    {renderItems(grouped.approved)}
          </div>
                )}
                {grouped.rejected.length > 0 && (
                  <div>
                    <h3 className="text-red-700 font-bold mb-2">Rechazadas</h3>
                    {renderItems(grouped.rejected)}
                  </div>
                )}
                {grouped.pending.length > 0 && (
                  <div>
                    <h3 className="text-amber-700 font-bold mb-2">Pendientes</h3>
                    {renderItems(grouped.pending)}
                  </div>
                )}

              </>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay historial disponible para esta solicitud.</p>
          </div>
        )}
          </div>
      </CardContent>
    </Card>
)
  }
)
HistorySection.displayName = "HistorySection"

// Main Component
const RequestDetails = ({ requests, onClose, onAction }: RequestDetailsProps) => {
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0)
  const [reason, setReason] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [operatorInfo, setOperatorInfo] = useState<any>(null)
  const [isLoadingOperator, setIsLoadingOperator] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const currentRequest = requests[currentRequestIndex]
  const isEquipmentRequest = !["descanso", "cita", "audiencia", "licencia", "diaAM", "diaPM"].includes(
    currentRequest.type,
  )

  // Función para obtener información del operador
  const fetchOperatorInfo = useCallback(async (code: string) => {
    try {
      setIsLoadingOperator(true)
      const token = localStorage.getItem("accessToken")
      console.log("Token disponible:", !!token)

      const response = await fetch(`/operator/info/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Respuesta del servidor:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("Datos del operador:", data)
        setOperatorInfo(data)
      } else {
        console.warn("Error al obtener información del operador:", response.status, response.statusText)
        setOperatorInfo(null)
      }
    } catch (error) {
      console.error("Error al obtener información del operador:", error)
      setOperatorInfo(null)
    } finally {
      setIsLoadingOperator(false)
    }
  }, [])

  // Obtener información del operador cuando cambia la solicitud
  useEffect(() => {
    const cedula = currentRequest.password || currentRequest.code
    console.log("Datos del request:", {
      code: currentRequest.code,
      password: currentRequest.password,
      cedulaUsada: cedula,
    })
    if (cedula) {
      fetchOperatorInfo(cedula)
    }
  }, [currentRequest.password, currentRequest.code, fetchOperatorInfo])

  // Función para obtener el historial completo del usuario
  const fetchUserHistory = useCallback(async (userCode: string) => {
    try {
      setIsLoadingHistory(true)
      setHistoryError(null)
      const token = localStorage.getItem("accessToken")

      const response = await fetch(`https://solicitud-permisos.sao6.com.co/api/admin/requests/user/${userCode}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        console.log("Historial completo del usuario obtenido:", data.history)
        console.log("Información del usuario:", data.userInfo)
      } else {
        setHistory([])
        setHistoryError("No se pudo cargar el historial completo del usuario.")
      }
    } catch (error) {
      console.error("Error al obtener historial completo:", error)
      setHistory([])
      setHistoryError("Error al cargar el historial completo.")
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Obtener historial completo del usuario cuando cambia la solicitud
  useEffect(() => {
    const userCode = currentRequest.code
    if (userCode) {
      fetchUserHistory(userCode)
    }
  }, [currentRequest.code, fetchUserHistory])

  useEffect(() => {
    // Guardar la posición actual del scroll
    const scrollY = window.scrollY
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width

    // Bloquear completamente el scroll y mantener la posición
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    
    return () => {
      // Restaurar el estado original
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth

      // Restaurar la posición de scroll
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Prevenir scroll del modal
  useEffect(() => {
    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const modalElement = document.querySelector('[data-modal="request-details"]')
    if (modalElement) {
      modalElement.addEventListener("wheel", preventScroll, { passive: false })
      modalElement.addEventListener("touchmove", preventScroll, { passive: false })
    }
    return () => {
      if (modalElement) {
        modalElement.removeEventListener("wheel", preventScroll)
        modalElement.removeEventListener("touchmove", preventScroll)
      }
    }
  }, [])

  const handlePrevRequest = useCallback(() => {
    if (currentRequestIndex > 0) {
      setCurrentRequestIndex(currentRequestIndex - 1)
      setReason("")
    }
  }, [currentRequestIndex])

  const handleNextRequest = useCallback(() => {
    if (currentRequestIndex < requests.length - 1) {
      setCurrentRequestIndex(currentRequestIndex + 1)
      setReason("")
    }
  }, [currentRequestIndex, requests.length])

  const handleAction = useCallback(
    (action: "approve" | "reject") => {
      if (!reason.trim()) return
      onAction(currentRequest.id, action, reason)
      // Cerrar el modal después de ejecutar la acción
      onClose()
    },
    [currentRequest.id, onAction, reason, onClose],
  )

  const getSections = useMemo(() => {
    const sections = ["info"]
    if (!isEquipmentRequest) {
      sections.push("dates", "files")
    }
    sections.push("history")
    if (currentRequest.status === "pending") {
      sections.push("action")
    }
    return sections
  }, [isEquipmentRequest, currentRequest.status])

  const processedFiles = useMemo(() => processFiles(currentRequest), [currentRequest])

  const tabIcons = {
    info: Info,
    dates: CalendarIcon,
    files: Paperclip,
    history: History,
    action: Settings,
  }

  const tabLabels = {
    info: "Información",
    dates: "Fechas",
    files: "Archivos",
    history: "Historial",
    action: "Acción",
  }

  const modalContent = (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
        data-modal="request-details"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] shadow-2xl border border-gray-200/80 relative flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="bg-white p-8 border-b border-gray-100">
            <div className="flex items-start justify-between">
              {/* Left Section - Employee Info */}
              <div className="flex items-start space-x-6">
                {/* Employee Photo */}
                <div className="relative flex-shrink-0">
                  {operatorInfo?.foto ? (
                    <div className="relative">
                      <img
                        src={operatorInfo.foto || "/placeholder.svg"}
                        alt={`Foto de ${operatorInfo.nombre || currentRequest.name}`}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-100 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl absolute top-0 left-0 hidden border-4 border-gray-100 shadow-lg">
                        {operatorInfo?.nombre
                          ? operatorInfo.nombre
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : currentRequest.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-100 shadow-lg">
                      {isLoadingOperator ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : operatorInfo?.nombre ? (
                        operatorInfo.nombre
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      ) : (
                        currentRequest.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      )}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                    <UserCheck className="w-3 h-3" />
                  </div>
                </div>

                {/* Employee Details */}
              <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {isLoadingOperator ? "Cargando..." : operatorInfo?.nombre || currentRequest.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 font-semibold text-sm">
                        {operatorInfo?.cargo || "OPERADOR"}
                  </Badge>
                      <Badge
                        className={`${getStatusColor(currentRequest.status)} border font-medium text-sm px-3 py-1`}
                      >
                    {getStatusText(currentRequest.status)}
                  </Badge>
                    </div>
                </div>

                  {/* Employee Information Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500 text-xs">Código</p>
                        <p className="font-semibold text-gray-900">{currentRequest.code}</p>
                  </div>
                    </div>

                  <div className="flex items-center space-x-2">
                      <IdCard className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500 text-xs">Cédula</p>
                        <p className="font-semibold text-gray-900">{operatorInfo?.cedula || currentRequest.code}</p>
                  </div>
                    </div>

                  <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500 text-xs">Ingreso</p>
                        <p className="font-semibold text-gray-900">
                          {operatorInfo?.fechaIngreso ? formatDate(operatorInfo.fechaIngreso) : "N/A"}
                        </p>
                  </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500 text-xs">Zona</p>
                        <p className="font-semibold text-gray-900">{currentRequest.zona || "Sin zona"}</p>
                </div>
              </div>

                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-500 text-xs">Estado</p>
                        <p className="font-semibold text-emerald-600">Activo</p>
                      </div>
            </div>

                    {currentRequest.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500 text-xs">Teléfono</p>
                          <p className="font-semibold text-gray-900">{currentRequest.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                  </div>

              {/* Close Button */}
                  <Button
                variant="ghost"
                    size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2"
                  >
                <X className="h-6 w-6" />
                  </Button>
                </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-100">
            <Tabs defaultValue="general" className="flex-1 flex flex-col h-full">
              <div className="px-8">
                <TabsList className="bg-transparent border-0 p-0 h-auto">
                      <TabsTrigger
                    value="general"
                    className="flex items-center space-x-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 bg-transparent hover:text-emerald-600 transition-all duration-200 font-semibold"
                      >
                    <Info className="w-4 h-4" />
                    <span>Vista General</span>
                      </TabsTrigger>
                  {!isEquipmentRequest && (
                    <TabsTrigger
                      value="dates"
                      className="flex items-center space-x-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 bg-transparent hover:text-emerald-600 transition-all duration-200 font-semibold"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span>Fechas</span>
                    </TabsTrigger>
                  )}
                  {!isEquipmentRequest && (
                    <TabsTrigger
                      value="files"
                      className="flex items-center space-x-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 bg-transparent hover:text-emerald-600 transition-all duration-200 font-semibold"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>Archivos</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="history"
                    className="flex items-center space-x-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 bg-transparent hover:text-emerald-600 transition-all duration-200 font-semibold"
                  >
                    <History className="w-4 h-4" />
                    <span>Historial</span>
                  </TabsTrigger>
                  {currentRequest.status === "pending" && (
                    <TabsTrigger
                      value="action"
                      className="flex items-center space-x-2 px-6 py-4 border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 bg-transparent hover:text-emerald-600 transition-all duration-200 font-semibold"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Acción</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Content Area */}
              <ScrollArea className="flex-1">
                <div className="p-8">
                  <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    {/* Detailed Analysis */}
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-xl font-bold text-gray-900">Análisis Detallado</h2>
                      </div>

                      <div className="grid grid-cols-1 gap-8">
                        {/* Request Information */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <FileText className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">Información de la Solicitud</h3>
                              <p className="text-sm text-gray-500">Detalles y especificaciones</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">ID de Solicitud</span>
                              <span className="font-semibold text-gray-900">{currentRequest.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">Fecha de Creación</span>
                              <span className="font-semibold text-gray-900">
                                {formatDate(currentRequest.createdAt)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">Estado Actual</span>
                              <Badge className={`${getStatusColor(currentRequest.status)} border font-medium`}>
                                {getStatusText(currentRequest.status)}
                              </Badge>
                            </div>
                            {currentRequest.description && (
                              <div className="py-2">
                                <span className="text-gray-600 block mb-2">Descripción</span>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-800">{currentRequest.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {!isEquipmentRequest && (
                    <TabsContent value="dates" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                      <DatesSection dates={currentRequest.dates} />
                    </TabsContent>
                  )}

                  {!isEquipmentRequest && (
                    <TabsContent value="files" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                      <FilesSection files={processedFiles} onFileSelect={setSelectedFile} />
                    </TabsContent>
                  )}

                  <TabsContent value="history" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <HistorySection isLoading={isLoadingHistory} error={historyError} history={history} />
                  </TabsContent>

                  {currentRequest.status === "pending" && (
                    <TabsContent value="action" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                      <ActionSection
                        reason={reason}
                        onReasonChange={setReason}
                        onApprove={() => handleAction("approve")}
                        onReject={() => handleAction("reject")}
                      />
                    </TabsContent>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Navigation Footer */}
          {requests.length > 1 && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevRequest}
                    disabled={currentRequestIndex === 0}
                    className="border-gray-300 bg-white hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 rounded-lg border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-700">
                      {currentRequestIndex + 1} de {requests.length}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextRequest}
                    disabled={currentRequestIndex === requests.length - 1}
                    className="border-gray-300 bg-white hover:bg-gray-50"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        {selectedFile && <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />}
        {selectedPhoto && (
          <PhotoModal
            photoUrl={selectedPhoto}
            employeeName={operatorInfo?.nombre || currentRequest.name}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )

  // Usar createPortal para renderizar el modal fuera del DOM normal
  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null
}

export default RequestDetails
