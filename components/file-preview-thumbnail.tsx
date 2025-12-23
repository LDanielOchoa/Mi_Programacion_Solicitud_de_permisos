'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FileText, FileIcon } from 'lucide-react'
import { toast } from 'sonner'

interface FilePreviewThumbnailProps {
  fileName: string
  fileUrl: string
  onClick: () => void
}

export default function FilePreviewThumbnail({ fileName, fileUrl, onClick }: FilePreviewThumbnailProps) {
  const [isImageError, setIsImageError] = useState(false)
  const fileType = fileName.toLowerCase().split('.').pop()
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')
  const isPDF = fileType === 'pdf'

  useEffect(() => {
    setIsImageError(false)
  }, [fileName])

  const extractFileName = (url: string) => {
    try {
      if (url.startsWith('[') && url.endsWith(']')) {
        const parsed = JSON.parse(url)
        return Array.isArray(parsed) ? parsed[0] : url
      }
      return url
    } catch {
      return url
    }
  }

  const cleanFileUrl = extractFileName(fileUrl)
  const fullFileUrl = `/api/uploads/${encodeURIComponent(cleanFileUrl)}`

  if (isImage && !isImageError) {
    return (
      <div
        className="relative aspect-video w-full overflow-hidden rounded-md bg-muted cursor-pointer"
        onClick={onClick}
      >
        <Image
          src={fullFileUrl}
          alt={fileName}
          fill
          className="object-cover"
          crossOrigin="anonymous"
          onError={() => {
            setIsImageError(true)
            toast.error(`Error al cargar la imagen: ${fileUrl}`)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center aspect-video w-full bg-muted rounded-md cursor-pointer"
      onClick={onClick}
    >
      {isPDF ? (
        <FileText className="h-10 w-10 text-muted-foreground" />
      ) : (
        <FileIcon className="h-10 w-10 text-muted-foreground" />
      )}
    </div>
  )
}


