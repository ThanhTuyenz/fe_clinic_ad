import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import DoctorHome from './pages/DoctorHome.jsx'
import ReceptionHome from './pages/ReceptionHome.jsx'
import RegistrationHome from './pages/RegistrationHome.jsx'
import { getStaffSession } from './utils/staffSession.js'

function hasSession() {
  return Boolean(getStaffSession().token)
}

function sessionUser() {
  return getStaffSession().user
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
