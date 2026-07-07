import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Instrument_Serif, Montserrat } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { PwaRegister } from '@/components/pwa/pwa-register'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '600', '900'],
  variable: '--font-logo',
})

export const metadata: Metadata = {
  title: 'Community OS — Comunidades, clubs y experiencias',
  description: 'El sistema operativo que convierte clubs y espacios en comunidades vivas. Eventos, deporte, gastronomía y socios en un solo lugar.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Community OS',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${instrumentSerif.variable} ${montserrat.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <PwaRegister />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
