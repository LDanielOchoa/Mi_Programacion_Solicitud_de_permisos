'use client'

import { useState} from 'react'
import { User, LogOut, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from 'framer-motion'

interface ProfileMenuProps {
  code: string
  name: string
  phone: string | null
  onPhoneUpdate: (newPhone: string) => Promise<void>
}

export default function ProfileMenu({ code, name, phone, onPhoneUpdate }: ProfileMenuProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newPhone, setNewPhone] = useState(phone && phone !== '(EMPTY)' ? phone : '')
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const handlePhoneUpdate = async () => {
    try {
      setIsLoading(true)
      await onPhoneUpdate(newPhone)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating phone:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userCode')
    router.push('/')
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors duration-300"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <User size={24} />
            </motion.div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 md:w-64 bg-green-50 border-green-200">
          <DropdownMenuLabel className="text-green-700">Mi Perfil</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-green-200" />
          <DropdownMenuItem className="flex flex-col items-start hover:bg-green-100" onSelect={(e) => e.preventDefault()}>
            <span className="text-sm font-medium text-green-700">Código</span>
            <span className="text-sm text-green-600">{code}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start hover:bg-green-100" onSelect={(e) => e.preventDefault()}>
            <span className="text-sm font-medium text-green-700">Nombre</span>
            <span className="text-sm text-green-600">{name}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {
            setIsEditing(true)
            setIsDropdownOpen(false)
          }} className="hover:bg-green-100">
            <div className="flex flex-col items-start w-full">
              <span className="text-sm font-medium text-green-700">Teléfono</span>
              {phone && phone !== '(EMPTY)' ? (
                <span className="text-sm text-green-600">{phone}</span>
              ) : (
                <span className="text-sm text-red-500 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  No registrado
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-green-200" />
          <DropdownMenuItem onSelect={handleLogout} className="text-red-600 hover:bg-red-100 hover:text-red-700">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AnimatePresence>
        {isEditing && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogContent className="sm:max-w-[425px] bg-green-50 border-green-200">
                <DialogHeader>
                  <DialogTitle className="text-green-700">
                    {phone && phone !== '(EMPTY)' ? "Actualizar teléfono" : "Registrar teléfono"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Ingrese su teléfono"
                    type="tel"
                    className="border-green-300 focus:ring-green-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                      className="text-green-700 border-green-300 hover:bg-green-100 transition-colors duration-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePhoneUpdate}
                      disabled={isLoading}
                      className="bg-green-600 text-white hover:bg-green-700 transition-colors duration-300"
                    >
                      {isLoading ? 'Actualizando...' : (phone && phone !== '(EMPTY)' ? 'Actualizar' : 'Registrar')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )
}

