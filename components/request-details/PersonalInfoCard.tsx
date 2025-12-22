"use client"

import React from "react"
import { Loader2, Eye, Shield, Briefcase, MapPin, IdCard, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OperatorInfo } from "./api-service"
import { Request } from "./types"

interface PersonalInfoCardProps {
    operatorInfo: OperatorInfo | null
    request: Request
    isLoading: boolean
    onPhotoClick?: (photoUrl: string) => void
}

/**
 * Tarjeta de información personal del empleado
 */
export const PersonalInfoCard = React.memo<PersonalInfoCardProps>(
    ({ operatorInfo, request, isLoading, onPhotoClick }) => {
        return (
            <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden rounded-3xl min-h-[200px]">
                <div className="p-8 h-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="flex flex-col items-center space-y-3">
                                <Loader2 className="w-8 h-8 text-[#4cc253] animate-spin" />
                                <p className="text-gray-500 text-sm">Cargando información...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                            {/* Photo Section */}
                            <div className="relative group">
                                <div
                                    className="relative cursor-pointer overflow-hidden rounded-2xl w-32 h-32 border-4 border-gray-50 shadow-inner"
                                    onClick={() => onPhotoClick && onPhotoClick(operatorInfo?.foto || "")}
                                >
                                    {operatorInfo?.foto ? (
                                        <img
                                            src={operatorInfo.foto || "/placeholder.svg"}
                                            alt={`Foto de ${operatorInfo.nombre || request.name}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-3xl">
                                            {(operatorInfo?.nombre || request.name)
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#4cc253] text-white p-2 rounded-full shadow-lg">
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                        {operatorInfo?.nombre || request.name}
                                    </h2>
                                    <Badge className="bg-[#4cc253]/10 text-[#4cc253] border-none px-3 font-bold text-[10px] uppercase tracking-wider">
                                        Solicitante
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-500">
                                        <Briefcase className="w-4 h-4 text-[#4cc253]" />
                                        <span className="text-sm font-medium">
                                            {operatorInfo?.cargo || request.cargo || "No especificado"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-500">
                                        <MapPin className="w-4 h-4 text-[#4cc253]" />
                                        <span className="text-sm font-medium">
                                            {operatorInfo?.zona || request.zona || "Zona no asignada"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-500">
                                        <IdCard className="w-4 h-4 text-[#4cc253]" />
                                        <span className="text-sm font-medium">
                                            ID: {request.code || operatorInfo?.operatorId || request.operatorId || "--"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-500">
                                        <Mail className="w-4 h-4 text-[#4cc253]" />
                                        <span className="text-sm font-medium truncate max-w-[200px]">
                                            {operatorInfo?.email || "Sin correo"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        )
    }
)

PersonalInfoCard.displayName = "PersonalInfoCard"
