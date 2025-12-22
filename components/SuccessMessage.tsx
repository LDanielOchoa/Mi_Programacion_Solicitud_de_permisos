import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

interface SuccessMessageProps {
  isVisible: boolean
  onClose: () => void
}

export function SuccessMessage({ isVisible, onClose }: SuccessMessageProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-green-500 bg-opacity-90 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="bg-white rounded-lg p-8 shadow-2xl text-center"
      >
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-green-700 mb-4">¡Éxito!</h2>
        <p className="text-xl text-gray-600">
          Su solicitud de equipo ha sido enviada correctamente.
        </p>
      </motion.div>
    </motion.div>
  )
}

