'use client'

import React, { useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QR_READER_ELEMENT_ID } from './receptionHelpers'

import { PhotoIcon } from './ReceptionIcons'

interface ReceptionQrScannerModalProps {
  qrOpen: boolean
  setQrOpen: (val: boolean) => void
  qrErr: string
  setQrErr?: (err: string) => void
  qrImageLoading: boolean
  handleQrFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onScan?: (decodedText: string) => void
  title?: string
  description?: string
}

export default function ReceptionQrScannerModal({
  qrOpen,
  setQrOpen,
  qrErr,
  setQrErr,
  qrImageLoading,
  handleQrFileInput,
  onScan,
  title,
  description,
}: ReceptionQrScannerModalProps) {
  useEffect(() => {
    if (!qrOpen) return
    let disposed = false
    const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID, { verbose: false })
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!disposed && onScan) {
            onScan(decodedText)
          }
        },
        () => {}
      )
      .catch((err) => {
        if (!disposed && setQrErr) {
          setQrErr(err?.message || 'Không thể mở camera. Vui lòng kiểm tra quyền camera hoặc tải ảnh mã QR.')
        }
      })

    return () => {
      disposed = true
      try {
        void scanner.stop().catch(() => {})
      } catch {
        /* ignore */
      }
    }
  }, [qrOpen, onScan, setQrErr])

  if (!qrOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="presentation"
      onClick={() => setQrOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4"
        role="dialog"
        aria-labelledby="tcl-qr-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 id="tcl-qr-title" className="text-base font-bold text-slate-900">
            {title || 'Quét mã QR lịch hẹn'}
          </h2>
          <button
            type="button"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Đóng"
            onClick={() => setQrOpen(false)}
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {description || 'Hướng camera vào mã QR trên phiếu khám / điện thoại bệnh nhân, hoặc tải ảnh mã QR bên dưới.'}
        </p>

        {qrErr ? (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
            {qrErr}
          </div>
        ) : null}

        <div className="w-full bg-slate-900 rounded overflow-hidden min-h-[260px] flex items-center justify-center">
          <div id={QR_READER_ELEMENT_ID} className="w-full" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label
            className={`flex-1 py-2.5 px-4 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs transition-all ${
              qrImageLoading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <PhotoIcon className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{qrImageLoading ? 'Đang đọc ảnh…' : 'Tải ảnh mã QR'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={qrImageLoading}
              onChange={handleQrFileInput}
            />
          </label>
          <button
            type="button"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-all cursor-pointer"
            onClick={() => setQrOpen(false)}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
