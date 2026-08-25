'use client'

import React from 'react'
import { QR_READER_ELEMENT_ID } from './receptionHelpers'

interface ReceptionQrScannerModalProps {
  qrOpen: boolean
  setQrOpen: (val: boolean) => void
  qrErr: string
  qrImageLoading: boolean
  handleQrFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ReceptionQrScannerModal({
  qrOpen,
  setQrOpen,
  qrErr,
  qrImageLoading,
  handleQrFileInput,
}: ReceptionQrScannerModalProps) {
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
            Quét mã QR lịch hẹn
          </h2>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Đóng"
            onClick={() => setQrOpen(false)}
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Hướng camera vào mã QR trên phiếu khám / điện thoại bệnh nhân, hoặc tải ảnh mã QR bên dưới.
        </p>

        {qrErr ? (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {qrErr}
          </div>
        ) : null}

        <div className="w-full bg-slate-900 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center">
          <div id={QR_READER_ELEMENT_ID} className="w-full" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs transition-all ${
              qrImageLoading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <span>{qrImageLoading ? 'Đang đọc ảnh…' : '📁 Tải ảnh mã QR'}</span>
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
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            onClick={() => setQrOpen(false)}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
