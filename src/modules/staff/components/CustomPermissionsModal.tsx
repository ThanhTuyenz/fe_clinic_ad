import React, { useEffect, useMemo, useState } from 'react'
import {
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
  Database,
} from 'lucide-react'
import {
  AppPermission,
  PERMISSION_CATALOG,
  PERMISSION_GROUP_CONFIG,
  PermissionGroup,
  PermissionItem,
  ROLE_DEFAULT_PERMISSIONS,
} from '@/common/constants/permissions.constant'
import {
  AdminButton,
  StatusBadge,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
} from '@/common/components/ui'
import { getUserPermissions } from '@/modules/admin/services/users'

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
  const [loadingDb, setLoadingDb] = useState(false)
  const [dbSynced, setDbSynced] = useState(false)

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

  // Nạp quyền thực tế trực tiếp từ Database PostgreSQL khi mở modal
  useEffect(() => {
    if (!isOpen || !user.id) return

    let isMounted = true
    setLoadingDb(true)
    setDbSynced(false)

    getUserPermissions(user.id)
      .then((data: any) => {
        if (!isMounted) return
        const cp = data?.customPermissions
        const role = String(data?.role || user.role || 'patient').toLowerCase()
        const baseSet = new Set<string>((ROLE_DEFAULT_PERMISSIONS[role] || []).map((p) => String(p)))

        if (!cp) {
          setGranted(new Set())
          setRevoked(new Set())
        } else if (Array.isArray(cp)) {
          setGranted(new Set(cp.map((x) => String(x)).filter((p) => !baseSet.has(p))))
          setRevoked(new Set())
        } else {
          setGranted(new Set((cp.granted || []).map((x: any) => String(x))))
          setRevoked(new Set((cp.revoked || []).map((x: any) => String(x))))
        }
        setDbSynced(true)
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Không thể nạp quyền trực tiếp từ DB, sử dụng dữ liệu cục bộ:', err)
        // Dùng fallback từ prop nếu xảy ra lỗi mạng
        setGranted(initialGranted)
        setRevoked(initialRevoked)
      })
      .finally(() => {
        if (isMounted) {
          setLoadingDb(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, user.id])

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

  const MATRIX_MODULES = useMemo(
    () => [
      {
        id: 'appointment',
        label: 'Lịch hẹn & Tiếp đón',
        read: AppPermission.APPOINTMENT_READ,
        create: AppPermission.APPOINTMENT_CREATE,
        update: AppPermission.APPOINTMENT_CHECKIN,
        delete: AppPermission.APPOINTMENT_CANCEL,
      },
      {
        id: 'patient',
        label: 'Hồ sơ Bệnh nhân',
        read: AppPermission.PATIENT_READ,
        create: null,
        update: AppPermission.PATIENT_MANAGE,
        delete: null,
      },
      {
        id: 'clinical_exam',
        label: 'Khám bệnh & Bệnh án',
        read: AppPermission.CLINICAL_READ,
        create: null,
        update: AppPermission.CLINICAL_WRITE,
        delete: null,
      },
      {
        id: 'schedules',
        label: 'Lịch làm việc & Ca trực',
        read: AppPermission.SCHEDULE_READ,
        create: null,
        update: AppPermission.SCHEDULE_MANAGE,
        delete: null,
      },
      {
        id: 'branch_room',
        label: 'Cơ sở & Phòng khám',
        read: AppPermission.BRANCH_READ,
        create: AppPermission.BRANCH_MANAGE,
        update: AppPermission.ROOM_MANAGE,
        delete: null,
      },
      {
        id: 'medical_services',
        label: 'Chuyên môn & Dịch vụ y tế',
        read: null,
        create: AppPermission.SPECIALTY_MANAGE,
        update: AppPermission.SERVICE_MANAGE,
        delete: null,
      },
      {
        id: 'finance',
        label: 'Tài chính & Viện phí',
        read: AppPermission.FINANCE_READ,
        create: AppPermission.FINANCE_COLLECT,
        update: null,
        delete: null,
      },
      {
        id: 'reports',
        label: 'Báo cáo & Thống kê',
        read: AppPermission.REPORT_BRANCH_READ,
        create: null,
        update: AppPermission.REPORT_SYSTEM_READ,
        delete: null,
      },
      {
        id: 'users',
        label: 'Nhân sự & Phân quyền',
        read: AppPermission.USER_READ,
        create: AppPermission.USER_MANAGE,
        update: AppPermission.ROLE_MANAGE,
        delete: null,
      },
      {
        id: 'system_config',
        label: 'Cấu hình Hệ thống',
        read: null,
        create: null,
        update: AppPermission.SYSTEM_CONFIG_MANAGE,
        delete: null,
      },
    ],
    [],
  )

  // Danh sách mã quyền cho từng cột
  const allCodes = useMemo(() => PERMISSION_CATALOG.map((p) => String(p.code)), [])
  const readCodes = useMemo(
    () => MATRIX_MODULES.map((m) => m.read).filter(Boolean).map(String),
    [MATRIX_MODULES],
  )
  const createCodes = useMemo(
    () => MATRIX_MODULES.map((m) => m.create).filter(Boolean).map(String),
    [MATRIX_MODULES],
  )
  const updateCodes = useMemo(
    () => MATRIX_MODULES.map((m) => m.update).filter(Boolean).map(String),
    [MATRIX_MODULES],
  )
  const deleteCodes = useMemo(
    () => MATRIX_MODULES.map((m) => m.delete).filter(Boolean).map(String),
    [MATRIX_MODULES],
  )

  // Trạng thái tick trên Header
  const isAllModulesChecked = allCodes.length > 0 && allCodes.every((c) => isPermissionActive(c))
  const isAllReadChecked = readCodes.length > 0 && readCodes.every((c) => isPermissionActive(c))
  const isAllCreateChecked = createCodes.length > 0 && createCodes.every((c) => isPermissionActive(c))
  const isAllUpdateChecked = updateCodes.length > 0 && updateCodes.every((c) => isPermissionActive(c))
  const isAllDeleteChecked = deleteCodes.length > 0 && deleteCodes.every((c) => isPermissionActive(c))

  // Toggle danh sách nhiều quyền (cho header hoặc cho dòng module)
  const toggleCodeList = (codes: string[]) => {
    if (saving || isTargetAdmin || codes.length === 0) return
    const allActive = codes.every((c) => isPermissionActive(c))

    if (allActive) {
      // Tắt tất cả
      codes.forEach((code) => {
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
      // Bật tất cả
      codes.forEach((code) => {
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

  // Lọc theo tìm kiếm
  const filteredModules = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return MATRIX_MODULES
    return MATRIX_MODULES.filter((m) => {
      const matchLabel = m.label.toLowerCase().includes(q)
      const codes = [m.read, m.create, m.update, m.delete].filter(Boolean).map(String)
      const matchCodes = codes.some((c) => c.toLowerCase().includes(q))
      return matchLabel || matchCodes
    })
  }, [searchTerm, MATRIX_MODULES])

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Sửa Hồ Sơ Phân Quyền Nhân Sự
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
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:border-sky-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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

        {/* Nội dung BẢNG PHÂN QUYỀN CHUẨN MA TRẬN (GIỐNG HỆT ẢNH MẪU) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isTargetAdmin && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Lưu ý:</strong> Tài khoản vai trò <strong>Admin</strong> mặc định có toàn bộ quyền hệ thống. Các tùy biến tước quyền không áp dụng cho quản trị viên tối cao.
              </div>
            </div>
          )}

          {loadingDb ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-slate-200 rounded bg-white">
              <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
              <p className="text-xs font-semibold text-slate-700">Đang tải phân quyền thực tế từ cơ sở dữ liệu PostgreSQL...</p>
              <p className="text-[11px] text-slate-400">Vui lòng chờ trong giây lát</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 text-xs sm:text-sm">
                  {/* HEADER BẢNG MÀU XANH #0088cc GIỐNG HỆT ẢNH */}
                  <thead>
                    <tr className="bg-[#0088cc] text-white">
                      {/* Cột 1: Modules */}
                      <th className="py-2.5 px-3.5 sm:px-4 border border-sky-600/70 font-bold min-w-[220px]">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllModulesChecked}
                            disabled={saving || isTargetAdmin}
                            onChange={() => toggleCodeList(allCodes)}
                            className="w-4 h-4 rounded text-[#0088cc] bg-white border-white focus:ring-sky-300 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs sm:text-sm">Modules</span>
                        </label>
                      </th>

                      {/* Cột 2: Xem */}
                      <th className="py-2.5 px-3 text-center border border-sky-600/70 font-bold w-24 sm:w-28">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllReadChecked}
                            disabled={saving || isTargetAdmin}
                            onChange={() => toggleCodeList(readCodes)}
                            className="w-4 h-4 rounded text-[#0088cc] bg-white border-white focus:ring-sky-300 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs sm:text-sm">Xem</span>
                        </label>
                      </th>

                      {/* Cột 3: Thêm mới */}
                      <th className="py-2.5 px-3 text-center border border-sky-600/70 font-bold w-28 sm:w-32">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllCreateChecked}
                            disabled={saving || isTargetAdmin}
                            onChange={() => toggleCodeList(createCodes)}
                            className="w-4 h-4 rounded text-[#0088cc] bg-white border-white focus:ring-sky-300 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs sm:text-sm">Thêm mới</span>
                        </label>
                      </th>

                      {/* Cột 4: Sửa */}
                      <th className="py-2.5 px-3 text-center border border-sky-600/70 font-bold w-24 sm:w-28">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllUpdateChecked}
                            disabled={saving || isTargetAdmin}
                            onChange={() => toggleCodeList(updateCodes)}
                            className="w-4 h-4 rounded text-[#0088cc] bg-white border-white focus:ring-sky-300 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs sm:text-sm">Sửa</span>
                        </label>
                      </th>

                      {/* Cột 5: Xóa */}
                      <th className="py-2.5 px-3 text-center border border-sky-600/70 font-bold w-24 sm:w-28">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAllDeleteChecked}
                            disabled={saving || isTargetAdmin}
                            onChange={() => toggleCodeList(deleteCodes)}
                            className="w-4 h-4 rounded text-[#0088cc] bg-white border-white focus:ring-sky-300 cursor-pointer"
                          />
                          <span className="text-white font-bold text-xs sm:text-sm">Xóa</span>
                        </label>
                      </th>
                    </tr>
                  </thead>

                  {/* THÂN BẢNG: Ô CÓ QUYỀN THÌ CÓ CHECKBOX Ở GIỮA, Ô KHÔNG CÓ THÌ ĐỂ TRẮNG */}
                  <tbody className="divide-y divide-slate-200">
                    {filteredModules.map((m) => {
                      const rowCodes = [m.read, m.create, m.update, m.delete].filter(Boolean).map(String)
                      const isRowChecked =
                        rowCodes.length > 0 && rowCodes.every((code) => isPermissionActive(code))

                      return (
                        <tr key={m.id} className="hover:bg-sky-50/20 transition-colors">
                          {/* Cột 1: Tên Module với Checkbox */}
                          <td className="py-3 px-3.5 sm:px-4 border border-slate-200 font-medium text-slate-800">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isRowChecked}
                                disabled={saving || isTargetAdmin}
                                onChange={() => toggleCodeList(rowCodes)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0088cc] focus:ring-sky-500 cursor-pointer"
                              />
                              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                                {m.label}
                              </span>
                            </label>
                          </td>

                          {/* 4 Cột hành động: Xem, Thêm mới, Sửa, Xóa */}
                          {[m.read, m.create, m.update, m.delete].map((code, colIdx) => {
                            if (!code) {
                              return (
                                <td
                                  key={colIdx}
                                  className="py-3 px-3 border border-slate-200 bg-slate-50/40 text-center select-none"
                                >
                                  <span className="text-slate-300 font-bold text-xs select-none">—</span>
                                </td>
                              )
                            }

                            const codeStr = String(code)
                            const item = PERMISSION_CATALOG.find((it) => String(it.code) === codeStr)
                            const isActive = isPermissionActive(codeStr)

                            return (
                              <td
                                key={colIdx}
                                onClick={() => {
                                  if (!saving && !isTargetAdmin) {
                                    togglePermission(codeStr)
                                  }
                                }}
                                title={`${item?.label || codeStr} (${codeStr})\n${item?.description || ''}`}
                                className={`py-3 px-3 border border-slate-200 text-center transition-colors cursor-pointer select-none ${isActive
                                  ? 'bg-sky-50/40 hover:bg-sky-100/60'
                                  : 'bg-white hover:bg-slate-50'
                                  }`}
                              >
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    disabled={saving || isTargetAdmin}
                                    onChange={() => togglePermission(codeStr)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-slate-300 text-[#0088cc] focus:ring-sky-500 cursor-pointer"
                                  />
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions giống ảnh: Nút Lưu màu xanh lá & Hủy bỏ */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng quyền kích hoạt: <strong className="text-emerald-700">{activeCount}</strong> /{' '}
            {PERMISSION_CATALOG.length} quyền
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={saving || isTargetAdmin}
              onClick={handleFormSubmit}
              className="px-6 py-1.5 text-xs font-semibold rounded bg-[#28a745] hover:bg-[#218838] text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


