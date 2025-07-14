import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Request } from '../types'

interface RequestCardProps {
  name: string
  requests: Request[]
  onRequestClick: (request: Request) => void
  selectedRequestIds: Set<string>
}

const RequestCard: React.FC<RequestCardProps> = ({ name, requests, onRequestClick, selectedRequestIds }) => {
  const isEquipmentRequest = !('noveltyType' in requests[0])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <Card className="h-full bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="space-y-2">
          <div className="flex justify-between items-start">
            <Badge 
              variant="outline" 
              className={`${
                isEquipmentRequest ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 
                'bg-green-50 text-green-700 border-green-300'
              }`}
            >
              {isEquipmentRequest ? 'Equipo' : 'Permiso'}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Pendiente
            </Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {requests.length} solicitud{requests.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requests.map((request) => (
              <motion.button
                key={request.id}
                className={`w-full text-left p-2 rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-3 ${
                  selectedRequestIds.has(request.id) ? 'bg-emerald-100' : ''
                }`}
                onClick={() => onRequestClick(request)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {request.type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(request.createdAt), "d MMM, yyyy", { locale: es })}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default RequestCard

