import { useState } from 'react'
import { useProjectStore } from '../state/store'
import type { WidgetType } from '../model/schema'
import { WIDGET_LABELS } from '../model/schema'
import type { Issue } from '../model/validate'

const TYPE_CHIPS: Record<WidgetType, string> = {
  switch: 'toggle',
  rangeInt: 'slider int',
  rangeFloat: 'slider float',
  selectorString: 'string list',
  button: 'button',
  keyBinding: 'keybind',
}

export function OptionList(props: { issues: Issue[] }) {
  const doc = useProjectStore((s) => s.doc)
  const selectedSubcategoryId = useProjectStore((s) => s.selectedSubcategoryId)
  const selectedOptionId = useProjectStore((s) => s.selectedOptionId)
  const { addOption, moveOption, duplicateOption, removeOption, selectOption } = useProjectStore()
  const [newType, setNewType] = useState<WidgetType>('switch')

  if (!selectedSubcategoryId || !doc.subcategories.some((c) => c.id === selectedSubcategoryId)) {
    return <div className="empty-state">Select a subcategory above to edit its options.</div>
  }

  const options = doc.options.filter((o) => o.subcategory === selectedSubcategoryId)

  const worstFor = (id: string): 'error' | 'warning' | null => {
    const relevant = props.issues.filter((i) => i.path === `option:${id}`)
    if (relevant.some((i) => i.severity === 'error')) return 'error'
    if (relevant.length) return 'warning'
    return null
  }

  return (
    <div>
      {options.length === 0 && (
        <div className="empty-state">
          <strong>This subcategory is empty.</strong> Pick a widget type below and press Add option;
          it appears in the preview immediately.
        </div>
      )}
      {options.map((opt, i) => {
        const dot = worstFor(opt.id)
        return (
          <div
            key={opt.id}
            className={`list-item ${selectedOptionId === opt.id ? 'active' : ''}`}
            onClick={() => selectOption(opt.id)}
            style={{ cursor: 'pointer' }}
          >
            {dot && <span className={`issue-dot ${dot}`} />}
            <span className="type-chip">{TYPE_CHIPS[opt.type]}</span>
            <span className="grow">
              {opt.label} <span className="dim">({opt.id})</span>
            </span>
            {opt.showInMenu === false && <span className="dim">hidden</span>}
            <button className="icon" disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveOption(opt.id, -1) }}>▲</button>
            <button className="icon" disabled={i === options.length - 1} onClick={(e) => { e.stopPropagation(); moveOption(opt.id, 1) }}>▼</button>
            <button className="icon" title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateOption(opt.id) }}>⧉</button>
            <button
              className="icon danger"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`Delete option "${opt.label}"?`)) removeOption(opt.id)
              }}
            >
              ✕
            </button>
          </div>
        )
      })}

      <div className="row" style={{ marginTop: 8 }}>
        <select value={newType} onChange={(e) => setNewType(e.target.value as WidgetType)}>
          {(Object.keys(WIDGET_LABELS) as WidgetType[]).map((t) => (
            <option key={t} value={t}>{WIDGET_LABELS[t]}</option>
          ))}
        </select>
        <button style={{ flex: '0 0 auto' }} onClick={() => addOption(newType, selectedSubcategoryId)}>
          Add option
        </button>
      </div>
    </div>
  )
}
