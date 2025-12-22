"use client"

import React from "react"
import { motion } from "framer-motion"
import { Paperclip, Download, Eye, ImageIcon, FileText as FileTextIcon, FileIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileInfo } from "./types"
import { FilePreviewThumbnail } from "./FilePreview"
import { downloadFile, downloadMultipleFiles, isImage, isPDF } from "@/lib/file-utils"

interface FilesSectionProps {
    files: FileInfo[]
    onFileSelect: (file: FileInfo) => void
}

/**
 * Sección de archivos adjuntos con previsualizaciones
 */
export const FilesSection = React.memo<FilesSectionProps>(({ files, onFileSelect }) => {
    const getFileSize = (url: string) => {
        const extension = url.split(".").pop()?.toLowerCase()
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
            return "~2.5 MB"
        } else if (extension === "pdf") {
            return "~1.8 MB"
        }
        return "~500 KB"
    }

    const getFileTypeInfo = (fileName: string) => {
        if (isImage(fileName)) {
            return {
                icon: ImageIcon,
                color: "text-blue-500",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-100",
                type: "Imagen",
            }
        } else if (isPDF(fileName)) {
            return {
                icon: FileTextIcon,
                color: "text-red-500",
                bgColor: "bg-red-50",
                borderColor: "border-red-100",
                type: "PDF",
            }
        }
        return {
            icon: FileIcon,
            color: "text-gray-500",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-100",
            type: "Archivo",
        }
    }

    return (
        <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden rounded-3xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <Paperclip className="w-6 h-6 text-[#4cc253]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Archivos Adjuntos</h3>
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-0.5">
                                {files.length} {files.length === 1 ? "archivo" : "archivos"} disponibles
                            </p>
                        </div>
                    </div>
                </div>

                {files.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {files.map((file, index) => {
                                const fileTypeInfo = getFileTypeInfo(file.fileName)

                                return (
                                    <motion.div
                                        key={`${file.fileUrl}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="relative aspect-video overflow-hidden bg-gray-50">
                                            <FilePreviewThumbnail
                                                fileName={file.fileName}
                                                fileUrl={file.fileUrl}
                                                onClick={() => onFileSelect(file)}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full w-10 h-10 bg-white/90"
                                                    onClick={() => onFileSelect(file)}
                                                >
                                                    <Eye className="w-5 h-5 text-gray-700" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full w-10 h-10 bg-white/90"
                                                    onClick={() => downloadFile(file.fileUrl, file.fileName, true)}
                                                >
                                                    <Download className="w-5 h-5 text-gray-700" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h4 className="font-bold text-gray-900 text-sm truncate mb-1" title={file.fileName}>
                                                {file.fileName}
                                            </h4>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${fileTypeInfo.color}`}>
                                                    {fileTypeInfo.type}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {getFileSize(file.fileUrl)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {files.length > 1 && (
                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-gray-200 text-gray-700 hover:bg-[#4cc253] hover:text-white hover:border-[#4cc253] transition-all font-bold text-xs uppercase tracking-widest px-6"
                                    onClick={() => downloadMultipleFiles(files, 100)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar Todos
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No hay archivos adjuntos</p>
                    </div>
                )}
            </div>
        </Card>
    )
})

FilesSection.displayName = "FilesSection"
