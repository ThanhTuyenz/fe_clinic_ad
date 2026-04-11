import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import DoctorHome from './pages/DoctorHome.jsx'
import ReceptionHome from './pages/ReceptionHome.jsx'
import RegistrationHome from './pages/RegistrationHome.jsx'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function hasSession() {
  try {
    return Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'))
  } catch {
    return false
  }
}

function sessionUser() {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
    return safeParse(raw || 'null')
  } catch {
    return null
  }
}

function RootRedirect() {
  if (!hasSession()) {
    return <Navigate to="/login" replace />
  }
  const u = sessionUser()
  if (u?.userType === 'receptionist') {
    return <Navigate to="/reception" replace />
  }
  return <Navigate to="/doctor" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reception" element={<ReceptionHome />} />
        <Route path="/registration" element={<RegistrationHome />} />
        <Route path="/doctor" element={<DoctorHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
