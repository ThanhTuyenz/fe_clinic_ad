const EXAM_TABS = ['info', 'prescription', 'history']

function isEditableTarget(el) {
  if (!el) return false
  if (el.closest?.('[data-dr-shortcuts="off"]')) return true
  const tag = String(el.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return Boolean(el.isContentEditable)
}

/**
 * @param {KeyboardEvent} e
 * @param {{
 *   onSave?: () => void
 *   onFinish?: () => void
 *   onFocusSearch?: () => void
 *   onQr?: () => void
 *   onRefresh?: () => void
 *   onTab?: (tabId: string) => void
 *   onPrevPatient?: () => void
 *   onNextPatient?: () => void
 *   onEscape?: () => void
 * }} handlers
 * @param {{ modalOpen?: boolean }} opts
 */
export function runDoctorShortcut(e, handlers, { modalOpen = false } = {}) {
  if (modalOpen) {
    if (e.key === 'Escape') {
      e.preventDefault()
      handlers.onEscape?.()
    }
    return
  }

  const typing = isEditableTarget(document.activeElement)

  if (e.ctrlKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    handlers.onSave?.()
    return
  }

  if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    handlers.onFinish?.()
    return
  }

  if (e.key === 'F2') {
    e.preventDefault()
    handlers.onFocusSearch?.()
    return
  }

  if (e.altKey && !e.ctrlKey && (e.key === 'q' || e.key === 'Q')) {
    e.preventDefault()
    handlers.onQr?.()
    return
  }

  if (e.key === 'F6') {
    e.preventDefault()
    handlers.onRefresh?.()
    return
  }

  if (e.altKey && !e.ctrlKey && /^[1-3]$/.test(e.key)) {
    e.preventDefault()
    handlers.onTab?.(EXAM_TABS[Number(e.key) - 1])
    return
  }

  if (!typing) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      handlers.onNextPatient?.()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      handlers.onPrevPatient?.()
    }
  }
}

export { EXAM_TABS }
