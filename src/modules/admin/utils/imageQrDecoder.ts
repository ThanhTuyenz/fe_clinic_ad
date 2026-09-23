'use client'

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'

// 1. Thử giải mã bằng Web API gốc BarcodeDetector (Chrome/Edge/Android hỗ trợ cực tốt)
async function decodeWithNativeBarcodeDetector(img: HTMLImageElement): Promise<string | null> {
  const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window

  if (hasBarcodeDetector) {
    try {
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: any }).BarcodeDetector
      const formats: string[] = await BarcodeDetectorClass.getSupportedFormats()
      if (formats.includes('qr_code')) {
        const barcodeDetector = new BarcodeDetectorClass({
          formats: ['qr_code'],
        })
        const barcodes = await barcodeDetector.detect(img)
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          return barcodes[0].rawValue.trim()
        }
      }
    } catch {
      // Bỏ qua nếu lỗi
    }
  }
  return null
}

// 2. Chuyển File sang Image
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 100)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

function getZxingReader(): BrowserMultiFormatReader {
  const hints = new Map()
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
  return new BrowserMultiFormatReader(hints)
}

// 3. Hàm Export chính giải mã ảnh QR
export async function decodeQrFromImageFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file)

  // Cách 1: Quét bằng Native BarcodeDetector trước
  const nativeResult = await decodeWithNativeBarcodeDetector(img)
  if (nativeResult) {
    return nativeResult
  }

  // Cách 2: Dùng ZXing MultiFormatReader (chuyên trị ảnh mờ, chói sáng, góc nghiêng)
  try {
    const codeReader = getZxingReader()
    const result = await codeReader.decodeFromImageElement(img)
    if (result && result.getText()) {
      return result.getText().trim()
    }
  } catch {
    /* ignore and try canvas */
  }

  // Cách 3: Fallback tăng tương phản qua Canvas (xử lý nền bảo an/chói)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height

    ctx.drawImage(img, 0, 0)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imgData.data
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const val = avg > 125 ? 255 : 0
      d[i] = val
      d[i + 1] = val
      d[i + 2] = val
    }
    ctx.putImageData(imgData, 0, 0)

    const codeReader = getZxingReader()
    const canvasDataUrl = canvas.toDataURL('image/png')
    const canvasResult = await codeReader.decodeFromImageUrl(canvasDataUrl)
    if (canvasResult && canvasResult.getText()) {
      return canvasResult.getText().trim()
    }
  } catch {
    /* ignore */
  }

  throw new Error('Không tìm thấy mã QR trong ảnh. Vui lòng thử lại với ảnh rõ nét hơn.')
}
