import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LOKAL HRMS - Municipality of Concepcion',
  description: 'Human Resource Management System for Municipality of Concepcion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
