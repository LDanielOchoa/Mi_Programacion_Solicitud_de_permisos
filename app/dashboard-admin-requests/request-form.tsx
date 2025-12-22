'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Calendar } from 'lucide-react'
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Navigation from '../../components/navigation'
import LoadingOverlay from '../../components/loading-overlay'

type User = {
  code: string;
  name: string;
  role?: string;
}

type UserData = {
  code: string;
  name: string;
  phone: string;
}

export default function PermitRequestForm() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [noveltyType, setNoveltyType] = useState('')
  const [userData, setUserData] = useState<UserData>({ code: '', name: '', phone: '' })
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const [isLicenseNotificationOpen, setIsLicenseNotificationOpen] = useState(false)
  const [hasShownLicenseNotification, setHasShownLicenseNotification] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isCodePopoverOpen, setIsCodePopoverOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://solicitud-permisos.sao6.com.co/api/users/list')
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCodeSelect = async (selectedCode: string) => {
    setIsCodePopoverOpen(false)
    setIsLoading(true)
    try {
      const response = await fetch(`https://solicitud-permisos.sao6.com.co/api/user/${selectedCode}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos del usuario')
      }
      const data = await response.json()

      setUserData({
        code: data.code,
        name: data.name,
        phone: data.phone || '',
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDates(prev => {
      const isAlreadySelected = prev.some(d => isSameDay(d, date))
      let newDates

      if (noveltyType === 'audiencia' || noveltyType === 'cita') {
        newDates = isAlreadySelected ? [] : [date]
      } else {
        newDates = isAlreadySelected
          ? prev.filter(d => !isSameDay(d, date))
          : [...prev, date]

        if (newDates.length >= 2 && noveltyType === 'descanso') {
          setIsConfirmationDialogOpen(true)
        }

        if (noveltyType === 'licencia' && newDates.length === 3 && !hasShownLicenseNotification) {
          setIsLicenseNotificationOpen(true)
          setHasShownLicenseNotification(true)
        }
      }

      return newDates
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = {
      code: userData.code,
      name: userData.name,
      phone: userData.phone,
      dates: selectedDates.map(date => format(date, 'yyyy-MM-dd')),
      noveltyType,
      time: e.currentTarget.time?.value || '',
      description: e.currentTarget.description.value,
    }

    try {
      const response = await fetch('https://solicitud-permisos.sao6.com.co/api/new-permit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud');
      }

      setIsSuccess(true);

      const result = await response.json()
      console.log("New permit request result:", result)

      const approvalResponse = await fetch(`https://solicitud-permisos.sao6.com.co/api/update-approval/${result.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: e.currentTarget.acceptedBy.value,
        }),
      })

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json()
        console.error("Approval update error:", errorData)
        throw new Error(`Error al actualizar la aprobación: ${errorData.detail}`)
      }

      const approvalResult = await approvalResponse.json()
      console.log("Approval update result:", approvalResult)

      setIsSuccess(true)

      e.currentTarget.reset()
      setSelectedDates([])
      setNoveltyType('')
      setHasShownLicenseNotification(false)
      setUserData({ code: '', name: '', phone: '' })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => setIsSuccess(false), 3000)
    }
  }

  const generateDates = () => {
    const today = startOfDay(new Date())
    const twoWeeksAgo = subDays(today, 14)
    return Array.from({ length: 28 }, (_, i) => addDays(twoWeeksAgo, i))
  }

  const dates = generateDates()

  const handleConfirmation = (confirmed: boolean) => {
    if (confirmed) {
      setNoveltyType('licencia')
    } else {
      setSelectedDates(prev => prev.slice(0, -1))
    }
    setIsConfirmationDialogOpen(false)
  }

  const supervisors = [
    { code: "0003", name: "Enrique Fajardo" },
    { code: "0004", name: "Mario Valle" },
    { code: "0005", name: "Oliver Barbosa" },
  ]

  const filteredSupervisors = localStorage.getItem('userRole') === 'testers'
    ? supervisors.filter(supervisor => {
      const userCode = localStorage.getItem('userCode')
      if (userCode === '0001') return supervisor.name === "Manuel Lopez"
      if (userCode === '0002') return supervisor.name === "Antonio Rubiano"
      return false
    })
    : supervisors


  return (
    <div className="min-h-screen via-white to-green-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatePresence>
        {isLoading && <LoadingOverlay />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white bg-opacity-40 backdrop-blur-lg rounded-3xl overflow-hidden relative z-10 px-4 sm:px-6 md:px-8"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-4 sm:space-y-6">
          <motion.h1
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-3xl sm:text-4xl font-bold text-green-700 text-center mb-6 sm:mb-8"
          >
            Solicitud de Permiso
          </motion.h1>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-green-700">Código</Label>
              <Popover open={isCodePopoverOpen} onOpenChange={setIsCodePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCodePopoverOpen}
                    className="w-full justify-between"
                  >
                    {userData.code || "Seleccione un código"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar código..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.code}
                            onSelect={() => handleCodeSelect(user.code)}
                          >
                            {user.code} - {user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-green-700">Nombre y Apellido</Label>
              <Input
                id="name"
                value={userData.name}
                readOnly
                className="border-green-300 focus:ring-green-500 bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-green-700">Teléfono de contacto</Label>
              <Input
                id="phone"
                type="tel"
                value={userData.phone}
                readOnly
                className="border-green-300 focus:ring-green-500 bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-green-700">Tipo de novedad</Label>
              <Select
                required
                onValueChange={(value) => {
                  setNoveltyType(value)
                  setHasShownLicenseNotification(false)
                }}
                value={noveltyType}
              >
                <SelectTrigger className="border-green-300 focus:ring-green-500">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descanso">Descanso</SelectItem>
                  <SelectItem value="licencia">Licencia no remunerada</SelectItem>
                  <SelectItem value="audiencia">Audiencia o curso de tránsito</SelectItem>
                  <SelectItem value="cita">Cita médica</SelectItem>
                  <SelectItem value="cambioTurno">Cambio de turno</SelectItem>
                  <SelectItem value="semanaAM">Tabla Partida</SelectItem>
                  <SelectItem value="diaAM">Día A.M.</SelectItem>
                  <SelectItem value="diaPM">Día P.M.</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-green-700">Fechas de solicitud</Label>
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-2" style={{ width: 'max-content' }}>
                  {dates.map((date, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedDates.some(d => isSameDay(d, date)) ? "default" : "outline"}
                      className={`p-2 h-auto flex flex-col items-center justify-center min-w-[60px] ${selectedDates.some(d => isSameDay(d, date)) ? 'bg-green-500 text-white' : ''
                        } ${isSameDay(date, new Date()) ? 'border-2 border-blue-500' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <span className="text-xs">{format(date, 'EEE', { locale: es })}</span>
                      <span className="text-lg font-bold">{format(date, 'd')}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {(noveltyType === 'cita' || noveltyType === 'audiencia') && (
              <div className="space-y-2">
                <Label htmlFor="time" className="text-green-700">Hora de la novedad</Label>
                <Input id="time" type="time" className="border-green-300 focus:ring-green-500" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-green-700">Descripción de la solicitud</Label>
              <Textarea
                id="description"
                placeholder="Ingrese el detalle de tu solicitud"
                className="min-h-[100px] border-green-300 focus:ring-green-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acceptedBy" className="text-green-700">Aceptado por</Label>
              <Select required name="acceptedBy">
                <SelectTrigger className="border-green-300 focus:ring-green-500">
                  <SelectValue placeholder="Seleccione quién acepta" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSupervisors.map((supervisor) => (
                    <SelectItem key={supervisor.code} value={supervisor.name}>
                      {supervisor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button
              type="submit"
              className="bg-green-500 text-white hover:bg-green-600 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg w-full sm:w-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white p-4 rounded-lg shadow-lg"
          >
            ¡Solicitud de permiso enviada con éxito!
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isConfirmationDialogOpen} onOpenChange={setIsConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambio de tipo de solicitud</DialogTitle>
          </DialogHeader>
          <p>Ha seleccionado 2 o más fechas para un descanso. Su solicitud cambiará a Licencia no remunerada. ¿Desea continuar?</p>
          <DialogFooter>
            <Button onClick={() => handleConfirmation(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={() => handleConfirmation(true)} className="bg-green-500 text-white hover:bg-green-600">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isLicenseNotificationOpen} onOpenChange={setIsLicenseNotificationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700">Notificación Importante</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <Calendar className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-center text-lg font-semibold mb-4">
              Ha seleccionado 3 o más días para una licencia no remunerada.
            </p>
            <motion.p
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, yoyo: Infinity, repeatDelay: 0.5 }}
              className="text-center text-green-600 font-bold"
            >
              Este requerimiento será evaluado por el coordinador de operaciones.
            </motion.p>
            <p className="text-center mt-4">
              La respuesta a su solicitud se le notificará oportunamente.
            </p>
          </motion.div>
          <DialogFooter>
            <Button
              onClick={() => setIsLicenseNotificationOpen(false)}
              className="bg-green-500 text-white hover:bg-green-600 px-6 py-2 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

