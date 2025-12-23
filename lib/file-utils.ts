/**
 * Utilidades para manejo de archivos con la nueva estructura profesional
 * 
 * Esta librería proporciona funciones para construir URLs de archivos
 * que funcionan con la nueva estructura de carpetas profesional implementada.
 */

/**
 * Limpia y extrae la URL del archivo de datos JSON o strings complejos
 * 
 * @param fileUrl - La URL que puede contener datos JSON o ser una ruta simple
 * @returns La URL limpia del archivo
 */
function cleanFileUrl(fileUrl: string): string {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return ''
  }

  // Si parece ser un JSON string, intentar parsearlo
  if (fileUrl.includes('"fileUrl"') || fileUrl.startsWith('{') || fileUrl.startsWith('[')) {
    try {
      // Intentar extraer la URL del JSON
      const match = fileUrl.match(/"fileUrl"\s*:\s*"([^"]+)"/)
      if (match && match[1]) {
        return match[1]
      }

      // Si es un JSON válido, intentar parsearlo
      const parsed = JSON.parse(fileUrl)
      if (typeof parsed === 'object' && parsed.fileUrl) {
        return parsed.fileUrl
      }
      if (typeof parsed === 'object' && parsed.relativePath) {
        return parsed.relativePath
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        return cleanFileUrl(parsed[0])
      }
    } catch (e) {
      // Si no se puede parsear, continuar con limpieza normal
    }
  }

  // Limpiar caracteres especiales y codificación
  return fileUrl
    .replace(/^["'\[\]{}]+|["'\[\]{}]+$/g, '') // Remover comillas y corchetes
    .replace(/\\n/g, '') // Remover saltos de línea
    .replace(/\\t/g, '') // Remover tabs
    .replace(/%22/g, '') // Remover %22 (comillas codificadas)
    .replace(/fileUrl["']*:/g, '') // Remover prefijo fileUrl:
    .trim()
}

/**
 * Construye la URL completa para un archivo usando la nueva estructura profesional
 * 
 * @param fileUrl - La URL relativa del archivo (puede ser absoluta o relativa)
 * @returns La URL completa para acceder al archivo
 * 
 * @example
 * // Para archivo con ruta relativa
 * buildFileUrl('2024/01/12345678/solicitud_123_cita/archivo.pdf')
 * // Retorna: 'https://solicitud-permisos.sao6.com.co/api/files/2024/01/12345678/solicitud_123_cita/archivo.pdf'
 * 
 * // Para archivo con URL absoluta (se mantiene sin cambios)
 * buildFileUrl('http://example.com/archivo.pdf')
 * // Retorna: 'http://example.com/archivo.pdf'
 */
export function buildFileUrl(fileUrl: string): string {
  // Limpiar la URL primero
  const cleanedUrl = cleanFileUrl(fileUrl)

  if (!cleanedUrl) {
    console.warn('buildFileUrl: URL vacía o inválida:', fileUrl)
    return ''
  }

  // Si ya es una URL absoluta, devolverla sin cambios
  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl
  }

  // Construir URL usando la nueva estructura profesional
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'

  // Asegurar que no hay barras duplicadas
  const finalUrl = cleanedUrl.startsWith('/') ? cleanedUrl.slice(1) : cleanedUrl

  const result = `${apiUrl}/files/${finalUrl}`
  console.log('buildFileUrl:', { original: fileUrl, cleaned: cleanedUrl, final: result })

  return result
}

/**
 * Descarga un archivo usando la nueva estructura profesional
 * 
 * @param fileUrl - La URL relativa o absoluta del archivo
 * @param fileName - El nombre del archivo para la descarga
 * @param openInNewTab - Si abrir en nueva pestaña (default: true)
 * 
 * @example
 * downloadFile('2024/01/12345678/solicitud_123_cita/documento.pdf', 'documento.pdf')
 */
export function downloadFile(fileUrl: string, fileName: string, openInNewTab: boolean = true): void {
  const fullUrl = buildFileUrl(fileUrl)

  if (openInNewTab) {
    // Abrir en nueva pestaña
    window.open(fullUrl, '_blank')
  } else {
    // Descargar directamente
    const link = document.createElement('a')
    link.href = fullUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Obtiene información sobre el tipo de archivo
 * 
 * @param fileName - El nombre del archivo
 * @returns Información sobre el tipo de archivo
 */
export function getFileTypeInfo(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return {
      type: 'image',
      category: 'Imagen',
      icon: 'ImageIcon',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  }

  if (extension === 'pdf') {
    return {
      type: 'pdf',
      category: 'Documento PDF',
      icon: 'FileText',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  }

  return {
    type: 'file',
    category: 'Archivo',
    icon: 'FileIcon',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
}

/**
 * Verifica si un archivo es una imagen
 * 
 * @param fileName - El nombre del archivo
 * @returns true si es una imagen
 */
export function isImage(fileName: string): boolean {
  return getFileTypeInfo(fileName).type === 'image'
}

/**
 * Verifica si un archivo es un PDF
 * 
 * @param fileName - El nombre del archivo
 * @returns true si es un PDF
 */
export function isPDF(fileName: string): boolean {
  return getFileTypeInfo(fileName).type === 'pdf'
}

/**
 * Formatea el tamaño de un archivo
 * 
 * @param bytes - El tamaño en bytes
 * @returns El tamaño formateado (ej: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Extrae el nombre del archivo de una URL
 * 
 * @param fileUrl - La URL del archivo
 * @returns El nombre del archivo
 */
export function extractFileName(fileUrl: string): string {
  // Si es una URL completa, extraer solo el nombre del archivo
  if (fileUrl.includes('/')) {
    return fileUrl.split('/').pop() || fileUrl
  }

  return fileUrl
}

/**
 * Valida si una URL de archivo es válida
 * 
 * @param fileUrl - La URL del archivo
 * @returns true si la URL es válida
 */
export function isValidFileUrl(fileUrl: string): boolean {
  if (!fileUrl || typeof fileUrl !== 'string') {
    return false
  }

  // Verificar si es una URL absoluta válida
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    try {
      new URL(fileUrl)
      return true
    } catch {
      return false
    }
  }

  // Verificar si es una ruta relativa válida
  return fileUrl.length > 0 && !fileUrl.includes('..')
}

/**
 * Construye múltiples URLs de archivos
 * 
 * @param fileUrls - Array de URLs de archivos
 * @returns Array de URLs completas
 */
export function buildMultipleFileUrls(fileUrls: string[]): string[] {
  return fileUrls.map(buildFileUrl)
}

/**
 * Descarga múltiples archivos con un retraso entre cada descarga
 * 
 * @param files - Array de objetos con fileUrl y fileName
 * @param delay - Retraso en milisegundos entre descargas (default: 100ms)
 */
export function downloadMultipleFiles(
  files: Array<{ fileUrl: string; fileName: string }>,
  delay: number = 100
): void {
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file.fileUrl, file.fileName, true)
    }, index * delay)
  })
}
