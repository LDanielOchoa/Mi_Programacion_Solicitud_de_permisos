import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Usar el backend Node.js con discriminación de tipos de usuario
    const backendUrl = 'solicitud-permisos.sao6.com.co/api/excel/excel-permisos'
    const response = await fetch(backendUrl)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Agregar información adicional para clarificar los tipos de usuario
    const processedData = data.map((record: any) => ({
      ...record,
      // Asegurar que el tipo de usuario sea visible
      tipo_usuario: record.tipo_usuario || (record.user_type === 'se_maintenance' ? 'Personal de Mantenimiento' : 'Usuario Registrado'),
      user_category: record.user_type === 'se_maintenance' ? 'MANTENIMIENTO' : 'REGISTRADO'
    }))

    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error fetching excel permisos:', error)
    return NextResponse.json({ error: 'Failed to fetch excel permisos' }, { status: 500 })
  }
}
