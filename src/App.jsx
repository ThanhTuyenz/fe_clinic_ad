import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorHome from './pages/DoctorHome.jsx'
import ReceptionHome from './pages/ReceptionHome.jsx'
import RegistrationHome from './pages/RegistrationHome.jsx'
import { getStaffSession } from './utils/staffSession.js'

function hasSession() {
  return Boolean(getStaffSession().token)
}

function RootRedirect() {
  if (!hasSession()) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reception" element={<ReceptionHome />} />
        <Route path="/registration" element={<RegistrationHome />} />
        <Route path="/doctor" element={<DoctorHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
