import '../src/styles/globals.css'
import Providers from './providers'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'VitaCare Clinic — Admin Portal',
  description: 'Cổng vận hành phòng khám VitaCare',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased`}><Providers>{children}</Providers></body>
    </html>
  )
}
