import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Secret key for verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || "secret-key-123"

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData()
    const ssoToken = formData.get("sso_token") as string
    const redirect = (formData.get("redirect") as string) || "/dashboard"

    if (!ssoToken) {
      return NextResponse.json({ error: "Token SSO no proporcionado" }, { status: 400 })
    }

    try {
      // Verify the token
      const decoded = jwt.verify(ssoToken, JWT_SECRET) as {
        code: string
        password: string
        name: string
        role: string
        sso: boolean
        issuer: string
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

      // Create a session token for the user
      const sessionToken = jwt.sign(
        {
          code: decoded.code,
          name: decoded.name,
          role: decoded.role,
          source: "sso",
        },
        JWT_SECRET,
        { expiresIn: "1d" },
      )

      // Create a response with redirect
      const response = NextResponse.redirect(new URL(redirect, request.url))

      // Set the session cookie
      response.cookies.set({
        name: "session",
        value: sessionToken,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
      })

      // Also set localStorage items via script
      response.headers.set("Set-Cookie", `loginScript=document.cookie;path=/;max-age=1;HttpOnly;SameSite=Strict`)

      return response
    } catch (error) {
      console.error("Error al verificar token SSO:", error)

      // Redirect to login page with error
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("error", "invalid_sso_token")
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error("Error en login-with-sso:", error)

    // Redirect to login page with error
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "server_error")
    return NextResponse.redirect(loginUrl)
  }
}

