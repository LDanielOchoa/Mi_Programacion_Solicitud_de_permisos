export interface RequestStats {
    total: number
    approved: number
    pending: number
    rejected: number
    descanso: number
    audiencia: number
    cita: number
    turnoPareja: number
    tablaPartida: number
    disponibleFijo: number
  }
  
  export interface Request {
    id: string
    code: string
    name: string
    type: string
    status: string
    createdAt: string
    description?: string
    zona?: string
    codeAM?: string
    codePM?: string
    shift?: string
    noveltyType?: string
    reason?: string
    [key: string]: string | undefined
  }
  
  export interface GroupedRequests {
    [key: string]: Request[]
  }
  
  