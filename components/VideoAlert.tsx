'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface VideoAlertProps {
  setShowVideo: (value: boolean) => void; // Asegura que setShowVideo es una función válida
}

export function VideoAlert({ setShowVideo }: VideoAlertProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      if (typeof setShowVideo === 'function') {
        setShowVideo(false) // Solo llama si es una función válida
      }
    }, 300) // Tiempo para que la animación finalice
  }

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('modal-open') // Limpia clases globales si las hay
    }
  }, [isOpen])

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-[700px] p-0 gap-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-8 rounded-t-lg">
            <DialogHeader className="space-y-3">
              <motion.div 
                className="flex items-center justify-center gap-3"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white/20 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-2xl font-bold">
                  Instrucciones Importantes
                </DialogTitle>
              </motion.div>
              <motion.p 
                className="text-green-50 text-center text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Por favor, vea este video con instrucciones importantes antes de continuar
              </motion.p>
            </DialogHeader>
          </div>

          {/* Video */}
          <div className="p-8 space-y-6 bg-gradient-to-b from-green-50 to-white">
            <motion.div 
              className="relative aspect-video w-full overflow-hidden rounded-xl border shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <iframe
                src="https://www.youtube.com/embed/bn3xJSZunOo?autoplay=1"
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="autoplay"
              />
            </motion.div>

            {/* Botón */}
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 rounded-full"
                onClick={handleClose}
              >
                He visto el video y deseo continuar
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}