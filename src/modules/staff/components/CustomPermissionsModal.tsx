'use client'

import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, X, AlertTriangle, Loader2, Calendar, Stethoscope, Building2, Coins, Users, Search, FileText, BarChart3, Package, type LucideIcon } from 'lucide-react'
import {
  AppPermission,
  PERMISSION_CATALOG,
  PERMISSION_GROUP_CONFIG,
  type PermissionGroup,
  ROLE_DEFAULT_PERMISSIONS,
  VALID_PERMISSIONS_SET,
  normalizeCustomPermissions,
} from '@/common/constants/permissions.constant'
import { AdminButton, StatusBadge } from '@/common/components/ui'
import { getUserPermissions } from '@/modules/admin/services/users'

export interface CustomPermissionsModalProps {
  user: {
    id: string
    fullName?: string
    email?: string
    role?: string
    customPermissions?: { granted?: string[]; revoked?: string[] } | string[] | any
  }
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { granted: string[]; revoked: string[] }) => Promise<void>
  saving?: boolean
}

const GROUP_ICONS: Record<PermissionGroup, LucideIcon> = {
  appointment: Calendar,
  patient: FileText,
  clinical: Stethoscope,
  operation: Building2,
  service: Package,
  finance: Coins,
  report: BarChart3,
  system: Users,
}
const MATRIX_COLUMNS = [
  { id: 'read', label: 'Xem' },
  { id: 'create', label: 'Tạo mới' },
  { id: 'update', label: 'Sửa' },
  { id: 'delete', label: 'Xóa' },
  { id: 'execute', label: 'Nghiệp vụ' },
] as const
type MatrixColumn = (typeof MATRIX_COLUMNS)[number]['id']
type MatrixRow = { id: string; label: string; group: PermissionGroup; cells: Partial<Record<MatrixColumn, AppPermission>> }
const MATRIX_ROWS: MatrixRow[] = [
  { id: 'user', label: "Tài khoản", group: 'system', cells: { read: AppPermission.USER_READ, create: AppPermission.USER_CREATE, update: AppPermission.USER_UPDATE, delete: AppPermission.USER_DELETE } },
  { id: 'branch', label: "Chi nhánh", group: 'operation', cells: { read: AppPermission.BRANCH_READ, create: AppPermission.BRANCH_CREATE, update: AppPermission.BRANCH_UPDATE, delete: AppPermission.BRANCH_DELETE } },
  { id: 'room', label: "Phòng khám", group: 'operation', cells: { read: AppPermission.ROOM_READ, create: AppPermission.ROOM_CREATE, update: AppPermission.ROOM_UPDATE, delete: AppPermission.ROOM_DELETE } },
  { id: 'specialty', label: "Chuyên khoa", group: 'service', cells: { read: AppPermission.SPECIALTY_READ, create: AppPermission.SPECIALTY_CREATE, update: AppPermission.SPECIALTY_UPDATE, delete: AppPermission.SPECIALTY_DELETE } },
  { id: 'service', label: "Dịch vụ & gói khám", group: 'service', cells: { read: AppPermission.SERVICE_READ, create: AppPermission.SERVICE_CREATE, update: AppPermission.SERVICE_UPDATE, delete: AppPermission.SERVICE_DELETE } },
  { id: 'booking_method', label: "Hình thức đặt khám", group: 'service', cells: { read: AppPermission.BOOKING_METHOD_READ, create: AppPermission.BOOKING_METHOD_CREATE, update: AppPermission.BOOKING_METHOD_UPDATE, delete: AppPermission.BOOKING_METHOD_DELETE } },
  { id: 'schedule', label: "Lịch làm việc", group: 'operation', cells: { read: AppPermission.SCHEDULE_READ, create: AppPermission.SCHEDULE_CREATE, update: AppPermission.SCHEDULE_UPDATE, delete: AppPermission.SCHEDULE_DELETE } },
  { id: 'patient', label: "Hồ sơ bệnh nhân", group: 'patient', cells: { read: AppPermission.PATIENT_READ, create: AppPermission.PATIENT_CREATE, update: AppPermission.PATIENT_UPDATE } },
  { id: 'appointments', label: 'Lịch hẹn', group: 'appointment', cells: { read: AppPermission.APPOINTMENT_READ, create: AppPermission.APPOINTMENT_CREATE } },
  { id: 'checkin', label: 'Tiếp nhận bệnh nhân', group: 'appointment', cells: { execute: AppPermission.APPOINTMENT_CHECKIN } },
  { id: 'cancel', label: 'Hủy lịch hẹn', group: 'appointment', cells: { execute: AppPermission.APPOINTMENT_CANCEL } },
  { id: 'clinical', label: 'Bệnh án', group: 'clinical', cells: { read: AppPermission.CLINICAL_READ } },
  { id: 'finance', label: 'Giao dịch & Doanh thu', group: 'finance', cells: { read: AppPermission.FINANCE_READ } },
  { id: 'collect', label: 'Thu viện phí', group: 'finance', cells: { execute: AppPermission.FINANCE_COLLECT } },
  { id: 'branch-reports', label: 'Báo cáo chi nhánh', group: 'report', cells: { read: AppPermission.REPORT_BRANCH_READ } },
  { id: 'chain-reports', label: 'Báo cáo toàn chuỗi', group: 'report', cells: { read: AppPermission.REPORT_SYSTEM_READ } },
  { id: 'roles', label: 'Vai trò & Phân quyền', group: 'system', cells: { execute: AppPermission.ROLE_MANAGE } },
  { id: 'integrations', label: 'Cấu hình tích hợp', group: 'system', cells: { read: AppPermission.INTEGRATION_READ, execute: AppPermission.INTEGRATION_VERIFY } },
  { id: 'logs', label: 'Nhật ký hệ thống', group: 'system', cells: { read: AppPermission.SYSTEM_LOG_READ } },
]
type Selection = { granted: Set<string>; revoked: Set<string> }

