'use client'

import { useState } from 'react'
import { FileText, FileIcon, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface FilePreviewProps {
  fileName: string
  fileUrl: string
  onClick: () => void
}

export function FilePreview({ fileName, fileUrl, onClick }: FilePreviewProps) {
  const [isImageError, setIsImageError] = useState(false)
  const fileType = fileName.toLowerCase().split('.').pop()
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')
  const isPDF = fileType === 'pdf'

  const fullFileUrl = `solicitud-permisos.sao6.com.co/api/files/${encodeURIComponent(fileUrl)}`

  if (isImage && !isImageError) {
    return (
      <div
        className="relative aspect-video w-full overflow-hidden rounded-md bg-muted cursor-pointer hover:opacity-90 transition-opacity group"
        onClick={onClick}
      >
        <Image
          src={fullFileUrl}
          alt={fileName}
          fill
          className="object-cover"
          onError={() => setIsImageError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <ImageIcon className="h-10 w-10 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center aspect-video w-full bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors p-4"
      onClick={onClick}
    >
      {isPDF ? (
        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
      ) : (
        <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
      )}
      <span className="text-sm text-muted-foreground text-center break-all">
        {fileName}
      </span>
    </div>
  )
}

