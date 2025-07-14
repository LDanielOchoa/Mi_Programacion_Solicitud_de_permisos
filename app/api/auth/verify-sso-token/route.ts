import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-123"

export async function POST(request: NextRequest) {
  try {
    // Get token from request body
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 })
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      code: string
      name: string
      role: string
      sso: boolean
      issuer: string
      issuedAt: string
      exp?: number
    }

    // Check if token has expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return NextResponse.json({ error: "Token SSO expirado" }, { status: 401 })
    }

    // Check if token is a valid SSO token
    if (!decoded.sso || decoded.issuer !== "sao6_main_system") {
      return NextResponse.json({ error: "Token SSO inválido" }, { status: 400 })
    }

    // Generate an access token for the application
    const accessToken = jwt.sign(
      {
        code: decoded.code,
        name: decoded.name,
        role: decoded.role,
        source: "sso",
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    )

    // Return the decoded user data and access token
    return NextResponse.json({
      success: true,
      user: {
        code: decoded.code,
        name: decoded.name,
        role: decoded.role,
      },
      accessToken,
    })
  } catch (error) {
    console.error("Error al verificar token SSO:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al verificar token SSO",
      },
      { status: 401 },
    )
  }
}

