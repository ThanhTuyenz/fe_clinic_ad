'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { kioskCheckInByQr, type CheckInResult } from '../services/checkIn'

const READER_ID = 'clinic-kiosk-qr-reader'

export default function KioskCheckIn() {
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState(true)
  const processing = useRef(false)

  useEffect(() => {
    if (!active) return
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    let disposed = false
    const onScan = async (payload: string) => {
      if (processing.current || !payload.startsWith('VITACARE_CHECKIN:')) return
      processing.current = true
      try {
        const checkedIn = await kioskCheckInByQr(payload)
        if (!disposed) { setResult(checkedIn); setError(''); setActive(false) }
      } catch (scanError) {
        if (!disposed) setError(scanError instanceof Error ? scanError.message : 'Mã QR không hợp lệ.')
        processing.current = false
      }
    }
    void scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 280, height: 280 } }, onScan, () => {}).catch((scanError) => setError(scanError?.message || 'Không mở được camera.'))
    return () => { disposed = true; try { void scanner.stop().catch(() => {}) } catch { /* ignore */ } }
  }, [active])

  const reset = () => { processing.current = false; setResult(null); setError(''); setActive(true) }
  return <main className="min-h-screen bg-[#f3faef] p-6 text-slate-900 sm:p-10"><section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-10"><header className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-2xl font-black text-white">M</div><h1 className="mt-4 text-3xl font-black">Check-in khám bệnh</h1><p className="mt-2 text-slate-500">Đưa mã QR lịch hẹn vào khung hình</p></header>{result ? <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center"><div className="text-5xl text-emerald-600">✓</div><h2 className="mt-3 text-2xl font-black text-emerald-800">Check-in thành công</h2><p className="mt-5 text-sm text-slate-500">Số thứ tự của bạn</p><p className="text-6xl font-black text-emerald-700">{result.queueNumber}</p><div className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl bg-white p-4 text-left text-sm"><p><b>Bệnh nhân:</b> {result.patient?.fullName || '—'}</p><p><b>Phòng:</b> {result.room?.code} · {result.room?.name}</p><p><b>Bác sĩ:</b> {result.doctor?.fullName || '—'}</p></div><button onClick={reset} className="mt-7 rounded-xl bg-emerald-600 px-7 py-3 font-bold text-white">Check-in người tiếp theo</button></div> : <><div id={READER_ID} className="mx-auto mt-8 min-h-[360px] max-w-lg overflow-hidden rounded-2xl bg-slate-950" />{error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">{error}</p> : null}</>}</section></main>
}
