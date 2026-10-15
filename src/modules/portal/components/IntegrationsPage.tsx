'use client'

import { useCallback, useEffect, useState } from 'react'
import { BellRing, CheckCircle2, CreditCard, KeyRound, LoaderCircle, Mail, MessageSquare, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { apiClient, apiErrorMessage, unwrapApiData } from '@/lib/api-client'
import { AdminButton, AdminPageHeader } from '@/common/components/ui'

type Integration = {
  id: string; name: string; category: 'payment' | 'email' | 'sms' | 'push'
  status: 'configured' | 'incomplete' | 'disabled' | 'built_in'
  description: string; notes: string[]; smtpCheck: boolean
  fields: Array<{ label: string; configured: boolean; required: boolean; secret: boolean }>
}
type Overview = { checkedAt: string; environment: string; items: Integration[] }
type SmtpResult = { ok: boolean; message: string; checkedAt: string }
const TABS = [
  { id: 'all', label: 'Tất cả', icon: SlidersHorizontal },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'push', label: 'Push Notification', icon: BellRing },
] as const
const TAB_COLORS = {
  all: { idle: 'border-slate-200 text-slate-600 hover:bg-slate-50', active: 'border-slate-400 bg-slate-100 text-slate-900', focus: 'focus-visible:ring-slate-400' },
  payment: { idle: 'border-violet-200 text-violet-700 hover:bg-violet-50', active: 'border-violet-400 bg-violet-100 text-violet-900', focus: 'focus-visible:ring-violet-400' },
  email: { idle: 'border-blue-200 text-blue-700 hover:bg-blue-50', active: 'border-blue-400 bg-blue-100 text-blue-900', focus: 'focus-visible:ring-blue-400' },
  sms: { idle: 'border-orange-200 text-orange-700 hover:bg-orange-50', active: 'border-orange-400 bg-orange-100 text-orange-900', focus: 'focus-visible:ring-orange-400' },
  push: { idle: 'border-pink-200 text-pink-700 hover:bg-pink-50', active: 'border-pink-400 bg-pink-100 text-pink-900', focus: 'focus-visible:ring-pink-400' },
} as const
const STATUS = {
  configured: { label: 'Đủ cấu hình', style: 'bg-violet-50 text-violet-700 border-violet-200' },
  incomplete: { label: 'Thiếu cấu hình', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  disabled: { label: 'Đang tắt', style: 'bg-slate-100 text-slate-600 border-slate-200' },
  built_in: { label: 'Tích hợp sẵn', style: 'bg-violet-50 text-violet-700 border-violet-200' },
}
const ICONS = { payment: CreditCard, email: Mail, sms: MessageSquare, push: BellRing }
const time = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export default function IntegrationsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [smtpResult, setSmtpResult] = useState<SmtpResult | null>(null)
  const load = useCallback(async () => {
    setLoading(true); setError(''); setSmtpResult(null)
    try {
      const response = await apiClient.get('/admin/integrations')
      setOverview(unwrapApiData<Overview>(response.data))
    } catch (e) { setError(apiErrorMessage(e, 'Không tải được cấu hình tích hợp.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const verifySmtp = async () => {
    setVerifying(true); setSmtpResult(null); setError('')
    try {
      const response = await apiClient.post('/admin/integrations/smtp/verify', {}, { timeout: 20_000 })
      setSmtpResult(unwrapApiData<SmtpResult>(response.data))
    } catch (e) { setError(apiErrorMessage(e, 'Không kiểm tra được kết nối SMTP.')) }
    finally { setVerifying(false) }
  }

  const visibleIntegrations = overview?.items.filter((item) => tab === 'all' || item.category === tab) || []

  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        eyebrow="Giám sát & Vận hành"
        title="Cấu hình tích hợp"
        className="[&>div:first-child>p:first-child]:text-slate-500"
        description="Theo dõi cổng thanh toán và các kênh thông báo của VitaCare."
      >
        <AdminButton
          variant="secondary"
          size="md"
          icon={RefreshCw}
          loading={loading}
          disabled={verifying}
          onClick={() => void load()}
          className="w-full rounded sm:w-auto"
        >
          Làm mới cấu hình
        </AdminButton>
      </AdminPageHeader>
      {error && (
        <div role="alert" className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="min-w-0 overflow-hidden rounded border border-slate-200 bg-white">
        <div className="overflow-x-auto p-2">
          <div className="flex w-max min-w-full gap-1" role="tablist" aria-label="Nhóm tích hợp">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`integration-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls="integration-panels"
                onClick={() => setTab(id)}
                className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${TAB_COLORS[id].focus} ${tab === id ? TAB_COLORS[id].active : TAB_COLORS[id].idle}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
        {overview && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              Môi trường
              <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700">{overview.environment}</span>
            </span>
            <span>Cập nhật: {time(overview.checkedAt)}</span>
          </div>
        )}
      </div>

      <div id="integration-panels" role="tabpanel" aria-labelledby={`integration-tab-${tab}`} aria-busy={loading}>
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-4 py-16 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Đang đọc cấu hình tích hợp…
          </div>
        ) : overview && (
          <div className={`grid min-w-0 gap-4 ${visibleIntegrations.length > 1 ? 'xl:grid-cols-2' : ''}`}>
            {visibleIntegrations.map((item) => {
              const Icon = ICONS[item.category]
              const status = STATUS[item.status]
              return (
                <section
                  key={item.id}
                  aria-labelledby={`integration-title-${item.id}`}
                  className="grid min-w-0 grid-rows-[auto_1fr_auto_auto] overflow-hidden rounded border border-slate-200 bg-white xl:row-span-4 xl:grid-rows-subgrid xl:gap-y-0"
                >
                  <header className="border-b border-slate-200 p-3 sm:px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-slate-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 id={`integration-title-${item.id}`} className="min-w-0 text-sm font-bold text-slate-900">{item.name}</h2>
                      </div>
                      <span className={`shrink-0 whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold ${status.style}`}>{status.label}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                  </header>

                  {item.fields.length > 0 ? (
                    <dl className="min-w-0 divide-y divide-slate-100 px-3 sm:px-4">
                      {item.fields.map((field) => (
                        <div key={field.label} className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 text-xs">
                          <dt className="flex min-w-0 items-start gap-2 text-slate-600">
                            <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                              {field.secret && <KeyRound className="h-4 w-4 text-slate-400" />}
                            </span>
                            <span className="break-words">{field.label}</span>
                          </dt>
                          <dd
                            title={field.secret && field.configured ? 'Giá trị bí mật đã được ẩn' : undefined}
                            className={`text-right font-medium ${field.configured ? 'text-slate-700' : field.required ? 'text-amber-700' : 'text-slate-400'}`}
                          >
                            {field.configured ? 'Đã thiết lập' : field.required ? 'Chưa thiết lập' : 'Không bắt buộc'}
                            {field.secret && field.configured && <span className="sr-only"> · Giá trị bí mật đã được ẩn</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="flex min-h-28 flex-col items-center justify-center gap-1.5 px-4 py-4 text-center">
                      <BellRing className="h-5 w-5 text-slate-300" aria-hidden="true" />
                      <p className="text-xs font-medium text-slate-600">Không yêu cầu khóa cấu hình</p>
                      <p className="max-w-sm text-xs leading-5 text-slate-400">Expo SDK đã được tích hợp trong backend. Thiết bị cần đăng ký Push Token để nhận thông báo.</p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 bg-slate-50/70 px-3 py-3 sm:px-4">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Thông tin tích hợp</p>
                    <ul className="space-y-1 text-xs leading-5 text-slate-500">
                      {item.notes.map((note) => (
                        <li key={note} className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <footer className="flex flex-col justify-center gap-2 border-t border-slate-200 px-3 py-2 sm:px-4">
                    <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{item.id === 'expo' ? 'Nguồn: Expo SDK' : 'Nguồn: Biến môi trường'}</span>
                      {item.id === 'smtp' && (
                        <AdminButton
                          icon={CheckCircle2}
                          variant="secondary"
                          size="xs"
                          loading={verifying}
                          disabled={!item.smtpCheck || loading}
                          onClick={() => void verifySmtp()}
                          className="rounded"
                        >
                          Kiểm tra SMTP
                        </AdminButton>
                      )}
                    </div>
                    {item.id === 'smtp' && smtpResult && (
                      <div role="status" className={`rounded border p-3 text-xs leading-5 ${smtpResult.ok ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                        <p>{smtpResult.message}</p>
                        <p className="mt-1 opacity-80">{time(smtpResult.checkedAt)}</p>
                      </div>
                    )}
                  </footer>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
