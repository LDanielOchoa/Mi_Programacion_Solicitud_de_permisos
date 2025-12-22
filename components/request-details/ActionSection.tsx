"use client"

import React from "react"
import { Settings, XCircle, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ActionSectionProps {
    reason: string
    onReasonChange: (reason: string) => void
    onApprove: () => void
    onReject: () => void
}

/**
 * Sección de acciones para aprobar/rechazar solicitudes
 */
export const ActionSection = React.memo<ActionSectionProps>(
    ({ reason, onReasonChange, onApprove, onReject }) => (
        <Card className="border border-gray-100 shadow-sm bg-white overflow-hidden rounded-3xl">
            <div className="p-8">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <Settings className="w-6 h-6 text-[#4cc253]" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Acción Requerida</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">
                            Motivo de la decisión <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Escriba aquí la razón detallada para su decisión..."
                            onChange={(e) => onReasonChange(e.target.value)}
                            value={reason}
                            className="min-h-[150px] border-gray-100 focus:ring-[#4cc253]/20 focus:border-[#4cc253] rounded-2xl p-4 text-sm resize-none transition-all"
                        />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                            Este comentario será visible para el solicitante
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={onReject}
                            className="h-14 rounded-2xl border-gray-100 text-red-600 hover:bg-red-50 hover:border-red-100 transition-all font-black uppercase tracking-widest text-xs"
                            disabled={!reason.trim()}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rechazar Solicitud
                        </Button>
                        <Button
                            onClick={onApprove}
                            className="h-14 rounded-2xl bg-[#4cc253] hover:bg-[#3da343] text-white shadow-lg shadow-[#4cc253]/20 transition-all font-black uppercase tracking-widest text-xs"
                            disabled={!reason.trim()}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar Solicitud
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
)

ActionSection.displayName = "ActionSection"
