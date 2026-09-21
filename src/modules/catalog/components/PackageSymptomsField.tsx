'use client'

import React from 'react'
import { X, Loader2 } from 'lucide-react'

interface PackageSymptomsFieldProps {
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
  symptomInput: string
  setSymptomInput: (val: string) => void
  aiSuggestedSymptoms: string[]
  setAiSuggestedSymptoms: React.Dispatch<React.SetStateAction<string[]>>
  loadingAiSymptoms: boolean
  onAiSuggest: () => void
  onAddSymptom: (text: string) => void
  onRemoveSymptom: (tag: string) => void
  onAddAllSuggested: () => void
}

export default function PackageSymptomsField({
  form,
  symptomInput,
  setSymptomInput,
  aiSuggestedSymptoms,
  loadingAiSymptoms,
  onAiSuggest,
  onAddSymptom,
  onRemoveSymptom,
  onAddAllSuggested,
}: PackageSymptomsFieldProps) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-semibold text-slate-700">
            Triệu chứng lâm sàng liên quan
          </span>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
            Nhập triệu chứng rồi nhấn <span className="font-medium text-slate-600">Enter</span> hoặc bấm Gợi ý triệu chứng.
          </p>
        </div>

        <button
          type="button"
          onClick={onAiSuggest}
          disabled={loadingAiSymptoms}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          {loadingAiSymptoms && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
          <span>{loadingAiSymptoms ? 'Đang phân tích...' : 'Gợi ý triệu chứng'}</span>
        </button>
      </div>

      {/* Khung nhập tag clean tích hợp */}
      <div className="rounded border border-slate-200 bg-white p-2 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 transition">
        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
          {(form.symptomTags || []).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveSymptom(tag)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Xóa triệu chứng"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="flex-1 min-w-[240px] flex items-center gap-1.5">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  onAddSymptom(symptomInput)
                } else if (e.key === 'Backspace' && !symptomInput && (form.symptomTags || []).length > 0) {
                  const current = form.symptomTags || []
                  onRemoveSymptom(current[current.length - 1])
                }
              }}
              placeholder={
                (form.symptomTags || []).length > 0
                  ? 'Thêm triệu chứng khác (nhấn Enter)...'
                  : 'Nhập triệu chứng (ví dụ: mắc ói, đau đầu, tức ngực...)'
              }
              className="flex-1 border-none bg-transparent px-1.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {symptomInput.trim() && (
              <button
                type="button"
                onClick={() => onAddSymptom(symptomInput)}
                className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer shrink-0"
              >
                Thêm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Khay hiển thị gợi ý */}
      {aiSuggestedSymptoms.length > 0 && (
        <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              Gợi ý liên quan ({aiSuggestedSymptoms.length}):
            </span>
            <button
              type="button"
              onClick={onAddAllSuggested}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              + Thêm tất cả
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {aiSuggestedSymptoms.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAddSymptom(s)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
              >
                <span>+ {s}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
