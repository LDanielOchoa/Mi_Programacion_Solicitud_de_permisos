'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from 'sonner'

interface FileInfo {
  fileName: string | string[]
  fileUrl: string | string[]
}

interface FilePreviewModalProps {
  file: FileInfo
  onClose: () => void
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [fileUrls, setFileUrls] = useState<string[]>([])

  useEffect(() => {
    const parseJsonSafely = (value: string | string[]): string[] => {
      if (Array.isArray(value)) return value
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : [value]
      } catch {
        return [value]
      }
    }

    // Limpiar y normalizar los nombres de archivo y URLs
    const normalizeFileInfo = (info: string | string[]): string[] => {
      const parsed = parseJsonSafely(info)
      return parsed.map(item =>
        item.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '')
      )
    }

    setFileNames(normalizeFileInfo(file.fileName))
    setFileUrls(normalizeFileInfo(file.fileUrl))
  }, [file.fileName, file.fileUrl])

  const currentFileName = fileNames[currentFileIndex] || ''
  const currentFileUrl = fileUrls[currentFileIndex] || ''
  const fullFileUrl = `${'solicitud-permisos.sao6.com.co/api'}/uploads/${currentFileUrl}`

  const handleDownload = async () => {
    try {
      const response = await fetch(fullFileUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Archivo descargado correctamente')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Error al descargar el archivo')
    }
  }

  const fileType = currentFileName.toLowerCase().split('.').pop()
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')
  const isPDF = fileType === 'pdf'

  const handlePrevious = () => {
    setCurrentFileIndex((prev) => (prev > 0 ? prev - 1 : fileUrls.length - 1))
  }

  const handleNext = () => {
    setCurrentFileIndex((prev) => (prev < fileUrls.length - 1 ? prev + 1 : 0))
  }

  // Verificar si hay archivos válidos para mostrar
  if (!fileUrls.length || !fileNames.length) {
    return null
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="sr-only">Vista previa de archivo</DialogTitle>
        <DialogDescription className="sr-only">
          Vista previa y descarga del archivo {currentFileName}
        </DialogDescription>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{currentFileName}</h2>
          <div className="flex items-center gap-2">
            {fileUrls.length > 1 && (
              <span className="text-sm text-muted-foreground">
                {currentFileIndex + 1} de {fileUrls.length}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </div>
        <div className="relative min-h-[60vh] bg-muted rounded-lg overflow-hidden">
          {isImage ? (
            <div className="relative w-full h-full">
              <img
                src={fullFileUrl}
                alt={currentFileName}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                  toast.error('Error al cargar la imagen')
                }}
              />
              {fileUrls.length > 1 && (
                <>
                  <Button
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    variant="secondary"
                    size="icon"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    variant="secondary"
                    size="icon"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ) : isPDF ? (
            <iframe
              src={fullFileUrl}
              className="w-full h-full min-h-[60vh]"
              title={currentFileName}
              onError={() => toast.error('Error al cargar el PDF')}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Vista previa no disponible
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleDownload}>
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}