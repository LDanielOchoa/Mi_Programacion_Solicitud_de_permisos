import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Replace this URL with your actual Python backend URL
    const backendUrl = 'https://solicitud-permisos.sao6.com.co/api/excel-permisos'
    const response = await fetch(backendUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching excel permisos:', error)
    return NextResponse.json({ error: 'Failed to fetch excel permisos' }, { status: 500 })
  }
}
