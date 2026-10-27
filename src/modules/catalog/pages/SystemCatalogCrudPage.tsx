'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Zap } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api-client'
import { usePermission } from '@/common/hooks/usePermission'
import { AppPermission } from '@/common/constants/permissions.constant'
import { useAuth } from '@/common/hooks/useAuth'
import {
  CONFIG,
  EMPTY,
  Field,
  at,
  formatReceptionSchedule,
  generateCode,
  money,
} from '../types/catalog.types'
import {
  batchBranchSpecialties,
  batchRoomSpecialties,
  createCatalog,
  deleteCatalog,
  listCatalog,
  suggestSymptoms,
  syncPackageVectors,
  updateCatalog,
} from '../services/catalogService'
import { vndAmountInWords as readVietnameseCurrency } from '@/modules/admin/utils/numberVi'

import CatalogTable from '../components/CatalogTable'
import CatalogDetailModal from '../components/CatalogDetailModal'
import CatalogFormModal from '../components/CatalogFormModal'
import BatchBranchModal from '../components/BatchBranchModal'
import BatchRoomModal from '../components/BatchRoomModal'

export default function SystemCatalogCrudPage({ resource }: { resource: keyof typeof CONFIG }) {
  const cfg = CONFIG[resource]
  const { role } = useAuth()
  const isBranchManager = role === 'branch_manager'
  const { hasPermission } = usePermission()
  const prefix = ({ branches: 'branch', rooms: 'room', specialties: 'specialty', 'service-packages': 'service', 'booking-methods': 'booking_method', 'branch-specialties': 'specialty', 'room-specialties': 'room' } as Record<string, string>)[resource]
  const canCreate = hasPermission(prefix + ':create') && !(isBranchManager && resource === 'branches')
  const canEdit = hasPermission(prefix + ':update')
  const canRemove = hasPermission(prefix + ':delete') && !(isBranchManager && resource === 'branches')

  const [rows, setRows] = useState<any[]>([])
  const [options, setOptions] = useState<Record<string, any[]>>({})
  const [q, setQ] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterSessionType, setFilterSessionType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [syncingVectors, setSyncingVectors] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [sortKey, setSortKey] = useState<string>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [symptomInput, setSymptomInput] = useState('')
  const [aiSuggestedSymptoms, setAiSuggestedSymptoms] = useState<string[]>([])
  const [loadingAiSymptoms, setLoadingAiSymptoms] = useState(false)
  const [aiSuggestionFeedback, setAiSuggestionFeedback] = useState<{ message: string; isError: boolean } | null>(null)
  const aiRequestId = useRef(0)
  useEffect(() => {
    aiRequestId.current++
    setLoadingAiSymptoms(false)
    setAiSuggestionFeedback(null)
  }, [modal, resource])

  // Batch Assignment Modal State
  const [batchModal, setBatchModal] = useState<'branch-specialties' | 'room-specialties' | null>(null)
  const [batchBranchId, setBatchBranchId] = useState<string>('')
  const [batchSpecialtyIds, setBatchSpecialtyIds] = useState<number[]>([])
  const [batchSpecialtyId, setBatchSpecialtyId] = useState<number>(0)
  const [batchRoomIds, setBatchRoomIds] = useState<string[]>([])
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchError, setBatchError] = useState('')

  const openBatchBranchModal = () => {
    const defaultBranchId = options.branches?.[0]?.id || ''
    setBatchBranchId(defaultBranchId)
    const activeIds = rows
      .filter((r) => (r.branchId === defaultBranchId || r.branch?.id === defaultBranchId) && r.isActive !== false)
      .map((r) => Number(r.specialtyId || r.specialty?.id))
    setBatchSpecialtyIds(activeIds)
    setBatchError('')
    setBatchModal('branch-specialties')
  }

  const openBatchRoomModal = () => {
    const defaultSpecialtyId = Number(options.specialties?.[0]?.id || 0)
    setBatchSpecialtyId(defaultSpecialtyId)
    const activeRooms = rows
      .filter((r) => Number(r.specialtyId || r.specialty?.id) === defaultSpecialtyId && r.isActive !== false)
      .map((r) => String(r.roomId || r.room?.id))
    setBatchRoomIds(activeRooms)
    setBatchError('')
    setBatchModal('room-specialties')
  }

  const handleSaveBatchBranch = async () => {
    if (!batchBranchId) {
      setBatchError('Vui lòng chọn cơ sở y tế.')
      return
    }
    setBatchSubmitting(true)
    setBatchError('')
    try {
      await batchBranchSpecialties(batchBranchId, batchSpecialtyIds)
      setSyncMsg('Đã cập nhật danh sách chuyên khoa cho cơ sở thành công.')
      setTimeout(() => setSyncMsg(''), 3500)
      setBatchModal(null)
      await load()
    } catch (err: any) {
      setBatchError(err?.response?.data?.message || err?.message || 'Gán chuyên khoa hàng loạt thất bại.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleSaveBatchRoom = async () => {
    if (!batchSpecialtyId) {
      setBatchError('Vui lòng chọn chuyên khoa.')
      return
    }
    setBatchSubmitting(true)
    setBatchError('')
    try {
      await batchRoomSpecialties(batchSpecialtyId, batchRoomIds)
      setSyncMsg('Đã cập nhật danh sách phòng khám cho chuyên khoa thành công.')
      setTimeout(() => setSyncMsg(''), 3500)
      setBatchModal(null)
      await load()
    } catch (err: any) {
      setBatchError(err?.response?.data?.message || err?.message || 'Gán phòng khám hàng loạt thất bại.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  const handleAddSymptom = (text: string) => {
    const symptom = text.trim().replace(/\s+/g, ' ').toLowerCase()
    if (!symptom) return
    setForm((previous: any) => ({
      ...previous,
      symptomTags: [...new Set([...(previous.symptomTags || []), symptom])],
    }))
    setSymptomInput('')
    setAiSuggestedSymptoms((previous) => previous.filter((item) => item.trim().toLowerCase() !== symptom))
  }

  const handleRemoveSymptom = (tag: string) => {
    const current: string[] = form.symptomTags || []
    setForm((prev: any) => ({ ...prev, symptomTags: current.filter((t) => t !== tag) }))
  }

  const handleAiSuggest = async () => {
    if (!String(form.name || '').trim()) {
      setAiSuggestionFeedback({ message: 'Vui lòng nhập tên trước khi lấy gợi ý triệu chứng.', isError: true })
      return
    }
    const requestId = ++aiRequestId.current
    setLoadingAiSymptoms(true)
    setAiSuggestionFeedback(null)
    setAiSuggestedSymptoms([])
    try {
      const specObj = (options.specialties || []).find((item: any) => String(item.id) === String(form.specialtyId))
      const res = await suggestSymptoms(form.name, resource === 'specialties' ? form.name : specObj?.name || '')
      if (requestId !== aiRequestId.current) return
      const current = new Set((form.symptomTags || []).map((item: string) => item.trim().toLowerCase()))
      const suggestions = [...new Set(res.map((item: string) => item.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))] as string[]
      const newSuggestions = suggestions.filter((item) => !current.has(item))
      setAiSuggestedSymptoms(newSuggestions)
      setAiSuggestionFeedback({
        message: !suggestions.length ? 'Chưa có gợi ý phù hợp. Bạn có thể nhập triệu chứng rồi nhấn Enter.'
          : !newSuggestions.length ? 'Các triệu chứng được gợi ý đã có trong danh sách của bạn.'
          : `Có ${newSuggestions.length} gợi ý. Chọn từng mục hoặc bấm Thêm tất cả.`,
        isError: false,
      })
    } catch (error) {
      if (requestId !== aiRequestId.current) return
      setAiSuggestionFeedback({ message: apiErrorMessage(error, 'Không thể lấy gợi ý triệu chứng. Vui lòng thử lại hoặc nhập thủ công.'), isError: true })
    } finally {
      if (requestId === aiRequestId.current) setLoadingAiSymptoms(false)
    }
  }

  const handleAddAllSuggested = () => {
    const current: string[] = form.symptomTags || []
    const merged = [...new Set([...current, ...aiSuggestedSymptoms.map((s) => s.toLowerCase())])]
    setForm((prev: any) => ({ ...prev, symptomTags: merged }))
    setAiSuggestedSymptoms([])
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await listCatalog(resource))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    setQ('')
    setFilterBranchId('')
    setFilterSessionType('')
    setDetailItem(null)
    setSyncMsg('')
    setSortKey(cfg.columns.some(([k]) => k === 'id') ? 'id' : cfg.columns[0]?.[0] || 'name')
    setSortDir('asc')
  }, [resource, cfg])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setFilterBranchId('')
    setQ('')
    const resources = [
      ...new Set([
        ...cfg.fields.map((field) => field[3]).filter(Boolean),
        ...(resource === 'service-packages' ? ['booking-methods'] : []),
      ]),
    ] as string[]
    Promise.all(resources.map(async (name) => [name, await listCatalog(name)] as const))
      .then((entries) => setOptions(Object.fromEntries(entries)))
      .catch(() => undefined)
  }, [cfg, resource])

  const filtered = useMemo(() => {
    let list = rows
    const term = q.trim().toLowerCase()
    if (term) {
      list = list.filter((row) => `${row.code || ''} ${row.name || ''}`.toLowerCase().includes(term))
    }
    if (resource === 'rooms' && filterBranchId) {
      list = list.filter((row) => (row.branchId || row.branch?.id) === filterBranchId)
    }
    if (resource === 'service-packages') {
      if (filterBranchId) {
        list = list.filter((row) => {
          const hasInLinks = row.branchBookingMethods?.some(
            (l: any) => (l.branchBookingMethod?.branchId || l.branchBookingMethod?.branch?.id) === filterBranchId
          )
          const bId = row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id || row.branchId
          return hasInLinks || bId === filterBranchId
        })
      }
      if (filterSessionType) {
        list = list.filter((row) => (row.receptionSchedules || []).some((day: any) => (!filterBranchId || day.branchId === filterBranchId) && day.sessions.includes(filterSessionType)))
      }
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const valA = at(a, sortKey)
        const valB = at(b, sortKey)
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        const numA = Number(valA)
        const numB = Number(valB)
        const isNum =
          !isNaN(numA) &&
          !isNaN(numB) &&
          typeof valA !== 'boolean' &&
          typeof valB !== 'boolean' &&
          String(valA).trim() !== '' &&
          String(valB).trim() !== ''

        const cmp = isNum ? numA - numB : String(valA).localeCompare(String(valB), 'vi')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [q, rows, resource, filterBranchId, filterSessionType, sortKey, sortDir])

  const openCreate = () => {
    if (!canCreate) return
    setSelected(null)
    const autoCode = ['service-packages', 'services', 'branches', 'rooms', 'medicines'].includes(resource)
      ? generateCode(resource)
      : ''
    const branchList = options.branches || []
    setForm({
      ...EMPTY,
      code: autoCode,
      price: '',
      receptionSchedules: [],
      applyAllBranches: false,
      branchIds: [],
      branchBookingMethodIds: [],
      branchId: filterBranchId || (branchList[0]?.id ?? ''),
      symptomTags: [],
      isActive: true,
      slug: '',
      slugAutoGenerated: true,
    })
    setSymptomInput('')
    setAiSuggestedSymptoms([])
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    if (!canEdit) return
    setSelected(row)
    const branchList = options.branches || []
    const specialtyBranchIds: string[] = resource === 'specialties'
      ? (row.branches?.map((b: any) => b.branchId) || [])
      : []

    const deployedBranchIds: string[] = [
      ...new Set([
        ...(row.branchBookingMethods?.map((l: any) => l.branchBookingMethod?.branchId || l.branchBookingMethod?.branch?.id) || []),
        row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id,
        ...specialtyBranchIds,
      ].filter(Boolean)),
    ] as string[]
    const rawSymptoms = Array.isArray(row.symptoms)
      ? row.symptoms
      : (Array.isArray(row.symptomTags) ? row.symptomTags : [])

    setForm({
      ...EMPTY,
      ...row,
      branchBookingMethodIds: [...new Set([
        ...(row.branchBookingMethods || []).map((link: any) => link.branchBookingMethodId),
        ...(row.branchBookingMethodId ? [row.branchBookingMethodId] : []),
      ])],
      applyAllBranches: branchList.length > 0 && deployedBranchIds.length >= branchList.length,
      branchIds: deployedBranchIds.length > 0 ? deployedBranchIds : (row.branchId ? [row.branchId] : []),
      branchId: row.branchId || (branchList[0]?.id ?? ''),
      symptomTags: rawSymptoms,
      isActive: row.isActive !== false,
      slug: row.slug || '',
      slugAutoGenerated: !row.slug,
    })
    setSymptomInput('')
    setAiSuggestedSymptoms([])
    setError('')
    setModal('edit')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (modal === 'create' ? !canCreate : !canEdit) return
    const payload: any = resource === 'service-packages' ? {
      name: form.name, code: form.code, price: form.price, specialtyId: form.specialtyId,
      imageUrl: form.imageUrl, description: form.description, durationMin: form.durationMin,
      isFeatured: form.isFeatured === true,
      isActive: form.isActive,
    } : { ...form }
    if (resource === 'specialties' || resource === 'service-packages') {
      // Also retain an unfinished input when the user saves without pressing Enter.
      payload.symptoms = [...new Set([
        ...(Array.isArray(form.symptomTags) ? form.symptomTags : []),
        symptomInput,
      ].map((text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()).filter(Boolean))]
      delete payload.symptomTags
    }
    if (resource === 'specialties') {
      const bList = options.branches || []
      const finalBranchIds = form.applyAllBranches
        ? bList.map((b: any) => b.id)
        : (form.branchIds || []).filter(Boolean)

      payload.branchIds = finalBranchIds
      payload.isActive = form.isActive !== false
      delete payload.branchId
    }
    if (resource === 'service-packages') {
      const bList = options.branches || []
      const finalBranchIds = form.applyAllBranches
        ? bList.map((b: any) => b.id)
        : (form.branchIds || []).filter(Boolean)

      if (finalBranchIds.length === 0) {
        return setError('Vui lòng chọn ít nhất một cơ sở y tế áp dụng gói khám.')
      }
      const methods = (options['booking-methods'] || []).filter((method: any) => finalBranchIds.includes(method.branchId) && (form.branchBookingMethodIds || []).includes(method.id))
      if (finalBranchIds.some((branchId: string) => !methods.some((method: any) => method.branchId === branchId))) return setError('Vui lòng chọn hình thức khám cho từng cơ sở đã chọn.')
      payload.branchBookingMethodIds = methods.map((method: any) => method.id)

      if (!form.name || !String(form.name).trim()) {
        return setError('Vui lòng nhập tên gói dịch vụ.')
      }
      if (Number(form.price) <= 0) {
        return setError('Vui lòng nhập giá gói dịch vụ hợp lệ.')
      }
      payload.price = Number(form.price)
      payload.branchReceptionSchedules = finalBranchIds.map((branchId: string) => ({
        branchId,
        schedules: (form.receptionSchedules || []).filter((day: any) => day.branchId === branchId)
          .map(({ dayOfWeek, sessions }: any) => ({ dayOfWeek, sessions })),
      }))
    }
    if (resource === 'rooms' && !String(form.branchId || '').trim()) {
      return setError('Vui lòng chọn chi nhánh cho phòng khám.')
    }
    if (!payload.code && ['service-packages', 'services', 'branches', 'rooms', 'medicines'].includes(resource)) {
      payload.code = generateCode(resource)
    }
    if (!['specialties', 'branch-specialties', 'room-specialties'].includes(resource) && !String(payload.code || '').trim()) {
      return setError('Mã không được để trống.')
    }
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') await createCatalog(resource, payload)
      else await updateCatalog(resource, selected.id, payload)
      setModal(null)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không lưu được dữ liệu.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: any) {
    if (!canRemove) return
    if (!confirm(`Ngừng sử dụng ${cfg.singular} “${row.name}”?`)) return
    try {
      await deleteCatalog(resource, row.id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không cập nhật được dữ liệu.')
    }
  }

  const display = (key: string, value: any) =>
    key === 'items'
      ? `${value?.length || 0} dịch vụ`
      : key === 'receptionSchedules'
        ? formatReceptionSchedule(value)
          : key === 'schedules'
            ? `${value?.length || 0} ngày / ${
                value?.reduce((total: number, item: any) => total + (item.slots?.length || 0), 0) || 0
              } khung giờ`
            : key.endsWith('examDate') && value
              ? new Date(value).toLocaleDateString('vi-VN')
              : ['price', 'unitPrice'].includes(key)
                ? money(value)
                : key === 'durationMin'
                  ? `${value || 0} phút`
                  : key === 'isActive'
                    ? value !== false ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Tạm ẩn
                        </span>
                      )
                    : key === 'specialties'
                      ? (value?.map((item: any) => item.specialty?.name).filter(Boolean).join(', ') || '—')
                      : value ?? '—'

  const optionValue = (field: Field, option: any) => (field[3] === 'specialties' ? String(option.id) : option.id)

  const fieldOptions = (source?: string) => {
    const raw = options[source || ''] || []
    if (source === 'booking-methods') {
      if (form.branchId) {
        return raw.filter((option: any) => option.branchId === form.branchId)
      }
      return raw.map((option: any) => ({
        ...option,
        displayName: option.branch?.name ? `${option.displayName} (${option.branch.name})` : option.displayName,
      }))
    }
    return raw
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý danh mục & Cơ sở</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{cfg.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý {cfg.singular} và trạng thái áp dụng.</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && resource === 'branch-specialties' && (
            <button
              type="button"
              onClick={openBatchBranchModal}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              Thêm chuyên khoa
            </button>
          )}
          {canEdit && resource === 'room-specialties' && (
            <button
              type="button"
              onClick={openBatchRoomModal}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-600 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-700" />
              Gán phòng khám hàng loạt
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm {cfg.singular}
            </button>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {syncMsg && (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
        </div>
      )}

      <CatalogTable
        resource={resource}
        cfg={cfg}
        filtered={filtered}
        loading={loading}
        q={q}
        setQ={setQ}
        filterBranchId={filterBranchId}
        setFilterBranchId={setFilterBranchId}
        filterSessionType={filterSessionType}
        setFilterSessionType={setFilterSessionType}
        options={options}
        sortKey={sortKey}
        setSortKey={setSortKey}
        sortDir={sortDir}
        setSortDir={setSortDir}
        syncingVectors={syncingVectors}
        onSyncVectors={async () => {
          setSyncingVectors(true)
          setError('')
          setSyncMsg('')
          try {
            const res = await syncPackageVectors()
            setSyncMsg(res?.message || 'Đã gửi yêu cầu đồng bộ vector vào hàng đợi RabbitMQ!')
            setTimeout(() => setSyncMsg(''), 6000)
          } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu đồng bộ vector.')
          } finally {
            setSyncingVectors(false)
          }
        }}
        onRefresh={() => void load()}
        onDetail={(row) => setDetailItem(row)}
        onEdit={(row) => openEdit(row)}
        onRemove={(row) => void remove(row)}
        canEdit={canEdit}
        canSyncVectors={canEdit && role === 'chain_manager'}
        canRemove={canRemove}
        display={display}
      />

      <CatalogFormModal
        modal={modal}
        onClose={() => setModal(null)}
        onSubmit={submit}
        saving={saving}
        cfg={cfg}
        resource={resource}
        form={form}
        setForm={setForm}
        options={options}
        fieldOptions={fieldOptions}
        optionValue={optionValue}
        generateCode={generateCode}
        money={money}
        readVietnameseCurrency={readVietnameseCurrency}
        symptomInput={symptomInput}
        setSymptomInput={setSymptomInput}
        aiSuggestedSymptoms={aiSuggestedSymptoms}
        setAiSuggestedSymptoms={setAiSuggestedSymptoms}
        aiSuggestionFeedback={aiSuggestionFeedback}
        loadingAiSymptoms={loadingAiSymptoms}
        onAiSuggest={handleAiSuggest}
        onAddSymptom={handleAddSymptom}
        onRemoveSymptom={handleRemoveSymptom}
        onAddAllSuggested={handleAddAllSuggested}
      />

      <CatalogDetailModal
        canEdit={canEdit}
        detailItem={detailItem}
        cfg={cfg}
        resource={resource}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => openEdit(item)}
        display={display}
      />

      <BatchBranchModal
        open={batchModal === 'branch-specialties'}
        onClose={() => setBatchModal(null)}
        options={options}
        rows={rows}
        batchBranchId={batchBranchId}
        setBatchBranchId={setBatchBranchId}
        batchSpecialtyIds={batchSpecialtyIds}
        setBatchSpecialtyIds={setBatchSpecialtyIds}
        batchSubmitting={batchSubmitting}
        batchError={batchError}
        onSave={handleSaveBatchBranch}
      />

      <BatchRoomModal
        open={batchModal === 'room-specialties'}
        onClose={() => setBatchModal(null)}
        options={options}
        rows={rows}
        batchSpecialtyId={batchSpecialtyId}
        setBatchSpecialtyId={setBatchSpecialtyId}
        batchRoomIds={batchRoomIds}
        setBatchRoomIds={setBatchRoomIds}
        batchSubmitting={batchSubmitting}
        batchError={batchError}
        onSave={handleSaveBatchRoom}
      />
    </>
  )
}
