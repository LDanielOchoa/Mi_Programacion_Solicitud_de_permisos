import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PageTransition from "@/components/page-transition";
import { RBACProvider } from "@/components/RBACProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SAO6 - Link de permisos operacionales",
  description: "Control de permisos operacionales sao6",
  icons: {
    icon: "/sao6.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="application-name" content="Permisos App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Permisos" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/image.png" />
      </head>
      <body className={inter.className}>
        <RBACProvider>
          <PageTransition>{children}</PageTransition>
        </RBACProvider>
        <Toaster />
      </body>
    </html>
  );
}

