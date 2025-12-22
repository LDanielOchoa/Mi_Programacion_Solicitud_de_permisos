"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import {
  X,
  FileText,
  Info,
  Calendar as CalendarIcon,
  Paperclip,
  History as HistoryIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Componentes internos
import { InfoSection } from "./request-details/InfoSection"
import { DatesSection } from "./request-details/DatesSection"
import { FilesSection } from "./request-details/FilesSection"
import { ActionSection } from "./request-details/ActionSection"
import { FilePreviewModal } from "./request-details/FilePreview"
import { PhotoModal } from "./request-details/PhotoModal"
import HistorySection from "./history"

// Utilidades y servicios
import { RequestDetailsProps, FileInfo } from "./request-details/types"
import { processFiles } from "./request-details/file-processor"
import { isEquipmentRequest } from "./request-details/utils"
import { fetchOperatorInfo, fetchUserHistory, OperatorInfo, HistoryItem } from "./request-details/api-service"

/**
 * Componente principal para mostrar detalles de una solicitud
 * Refactorizado en módulos separados para mejor mantenibilidad
 */
const RequestDetails = ({ request, onClose, onAction, onPrevRequest, onNextRequest }: RequestDetailsProps) => {
  // Estados principales
  const [reason, setReason] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Estados de datos
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  const [isLoadingOperator, setIsLoadingOperator] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const currentRequest = request || {}
  const isEquipment = useMemo(() => isEquipmentRequest(currentRequest?.type || ""), [currentRequest?.type])

  // Secciones disponibles según el tipo de solicitud
  const getSections = useMemo(() => {
    const sections = ["info"]
    if (!isEquipment) {
      sections.push("dates", "files")
    }
    sections.push("history")
    if (currentRequest.status === "pending") {
      sections.push("action")
    }
    return sections
  }, [isEquipment, currentRequest.status])

  // Procesar archivos
  const processedFiles = useMemo(() => processFiles(currentRequest), [currentRequest])

  // Configuración de tabs
  const tabIcons = {
    info: Info,
    dates: CalendarIcon,
    files: Paperclip,
    history: HistoryIcon,
    action: Settings,
  }

  const tabLabels = {
    info: "Información",
    dates: "Fechas",
    files: "Archivos",
    history: "Historial",
    action: "Acción",
  }

  // Obtener información del operador
  useEffect(() => {
    const cedula = currentRequest?.password || currentRequest?.code
    console.log("Obteniendo info para cédula:", cedula)

    if (cedula) {
      setIsLoadingOperator(true)
      fetchOperatorInfo(cedula)
        .then(setOperatorInfo)
        .finally(() => setIsLoadingOperator(false))
    }
  }, [currentRequest?.password, currentRequest?.code])

  // Obtener historial del usuario
  useEffect(() => {
    const userCode = currentRequest.code
    if (userCode) {
      setIsLoadingHistory(true)
      fetchUserHistory(userCode)
        .then(({ history: fetchedHistory, error }) => {
          setHistory(fetchedHistory)
          setHistoryError(error)
        })
        .finally(() => setIsLoadingHistory(false))
    }
  }, [currentRequest.code])

  // Control de scroll del body
  useEffect(() => {
    const scrollY = window.scrollY
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"

    return () => {
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Reiniciar razón al cambiar de solicitud
  useEffect(() => {
    setReason("")
  }, [currentRequest.id])

  // Handlers
  const handlePrevRequest = useCallback(() => {
    if (onPrevRequest) {
      onPrevRequest()
      setReason("")
    }
  }, [onPrevRequest])

  const handleNextRequest = useCallback(() => {
    if (onNextRequest) {
      onNextRequest()
      setReason("")
    }
  }, [onNextRequest])

  const handleAction = useCallback(
    (action: "approve" | "reject") => {
      if (!reason.trim()) return
      onAction(currentRequest.id, action, reason)
      onClose()
    },
    [currentRequest.id, onAction, reason, onClose]
  )

  // Contenido del modal
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
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="bg-white rounded-[40px] w-full max-w-7xl h-[90vh] shadow-2xl border border-gray-100 relative flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section - Minimalist */}
          <div className="bg-white p-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <FileText className="w-8 h-8 text-[#4cc253]" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                    Solicitud #{currentRequest?.id ? String(currentRequest.id).slice(-6) : "---"}
                  </h1>
                </div>
                <p className="text-[11px] uppercase font-black text-gray-400 tracking-[0.2em]">
                  {currentRequest?.type || "Tipo de solicitud no especificado"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {(onPrevRequest || onNextRequest) && (
                <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100 mr-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevRequest}
                    disabled={!onPrevRequest}
                    className="h-10 w-10 rounded-xl hover:bg-white text-gray-500 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextRequest}
                    disabled={!onNextRequest}
                    className="h-10 w-10 rounded-xl hover:bg-white text-gray-500 disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-14 w-14 rounded-2xl hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all"
              >
                <X className="h-8 w-8" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="info" className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="bg-white border-b border-gray-100 px-8">
              <TabsList className="bg-transparent border-0 p-0 h-auto space-x-8">
                {getSections.map((section) => {
                  const Icon = tabIcons[section as keyof typeof tabIcons]
                  return (
                    <TabsTrigger
                      key={section}
                      value={section}
                      className="group relative flex items-center space-x-2 px-2 py-6 border-0 bg-transparent text-gray-400 data-[state=active]:text-[#4cc253] hover:text-gray-600 transition-all duration-300"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {tabLabels[section as keyof typeof tabLabels]}
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4cc253] transform scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 rounded-t-full" />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 h-full">
              <div className="h-full flex flex-col p-8 pb-12">
                <TabsContent value="info" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <InfoSection
                    request={currentRequest}
                    operatorInfo={operatorInfo}
                    isLoadingOperator={isLoadingOperator}
                    onPhotoClick={(url) => setSelectedPhoto(url)}
                  />
                </TabsContent>

                {!isEquipment && (
                  <TabsContent value="dates" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <DatesSection dates={currentRequest.dates} />
                  </TabsContent>
                )}

                {!isEquipment && (
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
        </motion.div>

        {/* Modales anidados */}
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
