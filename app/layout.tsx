import '../src/styles/globals.css'
import '../src/modules/admin/styles/auth.css'
import '../src/modules/admin/styles/doctor-home.css'
import '../src/modules/admin/styles/reception-home.css'
import '../src/modules/admin/styles/registration-home.css'
import '../src/modules/admin/styles/dashboard.css'
import Providers from './providers'

export const metadata = {
  title: 'MediLink Global — Admin Portal',
  description: 'Cổng vận hành phòng khám MediLink Global',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
