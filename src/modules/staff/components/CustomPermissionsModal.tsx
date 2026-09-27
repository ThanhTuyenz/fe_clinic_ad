'use client'

import { useMemo, useState } from 'react'
import {
  Shield,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Stethoscope,
  Building2,
  Coins,
  Users,
  Search,
} from 'lucide-react'
import {
  AppPermission,
  PERMISSION_CATALOG,
  PERMISSION_GROUP_CONFIG,
  PermissionGroup,
  PermissionItem,
  ROLE_DEFAULT_PERMISSIONS,
} from '@/common/constants/permissions.constant'
import { AdminButton, StatusBadge } from '@/common/components/ui'

export interface CustomPermissionsModalProps {
  user: {
    id: string
    fullName?: string
    email?: string
    role?: string
    customPermissions?: {
      granted?: string[]
      revoked?: string[]
    } | string[] | any
  }
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { granted: string[]; revoked: string[] }) => Promise<void>
  saving?: boolean
}

const GROUP_ICONS: Record<PermissionGroup, any> = {
  appointment: Calendar,
  clinical: Stethoscope,
  operation: Building2,
  finance: Coins,
  system: Users,
}

export function CustomPermissionsModal({
  user,
  isOpen,
  onClose,
  onSave,
  saving = false,
}: CustomPermissionsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const roleNormalized = String(user.role || 'patient').toLowerCase()
  const isTargetAdmin = roleNormalized === 'admin'

  // Quyền cơ bản mặc định theo Role
  const roleBasePermissions = useMemo(() => {
    return new Set<string>((ROLE_DEFAULT_PERMISSIONS[roleNormalized] || []).map((p) => String(p)))
  }, [roleNormalized])

  // Trích xuất danh sách granted và revoked ban đầu từ customPermissions
  const initialGranted = useMemo(() => {
    const cp = user.customPermissions
    if (!cp) return new Set<string>()
    if (Array.isArray(cp)) {
      return new Set<string>(cp.map((x) => String(x)).filter((p) => !roleBasePermissions.has(p)))
    }
    return new Set<string>((cp.granted || []).map((x: any) => String(x)))
  }, [user.customPermissions, roleBasePermissions])

  const initialRevoked = useMemo(() => {
    const cp = user.customPermissions
    if (!cp || Array.isArray(cp)) return new Set<string>()
    return new Set<string>((cp.revoked || []).map((x: any) => String(x)))
  }, [user.customPermissions])

  const [granted, setGranted] = useState<Set<string>>(initialGranted)
  const [revoked, setRevoked] = useState<Set<string>>(initialRevoked)

  if (!isOpen) return null

  // Lọc quyền theo tìm kiếm
  const filteredCatalog = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return PERMISSION_CATALOG
    return PERMISSION_CATALOG.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    )
  }, [searchTerm])

  // Nhóm các quyền theo category
  const groupedCatalog = filteredCatalog.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<PermissionGroup, PermissionItem[]>)

  const isPermissionActive = (code: string) => {
    const isBase = roleBasePermissions.has(code)
    const isRevoked = revoked.has(code)
    const isGranted = granted.has(code)
    return (isBase && !isRevoked) || isGranted
  }

  const togglePermission = (code: string) => {
    const isBase = roleBasePermissions.has(code)

    if (isBase) {
      // Quyền mặc định của Role: Nếu bỏ chọn -> thêm vào revoked; Nếu chọn lại -> bỏ khỏi revoked
      setRevoked((prev) => {
        const next = new Set(prev)
        if (next.has(code)) {
          next.delete(code)
        } else {
          next.add(code)
        }
        return next
      })
    } else {
      // Quyền ngoài Role: Nếu chọn -> thêm vào granted; Nếu bỏ chọn -> bỏ khỏi granted
      setGranted((prev) => {
        const next = new Set(prev)
        if (next.has(code)) {
          next.delete(code)
        } else {
          next.add(code)
        }
        return next
      })
    }
  }

  // Chọn / Bỏ chọn toàn bộ quyền trong một nhóm
  const toggleGroup = (items: PermissionItem[]) => {
    const allActive = items.every((it) => isPermissionActive(String(it.code)))

    if (allActive) {
      // Tắt tất cả trong nhóm
      items.forEach((it) => {
        const code = String(it.code)
        if (roleBasePermissions.has(code)) {
          setRevoked((prev) => new Set(prev).add(code))
        } else {
          setGranted((prev) => {
            const next = new Set(prev)
            next.delete(code)
            return next
          })
        }
      })
    } else {
      // Bật tất cả trong nhóm
      items.forEach((it) => {
        const code = String(it.code)
        if (roleBasePermissions.has(code)) {
          setRevoked((prev) => {
            const next = new Set(prev)
            next.delete(code)
            return next
          })
        } else {
          setGranted((prev) => new Set(prev).add(code))
        }
      })
    }
  }

  const resetToDefault = () => {
    setGranted(new Set())
    setRevoked(new Set())
  }

  const handleFormSubmit = async () => {
    await onSave({
      granted: Array.from(granted),
      revoked: Array.from(revoked),
    })
  }

  // Đếm tổng số quyền đang hoạt động
  const activeCount = PERMISSION_CATALOG.filter((it) => isPermissionActive(String(it.code))).length

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Tùy Biến Phân Quyền Nhân Sự (RBAC Table)
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeCount}/{PERMISSION_CATALOG.length} quyền kích hoạt
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhân sự:{' '}
                <strong className="text-slate-700">{user.fullName || user.email}</strong>{' '}
                <span className="text-slate-400">({user.email})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh điều khiển & Tìm kiếm */}
        <div className="bg-slate-50/60 px-5 py-2.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-slate-600">Vai trò gốc:</span>
            <StatusBadge tone={isTargetAdmin ? 'emerald' : 'blue'}>
              {roleNormalized.toUpperCase()}
            </StatusBadge>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-600 text-[11px]">
              Cấp thêm: <strong className="text-blue-700">+{granted.size}</strong> • Đã tước:{' '}
              <strong className="text-rose-600">-{revoked.size}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm quyền hạn..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 hover:underline cursor-pointer shrink-0"
              title="Khôi phục lại toàn bộ quyền mặc định theo vai trò"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Về mặc định</span>
            </button>
          </div>
        </div>

        {/* Nội dung dạng BẢNG (Table with Checkboxes) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isTargetAdmin && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Lưu ý:</strong> Tài khoản vai trò <strong>Admin</strong> mặc định có toàn bộ quyền hệ thống. Các tùy biến tước quyền không áp dụng cho quản trị viên tối cao.
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 w-14 text-center">Cho phép</th>
                  <th className="py-2.5 px-3">Tên quyền & Mô tả nghiệp vụ</th>
                  <th className="py-2.5 px-3 w-48 hidden md:table-cell">Mã quyền (Code)</th>
                  <th className="py-2.5 px-3 w-32 text-right">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {(Object.keys(groupedCatalog) as PermissionGroup[]).map((groupKey) => {
                  const items = groupedCatalog[groupKey]
                  const groupConfig = PERMISSION_GROUP_CONFIG[groupKey]
                  const IconComp = GROUP_ICONS[groupKey] || Shield

                  const activeInGroup = items.filter((it) =>
                    isPermissionActive(String(it.code)),
                  ).length
                  const allActiveInGroup = activeInGroup === items.length

                  return (
                    <tr key={`group-wrapper-${groupKey}`} className="contents">
                      {/* Tiêu đề nhóm quyền (Group Header Row) */}
                      <tr className="bg-slate-50/95 font-semibold text-slate-800 border-t border-b border-slate-200/80">
                        <td colSpan={4} className="py-2 px-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">
                                {groupConfig.label}
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                ({activeInGroup}/{items.length} quyền đang bật)
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={saving || isTargetAdmin}
                              onClick={() => toggleGroup(items)}
                              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer disabled:opacity-40"
                            >
                              {allActiveInGroup ? 'Bỏ chọn nhóm' : 'Chọn tất cả nhóm'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Các dòng quyền cụ thể trong nhóm (Permission Rows) */}
                      {items.map((item) => {
                        const codeStr = String(item.code)
                        const isBase = roleBasePermissions.has(codeStr)
                        const isRevoked = revoked.has(codeStr)
                        const isGranted = granted.has(codeStr)
                        const isActive = (isBase && !isRevoked) || isGranted

                        return (
                          <tr
                            key={codeStr}
                            onClick={() => {
                              if (!saving && !isTargetAdmin) {
                                togglePermission(codeStr)
                              }
                            }}
                            className={`transition-colors cursor-pointer select-none ${
                              isActive
                                ? 'bg-emerald-50/35 hover:bg-emerald-50/60'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            {/* Cột 1: Ô Checkbox */}
                            <td
                              className="py-2.5 px-3 text-center align-top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                disabled={saving || isTargetAdmin}
                                onChange={() => togglePermission(codeStr)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>

                            {/* Cột 2: Tên quyền & Mô tả */}
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.label}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                              <div className="font-mono text-[10px] text-slate-400 mt-0.5 md:hidden">
                                {item.code}
                              </div>
                            </td>

                            {/* Cột 3: Mã code (Chỉ hiện trên desktop) */}
                            <td className="py-2.5 px-3 align-top font-mono text-[11px] text-slate-500 hidden md:table-cell whitespace-nowrap">
                              {item.code}
                            </td>

                            {/* Cột 4: Trạng thái RBAC */}
                            <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                              {isGranted ? (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Cấp thêm (+)
                                </span>
                              ) : isBase && isRevoked ? (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                  Đã tước (-)
                                </span>
                              ) : isBase && !isRevoked ? (
                                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                                  Mặc định
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] font-normal px-2 py-0.5 rounded text-slate-400">
                                  Chưa cấp
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng quyền kích hoạt: <strong className="text-emerald-700">{activeCount}</strong> /{' '}
            {PERMISSION_CATALOG.length} quyền
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              Hủy bỏ
            </button>

            <AdminButton
              variant="primary"
              disabled={saving || isTargetAdmin}
              onClick={handleFormSubmit}
              className="px-4 py-1.5 text-xs font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  <span>Lưu phân quyền</span>
                </>
              )}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  )
}
