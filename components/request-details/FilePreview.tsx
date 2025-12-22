"use client"

import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Eye, Loader2, ZoomIn, ZoomOut, RotateCw, FileIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileInfo } from "./types"
import { buildFileUrl, downloadFile, isImage, isPDF } from "@/lib/file-utils"

interface FilePreviewThumbnailProps {
    fileName: string
    fileUrl: string
    onClick: () => void
}

/**
 * Componente para mostrar miniatura de archivo con preview
 */
export const FilePreviewThumbnail = React.memo<FilePreviewThumbnailProps>(
    ({ fileName, fileUrl, onClick }) => {
        const [imageError, setImageError] = useState(false)
        const [loading, setLoading] = useState(true)

        useEffect(() => {
            setImageError(false)
            setLoading(true)
            console.log("FilePreviewThumbnail - URL:", buildFileUrl(fileUrl))
        }, [fileUrl])

        const getFileExtension = () => {
            return fileName.split(".").pop()?.toUpperCase() || "FILE"
        }

        const getFileIcon = () => {
            if (isImage(fileName)) {
                return { icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-50" }
            }
            return { icon: FileIcon, color: "text-gray-500", bg: "bg-gray-50" }
        }

        const fileIconInfo = getFileIcon()
        const IconComponent = fileIconInfo.icon

        return (
            <div
                className="relative group w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#4cc253]/30 hover:shadow-md transition-all duration-300"
                onClick={onClick}
            >
                {isImage(fileName) && !imageError ? (
                    <>
                        <img
                            src={buildFileUrl(fileUrl) || "/placeholder.svg"}
                            alt={fileName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onLoad={() => setLoading(false)}
                            onError={() => {
                                setImageError(true)
                                setLoading(false)
                            }}
                        />
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 text-[#4cc253] animate-spin mx-auto mb-2" />
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cargando...</span>
                                </div>
                            </div>
                        )}
                    </>
                ) : isPDF(fileName) ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full">
                        <div className="p-4 bg-red-50 rounded-full mb-3 border border-red-100">
                            <FileIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xs font-bold text-gray-700 truncate w-full px-2">{fileName}</p>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">PDF</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full">
                        <div className={`p-4 ${fileIconInfo.bg} rounded-full mb-3 border border-gray-200`}>
                            <IconComponent className={`w-8 h-8 ${fileIconInfo.color}`} />
                        </div>
                        <p className="text-xs font-bold text-gray-700 truncate w-full px-2 mb-2">{fileName}</p>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${fileIconInfo.color}`}>
                            {getFileExtension()}
                        </span>
                        <p className="text-xs text-gray-500">Archivo</p>
                    </div>
                )}

                {/* Overlay mejorado */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-xs font-bold truncate drop-shadow-lg">{fileName}</p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl">
                            <Eye className="w-5 h-5 text-gray-700" />
                        </div>
                    </div>
                </div>

                {loading && isImage(fileName) && (
                    <div className="absolute top-2 right-2">
                        <div className="bg-white/80 backdrop-blur-sm rounded-full p-1.5">
                            <Loader2 className="w-3 h-3 text-[#4cc253] animate-spin" />
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

FilePreviewThumbnail.displayName = "FilePreviewThumbnail"

interface FilePreviewModalProps {
    file: FileInfo
    onClose: () => void
}

/**
 * Modal para preview de archivos con zoom y descarga
 */
export const FilePreviewModal = React.memo<FilePreviewModalProps>(({ file, onClose }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imageScale, setImageScale] = useState(1)
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        setLoading(true)
        setError(null)
        setImageScale(1)
        setImagePosition({ x: 0, y: 0 })
    }, [file.fileUrl])

    const handleDownload = useCallback(() => {
        downloadFile(file.fileUrl, file.fileName, false)
    }, [file.fileUrl, file.fileName])

    const handleZoomIn = () => {
        setImageScale((prev) => Math.min(prev + 0.25, 3))
    }

    const handleZoomOut = () => {
        setImageScale((prev) => Math.max(prev - 0.25, 0.5))
    }

    const handleResetZoom = () => {
        setImageScale(1)
        setImagePosition({ x: 0, y: 0 })
    }

    const fileType = file.fileName.split(".").pop()?.toLowerCase()

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10001] p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-[40px] w-full max-w-6xl max-h-[92vh] border border-gray-100 overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 bg-white flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex-shrink-0">
                                {isImage(file.fileName) ? (
                                    <ImageIcon className="w-6 h-6 text-blue-500" />
                                ) : isPDF(file.fileName) ? (
                                    <FileIcon className="w-6 h-6 text-red-500" />
                                ) : (
                                    <FileIcon className="w-6 h-6 text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter truncate">
                                    {file.fileName}
                                </h2>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {fileType?.toUpperCase() || "ARCHIVO"}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Vista Previa
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                            {isImage(file.fileName) && (
                                <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100 mr-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleZoomOut}
                                        disabled={imageScale <= 0.5}
                                        className="h-10 w-10 rounded-xl hover:bg-white text-gray-500"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleResetZoom}
                                        className="h-10 w-10 rounded-xl hover:bg-white text-gray-500"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleZoomIn}
                                        disabled={imageScale >= 3}
                                        className="h-10 w-10 rounded-xl hover:bg-white text-gray-500"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                className="h-12 rounded-2xl border-gray-100 text-[#4cc253] hover:bg-[#4cc253] hover:text-white transition-all font-black text-xs uppercase tracking-widest px-6"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="h-12 w-12 rounded-2xl hover:bg-gray-100 text-gray-500 flex items-center justify-center p-0"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-6">
                        {loading && !error && (
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="w-12 h-12 text-[#4cc253] animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Cargando archivo...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center max-w-md bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileIcon className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Error al Cargar</h3>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">{error}</p>
                                <Button
                                    onClick={handleDownload}
                                    className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Archivo
                                </Button>
                            </div>
                        )}

                        {!error && isImage(file.fileName) && (
                            <div className="relative max-w-full max-h-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg bg-white">
                                <img
                                    src={buildFileUrl(file.fileUrl) || "/placeholder.svg"}
                                    alt={file.fileName}
                                    style={{
                                        transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                        transition: "transform 0.2s ease-out",
                                    }}
                                    className="max-w-full max-h-[70vh] object-contain"
                                    onLoad={() => setLoading(false)}
                                    onError={() => {
                                        setLoading(false)
                                        setError("No se pudo cargar la imagen")
                                    }}
                                />
                            </div>
                        )}

                        {!error && isPDF(file.fileName) && (
                            <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                                <iframe
                                    src={`${buildFileUrl(file.fileUrl)}#toolbar=1&navpanes=0&scrollbar=1`}
                                    width="100%"
                                    height="100%"
                                    className="border-0"
                                    onLoad={() => setLoading(false)}
                                    onError={() => {
                                        setLoading(false)
                                        setError("Error")
                                    }}
                                    title={file.fileName}
                                />
                            </div>
                        )}

                        {!error && !isImage(file.fileName) && !isPDF(file.fileName) && (
                            <div className="text-center max-w-md bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileIcon className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">
                                    Archivo No Compatible
                                </h3>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
                                    Este tipo de archivo requiere una aplicación externa para ser visualizado.
                                </p>
                                <Button
                                    onClick={handleDownload}
                                    className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs"
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
})

FilePreviewModal.displayName = "FilePreviewModal"
