"use client"

import React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatDate } from "./utils"

interface DatesSectionProps {
    dates?: string[] | string
}

/**
 * Sección de fechas solicitadas
 */
export const DatesSection = React.memo<DatesSectionProps>(({ dates }) => (
    <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden rounded-3xl">
        <div className="p-8">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gray-50 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-[#4cc253]" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Fechas Solicitadas</h3>
            </div>

            {Array.isArray(dates) && dates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dates.map((date: string, index: number) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors hover:bg-white hover:shadow-sm"
                        >
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <CalendarIcon className="w-4 h-4 text-[#4cc253]" />
                            </div>
                            <span className="font-black text-gray-800 text-sm">{formatDate(date)}</span>
                        </div>
                    ))}
                </div>
            ) : typeof dates === "string" ? (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <CalendarIcon className="w-4 h-4 text-[#4cc253]" />
                    </div>
                    <span className="font-black text-gray-800 text-sm">{formatDate(dates)}</span>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No hay fechas disponibles</p>
                </div>
            )}
        </div>
    </Card>
))

DatesSection.displayName = "DatesSection"
