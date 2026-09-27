'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Shield,
  Building2,
  Stethoscope,
  DoorOpen,
  Search,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle2,
  Phone,
  User,
} from 'lucide-react'
import { apiErrorMessage } from '@/lib/api-client'
import { useAuth } from '@/common/hooks/useAuth'
import {
  AdminButton,
  AdminPageHeader,
  FilterTabs,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
  AdminModal,
  StatusBadge,
} from '@/common/components/ui'
import { listUsers, updateUser } from '../services/staffService'
import { staffRole } from '@/modules/admin/utils/staffSession'
import { CustomPermissionsModal } from '../components/CustomPermissionsModal'

type StaffUser = {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: string
  isBlocked?: boolean
  customPermissions?: any
  effectivePermissions?: string[]
  branchAssignments?: Array<{
    isPrimary?: boolean
    branch?: { id: string; code?: string; name?: string }
  }>
  doctor?: {
    academicRank?: string
    licenseNumber?: string
    specialties?: Array<{
      isPrimary?: boolean
      specialty?: { id: number; name?: string }
    }>
  }
}

type RoleDef = {
  id: 'admin' | 'branch_manager' | 'doctor' | 'receptionist'
  label: string
  shortLabel: string
  scope: string
  icon: any
  badgeTone: 'emerald' | 'blue' | 'purple' | 'amber'
  summary: string
  responsibility: string
  permissions: string[]
}

const SYSTEM_STAFF_ROLES: RoleDef[] = [
  {
    id: 'admin',
    label: 'Quản trị viên (Admin)',
    shortLabel: 'Admin',
    scope: 'Toàn hệ thống chuỗi',
    icon: Shield,
    badgeTone: 'emerald',
    summary: 'Toàn quyền quản trị hệ thống, phân quyền nhân sự và tài chính.',
    responsibility: 'Quản lý toàn diện: danh mục, cơ sở chi nhánh, tài khoản nhân sự, phân quyền, cấu hình hệ thống và báo cáo tài chính cấp cao.',
    permissions: [
      'Toàn quyền cấu hình chi nhánh & phòng khám',
      'Quản lý tài khoản & gán vai trò nhân sự',
      'Xem toàn bộ báo cáo doanh thu & dòng tiền',
      'Điều phối lịch làm việc & lịch hẹn toàn viện',
    ],
  },
  {
    id: 'branch_manager',
    label: 'Quản lý chi nhánh (Manager)',
    shortLabel: 'Quản lý',
    scope: 'Tại cơ sở chi nhánh',
    icon: Building2,
    badgeTone: 'blue',
    summary: 'Vận hành cơ sở, điều phối buồng khám và quản lý lịch trực.',
    responsibility: 'Quản lý lịch làm việc bác sĩ, phân bổ buồng khám, theo dõi doanh thu chi nhánh, quản lý nhân sự tại cơ sở được gán.',
    permissions: [
      'Xếp lịch trực & mở khung giờ (slots) tại chi nhánh',
      'Theo dõi tiến độ khám & công suất buồng khám',
      'Xem báo cáo doanh thu & lượt khám chi nhánh',
      'Giám sát hoạt động bàn tiếp đón tại cơ sở',
    ],
  },
  {
    id: 'doctor',
    label: 'Bác sĩ chuyên môn (Doctor)',
    shortLabel: 'Bác sĩ',
    scope: 'Phòng khám & Kê đơn',
    icon: Stethoscope,
    badgeTone: 'purple',
    summary: 'Khám chữa bệnh, chẩn đoán ICD-10 và xuất đơn thuốc điện tử.',
    responsibility: 'Tiếp nhận hàng đợi bệnh nhân tại phòng khám, ghi nhận triệu chứng, chẩn đoán mã ICD-10, chỉ định cận lâm sàng, xuất đơn thuốc điện tử.',
    permissions: [
      'Gọi số bệnh nhân & quản lý hàng đợi phòng khám',
      'Chẩn đoán bệnh theo mã quốc tế ICD-10',
      'Chỉ định cận lâm sàng & xét nghiệm',
      'Kê đơn thuốc điện tử và hoàn thành ca khám',
      'Xem lịch làm việc cá nhân & lịch sử ca khám',
    ],
  },
  {
    id: 'receptionist',
    label: 'Lễ tân tiếp đón (Receptionist)',
    shortLabel: 'Lễ tân',
    scope: 'Bàn tiếp đón & Quầy',
    icon: DoorOpen,
    badgeTone: 'amber',
    summary: 'Tiếp nhận bệnh nhân, check-in mã QR và thu viện phí tại quầy.',
    responsibility: 'Quét mã QR vé hẹn / CCCD, xác nhận check-in, gán phòng khám chuyên môn, thu phí dịch vụ tại quầy, xuất phiếu số thứ tự khám.',
    permissions: [
      'Quét mã QR vé hẹn & giải mã CCCD',
      'Xác nhận tiếp đón & cấp số thứ tự vào phòng',
      'Thu phí khám, xuất hóa đơn tại quầy (Tiền mặt / QR)',
      'Đăng ký thông tin bệnh nhân mới & đặt lịch tại quầy',
      'Kiểm kê báo cáo két tiền cuối ca trực',
    ],
  },
]

