import { FileInfo, Request } from "./types"
import { cleanFileName } from "./utils"

/**
 * Procesa los archivos de una solicitud para normalizarlos en un formato consistente
 */
export function processFiles(request: Request): FileInfo[] {
    const files: FileInfo[] = []

    try {
        // Caso 1: Si ya viene como array de objetos FileInfo
        if (request.files && Array.isArray(request.files)) {
            const firstFile = request.files[0]
            if (firstFile && typeof firstFile === "object" && "fileName" in firstFile && "fileUrl" in firstFile) {
                return request.files as FileInfo[]
            }
        }

        // Caso 2: Procesar arrays separados de nombres y URLs
        let fileNames: string[] = []
        let fileUrls: string[] = []

        // Obtener nombres de archivo
        if (request.file_name && Array.isArray(request.file_name)) {
            fileNames = request.file_name.map((name) => cleanFileName(name))
        } else if (typeof request.file_name === "string") {
            try {
                const parsed = JSON.parse(request.file_name)
                fileNames = Array.isArray(parsed) ? parsed.map((name) => cleanFileName(name)) : [cleanFileName(request.file_name)]
            } catch {
                fileNames = [cleanFileName(request.file_name)]
            }
        }

        // Obtener URLs de archivo
        if (request.file_url && Array.isArray(request.file_url)) {
            fileUrls = request.file_url.map((url: string) => {
                if (typeof url === "string") {
                    return url.replace(/^\["|"\]$/g, "").replace(/\\"/g, '"').replace(/^["']|["']$/g, "").trim()
                }
                return String(url)
            })
        } else if (typeof request.file_url === "string") {
            try {
                const parsed = JSON.parse(request.file_url)
                fileUrls = Array.isArray(parsed)
                    ? parsed.map((url: string) =>
                        typeof url === "string"
                            ? url.replace(/^\["|"\]$/g, "").replace(/\\"/g, '"').replace(/^["']|["']$/g, "").trim()
                            : String(url),
                    )
                    : [request.file_url.replace(/^\["|"\]$/g, "").replace(/\\"/g, '"').replace(/^["']|["']$/g, "").trim()]
            } catch {
                fileUrls = [request.file_url.replace(/^\["|"\]$/g, "").replace(/\\"/g, '"').replace(/^["']|["']$/g, "").trim()]
            }
        }

        // Combinar nombres y URLs en objetos FileInfo
        const maxLength = Math.max(fileNames.length, fileUrls.length)
        for (let i = 0; i < maxLength; i++) {
            const fileName = fileNames[i] || `archivo_${i + 1}`
            const fileUrl = fileUrls[i] || ""

            if (fileUrl && fileUrl !== "[]" && fileUrl !== '""' && fileUrl !== "") {
                files.push({
                    fileName: fileName,
                    fileUrl: fileUrl,
                })
            }
        }

        // Log para debugging
        console.log("Archivos procesados:", files)

        return files
    } catch (error) {
        console.error("Error procesando archivos:", error)
        return []
    }
}
