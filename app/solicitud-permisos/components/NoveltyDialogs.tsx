"use client"

import React from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Briefcase, CheckCircle, Search, X } from "lucide-react"

interface NoveltyOption {
    id: string
    label: string
    description: string
    icon: any
    color: string
    iconColor: string
    iconBg: string
}

interface NoveltyTypeDialogProps {
    isOpen: boolean
    onClose: () => void
    noveltyOptions: NoveltyOption[]
    noveltyType: string
    onSelectType: (typeId: string) => void
    onOpenSubpoliticaDialog: () => void
}

// Skeleton para las tarjetas de novedad
const NoveltyCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-start justify-between mb-4">
            <div className="bg-gray-100 rounded-xl w-12 h-12 animate-pulse"></div>
        </div>
        <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6"></div>
        </div>
    </div>
)

export const NoveltyTypeDialog: React.FC<NoveltyTypeDialogProps> = ({
    isOpen,
    onClose,
    noveltyOptions,
    noveltyType,
    onSelectType,
    onOpenSubpoliticaDialog,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl p-0 rounded-3xl overflow-hidden border border-gray-100 shadow-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-8">
                    <div className="flex items-center">
                        <div className="bg-[#4cc253]/10 rounded-2xl p-4 mr-5">
                            <AlertCircle className="h-8 w-8 text-[#4cc253]" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Seleccione el Tipo de Novedad</h2>
                            <p className="text-xs uppercase font-black text-gray-400 tracking-[0.2em]">
                                Elige el tipo de solicitud que necesitas realizar
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {noveltyOptions.map((type, index) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                    if (type.id === "subpolitica") {
                                        onOpenSubpoliticaDialog()
                                        onClose()
                                    } else {
                                        onSelectType(type.id)
                                        onClose()
                                    }
                                }}
                                className={`
                    bg-white
                    rounded-2xl
                    p-5
                    cursor-pointer
                    transition-all
                    duration-200
                    border
                    group
                    text-left
                    w-full
                    ${noveltyType === type.id
                                        ? "border-[#4cc253] shadow-sm ring-2 ring-[#4cc253]/20"
                                        : "border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
                                    }
                  `}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-[#4cc253]/10 p-3 rounded-xl shadow-sm">
                                        <type.icon className="h-6 w-6 text-[#4cc253]" />
                                    </div>
                                    {noveltyType === type.id && (
                                        <div
                                            className="bg-[#4cc253] text-white rounded-full p-1.5"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-black text-gray-900 text-base mb-2 group-hover:text-[#4cc253] transition-colors leading-tight">
                                        {type.label}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        {type.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 pt-6 border-t border-gray-100 bg-white">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-8 py-2.5 font-bold uppercase tracking-wider text-xs shadow-sm"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface SubpoliticaDialogProps {
    isOpen: boolean
    onClose: () => void
    onBack: () => void
    filteredGroupedsubpoliticas: Record<string, string[]>
    selectedSubpolitica: string
    onSelectSubpolitica: (subpolitica: string) => void
    searchTerm: string
    onSearchChange: (term: string) => void
}

// Skeleton para las tarjetas de subpolítica
const SubpoliticaCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
                <div className="bg-gray-100 rounded-xl w-10 h-10 animate-pulse"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                </div>
            </div>
        </div>
    </div>
)

export const SubpoliticaDialog: React.FC<SubpoliticaDialogProps> = ({
    isOpen,
    onClose,
    onBack,
    filteredGroupedsubpoliticas,
    selectedSubpolitica,
    onSelectSubpolitica,
    searchTerm,
    onSearchChange,
}) => {
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            const timer = setTimeout(() => setIsLoading(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const handleClose = () => {
        onSearchChange("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent className="sm:max-w-6xl p-0 rounded-3xl overflow-hidden border border-gray-100 shadow-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-8">
                    <div className="flex items-center mb-6">
                        <div className="bg-[#4cc253]/10 rounded-2xl p-4 mr-5">
                            <Briefcase className="h-8 w-8 text-[#4cc253]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Seleccione una Subpolítica</h2>
                            <p className="text-xs uppercase font-black text-gray-400 tracking-[0.2em]">
                                Elige la subpolítica en la que deseas laborar
                            </p>
                        </div>
                    </div>

                    {/* Campo de búsqueda */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar subpolíticas..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4cc253]/20 focus:border-[#4cc253] transition-all text-base font-medium"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10 bg-gray-50">
                    {isLoading ? (
                        <div className="space-y-8">
                            {Array.from({ length: 3 }).map((_, groupIndex) => (
                                <div key={groupIndex} className="space-y-4">
                                    {/* Header skeleton */}
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="bg-gray-100 rounded-xl w-10 h-10 animate-pulse"></div>
                                        <div className="h-6 bg-gray-100 rounded animate-pulse w-48"></div>
                                        <div className="flex-1 h-px bg-gray-200"></div>
                                    </div>
                                    {/* Cards skeleton */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {Array.from({ length: 6 }).map((_, index) => (
                                            <SubpoliticaCardSkeleton key={index} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : Object.keys(filteredGroupedsubpoliticas).length === 0 && searchTerm.trim() !== "" ? (
                        <div className="text-center py-16">
                            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <Search className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-700 mb-2">No se encontraron resultados</h3>
                            <p className="text-gray-500 mb-6">No hay subpolíticas que coincidan con "{searchTerm}"</p>
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                className="px-6 py-3 bg-[#4cc253] text-white rounded-2xl hover:bg-[#3da343] transition-colors font-bold shadow-sm"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    ) : (
                        Object.entries(filteredGroupedsubpoliticas).map(([politica, subpoliticasList], groupIndex) => (
                            <div
                                key={politica}
                                className="space-y-4"
                            >
                                {/* Header de política */}
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="bg-[#4cc253]/10 rounded-xl p-2.5">
                                        <Briefcase className="h-6 w-6 text-[#4cc253]" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{politica}</h3>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                {/* Grid de subpolíticas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {subpoliticasList.map((subpolitica, index) => (
                                        <button
                                            key={subpolitica}
                                            type="button"
                                            onClick={() => {
                                                onSelectSubpolitica(subpolitica)
                                                onClose()
                                            }}
                                            className={`
                        rounded-2xl
                        p-4
                        cursor-pointer
                        transition-all
                        duration-200
                        border
                        group
                        text-left
                        w-full
                        h-full
                        ${selectedSubpolitica === subpolitica
                                                    ? "bg-[#4cc253]/5 border-[#4cc253] shadow-sm ring-2 ring-[#4cc253]/20"
                                                    : "bg-white border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
                                                }
                      `}
                                        >
                                            <div className="flex items-start justify-between h-full">
                                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                    <div
                                                        className={`
                            p-2 rounded-xl shadow-sm transition-all flex-shrink-0 mt-0.5
                            ${selectedSubpolitica === subpolitica
                                                                ? "bg-[#4cc253] text-white"
                                                                : "bg-[#4cc253]/10 text-[#4cc253]"
                                                            }
                          `}
                                                    >
                                                        <Briefcase className="h-5 w-5" />
                                                    </div>
                                                    <p className={`font-bold text-xs sm:text-sm leading-snug transition-colors break-words ${selectedSubpolitica === subpolitica ? "text-[#4cc253]" : "text-gray-900"}`}>
                                                        {subpolitica}
                                                    </p>
                                                </div>

                                                {selectedSubpolitica === subpolitica && (
                                                    <div
                                                        className="bg-[#4cc253] text-white rounded-full p-1.5 flex-shrink-0 ml-2 mt-0.5"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 pt-6 border-t border-gray-100 bg-white">
                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            onClick={() => {
                                onClose()
                                onBack()
                            }}
                            className="rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-6 py-2.5 font-bold text-xs shadow-sm"
                        >
                            ← Volver
                        </Button>
                        <Button
                            type="button"
                            onClick={handleClose}
                            className="rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-8 py-2.5 font-bold uppercase tracking-wider text-xs shadow-sm"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