const TABLE_COLUMNS = [
  'Nhân viên',
  'Cơ sở & Chuyên môn',
  'Vai trò hiện tại',
  { label: 'Phân vai trò (RBAC)', align: 'right' as const },
]

const roleOf = (row: StaffUser) => String(row.role || '').toLowerCase()

export default function RolesPermissionsPage() {
  const { user } = useAuth()
  const currentRole = staffRole(user)
  const currentId = String(user?.id || '')
  const canAssignAdmin = currentRole === 'admin'

  const [rows, setRows] = useState<StaffUser[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [savingId, setSavingId] = useState('')

  const [inspectRole, setInspectRole] = useState<RoleDef | null>(null)
  const [customPermTargetUser, setCustomPermTargetUser] = useState<StaffUser | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listUsers({ limit: 100, isDeleted: false })
      setRows(
        res.data.filter((u: StaffUser) =>
          SYSTEM_STAFF_ROLES.some((r) => r.id === roleOf(u))
        )
      )
    } catch (e) {
      setError(apiErrorMessage(e, 'Không tải được danh sách nhân sự.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(
      SYSTEM_STAFF_ROLES.map((r) => [r.id, 0])
    )
    rows.forEach((r) => {
      const k = roleOf(r)
      if (k in map) map[k]++
    })
    return map
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && roleOf(r) !== filter) return false
      return (
        !q ||
        `${r.fullName || ''} ${r.email || ''} ${r.phoneNumber || ''}`
          .toLowerCase()
          .includes(q)
      )
    })
  }, [rows, query, filter])

  const changeRole = async (row: StaffUser, nextRole: string) => {
    if (roleOf(row) === nextRole) return
    if (
      row.id === currentId &&
      !confirm('Đổi vai trò của chính bạn có thể làm thay đổi quyền truy cập các trang. Tiếp tục?')
    )
      return
    const label = SYSTEM_STAFF_ROLES.find((r) => r.id === nextRole)?.label || nextRole
    if (!confirm(`Xác nhận gán vai trò “${label}” cho tài khoản ${row.fullName || row.email}?`))
      return

    setSavingId(row.id)
    setError('')
    try {
      await updateUser(row.id, { role: nextRole })
      setRows((items) =>
        items.map((it) => (it.id === row.id ? { ...it, role: nextRole } : it))
      )
      setSuccessMsg(`Đã cập nhật vai trò của ${row.fullName || row.email} thành ${label}.`)
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (e) {
      setError(apiErrorMessage(e, 'Không cập nhật được vai trò người dùng.'))
    } finally {
      setSavingId('')
    }
  }

  const handleSaveCustomPermissions = async (payload: { granted: string[]; revoked: string[] }) => {
    if (!customPermTargetUser) return
    setSavingId(customPermTargetUser.id)
    setError('')
    try {
      await updateUser(customPermTargetUser.id, { customPermissions: payload })
      setRows((items) =>
        items.map((it) =>
          it.id === customPermTargetUser.id ? { ...it, customPermissions: payload } : it,
        ),
      )
      setSuccessMsg(
        `Đã cập nhật phân quyền chi tiết cho ${customPermTargetUser.fullName || customPermTargetUser.email}.`,
      )
      setTimeout(() => setSuccessMsg(''), 3500)
      setCustomPermTargetUser(null)
    } catch (e) {
      setError(apiErrorMessage(e, 'Không cập nhật được quyền hạn nhân sự.'))
    } finally {
      setSavingId('')
    }
  }

  const assignableRoles = SYSTEM_STAFF_ROLES.filter(
    (r) => canAssignAdmin || r.id !== 'admin'
  )

  const filterTabs = [
    { id: 'all', label: 'Tất cả nhân sự', count: rows.length },
    ...SYSTEM_STAFF_ROLES.map((r) => ({
      id: r.id,
      label: r.shortLabel,
      count: counts[r.id] ?? 0,
    })),
  ]

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Bảo mật & Phân quyền"
        title="Vai trò & Phân quyền nhân sự"
        description="Quản lý và chuyển đổi vai trò (Role-Based Access Control) cho đội ngũ nhân viên phòng khám."
      >
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={() => void load()}
        >
          Làm mới
        </AdminButton>
      </AdminPageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 font-semibold">
          {successMsg}
        </div>
      )}

      {/* 4 Thẻ Vai trò cốt lõi - Tối giản, mỏng nhẹ, thanh lịch */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {SYSTEM_STAFF_ROLES.map((r) => {
          const IconComp = r.icon
          const isSelected = filter === r.id
          const count = counts[r.id] ?? 0
          return (
            <div
              key={r.id}
              onClick={() => setFilter(filter === r.id ? 'all' : r.id)}
              className={`rounded border p-4 transition-all duration-150 cursor-pointer shadow-2xs relative flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                  : 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200/80 text-emerald-700 shadow-2xs'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </span>

                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200/80 px-2 py-0.5 rounded shadow-2xs tabular-nums">
                    {count} <span className="font-normal text-slate-400">người</span>
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {r.label}
                  </h3>
                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                    {r.scope}
                  </p>
                </div>

                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {r.summary}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {isSelected ? 'Đang lọc' : 'Bấm để lọc'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectRole(r)
                  }}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>Quyền hạn</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bảng Nhân sự & Gán vai trò (RBAC Role Assignment Table) */}
      <AdminTableCard>
        <div className="border-b border-slate-100 p-4 space-y-3">
          <FilterTabs tabs={filterTabs} active={filter} onChange={(id) => setFilter(id)} />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
            />
          </div>
        </div>

        <AdminTable minWidth="min-w-[650px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={4} message="Đang tải dữ liệu nhân sự…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={4} message="Không có nhân viên phù hợp." />
            ) : (
              filtered.map((row) => {
                const cur = roleOf(row)
                const roleDef = SYSTEM_STAFF_ROLES.find((r) => r.id === cur)

                // Lấy thông tin cơ sở chi nhánh
                const branchName =
                  row.branchAssignments?.find((b) => b.isPrimary)?.branch?.name ||
                  row.branchAssignments?.[0]?.branch?.name ||
                  (cur === 'admin' ? 'Toàn chuỗi phòng khám' : 'VitaCare Clinic')

                // Lấy thông tin học vị/chuyên khoa nếu là bác sĩ
                const docRank = row.doctor?.academicRank
                const specialtyName =
                  row.doctor?.specialties?.find((s) => s.isPrimary)?.specialty?.name ||
                  row.doctor?.specialties?.[0]?.specialty?.name

                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Cột 1: Thông tin nhân viên */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {row.fullName ? (
                            row.fullName.trim().charAt(0).toUpperCase()
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <strong className="text-xs font-semibold text-slate-900 block leading-tight">
                            {row.fullName || 'Chưa cập nhật tên'}
                          </strong>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {row.email}{' '}
                            {row.id === currentId && (
                              <span className="ml-1 font-bold text-emerald-700">(Bạn)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Cơ sở & Chuyên môn */}
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{branchName}</span>
                        </div>
                        {specialtyName && (
                          <div className="text-[11px] text-purple-700 font-medium">
                            {docRank ? `${docRank} • ` : ''}Chuyên khoa {specialtyName}
                          </div>
                        )}
                        {row.phoneNumber && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{row.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cột 3: Vai trò hiện tại */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge tone={roleDef?.badgeTone || 'slate'}>
                          {roleDef?.label || cur.toUpperCase()}
                        </StatusBadge>
                        {Boolean(
                          row.customPermissions &&
                            (row.customPermissions.granted?.length > 0 ||
                              row.customPermissions.revoked?.length > 0 ||
                              (Array.isArray(row.customPermissions) && row.customPermissions.length > 0)),
                        ) && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Đã tùy biến quyền
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 4: Dropdown Phân quyền vai trò (RBAC) & Tùy biến quyền */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={cur}
                          disabled={savingId === row.id}
                          onChange={(e) => void changeRole(row, e.target.value)}
                          className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:border-emerald-600 disabled:opacity-50 cursor-pointer"
                        >
                          {assignableRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setCustomPermTargetUser(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                          title="Tùy biến quyền hạn chi tiết (Cấp thêm / Tước quyền)"
                        >
                          <Shield className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden md:inline">Tùy biến quyền</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </AdminTable>
        <AdminTableFooter total={filtered.length} label="nhân sự" />
      </AdminTableCard>

      {/* Modal Xem chi tiết quyền hạn của vai trò */}
      <AdminModal
        isOpen={Boolean(inspectRole)}
        onClose={() => setInspectRole(null)}
        eyebrow="Chi tiết vai trò hệ thống"
        title={inspectRole?.label || 'Vai trò'}
      >
        {inspectRole && (
          <div className="space-y-4 text-xs">
            <div>
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Phạm vi tác nghiệp:
              </p>
              <p className="mt-1 text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 font-medium">
                {inspectRole.scope}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Trách nhiệm chính:
              </p>
              <p className="mt-1 text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 leading-relaxed">
                {inspectRole.responsibility}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                Các quyền hạn được cấp (Permissions):
              </p>
              <div className="space-y-2">
                {inspectRole.permissions.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <AdminButton variant="secondary" onClick={() => setInspectRole(null)}>
                Đóng
              </AdminButton>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Modal Tùy biến quyền hạn chi tiết (RBAC Granular Permissions) */}
      {customPermTargetUser && (
        <CustomPermissionsModal
          user={customPermTargetUser}
          isOpen={Boolean(customPermTargetUser)}
          onClose={() => setCustomPermTargetUser(null)}
          onSave={handleSaveCustomPermissions}
          saving={savingId === customPermTargetUser.id}
        />
      )}
    </div>
  )
}

