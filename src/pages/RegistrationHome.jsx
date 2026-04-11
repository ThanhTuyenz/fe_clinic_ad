import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/reception-home.css'
import '../styles/registration-home.css'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getSession() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user')
  const user = safeParse(userRaw || 'null')
  return { token, user }
}

function displayName(user) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || '').trim() || user?.email || 'Nhân viên'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDateVi(isoOrDate) {
  if (!isoOrDate) return ''
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function formatDateTimeNow() {
  const d = new Date()
  return `${formatDateVi(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const ROOMS = [
  { value: 'noi_tong_quat', label: 'Phòng nội tổng quát' },
  { value: 'ngoai', label: 'Phòng ngoại' },
  { value: 'nhi', label: 'Phòng nhi' },
  { value: 'san', label: 'Phòng sản' },
]

export default function RegistrationHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, user } = getSession()
  const payload = location.state

  const [symptom, setSymptom] = useState(() => String(location.state?.note || '').trim())
  const [regNote, setRegNote] = useState('')
  const [room, setRoom] = useState(ROOMS[0].value)
  const [priority, setPriority] = useState(false)
  const [seq, setSeq] = useState(() => String(Math.floor(Math.random() * 20) + 1))
  const [saveMsg, setSaveMsg] = useState('')
  const [maKcb, setMaKcb] = useState('')
  const [todayIso] = useState(() => ymd(new Date()))
  const [registeredAt] = useState(() => formatDateTimeNow())
  /** null = chưa lưu lần nào; sau mỗi lưu thành công lưu snapshot để so sánh */
  const [lastSaved, setLastSaved] = useState(null)

  const p = payload?.patient
  const hasPayload = Boolean(p && payload?.ticket)

  const hasUnsavedChanges = useMemo(() => {
    if (lastSaved === null) return true
    return (
      symptom !== lastSaved.symptom ||
      regNote !== lastSaved.regNote ||
      room !== lastSaved.room ||
      priority !== lastSaved.priority ||
      seq !== lastSaved.seq
    )
  }, [lastSaved, symptom, regNote, room, priority, seq])

  const patientDisplay = useMemo(() => {
    if (!p) return null
    return {
      patientCode: p.patientCode || '—',
      displayName: p.displayName || [p.lastName, p.firstName].filter(Boolean).join(' ').trim() || '—',
      dobLabel: p.dob ? formatDateVi(p.dob) : '—',
      age: p.age != null && p.age !== '' ? String(p.age) : '—',
      phone: p.phone || '—',
      gender: p.gender || '—',
      address: p.address || '—',
      email: p.email || '',
    }
  }, [p])

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (user.userType !== 'receptionist') {
      navigate('/doctor', { replace: true })
    }
  }, [token, user, navigate])

  if (!token || !user || user.userType !== 'receptionist') {
    return null
  }

  function handleSave() {
    if (!hasUnsavedChanges) return
    const stamp = `REG-${Date.now().toString(36).toUpperCase()}`
    setMaKcb(stamp)
    setSaveMsg(`Đã lưu nháp đăng ký (demo). Mã KCB: ${stamp}`)
    setLastSaved({
      symptom,
      regNote,
      room,
      priority,
      seq,
    })
  }

  if (!hasPayload) {
    return (
      <div className="tcl-shell">
        <header className="tcl-top">
          <button
            type="button"
            className="tcl-brand"
            onClick={() => navigate('/reception')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            VITACARE
          </button>
          <nav className="tcl-nav" aria-label="Module">
            <button type="button" onClick={() => navigate('/reception')}>
              Lịch hẹn
            </button>
            <button type="button" className="is-active">
              Đăng ký
            </button>
            <button type="button" disabled>
              Khám bệnh
            </button>
            <button type="button" disabled>
              Báo cáo
            </button>
          </nav>
          <div className="tcl-top-user">
            <span>{displayName(user)}</span>
            <button
              type="button"
              className="tcl-btn"
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                sessionStorage.removeItem('token')
                sessionStorage.removeItem('user')
                navigate('/login', { replace: true })
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            Chưa có thông tin đăng ký. Vào <strong>Lịch hẹn</strong>, chọn một lịch khám và bấm <strong>Tạo đăng ký</strong> để
            mở phiếu đăng ký khám.
          </p>
          <button type="button" className="tcl-btn tcl-btn--pri" style={{ marginTop: '1rem' }} onClick={() => navigate('/reception')}>
            Đi tới Lịch hẹn
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tcl-shell">
      <header className="tcl-top">
        <button
          type="button"
          className="tcl-brand"
          onClick={() => navigate('/reception')}
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
        >
          VITACARE
        </button>
        <nav className="tcl-nav" aria-label="Module">
          <button type="button" onClick={() => navigate('/reception')}>
            Lịch hẹn
          </button>
          <button type="button" className="is-active">
            Đăng ký
          </button>
          <button type="button" disabled>
            Khám bệnh
          </button>
          <button type="button" disabled>
            Báo cáo
          </button>
        </nav>
        <div className="tcl-top-user">
          <span>{displayName(user)}</span>
          <button
            type="button"
            className="tcl-btn"
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              sessionStorage.removeItem('token')
              sessionStorage.removeItem('user')
              navigate('/login', { replace: true })
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="tcl-page">
        <div className="tcl-bar">
          <h1>Đăng ký khám</h1>
          <div className="tcl-bar-actions">
            <button type="button" className="tcl-btn tcl-btn--pri" onClick={() => navigate('/reception')}>
              + Thêm
            </button>
            <button
              type="button"
              className="tcl-btn tcl-btn--pri"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              title={!hasUnsavedChanges ? 'Không có thay đổi so với bản đã lưu' : undefined}
            >
              Lưu
            </button>
            <button type="button" className="tcl-btn tcl-btn--danger" disabled title="Chưa hỗ trợ">
              Xóa
            </button>
          </div>
        </div>

        <div className="tcl-split">
          <aside className="tcl-sidebar">
            <div className="tcl-filters">
              <div className="tcl-filters-row">
                <div>
                  <label>Trạng thái</label>
                  <select defaultValue="all">
                    <option value="all">Tất cả</option>
                  </select>
                </div>
                <div>
                  <label>Mã KCB</label>
                  <input readOnly value={maKcb} placeholder="—" />
                </div>
              </div>
              <div className="tcl-filters-row">
                <div>
                  <label>Từ ngày</label>
                  <input type="date" readOnly value={todayIso} />
                </div>
                <div>
                  <label>Đến ngày</label>
                  <input type="date" readOnly value={todayIso} />
                </div>
              </div>
              <div className="tcl-filters-row">
                <div>
                  <label>Mã BN</label>
                  <input readOnly value={patientDisplay?.patientCode || ''} />
                </div>
                <div>
                  <label>Họ tên</label>
                  <input readOnly value={patientDisplay?.displayName || ''} />
                </div>
              </div>
            </div>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead>
                  <tr>
                    <th>TT</th>
                    <th>STT</th>
                    <th>Mã KCB</th>
                    <th>Mã BN</th>
                    <th>Tên BN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="is-selected">
                    <td>
                      <span className="tcl-stt-dot tcl-stt-dot--pending" />
                    </td>
                    <td>{seq}</td>
                    <td>{maKcb || '—'}</td>
                    <td>{patientDisplay?.patientCode}</td>
                    <td>{patientDisplay?.displayName}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tcl-pager">
              <span>1–1 của 1</span>
              <span />
            </div>
          </aside>

          <main className="tcl-detail">
            <div className="reg-tabs">
              <button type="button" className="reg-tab is-active">
                Thông tin đăng ký
              </button>
              <button type="button" className="reg-tab" disabled>
                Thông tin phòng khám
              </button>
            </div>

            <div className="reg-inner-banner">Bạn đang thêm mới thông tin đăng ký khám</div>
            {saveMsg ? <div className="tcl-banner-ok" style={{ margin: '0.65rem 0.75rem 0' }}>{saveMsg}</div> : null}

            <section className="tcl-sec">
              <h2 className="tcl-sec-title">
                <span>1</span>
                Thông tin người đăng ký
              </h2>
              <div className="tcl-grid-form">
                <div className="tcl-f">
                  <label>Mã bệnh nhân</label>
                  <input readOnly value={patientDisplay?.patientCode || ''} title="Mã BN theo lịch hẹn, không chỉnh sửa" />
                </div>
                <div className="tcl-f">
                  <label>Họ tên *</label>
                  <input readOnly value={patientDisplay?.displayName || ''} />
                </div>
                <div className="tcl-f">
                  <label>Ngày sinh *</label>
                  <input readOnly value={patientDisplay?.dobLabel || ''} />
                </div>
                <div className="tcl-f">
                  <label>Độ tuổi</label>
                  <input readOnly value={patientDisplay?.age || ''} />
                </div>
                <div className="tcl-f">
                  <label>Điện thoại *</label>
                  <input readOnly value={patientDisplay?.phone || ''} />
                </div>
                <div className="tcl-f">
                  <label>Giới tính</label>
                  <input readOnly value={patientDisplay?.gender || ''} />
                </div>
                <div className="tcl-f">
                  <label>Mã lịch hẹn</label>
                  <input readOnly value={payload.ticket || ''} />
                </div>
                <div className="tcl-f">
                  <label>Tài khoản (email)</label>
                  <input readOnly value={patientDisplay?.email || ''} placeholder="—" />
                </div>
                <div className="tcl-f tcl-f--full">
                  <label>Địa chỉ</label>
                  <input readOnly value={patientDisplay?.address || ''} />
                </div>
              </div>
            </section>

            <section className="tcl-sec">
              <h2 className="tcl-sec-title">
                <span>2</span>
                Thông tin đăng ký
              </h2>
              <div className="tcl-grid-form">
                <div className="tcl-f">
                  <label>Mã KCB</label>
                  <input readOnly value={maKcb || ''} placeholder="Lưu để sinh mã" />
                </div>
                <div className="tcl-f">
                  <label>Số thứ tự</label>
                  <input value={seq} onChange={(e) => setSeq(e.target.value)} />
                </div>
                <div className="tcl-f">
                  <label>Phòng khám</label>
                  <select value={room} onChange={(e) => setRoom(e.target.value)}>
                    {ROOMS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tcl-f">
                  <label>Ngày đăng ký</label>
                  <input readOnly value={registeredAt} />
                </div>
                <div className="tcl-f tcl-f--full">
                  <label>
                    <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} /> Ưu tiên
                  </label>
                </div>
                <div className="tcl-f tcl-f--full">
                  <label>Triệu chứng</label>
                  <textarea rows={2} value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="VD: Đau bụng" />
                </div>
                <div className="tcl-f tcl-f--full">
                  <label>Ghi chú</label>
                  <textarea rows={2} value={regNote} onChange={(e) => setRegNote(e.target.value)} placeholder="Ghi chú thêm" />
                </div>
              </div>
            </section>

            <section className="tcl-sec">
              <h2 className="tcl-sec-title">
                <span>3</span>
                Thông tin lịch sử khám
              </h2>
              <div className="reg-history-wrap">
                <table className="reg-history-table">
                  <thead>
                    <tr>
                      <th>Trạng thái</th>
                      <th>Mã KCB</th>
                      <th>Ngày đăng ký</th>
                      <th>Phòng khám</th>
                      <th>Chuyên khoa</th>
                    </tr>
                  </thead>
                </table>
                <div className="reg-history-empty">Chưa có lịch sử (kết nối API sau)</div>
              </div>
            </section>

            <div style={{ padding: '0 0.75rem 1rem' }}>
              <button type="button" className="tcl-btn" onClick={() => navigate('/reception')}>
                ← Quay lại Lịch hẹn
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
