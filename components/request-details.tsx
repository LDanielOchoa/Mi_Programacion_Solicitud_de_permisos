import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  FileIcon,
  Loader,
  Calendar,
  Clock,
  Phone,
  User,
  Code,
  Type,
  CheckCircle,
  XCircle,
  Paperclip,
  CalendarIcon,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { format, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"

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
  [key: string]: any
}

type HistoryItem = {
  id: string
  type: string
  createdAt: string
  status: string
}

type RequestDetailsProps = {
  requests: Request[]
  onClose: () => void
  onAction: (id: string, action: "approve" | "reject", reason: string) => void
}

// Utility Functions
function processFiles(request: Request): FileInfo[] {
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
    toast({
      title: "Error",
      description: "Error al procesar los archivos",
      variant: "destructive",
    })
  }

  return []
}

function formatDate(dateString: string) {
  if (!dateString) return "Fecha no disponible"
  
  try {
    // Verificar si la cadena contiene comas (múltiples fechas)
    if (dateString.includes(',')) {
      // Dividir la cadena por comas y formatear cada fecha individualmente
      const fechas = dateString.split(',').map(fecha => {
        const fechaTrim = fecha.trim()
        try {
          const date = parseISO(fechaTrim)
          return isValid(date) ? format(date, "PPP", { locale: es }) : fechaTrim
        } catch {
          return fechaTrim
        }
      })
      
      // Unir las fechas formateadas con comas
      return fechas.join(', ')
    }
    
    // Caso de una sola fecha
    const date = parseISO(dateString)
    
    // Verificar si la fecha es válida
    if (!isValid(date)) {
      console.warn('Fecha inválida:', dateString)
      
      // Intentar interpretar otros formatos comunes
      // Formato DD/MM/YYYY o DD-MM-YYYY
      const matches = dateString.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
      if (matches) {
        const [_, day, month, year] = matches
        const newDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
        if (isValid(newDate)) {
          return format(newDate, "PPP", { locale: es })
        }
      }
      
      return dateString // Devolver la cadena original si no se puede formatear
    }
    
    // Formatear la fecha correctamente
    return format(date, "PPP", { locale: es })
  } catch (error) {
    console.error('Error al formatear fecha:', error, dateString)
    return dateString // Devolver la cadena original en caso de error
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
    case "rejected":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
  }
}

const isImage = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension || '')
}

const isPDF = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension === 'pdf'
}

