import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HomeComing',
  description: 'A considered collection for everyday living.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}