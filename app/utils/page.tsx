'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import Navigation from '../../components/navigation'
import WelcomeBar from '../../components/WelcomeBar'
import LoadingOverlay from '../../components/loading-overlay'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Request {
  id: number
  code: string
  name: string
  tipo_novedad: string
  description: string
  status: string
  respuesta: string
  zona?: string
  createdAt: string
}

export default function Solicitudes() {
  const [userName, setUserName] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch('solicitud-permisos.sao6.com.co/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserName(data.name)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch('solicitud-permisos.sao6.com.co/api/solicitudes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setRequests(data)
          setFilteredRequests(data)
        }
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchUserData()
    fetchRequests()
  }, [])

  useEffect(() => {
    let filtered = [...requests]

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date()
      const periodStart = new Date()
      switch (filterPeriod) {
        case 'day':
          periodStart.setDate(now.getDate() - 1)
          break
        case 'week':
          periodStart.setDate(now.getDate() - 7)
          break
        case 'month':
          periodStart.setMonth(now.getMonth() - 1)
          break
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1)
          break
      }
      filtered = filtered.filter(req => new Date(req.createdAt) >= periodStart)
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus)
    }

    // Sort
    filtered.sort((a, b) => {
      return sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    setFilteredRequests(filtered)
  }, [requests, filterPeriod, filterStatus, sortOrder])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {isLoading && <LoadingOverlay />}

      <div className="container mx-auto px-4 py-8">
        <WelcomeBar userName={userName} />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Mis Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <Select onValueChange={setFilterPeriod} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="day">Último día</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={setFilterStatus} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aceptada">Aceptadas</SelectItem>
                  <SelectItem value="rechazada">Rechazadas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                <Filter className="mr-2 h-4 w-4" />
                {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo de Novedad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Respuesta</TableHead>
                    <TableHead>Zona</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No hay solicitudes para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className={
                          request.status === 'aceptada'
                            ? 'bg-green-50 hover:bg-green-100'
                            : request.status === 'rechazada'
                              ? 'bg-red-50 hover:bg-red-100'
                              : ''
                        }
                      >
                        <TableCell>{request.code}</TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.tipo_novedad}</TableCell>
                        <TableCell>{request.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${request.status === 'aceptada'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                            }`}>
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell>{request.respuesta || '-'}</TableCell>
                        <TableCell>{request.zona || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

