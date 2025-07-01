
import './globals.css'
import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import PageTransition from "@/components/page-transition"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SAO6 - Link de permisos operacionales',
  description: 'Control de permisos operacionales sao6', 
  icons: {
    icon: '/sao6.png', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <PageTransition>{children}</PageTransition>
        <Toaster />
      </body>
    </html>
  )
}

