'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '@/common/hooks/useAuth'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import RoleSidebar from '../components/RoleSidebar'
import { staffRole } from '../utils/staffSession'
import { completeClinicalOrderMock, listClinicalQueue, listClinicalRooms, receiveClinicalQr } from '../services/clinicalQueue'

const READER_ID = 'clinical-order-qr-reader'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

export default function ClinicalQueuePage() {
  const { user } = useAuth()
  const { performLogout } = useStaffLogout()
  const role = staffRole(user)
  const sidebarRole = role === 'doctor' ? 'doctor' : 'receptionist'
  const sidebarActive = role === 'doctor' ? 'laboratory' : 'clinical'
  const [view, setView] = useState('waiting')
  const [rooms, setRooms] = useState([]), [roomId, setRoomId] = useState(''), [items, setItems] = useState([])
  const [payload, setPayload] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState('')
  const [scanning, setScanning] = useState(false), [busy, setBusy] = useState('')
  const processing = useRef(false)
  const refresh = async (id = roomId, status = view) => { if (!id) return setItems([]); const data = await listClinicalQueue({ roomId: id, date: today(), status }); setItems(data?.items || []) }
  useEffect(() => { void listClinicalRooms().then((data) => { const rows = data?.items || []; setRooms(rows); if (rows[0]) setRoomId(rows[0].id) }).catch((e) => setError(e.message)) }, [])
  useEffect(() => { void refresh() }, [roomId])
  useEffect(() => { void refresh(roomId, view) }, [view])
  useEffect(() => {
    if (!scanning) return
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    void scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 260 } }, async (text) => {
      if (processing.current || !text.startsWith('VITACARE_CLINICAL_ORDER:')) return
      processing.current = true; setPayload(text); await scanner.stop().catch(() => {}); setScanning(false); processing.current = false
    }, () => {}).catch((e) => setError(e?.message || 'Không mở được camera'))
    return () => { try { void scanner.stop().catch(() => {}) } catch {} }
  }, [scanning])
  const receive = async () => { if (!payload.trim()) return; setBusy('receive'); setError(''); try { const data = await receiveClinicalQr({ qrPayload: payload.trim() }); const tickets = data?.tickets || []; const summary = tickets.map((ticket) => `${ticket.room?.code || ticket.room?.name}: STT ${ticket.queueNumber}`).join(' · '); setMessage(`Đã tiếp nhận ${data.patient?.fullName || 'bệnh nhân'}${summary ? ` · ${summary}` : ''}`); setPayload(''); if (tickets[0]?.room?.id) setRoomId(tickets[0].room.id); await refresh(tickets[0]?.room?.id || roomId) } catch (e) { setError(e?.message || 'Không tiếp nhận được') } finally { setBusy('') } }
  const complete = async (id) => { setBusy(id); try { await completeClinicalOrderMock(id); await refresh(); setMessage('Đã hoàn thành và gửi kết quả về bác sĩ.') } catch (e) { setError(e?.message || 'Không hoàn thành được') } finally { setBusy('') } }
  const grouped = items.reduce((map, item) => { const key = `${item.medicalVisitId}:${item.queueNumber}`; if (!map[key]) map[key] = { queueNumber: item.queueNumber, patient: item.patient, orders: [] }; map[key].orders.push(item); return map }, {})
  return <div className="tcl-shell">
    <RoleSidebar role={sidebarRole} active={sidebarActive} user={user} onLogout={performLogout} />
    <main className="min-h-screen bg-[#f3faef] p-6 text-slate-900"><div className="mx-auto max-w-6xl"><header className="mb-6"><h1 className="text-3xl font-black">Hàng đợi cận lâm sàng</h1><p className="mt-1 text-sm text-slate-500">Quét QR phiếu chỉ định, cấp số theo phòng và xử lý kết quả.</p></header>
    <section className="grid gap-5 lg:grid-cols-[360px_1fr]"><aside className="h-fit border border-emerald-100 bg-white p-5"><p className="text-sm font-bold">Tiếp nhận phiếu</p><p className="mt-1 text-xs leading-5 text-slate-500">Hệ thống tự xác định các phòng từ chỉ định và cấp số cho từng phòng.</p><button className="mt-4 w-full bg-emerald-700 p-3 font-bold text-white" onClick={() => setScanning((v) => !v)}>{scanning ? 'Đóng camera' : 'Quét QR phiếu chỉ định'}</button>{scanning ? <div id={READER_ID} className="mt-3 min-h-72 bg-black"/> : null}<textarea className="mt-3 w-full border border-slate-300 p-3 text-xs" rows={3} value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Hoặc dán nội dung QR tại đây"/><button disabled={!payload.trim() || busy === 'receive'} className="mt-2 w-full bg-slate-900 p-3 font-bold text-white disabled:opacity-40" onClick={() => void receive()}>{busy === 'receive' ? 'Đang tiếp nhận…' : 'Tiếp nhận & cấp số'}</button>{message ? <p className="mt-3 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}{error ? <p className="mt-3 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}</aside>
    <div><div className="mb-4 border border-emerald-100 bg-white p-4"><label className="block text-sm font-bold">Phòng đang xem<select className="mt-2 w-full border border-slate-300 bg-white p-3" value={roomId} onChange={(e) => setRoomId(e.target.value)}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.branch?.name} · {r.code} · {r.name}</option>)}</select></label></div><div className="mb-4 flex gap-2 border-b border-emerald-100"><button className={`px-5 py-3 font-bold ${view === 'waiting' ? 'border-b-2 border-emerald-700 text-emerald-800' : 'text-slate-500'}`} onClick={() => setView('waiting')}>Đang chờ</button><button className={`px-5 py-3 font-bold ${view === 'completed' ? 'border-b-2 border-emerald-700 text-emerald-800' : 'text-slate-500'}`} onClick={() => setView('completed')}>Đã thực hiện</button></div><div className="space-y-4">{Object.values(grouped).length === 0 ? <div className="border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{view === 'completed' ? 'Chưa có bệnh nhân hoàn thành tại phòng này hôm nay.' : 'Chưa có bệnh nhân trong hàng đợi phòng này hôm nay.'}</div> : Object.values(grouped).map((ticket) => <article key={`${ticket.queueNumber}-${ticket.patient?.id}`} className="border border-slate-200 bg-white"><header className="flex items-center justify-between bg-emerald-50 p-4"><div><span className="text-xs font-bold uppercase text-emerald-700">Số thứ tự</span><strong className="ml-3 text-3xl text-emerald-800">{ticket.queueNumber}</strong></div><b>{ticket.patient?.fullName}</b></header><div className="divide-y divide-slate-100">{ticket.orders.map((order) => <div key={order.id} className="flex items-center justify-between gap-4 p-4"><div><b>{order.serviceName}</b><p className="text-xs text-slate-500">{order.status === 'COMPLETED' ? `Hoàn thành ${order.completedAt ? new Date(order.completedAt).toLocaleString('vi-VN') : ''}` : 'Đang chờ thực hiện'}</p></div>{order.status !== 'COMPLETED' ? <button disabled={busy === order.id} className="bg-emerald-700 px-4 py-2 text-sm font-bold text-white" onClick={() => void complete(order.id)}>{busy === order.id ? 'Đang xử lý…' : 'Mô phỏng kết quả'}</button> : <span className="font-bold text-emerald-700">✓ Đã gửi kết quả</span>}</div>)}</div></article>)}</div></div></section></div></main>
  </div>
}
