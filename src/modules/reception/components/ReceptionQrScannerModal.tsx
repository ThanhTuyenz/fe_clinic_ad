'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { decodeQrFromImageFile } from '@/modules/admin/utils/imageQrDecoder'
import {
  QrCode,
  CameraOff,
  Zap,
  ZapOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'

interface ReceptionQrScannerModalProps {
  qrOpen: boolean
  setQrOpen: (val: boolean) => void
  qrErr: string
  setQrErr?: (err: string) => void
  qrImageLoading?: boolean
  handleQrFileInput?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onScan?: (decodedText: string) => void
  title?: string
  description?: string
}

type CameraDevice = {
  deviceId: string
  label: string
}

function playScanChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
    osc.start(now)
    osc.stop(now + 0.12)
  } catch {
    /* ignore audio failure */
  }
}

function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([60, 40, 60])
    }
  } catch {
    /* ignore vibration failure */
  }
}

function getZxingScanner(): BrowserMultiFormatReader {
  const hints = new Map()
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
  // Tần suất 120ms: vừa mượt 60fps cho video, vừa giải mã sâu từng khung hình
  return new BrowserMultiFormatReader(hints, 120)
}

export default function ReceptionQrScannerModal({
  qrOpen,
  setQrOpen,
  qrErr,
  setQrErr,
  qrImageLoading = false,
  handleQrFileInput,
  onScan,
  title,
  description,
}: ReceptionQrScannerModalProps) {
  const [cameraLoading, setCameraLoading] = useState(true)
  const [successCode, setSuccessCode] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const [localImageLoading, setLocalImageLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const hasDecodedRef = useRef<boolean>(false)

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch {
        /* ignore */
      }
      codeReaderRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        /* ignore */
      }
      videoRef.current.srcObject = null
    }
    setFlashOn(false)
    setHasFlash(false)
  }, [])

  const handleDecodedText = useCallback(
    (rawText: string) => {
      if (!rawText || hasDecodedRef.current) return
      const cleanText = rawText.trim()
      if (!cleanText) return

      hasDecodedRef.current = true
      playScanChime()
      triggerHaptic()
      setSuccessCode(cleanText)

      setTimeout(() => {
        stopCamera()
        setSuccessCode(null)
        if (onScan) {
          onScan(cleanText)
        }
      }, 400)
    },
    [onScan, stopCamera]
  )

  const startCamera = useCallback(
    async (targetDeviceId?: string) => {
      stopCamera()
      if (setQrErr) setQrErr('')
      setSuccessCode(null)
      setCameraLoading(true)
      hasDecodedRef.current = false

      if (!videoRef.current) return

      try {
        const video = videoRef.current
        const reader = getZxingScanner()
        codeReaderRef.current = reader

        // 1. Quét danh sách các camera
        try {
          const videoInputDevices = await reader.listVideoInputDevices()
          if (videoInputDevices && videoInputDevices.length > 0) {
            setCameras(
              videoInputDevices.map((d, index) => ({
                deviceId: d.deviceId,
                label: d.label || `Camera ${index + 1}`,
              }))
            )
          }
        } catch {
          /* ignore */
        }

        // 2. Thiết lập cấu hình camera (Full HD 1080p, ưu tiên camera sau nếu có)
        const constraints: MediaStreamConstraints = {
          video: targetDeviceId
            ? {
                deviceId: { exact: targetDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
          audio: false,
        }

        // 3. Khởi chạy luồng quét liên tục của ZXing
        await reader.decodeFromConstraints(constraints, video, (result) => {
          if (result && !hasDecodedRef.current) {
            handleDecodedText(result.getText())
          }
        })

        // 4. Kiểm tra hỗ trợ đèn Flash (Torch)
        try {
          const stream = video.srcObject as MediaStream | null
          const track = stream?.getVideoTracks()[0]
          if (track) {
            const caps = (track.getCapabilities?.() || {}) as { torch?: boolean }
            setHasFlash(Boolean(caps.torch))
          }
        } catch {
          setHasFlash(false)
        }

        setCameraLoading(false)
      } catch (err: unknown) {
        setCameraLoading(false)
        const isHttpInsecure =
          typeof window !== 'undefined' &&
          !window.isSecureContext &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1'

        if (isHttpInsecure) {
          if (setQrErr) {
            setQrErr('Trình duyệt chặn mở camera qua HTTP (cần HTTPS). Bạn có thể dùng nút Tải ảnh bên dưới.')
          }
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Không thể kết nối máy ảnh'
          if (setQrErr) {
            setQrErr(`Lỗi camera: ${errorMsg}. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc dùng tính năng tải ảnh.`)
          }
        }
      }
    },
    [handleDecodedText, setQrErr, stopCamera]
  )

  // Quản lý vòng đời camera
  useEffect(() => {
    if (qrOpen) {
      const timer = setTimeout(() => {
        void startCamera()
      }, 150)
      return () => {
        clearTimeout(timer)
        stopCamera()
      }
    } else {
      stopCamera()
      setSuccessCode(null)
    }
  }, [qrOpen, startCamera, stopCamera])

  // Chuyển đổi camera
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return
    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)
    const nextDevice = cameras[nextIndex]
    if (nextDevice?.deviceId) {
      await startCamera(nextDevice.deviceId)
    }
  }

  // Bật/tắt đèn Flash
  const handleToggleFlash = async () => {
    if (!hasFlash || !videoRef.current) return
    try {
      const stream = videoRef.current.srcObject as MediaStream | null
      const track = stream?.getVideoTracks()[0]
      if (track) {
        const nextFlash = !flashOn
        await track.applyConstraints({
          advanced: [{ torch: nextFlash } as any],
        })
        setFlashOn(nextFlash)
      }
    } catch {
      /* ignore */
    }
  }

  // Tải file ảnh xử lý trực tiếp bằng decodeQrFromImageFile
  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleQrFileInput) {
      handleQrFileInput(e)
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    setLocalImageLoading(true)
    if (setQrErr) setQrErr('')

    try {
      const decodedText = await decodeQrFromImageFile(file)
      handleDecodedText(decodedText)
    } catch (err: any) {
      if (setQrErr) {
        setQrErr(err?.message || 'Không tìm thấy mã QR trong ảnh tải lên.')
      }
    } finally {
      setLocalImageLoading(false)
      e.target.value = ''
    }
  }

  if (!qrOpen) return null

  const isImageBusy = qrImageLoading || localImageLoading

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="presentation"
      onClick={() => setQrOpen(false)}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-100 space-y-4"
        role="dialog"
        aria-labelledby="tcl-qr-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header giống web client */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 id="tcl-qr-title" className="text-sm sm:text-base font-bold text-slate-900">
                {title || 'Quét mã QR phiếu khám / CCCD'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {description || 'Tự động tra cứu hồ sơ tiếp đón bệnh nhân'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Đóng"
            onClick={() => setQrOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông báo lỗi */}
        {qrErr ? (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{qrErr}</div>
          </div>
        ) : null}

        {/* Khung máy ảnh viewfinder (tỷ lệ & kích thước đồng bộ web client) */}
        <div className="relative w-full h-[320px] sm:h-[360px] bg-slate-950 rounded overflow-hidden flex items-center justify-center shadow-inner">
          {/* Luồng video trực tiếp */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Trạng thái khởi động camera */}
          {cameraLoading && !qrErr && (
            <div className="absolute inset-0 z-10 bg-slate-950/80 flex flex-col items-center justify-center text-slate-300 text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Đang khởi động camera…</span>
            </div>
          )}

          {/* Overlay thành công */}
          {successCode && (
            <div className="absolute inset-0 z-30 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2.5 p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-emerald-200">Đã nhận diện thành công!</p>
              <p className="text-xs text-white font-medium max-w-xs truncate">{successCode}</p>
            </div>
          )}

          {/* Khung định vị và tia laser quét chuẩn web client */}
          {!qrErr && !cameraLoading && !successCode && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-6">
              <div className="relative w-52 h-52 sm:w-56 sm:h-56 rounded overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br" />
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
          )}

          {/* Nút đèn Flash & Chuyển camera chuẩn web client */}
          {!qrErr && !cameraLoading && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {hasFlash && (
                <button
                  type="button"
                  onClick={handleToggleFlash}
                  className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md ${
                    flashOn
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                      : 'bg-slate-900/70 text-white hover:bg-slate-900'
                  }`}
                  title={flashOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}
                >
                  {flashOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 backdrop-blur-md transition-all cursor-pointer shadow-md"
                  title="Đổi camera"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>
          )}

          {/* Fallback khi không truy cập được camera */}
          {qrErr && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs gap-3 p-6 text-center z-10">
              <CameraOff className="w-8 h-8 text-slate-500" />
              <p className="max-w-xs text-slate-300">
                Không thể mở camera trực tiếp.
              </p>
              <p className="text-[11px] text-slate-400">
                Bạn có thể nhấn nút &ldquo;Tải ảnh mã QR&rdquo; bên dưới để nhận diện qua ảnh chụp.
              </p>
            </div>
          )}
        </div>

        {/* Hướng dẫn ngắn */}
        <p className="text-[11px] text-center text-slate-500">
          Mẹo: Căn chỉnh mã QR trên phiếu khám hoặc CCCD vào giữa khung ngắm.
        </p>

        {/* Footer controls */}
        <div className="flex items-center gap-3 pt-1">
          <label
            className={`flex-1 py-2 px-3.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs transition-all ${
              isImageBusy ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {isImageBusy ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>{isImageBusy ? 'Đang giải mã ảnh…' : 'Tải ảnh mã QR'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isImageBusy}
              onChange={handleLocalFileChange}
            />
          </label>
          <button
            type="button"
            className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-all cursor-pointer"
            onClick={() => setQrOpen(false)}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
