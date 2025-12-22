import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Limpia y extrae el nombre del archivo de una cadena que puede contener formato JSON
 */
export function cleanFileName(fileName: any): string {
    if (!fileName) return "archivo_sin_nombre"

    try {
        // Si es un objeto, intenta extraer el nombre
        if (typeof fileName === "object" && fileName !== null) {
            return fileName.name || fileName.fileName || "archivo_sin_nombre"
        }

        // Si es una cadena, limpia el formato JSON
        let cleanedName = String(fileName)
            .replace(/^\["|"\]$/g, "")
            .replace(/\\"/g, '"')
            .replace(/^["']|["']$/g, "")
            .trim()

        // Si después de limpiar queda vacío, usar nombre por defecto
        if (!cleanedName || cleanedName === "[]" || cleanedName === '""') {
            return "archivo_sin_nombre"
        }

        return cleanedName
    } catch (error) {
        console.error("Error limpiando nombre de archivo:", error)
        return "archivo_sin_nombre"
    }
}

/**
 * Formatea una fecha a formato español legible
 */
export function formatDate(dateString: string) {
    if (!dateString) return "--"

    try {
        const date = parseISO(dateString)
        return format(date, "dd/MM/yyyy", { locale: es })
    } catch (error) {
        console.error("Error formateando fecha:", error)

        // Intentar con formato alternativo si hay guiones
        if (dateString.includes("-")) {
            const [year, month, day] = dateString.split("-")
            if (year && month && day) {
                return `${day}/${month}/${year}`
            }
        }

        return dateString
    }
}

/**
 * Obtiene el color del estado de una solicitud
 */
export function getStatusColor(status: string) {
    const statusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        approved: "bg-[#4cc253]/10 text-[#4cc253] border-[#4cc253]/20",
        rejected: "bg-red-50 text-red-600 border-red-100",
    }

    return statusColors[status] || "bg-gray-50 text-gray-600 border-gray-100"
}

/**
 * Obtiene el texto del estado de una solicitud
 */
export function getStatusText(status: string) {
    const statusTexts: Record<string, string> = {
        pending: "Pendiente",
        approved: "Aprobada",
        rejected: "Rechazada",
    }

    return statusTexts[status] || status
}

/**
 * Lista de tipos de solicitud que NO son de equipamiento
 */
export const NON_EQUIPMENT_REQUEST_TYPES = [
    "cumpleanos",
    "cita",
    "descanso",
    "licenciaMaternidad",
    "licenciaPaternidad",
    "calamidad",
    "cambioTurno",
    "vacaciones",
    "tramitesLegales",
    "subpolitica",
    "educacion",
    "permisoEstudiar",
    "viaje",
    "licencia",
    "audiencia",
    "tablaPartida",
    "diaAM",
    "diaPM",
    "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR MECÁNICA",
    "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR ELÉCTRICO",
    "SUBPOLITICA CORRECTIVO - PROGRAMADO MECÁNICA",
    "SUBPOLITICA CORRECTIVO - POTENCIA",
    "SUBPOLITICA CORRECTIVO - DIAGNÓSTICO",
    "SUBPOLITICA CORRECTIVO - BIMENSUAL ELECTROMECANICO",
    "SUBPOLITICA CORRECTIVO - BIMENSUAL CARROCERIA",
    "SUBPOLITICA CORRECTIVO - METRO MEDELLIN",
    "SUBPOLITICA CORRECTIVO - ALISTAMIENTO CDA",
    "SUBPOLITICA CORRECTIVO - CARROCERIA MENOR",
    "SUBPOLITICA CORRECTIVO - CORRECTIVO Y MONTAJE PUERTAS",
    "SUBPOLITICA CORRECTIVO - PISOS",
    "SUBPOLITICA CORRECTIVO - CARROCERO CHASIS",
    "SUBPOLITICA CORRECTIVO - MECÁNICO CHASIS",
    "SUBPOLITICA CORRECTIVO - PINTURA GENERAL CARROCERÍA",
    "SUBPOLITICA CORRECTIVO - PINTURA PARCIAL CARROCERÍA",
    "SUBPOLITICA CORRECTIVO - FIBRA EMBELLECIMIENTO CARROCERÍA",
    "SUBPOLITICA CORRECTIVO - FALDONES EMBELLECIMIENTO CARROCERÍA",
    "SUBPOLITICA CORRECTIVO - CHOQUES FUERTES CARROCERÍA",
    "SUBPOLITICA PREVENTIVO - CAMBIAR DIFERENCIALES",
    "SUBPOLITICA PREVENTIVO - HACER",
    "SUBPOLITICA PREVENTIVO - LUBRICACION",
    "SUBPOLITICA PREVENTIVO - ALISTAMIENTO PROFUNDO",
    "SUBPOLITICA PREVENTIVO - ENGRASE",
    "SUBPOLITICA PREVENTIVO - ALISTAMIENTO CHIP Y TANQUE GAS",
    "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL CARROCERIA",
    "SUBPOLITICA PREVENTIVO - FRENOS ANUAL",
    "SUBPOLITICA PREVENTIVO - GNV",
    "SUBPOLITICA PREVENTIVO - ELECTRICO ANUAL",
    "SUBPOLITICA PREVENTIVO - REFRIGERACION ANUAL",
    "SUBPOLITICA PREVENTIVO - PMR BIMENSUAL",
    "SUBPOLITICA PREVENTIVO - PUERTAS BIMENSUAL",
    "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL ELECTROMECANICO",
    "SUBPOLITICA PREVENTIVO LLANTAS",
    "SUBPOLITICA PREVENTIVO - REDISEÑOS O MEJORAS TECNICAS",
    "SUBPOLITICA PREVENTIVO - COMPONENTES MAYORES CRC",
    "APOYO ADMINISTRATIVO - LÍDER DE MANTENIMIENTO",
    "APOYO ADMINISTRATIVO - AUXILIAR MANTENIMIENTO - FLOTA",
]

/**
 * Verifica si una solicitud es de tipo equipamiento
 */
export function isEquipmentRequest(requestType: string): boolean {
    return !NON_EQUIPMENT_REQUEST_TYPES.includes(requestType)
}
