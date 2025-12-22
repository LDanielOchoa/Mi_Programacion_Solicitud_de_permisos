import { FileWithInfo } from "./types"
import { formatFileSize, getFileType } from "./utils"

/**
 * Valida un archivo antes de subirlo
 */
export function validateFile(file: File): string | null {
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
        return `El archivo "${file.name}" excede el tamaño máximo permitido de 10MB`
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
        return `El tipo de archivo "${file.type}" no está permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WebP) y documentos (PDF, DOC, DOCX)`
    }

    // Validar nombre
    if (file.name.length > 200) {
        return "El nombre del archivo es demasiado largo (máximo 200 caracteres)"
    }

    return null
}

/**
 * Genera una vista previa de un archivo
 */
export async function generateFilePreview(file: File): Promise<string | undefined> {
    if (file.type.startsWith("image/")) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }
    return undefined
}

/**
 * Crea un objeto FileWithInfo a partir de un File
 */
export async function createFileWithInfo(file: File): Promise<FileWithInfo> {
    const preview = await generateFilePreview(file)
    const fileSize = formatFileSize(file.size)
    const fileType = getFileType(file.name)

    return {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        preview,
        fileSize,
        fileType,
        uploadStatus: "pending",
        uploadProgress: 0,
    }
}

/**
 * Simula la carga de un archivo con progreso
 */
export async function uploadFileWithProgress(
    fileWithInfo: FileWithInfo,
    onProgress: (progress: number) => void
): Promise<FileWithInfo> {
    return new Promise((resolve, reject) => {
        let progress = 0
        const interval = setInterval(() => {
            progress += Math.random() * 30
            if (progress >= 100) {
                clearInterval(interval)
                onProgress(100)
                resolve({
                    ...fileWithInfo,
                    uploadStatus: "completed",
                    uploadProgress: 100,
                })
            } else {
                onProgress(Math.min(progress, 95))
            }
        }, 200)
    })
}

/**
 * Verifica si un tipo de archivo es una imagen
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith("image/")
}

/**
 * Verifica si un tipo de archivo es un PDF
 */
export function isPDFFile(file: File): boolean {
    return file.type === "application/pdf"
}
