import {
    User,
    Car,
    Briefcase,
    HeartPulse,
    Sun,
    AlertCircle,
    Clock,
    FileText,
    Moon,
    Table2,
    IdCard,
} from "lucide-react"

/**
 * Opciones de novedad para personal de mantenimiento
 */
export const MAINTENANCE_NOVELTY_OPTIONS = [
    {
        id: "cumpleanos",
        label: "Cumpleaños",
        description: "Celebración de cumpleaños",
        icon: User,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "cita",
        label: "Cita médica",
        description: "Para asistir a citas médicas",
        icon: HeartPulse,
        color: "bg-cyan-50",
        iconColor: "text-cyan-600",
        iconBg: "bg-cyan-100",
    },
    {
        id: "descanso",
        label: "Descanso",
        description: "Para un día de descanso",
        icon: Sun,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "licenciaMaternidad",
        label: "Licencia de maternidad",
        description: "Se debe adjuntar el documento soporte",
        icon: HeartPulse,
        color: "bg-pink-50",
        iconColor: "text-pink-600",
        iconBg: "bg-pink-100",
    },
    {
        id: "licenciaPaternidad",
        label: "Licencia de paternidad",
        description: "Se debe adjuntar el documento soporte",
        icon: User,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "calamidad",
        label: "Calamidad",
        description: "Para situaciones de calamidad",
        icon: AlertCircle,
        color: "bg-red-50",
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
    },
    {
        id: "cambioTurno",
        label: "Cambio de turno",
        description: "Para solicitar cambio de turno",
        icon: Clock,
        color: "bg-orange-50",
        iconColor: "text-orange-600",
        iconBg: "bg-orange-100",
    },
    {
        id: "vacaciones",
        label: "Vacaciones",
        description: "Solicitud de vacaciones",
        icon: Sun,
        color: "bg-yellow-50",
        iconColor: "text-yellow-600",
        iconBg: "bg-yellow-100",
    },
    {
        id: "tramitesLegales",
        label: "Trámites legales",
        description: "Para realizar trámites legales",
        icon: FileText,
        color: "bg-gray-50",
        iconColor: "text-gray-600",
        iconBg: "bg-gray-100",
    },
    {
        id: "subpolitica",
        label: "Deseo de laborar en alguna Sub política",
        description: "Seleccionar subpolítica específica",
        icon: Briefcase,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "educacion",
        label: "Educación",
        description: "Entrega de notas, reuniones escolares, evaluaciones",
        icon: FileText,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
    },
    {
        id: "permisoEstudiar",
        label: "Permiso para estudiar",
        description: "Anexar soportes y cumplir requerimientos de SAO6",
        icon: FileText,
        color: "bg-teal-50",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
    },
    {
        id: "viaje",
        label: "Viaje",
        description: "Para realizar viajes",
        icon: Car,
        color: "bg-violet-50",
        iconColor: "text-violet-600",
        iconBg: "bg-violet-100",
    },
    {
        id: "licencia",
        label: "Licencia no remunerada",
        description: "Solicitud de días sin remuneración",
        icon: Briefcase,
        color: "bg-stone-50",
        iconColor: "text-stone-600",
        iconBg: "bg-stone-100",
    },
]

/**
 * Opciones de novedad para usuarios regulares
 */
export const REGULAR_NOVELTY_OPTIONS = [
    {
        id: "descanso",
        label: "Descanso",
        description: "Para un día de descanso",
        icon: Sun,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "licencia",
        label: "Licencia no remunerada",
        description: "Solicitud de días sin remuneración",
        icon: Briefcase,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
    },
    {
        id: "audiencia",
        label: "Audiencia o curso de tránsito",
        description: "Para asistir a audiencias o cursos",
        icon: Car,
        color: "bg-teal-50",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
    },
    {
        id: "cita",
        label: "Cita médica",
        description: "Para asistir a citas médicas",
        icon: HeartPulse,
        color: "bg-cyan-50",
        iconColor: "text-cyan-600",
        iconBg: "bg-cyan-100",
    },
    {
        id: "tablaPartida",
        label: "Tabla Partida",
        description: "Para la jornada de tabla partida",
        icon: Table2,
        color: "bg-green-50",
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
    },
    {
        id: "diaAM",
        label: "Día A.M.",
        description: "Jornada de mañana un día específico",
        icon: Sun,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
    },
    {
        id: "diaPM",
        label: "Día P.M.",
        description: "Jornada de tarde un día específico",
        icon: Moon,
        color: "bg-teal-50",
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
    },
]

/**
 * Subpolíticas agrupadas por política
 */
export const SUBPOLITICAS_DATA = [
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR MECÁNICA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO MENOR ELÉCTRICO",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PROGRAMADO MECÁNICA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - POTENCIA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - DIAGNÓSTICO",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - BIMENSUAL ELECTROMECANICO",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - BIMENSUAL CARROCERIA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - METRO MEDELLIN",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - ALISTAMIENTO CDA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CARROCERIA MENOR",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CORRECTIVO Y MONTAJE PUERTAS",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PISOS",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CARROCERO CHASIS",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - MECÁNICO CHASIS",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PINTURA GENERAL CARROCERÍA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - PINTURA PARCIAL CARROCERÍA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - FIBRA EMBELLECIMIENTO CARROCERÍA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - FALDONES EMBELLECIMIENTO CARROCERÍA",
    },
    {
        POLÍTICA: "POLÍTICA CORRECTIVO",
        SUBPOLÍTICA: "SUBPOLITICA CORRECTIVO - CHOQUES FUERTES CARROCERÍA",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - CAMBIAR DIFERENCIALES",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - HACER",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - LUBRICACION",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ALISTAMIENTO PROFUNDO",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ENGRASE",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ALISTAMIENTO CHIP Y TANQUE GAS",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL CARROCERIA",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - FRENOS ANUAL",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - GNV",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - ELECTRICO ANUAL",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - REFRIGERACION ANUAL",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - PMR BIMENSUAL",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - PUERTAS BIMENSUAL",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA FIJA",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - INSPECCION BIMENSUAL ELECTROMECANICO",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO LLANTAS",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - REDISEÑOS O MEJORAS TECNICAS",
    },
    {
        POLÍTICA: "POLÍTICA PREVENTIVO - FRECUENCIA VARIABLE",
        SUBPOLÍTICA: "SUBPOLITICA PREVENTIVO - COMPONENTES MAYORES CRC",
    },
    {
        POLÍTICA: "APOYO ADMINISTRATIVO",
        SUBPOLÍTICA: "APOYO ADMINISTRATIVO - LÍDER DE MANTENIMIENTO",
    },
    {
        POLÍTICA: "APOYO ADMINISTRATIVO",
        SUBPOLÍTICA: "APOYO ADMINISTRATIVO - AUXILIAR MANTENIMIENTO - FLOTA",
    },
]

/**
 * Constantes de validación de archivos
 */
export const FILE_VALIDATION = {
    MAX_FILES: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    ALLOWED_EXTENSIONS: [".pdf", ".jpg", ".jpeg", ".png"],
}
