'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { format } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface LinkStatus {
  id: string
  name: string
  enabled: boolean
  startDate?: Date
  endDate?: Date
}

export default function LinkManager() {
  const [links, setLinks] = useState<LinkStatus[]>([
    {
      id: 'permits',
      name: 'Solicitud de Permisos',
      enabled: true
    },
    {
      id: 'equipment',
      name: 'Solicitud de Equipo',
      enabled: true
    }
  ])

  useEffect(() => {
    const savedLinks = localStorage.getItem('linkStatus')
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks, (key, value) => {
        if (key === 'startDate' || key === 'endDate') {
          return value ? new Date(value) : undefined
        }
        return value
      }))
    }
  }, [])

  const updateLink = (id: string, updates: Partial<LinkStatus>) => {
    setLinks(prevLinks => {
      const newLinks = prevLinks.map(link => 
        link.id === id ? { ...link, ...updates } : link
      )
      localStorage.setItem('linkStatus', JSON.stringify(newLinks))
      return newLinks
    })
  }

  return (
    <div className="space-y-4">
      {links.map(link => (
        <Card key={link.id}>
          <CardHeader>
            <CardTitle>{link.name}</CardTitle>
            <CardDescription>
              Gestionar disponibilidad del enlace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${link.id}-switch`}>Estado</Label>
                <Switch
                  id={`${link.id}-switch`}
                  checked={link.enabled}
                  onCheckedChange={(checked) => updateLink(link.id, { enabled: checked })}
                />
              </div>

              {!link.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de inicio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {link.startDate ? format(link.startDate, 'PPP') : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={link.startDate}
                            onSelect={(date) => 
                              updateLink(link.id, { startDate: date || undefined })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {link.endDate ? format(link.endDate, 'PPP') : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={link.endDate}
                            onSelect={(date) => 
                              updateLink(link.id, { endDate: date || undefined })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