// File Preview Components
function FilePreviewThumbnail({ fileName, fileUrl, onClick }: { fileName: string, fileUrl: string, onClick: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [fileUrl])

  return (
    <div 
      className="relative group aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-center justify-center"
      onClick={onClick}
    >
      {isImage(fileName) && !imageError ? (
        <>
          <img
            src={fileUrl}
            alt={fileName}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </>
      ) : isPDF(fileName) ? (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <FileText className="w-12 h-12 text-emerald-500 mb-2" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Documento PDF</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <FileIcon className="w-12 h-12 text-emerald-500 mb-2" />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {fileName.split('.').pop()?.toUpperCase() || "Archivo"}
          </span>
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md">
          <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </div>
  )
}

function FilePreviewModal({ file, onClose }: { file: FileInfo, onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
  }, [file.fileUrl])

  const handleDownload = () => {
    window.open(file.fileUrl, '_blank')
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          key="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-emerald-100 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center space-x-3">
              {isImage(file.fileName) ? (
                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : isPDF(file.fileName) ? (
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              <h3 className="font-medium text-lg text-emerald-800 dark:text-emerald-200 truncate max-w-[400px]">
                {file.fileName}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-900/30 dark:text-emerald-400"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            {loading && (
              <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="mt-2 text-emerald-600 dark:text-emerald-400">Cargando archivo...</p>
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileIcon className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  No se pudo cargar el archivo. Intente descargar el archivo para verlo.
                </p>
                <Button
                  variant="default"
                  onClick={handleDownload}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Archivo
                </Button>
              </div>
            ) : isImage(file.fileName) ? (
              <motion.img
                src={file.fileUrl}
                alt={file.fileName}
                className="max-w-full max-h-[calc(90vh-120px)] object-contain rounded-lg shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setError("No se pudo cargar la imagen")
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: loading ? 0 : 1 }}
                transition={{ duration: 0.3 }}
              />
            ) : isPDF(file.fileName) ? (
              <div className="w-full h-[calc(90vh-120px)]">
                <object
                  data={file.fileUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-lg shadow-lg"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false)
                    setError("No se pudo cargar el PDF")
                  }}
                >
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="w-16 h-16 text-emerald-500 mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-2">No se puede mostrar el PDF</p>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      Tu navegador no puede mostrar PDFs integrados. Puedes descargar el archivo para verlo.
                    </p>
                    <Button
                      variant="default"
                      onClick={handleDownload}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileIcon className="w-16 h-16 text-emerald-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-2">Vista previa no disponible</p>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  No se puede mostrar una vista previa para este tipo de archivo. Puedes descargar el archivo para verlo.
                </p>
                <Button
                  variant="default"
                  onClick={handleDownload}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Archivo
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Section Components
function InfoSection({ request }: { request: Request }) {
  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 25,
            stiffness: 500
          }
        }
      }}
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-200"
      whileHover={{ x: 5, transition: { type: "spring", stiffness: 300 } }}
    >
      <div className="text-emerald-500 dark:text-emerald-400">
        {icon}
      </div>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>
      <span className="text-gray-800 dark:text-gray-200">{value}</span>
    </motion.div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring",
              damping: 20,
              stiffness: 300,
              when: "beforeChildren",
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
            <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
              <User className="w-5 h-5" />
              <span>Información del Solicitante</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <InfoItem 
              icon={<Code className="w-5 h-5" />}
              label="Código"
              value={request.code}
            />
            <InfoItem 
              icon={<User className="w-5 h-5" />}
              label="Nombre"
              value={request.name}
            />
            {request.phone && (
              <InfoItem 
                icon={<Phone className="w-5 h-5" />}
                label="Teléfono"
                value={request.phone}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring",
              damping: 20,
              stiffness: 300,
              when: "beforeChildren",
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
            <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
              <span>Detalles de la Solicitud</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <InfoItem 
              icon={<Type className="w-5 h-5" />}
              label="Tipo"
              value={request.type}
            />
            <InfoItem 
              icon={<Calendar className="w-5 h-5" />}
              label="Fecha"
              value={formatDate(request.createdAt)}
            />
            <InfoItem 
              icon={<Clock className="w-5 h-5" />}
              label="Hora"
              value={request.time}
            />
            <InfoItem 
              icon={<Clock className="w-5 h-5" />}
              label="Estado"
              value={
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              }
            />
            {request.zona && (
              <InfoItem 
                icon={<MapPin className="w-5 h-5" />}
                label="Zona"
                value={request.zona}
              />
            )}
            {(request.codeAM || request.codePM) && (
              <InfoItem 
                icon={<Users className="w-5 h-5" />}
                label="Códigos"
                value={
                  <>
                    {request.codeAM && `AM: ${request.codeAM}`}
                    {request.codeAM && request.codePM && ", "}
                    {request.codePM && `PM: ${request.codePM}`}
                  </>
                }
              />
            )}
            {request.shift && (
              <InfoItem 
                icon={<Clock className="w-5 h-5" />}
                label="Turno"
                value={request.shift}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {request.description && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                type: "spring",
                damping: 20,
                stiffness: 300,
                when: "beforeChildren",
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="visible"
          className="md:col-span-2"
        >
          <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
              <CardTitle className="text-emerald-700 dark:text-emerald-400">Descripción</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      type: "spring",
                      damping: 25,
                      stiffness: 500
                    }
                  }
                }}
                className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800"
              >
                {request.description}
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function DatesSection({ dates }: { dates?: string[] | string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 20,
            stiffness: 300,
            when: "beforeChildren",
            staggerChildren: 0.05
          }
        }
      }}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
          <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <CalendarIcon className="w-5 h-5" />
            <span>Fechas Solicitadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {Array.isArray(dates) ? (
              dates.map((date: string, index: number) => (
                <motion.div 
                  key={index} 
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        type: "spring",
                        damping: 25,
                        stiffness: 500
                      }
                    }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 2, 
                    transition: { type: "spring", stiffness: 500 } 
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 text-sm rounded-lg shadow-sm">
                    {formatDate(date)}
                  </Badge>
                </motion.div>
              ))
            ) : typeof dates === "string" ? (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { 
                    opacity: 1, 
                    scale: 1,
                    transition: { 
                      type: "spring",
                      damping: 25,
                      stiffness: 500
                    }
                  }
                }}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 2, 
                  transition: { type: "spring", stiffness: 500 } 
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 text-sm rounded-lg shadow-sm">
                  {formatDate(dates)}
                </Badge>
              </motion.div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No hay fechas disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function FilesSection({ files, onFileSelect }: { files: FileInfo[], onFileSelect: (file: FileInfo) => void }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 20,
            stiffness: 300,
            when: "beforeChildren",
            staggerChildren: 0.1
          }
        }
      }}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
          <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <Paperclip className="w-5 h-5" />
            <span>Archivos Adjuntos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.fileUrl}-${index}`}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        type: "spring",
                        damping: 25,
                        stiffness: 500
                      }
                    }
                  }}
                  className="group"
                  whileHover={{ 
                    scale: 1.03,
                    transition: { 
                      type: "spring", 
                      stiffness: 400,
                      damping: 10
                    }
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card 
                    className="overflow-hidden border-emerald-100 dark:border-emerald-800 hover:shadow-md transition-all duration-300 cursor-pointer group-hover:border-emerald-300 dark:group-hover:border-emerald-600"
                    onClick={() => onFileSelect(file)}
                  >
                    <CardContent className="p-3">
                      <div className="overflow-hidden rounded-lg">
                        <FilePreviewThumbnail
                          fileName={file.fileName}
                          fileUrl={file.fileUrl}
                          onClick={() => onFileSelect(file)}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                        {file.fileName}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-6">No hay archivos adjuntos</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ActionSection({ reason, onReasonChange, onApprove, onReject }: { 
  reason: string
  onReasonChange: (reason: string) => void
  onApprove: () => void
  onReject: () => void 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 20,
            stiffness: 300,
            when: "beforeChildren",
            staggerChildren: 0.1
          }
        }
      }}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
          <CardTitle className="text-emerald-700 dark:text-emerald-400">Acción</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Proporcione una razón para aprobar o rechazar esta solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <motion.div variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                type: "spring",
                damping: 25,
                stiffness: 500
              }
            }
          }}>
            <Textarea
              placeholder="Razón de aprobación o rechazo"
              onChange={(e) => onReasonChange(e.target.value)}
              value={reason}
              className="min-h-[100px] border-emerald-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:border-emerald-800 dark:bg-gray-900/50 dark:focus-visible:ring-emerald-600"
            />
          </motion.div>
          
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { 
                  type: "spring",
                  damping: 25,
                  stiffness: 500
                }
              }
            }}
            className="flex justify-end space-x-4"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="destructive"
                onClick={onReject}
                className="shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="default"
                onClick={onApprove}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HistorySection({ isLoading, error, history }: {
  isLoading: boolean
  error: string | null
  history: HistoryItem[]
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            type: "spring",
            damping: 20,
            stiffness: 300,
            when: "beforeChildren",
            staggerChildren: 0.05
          }
        }
      }}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-emerald-100 dark:border-emerald-800 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-100 dark:border-emerald-800">
          <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
            <span>Historial de Solicitudes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 border-4 border-t-emerald-500 border-emerald-200 rounded-full animate-spin"></div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-16">Cargando historial...</p>
              </div>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 text-center"
            >
              {error}
            </motion.div>
          ) : history.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-emerald-100 dark:border-emerald-800">
              <Table>
                <TableHeader className="bg-emerald-50 dark:bg-emerald-900/30">
                  <TableRow>
                    <TableHead className="text-emerald-700 dark:text-emerald-400 font-semibold">ID</TableHead>
                    <TableHead className="text-emerald-700 dark:text-emerald-400 font-semibold">Tipo</TableHead>
                    <TableHead className="text-emerald-700 dark:text-emerald-400 font-semibold">Fecha</TableHead>
                    <TableHead className="text-emerald-700 dark:text-emerald-400 font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      custom={index}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { 
                          opacity: 1, 
                          x: 0,
                          transition: { 
                            delay: index * 0.05,
                            type: "spring",
                            damping: 25,
                            stiffness: 500
                          }
                        }
                      }}
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors duration-200"
                    >
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic text-center py-6">
              No hay historial disponible para esta solicitud.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Main Component
const RequestDetails = ({ requests, onClose, onAction }: RequestDetailsProps) => {
  const [reason, setReason] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  
  const currentRequest = requests[currentRequestIndex]
  const isEquipmentRequest = !("noveltyType" in currentRequest)
  
  useEffect(() => {
    document.body.style.overflow = "hidden"
    
    const fetchHistory = async () => {
    if (!currentRequest?.code) {
      console.warn('No request code available to fetch history');
      setHistoryError('No se pudo identificar el código de solicitud');
      setHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    // Usar URL relativa para evitar problemas de CORS en desarrollo
    // También agregar una URL alternativa en caso de fallo
    const apiUrls = [
      `/api/history/${encodeURIComponent(currentRequest.code)}`,
      `https://solicitud-permisos.sao6.com.co/api/history/${encodeURIComponent(currentRequest.code)}`
    ];
    
    // Función para intentar una URL específica
    const tryFetchUrl = async (url: string, retryCount: number = 0) => {
      console.log(`Fetching history from: ${url} (attempt ${retryCount + 1})`);
      try {
      const startTime = performance.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
        },
        credentials: 'include',  // Include cookies for authentication if needed
        // Agregar un timeout para evitar esperas infinitas
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      });
      
      const responseTime = Math.round(performance.now() - startTime);
      console.log(`History API [${response.status}] in ${responseTime}ms - ${url}`);
      
      if (!response.ok) {
        let errorDetails = '';
        
        // Handle 404 specifically
        if (response.status === 404) {
        return { success: false, error: 'No se encontró historial para este código de usuario', data: null };
        }

          try {
            const errorData = await response.json().catch(() => ({}));
            errorDetails = errorData.detail || JSON.stringify(errorData);
          } catch (e) {
            errorDetails = await response.text().catch(() => 'Error desconocido');
          }
          
          const errorMessage = `Error ${response.status} al cargar el historial: ${errorDetails}`;
          console.error('History API Error:', {
            status: response.status,
            statusText: response.statusText,
            url,
            details: errorDetails
          });
          
          return { success: false, error: errorMessage, data: null };
        }
        
        const data = await response.json();
        console.log('History API Response:', data);
        
        if (!Array.isArray(data)) {
          const errorMsg = `Formato de respuesta inesperado del servidor: ${typeof data}`;
          console.warn(errorMsg, data);
          return { success: false, error: 'Error al procesar el historial: formato de datos inválido', data: null };
        }
        
        // Asegurarse de que las fechas se procesen correctamente
        const processedData = data.map(item => ({
          ...item,
          // Asegurarse de que createdAt sea una fecha ISO válida
          createdAt: item.createdAt || new Date().toISOString()
        }));
        
        return { success: true, error: null, data: processedData };
      } catch (error) {
        // Verificar si es un error de timeout
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name &&
          ((error as { name: string }).name === "TimeoutError" ||
            (error as { name: string }).name === "AbortError")
        ) {
          console.warn(`Timeout fetching from ${url}`);
          return { success: false, error: 'Tiempo de espera agotado al conectar con el servidor', data: null };
        }
        
        // Verificar si es un error de red
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          (error as { message?: string }).message === "Failed to fetch"
        ) {
          console.warn(`Network error fetching from ${url}:`, error);
          // Si todavía hay reintentos disponibles, esperar y reintentar
          if (retryCount < 2) { // Máximo 3 intentos (0, 1, 2)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Espera exponencial
            return tryFetchUrl(url, retryCount + 1);
          }
          return { success: false, error: 'Error de conexión al servidor. Verifica tu conexión a internet.', data: null };
        }
        if (error instanceof TypeError) {
          console.warn(`Network error fetching from ${url}:`, error);
          if (retryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return tryFetchUrl(url, retryCount + 1);
          }
          return { success: false, error: 'Error de conexión al servidor. Verifica tu conexión a internet.', data: null };
        }
        
        // Otros errores
        console.error(`Error fetching from ${url}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return { success: false, error: `Error al cargar el historial: ${errorMessage}`, data: null };
      }
    };
    
    // Intentar cada URL en secuencia hasta que una funcione
    let result: { success: boolean; error: string | null; data: any } | null = null;
    for (const url of apiUrls) {
      result = await tryFetchUrl(url);
      if (result && result.success) break;
    }
    
    // Manejar el resultado final
    if (result && result.success) {
      setHistory(result.data);
    } else if (result) {
      setHistoryError(result.error);
      setHistory([]);
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        duration: 5000,
      });
    } else {
      setHistoryError('Error desconocido al cargar el historial');
      setHistory([]);
      toast({
        title: "Error",
        description: 'Error desconocido al cargar el historial',
        variant: "destructive",
        duration: 5000,
      });
    }
    
    setIsLoadingHistory(false);
  }
    
    fetchHistory()
    
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [currentRequest.code])

  const handlePrevRequest = () => {
    if (currentRequestIndex > 0) {
      setCurrentRequestIndex(currentRequestIndex - 1)
    }
  }

  const handleNextRequest = () => {
    if (currentRequestIndex < requests.length - 1) {
      setCurrentRequestIndex(currentRequestIndex + 1)
    }
  }

  const handleAction = (action: "approve" | "reject") => {
    onAction(currentRequest.id, action, reason)
  }

  const getSections = () => {
    const sections = ["info", "history"]

    if (!isEquipmentRequest) {
      sections.push("dates", "files")
    }

    if (currentRequest.status === "pending") {
      sections.push("action")
    }

    return sections
  }

  const sections = getSections()
  const processedFiles = processFiles(currentRequest)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  const contentVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-emerald-200"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div 
            variants={contentVariants}
            className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-b border-emerald-200 z-10 p-6"
          >
            <div className="flex justify-between items-center">
              <motion.div layout>
                <Badge
                  variant="outline"
                  className={`mb-2 ${
                    isEquipmentRequest
                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                      : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                  }`}
                >
                  {isEquipmentRequest ? "Solicitud de Equipo" : "Solicitud de Permiso"}
                </Badge>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  {currentRequest.type}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">ID: {currentRequest.id}</p>
              </motion.div>
              
              <motion.div
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                >
                  <X className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-4 mt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevRequest}
                  disabled={currentRequestIndex === 0}
                  className="border-emerald-200 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </motion.div>
              
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {currentRequestIndex + 1} / {requests.length}
              </span>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextRequest}
                  disabled={currentRequestIndex === requests.length - 1}
                  className="border-emerald-200 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            variants={contentVariants}
            className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]"
          >
            <Tabs 
              defaultValue="info" 
              className="w-full"
            >
              <TabsList className="bg-emerald-50 border border-emerald-200 p-1 rounded-xl dark:bg-emerald-900/30 dark:border-emerald-800">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    {section === "info"
                      ? "Información"
                      : section === "dates"
                        ? "Fechas"
                        : section === "files"
                          ? "Archivos"
                          : section === "history"
                            ? "Historial"
                            : "Acción"}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <AnimatePresence mode="wait">
                <TabsContent key="info-tab" value="info" className="mt-6">
                  <InfoSection request={currentRequest} />
                </TabsContent>
                
                {!isEquipmentRequest && (
                  <TabsContent key="dates-tab" value="dates" className="mt-6">
                    <DatesSection dates={currentRequest.dates} />
                  </TabsContent>
                )}
                
                {!isEquipmentRequest && (
                  <TabsContent key="files-tab" value="files" className="mt-6">
                    <FilesSection 
                      files={processedFiles} 
                      onFileSelect={setSelectedFile} 
                    />
                  </TabsContent>
                )}
                
                <TabsContent key="history-tab" value="history" className="mt-6">
                  <HistorySection 
                    isLoading={isLoadingHistory}
                    error={historyError}
                    history={history}
                  />
                </TabsContent>
                
                {currentRequest.status === "pending" && (
                  <TabsContent key="action-tab" value="action" className="mt-6">
                    <ActionSection 
                      reason={reason}
                      onReasonChange={setReason}
                      onApprove={() => handleAction("approve")}
                      onReject={() => handleAction("reject")}
                    />
                  </TabsContent>
                )}
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </motion.div>
        
        {selectedFile && (
          <FilePreviewModal 
            file={selectedFile} 
            onClose={() => setSelectedFile(null)} 
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default RequestDetails
