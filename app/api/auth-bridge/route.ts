import { type NextRequest, NextResponse } from "next/server"

/**
 * Esta ruta API actúa como un puente seguro entre las dos aplicaciones
 * Recibe las credenciales y las reenvía a la aplicación destino
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, password, redirectUrl } = body

    if (!code || !password || !redirectUrl) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Validar que redirectUrl sea una URL permitida
    const allowedDomains = ["miprogramacionsao6.vercel.app", "solicitud-permisos.onrender.com"]

    const urlObj = new URL(redirectUrl)
    const isDomainAllowed = allowedDomains.some(
      (domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
    )

    if (!isDomainAllowed) {
      return NextResponse.json({ error: "URL de redirección no permitida" }, { status: 403 })
    }

    // Crear un token temporal firmado (en producción usarías una biblioteca de JWT)
    const tempToken = Buffer.from(
      JSON.stringify({
        code,
        exp: Date.now() + 5 * 60 * 1000, // 5 minutos
      }),
    ).toString("base64")

    // Construir la URL de redirección con el token
    const redirectWithToken = `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}authToken=${tempToken}`

    return NextResponse.json({ redirectUrl: redirectWithToken })
  } catch (error) {
    console.error("Error en el puente de autenticación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

