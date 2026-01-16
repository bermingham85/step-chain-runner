import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Step-Chain Runner',
  description: 'A step-by-step problem solver',
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
