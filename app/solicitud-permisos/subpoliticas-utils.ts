import { SUBPOLITICAS_DATA } from "./constants"

/**
 * Agrupa las subpolíticas por política
 */
export function groupSubpoliticas(): Record<string, string[]> {
    return SUBPOLITICAS_DATA.reduce(
        (acc, item) => {
            if (!acc[item.POLÍTICA]) {
                acc[item.POLÍTICA] = []
            }
            acc[item.POLÍTICA].push(item.SUBPOLÍTICA)
            return acc
        },
        {} as Record<string, string[]>
    )
}

/**
 * Filtra subpolíticas agrupadas por término de búsqueda
 */
export function filterGroupedSubpoliticas(
    groupedSubpoliticas: Record<string, string[]>,
    searchTerm: string
): Record<string, string[]> {
    if (!searchTerm.trim()) {
        return groupedSubpoliticas
    }

    const search = searchTerm.toLowerCase().trim()
    const filtered: Record<string, string[]> = {}

    Object.entries(groupedSubpoliticas).forEach(([politica, subpoliticasList]) => {
        const filteredSubpoliticas = subpoliticasList.filter(
            (subpolitica) =>
                subpolitica.toLowerCase().includes(search) || politica.toLowerCase().includes(search)
        )

        if (filteredSubpoliticas.length > 0) {
            filtered[politica] = filteredSubpoliticas
        }
    })

    return filtered
}

/**
 * Obtiene opciones de novedad según tipo de usuario
 */
export function getNoveltyOptions(userType: string | undefined) {
    const { MAINTENANCE_NOVELTY_OPTIONS, REGULAR_NOVELTY_OPTIONS } = require("./constants")

    if (userType === "se_maintenance") {
        return MAINTENANCE_NOVELTY_OPTIONS
    }

    return REGULAR_NOVELTY_OPTIONS
}
