/**
 * Exports para el módulo request-details
 * Facilita las importaciones desde otros componentes
 */

// Componente principal
export { default as RequestDetails } from "../request-details"

// Tipos
export type { FileInfo, Request, HistoryItem, RequestDetailsProps } from "./types"

// Utilidades
export {
    cleanFileName,
    formatDate,
    getStatusColor,
    getStatusText,
    isEquipmentRequest,
    NON_EQUIPMENT_REQUEST_TYPES,
} from "./utils"

// Servicios
export type { OperatorInfo } from "./api-service"
export { fetchOperatorInfo, fetchUserHistory } from "./api-service"

// Procesador de archivos
export { processFiles } from "./file-processor"

// Sub-componentes (si se necesitan usar individualmente)
export { FilePreviewThumbnail, FilePreviewModal } from "./FilePreview"
export { PhotoModal } from "./PhotoModal"
export { PersonalInfoCard } from "./PersonalInfoCard"
export { InfoSection } from "./InfoSection"
export { DatesSection } from "./DatesSection"
export { FilesSection } from "./FilesSection"
export { ActionSection } from "./ActionSection"
