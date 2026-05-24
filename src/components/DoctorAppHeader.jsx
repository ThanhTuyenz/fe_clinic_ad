import { useNavigate } from 'react-router-dom'

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || user?.fullName || '').trim() || user?.email || 'Bác sĩ'
}

/**
 * Thanh điều hướng bác sĩ — dùng chung Khám bệnh / Thống kê.
 * @param {'exam'|'stats'} activeTab
 */
export default function DoctorAppHeader({ activeTab = 'exam', user, onLogout, examBadge = 0, onExamNavigate }) {
  const navigate = useNavigate()
  const goExam = onExamNavigate ?? (() => navigate('/doctor'))

  return (
    <header className="dr-topbar">
      <div className="dr-brand" role="banner" aria-label="VitaCare Clinic">
        <span className="dr-brand-mark" aria-hidden="true">
          +
        </span>
        <span className="dr-brand-text">VitaCare Clinic</span>
      </div>

      <nav className="dr-topnav" aria-label="Điều hướng phân hệ">
        <button
          type="button"
          className={`dr-topnav-item${activeTab === 'exam' ? ' is-active' : ''}${
            examBadge > 0 ? ' dash-btn-with-badge' : ''
          }`}
          onClick={activeTab === 'exam' ? undefined : goExam}
        >
          Khám bệnh
          {examBadge > 0 ? (
            <span className="dash-nav-badge" aria-label={`${examBadge} ca chờ khám`}>
              {examBadge > 99 ? '99+' : examBadge}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={`dr-topnav-item${activeTab === 'stats' ? ' is-active' : ''}`}
          onClick={activeTab === 'stats' ? undefined : () => navigate('/dashboard')}
        >
          Thống kê
        </button>
      </nav>

      <div className="dr-topbar-right">
        <span className="dr-user-name">{displayName(user)}</span>
        <button type="button" className="dr-btn dr-btn--ghost dr-logout" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