function readSelection(payload: any, base: Set<string>): Selection {
  const normalized = normalizeCustomPermissions(payload)
  const rawGranted = normalized.granted
  const rawRevoked = normalized.revoked
  const revoked = new Set<string>(rawRevoked.map(String).filter((code: string) => VALID_PERMISSIONS_SET.has(code)))
  return {
    granted: new Set(rawGranted.map(String).filter((code: string) => VALID_PERMISSIONS_SET.has(code) && !base.has(code) && !revoked.has(code))),
    revoked: new Set([...revoked].filter((code) => base.has(code))),
  }
}

export function CustomPermissionsModal({ user, isOpen, onClose, onSave, saving = false }: CustomPermissionsModalProps) {
  const [roleNormalized, setRoleNormalized] = useState(String(user.role || 'patient').toLowerCase())
  const roleBasePermissions = useMemo(() => new Set<string>(ROLE_DEFAULT_PERMISSIONS[roleNormalized] || []), [roleNormalized])
  const [selection, setSelection] = useState<Selection>(() => readSelection(user.customPermissions, roleBasePermissions))
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingDb, setLoadingDb] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const isTargetAdmin = roleNormalized === 'admin'
  const disabled = saving || loadingDb || isTargetAdmin

  useEffect(() => {
    if (!isOpen) return
    let active = true
    const fallbackRole = String(user.role || 'patient').toLowerCase()
    const fallbackBase = new Set<string>(ROLE_DEFAULT_PERMISSIONS[fallbackRole] || [])
    setRoleNormalized(fallbackRole)
    setSelection(readSelection(user.customPermissions, fallbackBase))
    setSearchTerm('')
    setLoadingDb(true)
    setLoadFailed(false)
    getUserPermissions(user.id)
      .then((data: any) => {
        if (!active) return
        const role = String(data?.role || fallbackRole).toLowerCase()
        const base = new Set<string>(ROLE_DEFAULT_PERMISSIONS[role] || [])
        setRoleNormalized(role)
        setSelection(readSelection(data?.customPermissions, base))
      })
      .catch(() => { if (active) setLoadFailed(true) })
      .finally(() => { if (active) setLoadingDb(false) })
    return () => { active = false }
  }, [isOpen, user.id, user.role, user.customPermissions])

  const filteredCatalog = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('vi')
    return PERMISSION_CATALOG.filter((item) => {
      const groupLabel = PERMISSION_GROUP_CONFIG[item.group].label
      return !term || [item.label, item.code, item.description, groupLabel].some((value) => value.toLocaleLowerCase('vi').includes(term))
    })
  }, [searchTerm])
  const visibleCodes = new Set(filteredCatalog.map((item) => item.code))
  const matrixRows = MATRIX_ROWS.filter((row) =>
    Object.values(row.cells).some((code) => visibleCodes.has(code)),
  )

  const isPermissionActive = (code: string) => isTargetAdmin
    ? roleBasePermissions.has(code)
    : !selection.revoked.has(code) && (roleBasePermissions.has(code) || selection.granted.has(code))
  const activeCount = PERMISSION_CATALOG.filter((item) => isPermissionActive(item.code)).length
  const visibleCount = filteredCatalog.filter((item) => isPermissionActive(item.code)).length
  const allVisibleChecked = filteredCatalog.length > 0 && visibleCount === filteredCatalog.length

  const setCodes = (codes: string[], enabled: boolean) => {
    if (disabled) return
    setSelection((previous) => {
      const granted = new Set(previous.granted)
      const revoked = new Set(previous.revoked)
      codes.forEach((code) => {
        if (!VALID_PERMISSIONS_SET.has(code)) return
        if (roleBasePermissions.has(code)) {
          granted.delete(code)
          if (enabled) revoked.delete(code)
          else revoked.add(code)
        } else {
          revoked.delete(code)
          if (enabled) granted.add(code)
          else granted.delete(code)
        }
      })
      return { granted, revoked }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-xs sm:p-4" onClick={() => { if (!saving) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="custom-permissions-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="custom-permissions-title" className="text-sm font-bold text-slate-900">Ma trận phân quyền chức năng</h2>
            <p className="mt-1 break-words text-xs text-slate-500"><strong className="text-slate-700">{user.fullName || user.email}</strong>{user.email && ' · ' + user.email}</p>
          </div>
          <button type="button" aria-label="Đóng phân quyền" disabled={saving} onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">Vai trò gốc</span>
              <StatusBadge tone="blue">{roleNormalized.toUpperCase()}</StatusBadge>
            </div>
            <span className="text-slate-500">Cấp thêm: <strong className="text-blue-700">+{isTargetAdmin ? 0 : selection.granted.size}</strong> · Thu hồi: <strong className="text-rose-600">{isTargetAdmin ? 0 : selection.revoked.size}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input aria-label="Tìm quyền theo chức năng" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm chức năng, hành động hoặc mã quyền…" className="w-full rounded border border-slate-200 py-2 pl-8 pr-8 text-xs focus:border-sky-500 focus:outline-none" />
              {searchTerm && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <AdminButton variant="secondary" icon={RotateCcw} disabled={disabled} onClick={() => setSelection({ granted: new Set(), revoked: new Set() })}>Về mặc định</AdminButton>
          </div>
          <p className="text-xs leading-5 text-slate-500">Chọn quyền theo hàng chức năng và cột hành động. Rê chuột lên ô để xem chi tiết; dấu — là thao tác không áp dụng. Quyền vẫn chịu giới hạn vai trò và phạm vi chi nhánh.</p>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/40 p-4 sm:p-5">
          {isTargetAdmin && <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>Admin có bộ quyền quản trị kỹ thuật cố định. Không áp dụng cấp thêm hoặc thu hồi quyền cho vai trò này.</p></div>}
          {loadFailed && <div role="alert" className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Không tải được quyền mới nhất. Đang hiển thị dữ liệu tài khoản đã có; kiểm tra lại trước khi lưu.</div>}
          {loadingDb ? (
            <div role="status" className="flex items-center justify-center gap-2 rounded border border-slate-200 bg-white py-14 text-xs text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Đang tải quyền hiện tại…</div>
          ) : (
            <>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                <input type="checkbox" checked={allVisibleChecked} ref={(node) => { if (node) node.indeterminate = visibleCount > 0 && !allVisibleChecked }} disabled={disabled || !filteredCatalog.length} onChange={(event) => setCodes(filteredCatalog.map((item) => item.code), event.target.checked)} className="h-4 w-4 shrink-0 rounded accent-sky-600" />
                Chọn các quyền đang hiển thị
                <span className="ml-auto text-[11px] font-normal text-slate-400">{visibleCount}/{filteredCatalog.length}</span>
              </label>
              <div className="no-scrollbar overflow-x-auto rounded border border-slate-200 bg-white">
                <table className="w-full min-w-[760px] table-fixed border-collapse text-xs">
                  <caption className="sr-only">Ma trận quyền theo chức năng và hành động thực tế</caption>
                  <colgroup>
                    <col className="w-[220px]" />
                    {MATRIX_COLUMNS.map((column) => <col key={column.id} />)}
                  </colgroup>
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th scope="col" className="border-b border-r border-slate-200 px-3 py-3 text-left font-bold">Nhóm chức năng</th>
                      {MATRIX_COLUMNS.map((column) => {
                        const codes = matrixRows.map((row) => row.cells[column.id]).filter((code): code is AppPermission => Boolean(code) && visibleCodes.has(code))
                        const count = codes.filter(isPermissionActive).length
                        return (
                          <th key={column.id} scope="col" className="border-b border-r border-slate-200 px-2 py-3 last:border-r-0">
                            <label className="flex items-center justify-center gap-2">
                              <input type="checkbox" aria-label={'Chọn tất cả quyền ' + column.label + ' đang hiển thị'} checked={codes.length > 0 && count === codes.length} ref={(node) => { if (node) node.indeterminate = count > 0 && count < codes.length }} disabled={disabled || !codes.length} onChange={(event) => setCodes(codes, event.target.checked)} className="h-4 w-4 shrink-0 rounded accent-sky-600" />
                              {column.label}
                            </label>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {!matrixRows.length && <tr><td colSpan={MATRIX_COLUMNS.length + 1} className="py-10 text-center text-slate-500">Không có quyền phù hợp với từ khóa.</td></tr>}
                    {matrixRows.map((row) => {
                      const Icon = GROUP_ICONS[row.group]
                      const codes = Object.values(row.cells).filter((code) => visibleCodes.has(code))
                      const count = codes.filter(isPermissionActive).length
                      return (
                        <tr key={row.id} data-permission-row={row.id} className="border-b border-slate-200 last:border-b-0">
                          <th scope="row" className="border-r border-slate-200 bg-slate-50/60 px-3 py-3 text-left align-middle">
                            <label className="flex items-start gap-2">
                              <input type="checkbox" aria-label={'Chọn tất cả quyền trong nhóm ' + row.label} checked={count === codes.length} ref={(node) => { if (node) node.indeterminate = count > 0 && count < codes.length }} disabled={disabled} onChange={(event) => setCodes(codes, event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-sky-600" />
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5 font-semibold text-slate-800"><Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />{row.label}</span>
                                <span className="mt-1 block text-[10px] font-normal text-slate-400">{count}/{codes.length} quyền</span>
                              </span>
                            </label>
                          </th>
                          {MATRIX_COLUMNS.map((column) => {
                            const code = row.cells[column.id]
                            const item = filteredCatalog.find((permission) => permission.code === code)
                            if (!item) return (
                              <td key={column.id} className="border-r border-slate-200 bg-slate-50/30 px-2 py-3 text-center text-slate-300 last:border-r-0">
                                <span aria-label={code ? 'Quyền không khớp bộ lọc' : 'Không áp dụng'}>—</span>
                              </td>
                            )
                            const checked = isPermissionActive(item.code)
                            const base = roleBasePermissions.has(item.code)
                            const stateLabel = checked ? base ? 'Mặc định' : 'Cấp thêm' : base ? 'Đã thu hồi' : 'Chưa cấp'
                            const description = item.code === AppPermission.INTEGRATION_READ
                              ? 'Quyền kỹ thuật dành cho Admin. Trang tích hợp hiện chỉ xem cấu hình và kiểm tra SMTP.'
                              : item.description
                            return (
                              <td key={column.id} className={'border-r border-slate-200 align-middle last:border-r-0 ' + (checked ? 'bg-sky-50/30' : 'bg-white')}>
                                <label title={item.label + ' · ' + stateLabel + '\n' + description} className={'flex min-h-12 items-center justify-center px-2.5 py-3 ' + (disabled ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50')}>
                                  <input type="checkbox" aria-label={item.label} checked={checked} disabled={disabled} onChange={(event) => setCodes([item.code], event.target.checked)} className="h-4 w-4 shrink-0 rounded accent-sky-600" />
                                </label>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <span className="text-xs text-slate-500">Đang kích hoạt <strong className="text-slate-800">{activeCount}</strong>/{PERMISSION_CATALOG.length} quyền</span>
          <div className="flex items-center gap-2">
            <AdminButton variant="secondary" disabled={saving} onClick={onClose}>Hủy bỏ</AdminButton>
            <AdminButton variant="primary" loading={saving} disabled={disabled} onClick={() => { if (!disabled) void onSave({ granted: [...selection.granted], revoked: [...selection.revoked] }) }}>Lưu phân quyền</AdminButton>
          </div>
        </footer>
      </div>
    </div>
  )
}


