"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CheckCircle, ChevronRight, MapPin, Search } from "lucide-react"

interface ZoneSelectorProps {
  selectedZone: string
  onZoneSelect: (zone: string) => void
  zones: string[]
}

export function ZoneSelector({ selectedZone, onZoneSelect, zones }: ZoneSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredZones = zones.filter((zone) => zone.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <MapPin className="h-5 w-5 mr-2 text-green-600" />
        <h3 className="text-base font-medium text-gray-800">Selecciona la zona</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-xl shadow-md border border-green-100"
      >
        <div className="p-4 bg-white">
          {selectedZone ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedZone}</p>
                  <p className="text-xs text-gray-500">Zona seleccionada</p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-green-300 bg-white hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-600">Seleccione la zona</span>
              </div>
              <ChevronRight className="h-5 w-5 text-green-400" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Zone Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-xl overflow-hidden border-0 shadow-xl">
          {/* Header */}
          <div className="bg-green-500 p-4">
            <h2 className="text-lg font-medium text-white">Seleccionar Zona</h2>
            <p className="text-white/80 text-sm">Elija la zona para la asignación de turnos</p>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
              <Input
                placeholder="Buscar zona..."
                className="border border-green-200 pl-10 py-2 rounded-lg focus-visible:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Zone List */}
          <div className="px-4 pb-4 max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredZones.map((zone) => (
                <div
                  key={zone}
                  onClick={() => {
                    onZoneSelect(zone)
                    setIsDialogOpen(false)
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedZone === zone ? "bg-green-100 border-green-300" : "border-gray-200 hover:bg-green-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-md mr-2 ${selectedZone === zone ? "bg-green-200" : "bg-green-100"}`}>
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium text-sm">{zone}</span>
                  </div>
                  {selectedZone === zone && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
