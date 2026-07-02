import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../state/store'
import type { SelectorStringOption, SettingsOption, WidgetType } from '../model/schema'
import { WIDGET_LABELS } from '../model/schema'
import { convertOption } from '../model/defaults'
import { IK_KEYS } from '../model/ikKeys'
import { CheckField, NumberField, SelectField, TextField } from './fields'
import { ApplyEditor } from './ApplyEditor'

export function OptionEditor() {
  const doc = useProjectStore((s) => s.doc)
  const selectedOptionId = useProjectStore((s) => s.selectedOptionId)
  const updateOption = useProjectStore((s) => s.updateOption)
  const [editingId, setEditingId] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Bring the editor into view when an option is picked (list or preview click).
  useEffect(() => {
    if (selectedOptionId) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedOptionId])

  const opt = doc.options.find((o) => o.id === selectedOptionId)
  if (!opt) {
    return (
      <div className="empty-state" ref={scrollRef}>
        Pick an option from the list above, or click a row in the preview, to edit it here.
      </div>
    )
  }

  const update = (next: SettingsOption) => updateOption(opt.id, next)

  return (
    <div ref={scrollRef}>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <TextField label="Label" value={opt.label} onChange={(label) => update({ ...opt, label })} />
        <div className="field" style={{ flex: 1 }}>
          <span className="field-label">Id (save key)</span>
          {editingId ? (
            <input
              type="text"
              value={opt.id}
              style={{ fontFamily: 'Consolas, monospace', fontSize: 14 }}
              onChange={(e) => update({ ...opt, id: e.target.value })}
              onBlur={() => setEditingId(false)}
              autoFocus
            />
          ) : (
            <div className="row" style={{ alignItems: 'center' }}>
              <code style={{ fontSize: 14 }}>{opt.id}</code>
              <button
                className="icon"
                style={{ flex: '0 0 auto' }}
                onClick={() => {
                  if (window.confirm('Changing the id resets this option to its default for players who already saved a choice under the old id. Change it anyway?')) {
                    setEditingId(true)
                  }
                }}
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>
      <TextField
        label="Description"
        value={opt.description}
        onChange={(description) => update({ ...opt, description })}
        hint="Tooltip shown in-game. Also usable as LocKey#…"
      />
      <div className="row">
        <SelectField
          label="Section"
          value={opt.category}
          onChange={(category) => update({ ...opt, category })}
          options={doc.categories.map((c) => ({ value: c.id, label: c.label }))}
        />
        <SelectField
          label="Widget"
          value={opt.type}
          onChange={(type) => update(convertOption(opt, type as WidgetType))}
          options={(Object.keys(WIDGET_LABELS) as WidgetType[]).map((t) => ({
            value: t,
            label: WIDGET_LABELS[t],
          }))}
          hint="Switching widget resets its widget-specific fields (range, choices, effect details)"
        />
      </div>
      {opt.type !== 'button' && (
        <CheckField
          label="Show in menu (untick for hidden, API-driven settings)"
          checked={opt.showInMenu !== false}
          onChange={(show) => update({ ...opt, showInMenu: show ? undefined : false })}
        />
      )}

      <TypeFields opt={opt} update={update} />
      <ApplyEditor opt={opt} update={update} />
    </div>
  )
}

function TypeFields({ opt, update }: { opt: SettingsOption; update: (o: SettingsOption) => void }) {
  switch (opt.type) {
    case 'switch':
      return (
        <CheckField label="Default: ON" checked={opt.default} onChange={(d) => update({ ...opt, default: d })} />
      )
    case 'rangeInt':
    case 'rangeFloat': {
      const isFloat = opt.type === 'rangeFloat'
      return (
        <>
          <div className="row">
            <NumberField label="Min" value={opt.min} onChange={(min) => update({ ...opt, min })} />
            <NumberField label="Max" value={opt.max} onChange={(max) => update({ ...opt, max })} />
            <NumberField label="Step" value={opt.step} onChange={(step) => update({ ...opt, step })} />
            <NumberField label="Default" value={opt.default} onChange={(d) => update({ ...opt, default: d })} />
          </div>
          {isFloat && (
            <TextField
              label="Number format"
              value={opt.format}
              onChange={(format) => update({ ...opt, format })}
              mono
              hint={'Lua string.format spec, e.g. "%.2f" for two decimals'}
            />
          )}
        </>
      )
    }
    case 'selectorString':
      return <SelectorElements opt={opt} update={update} />
    case 'button':
      return (
        <div className="row">
          <TextField
            label="Button text"
            value={opt.buttonText}
            onChange={(buttonText) => update({ ...opt, buttonText })}
          />
          <NumberField
            label="Text size"
            value={opt.textSize ?? 45}
            onChange={(textSize) => update({ ...opt, textSize })}
            hint="45 matches the vanilla look"
          />
        </div>
      )
    case 'keyBinding':
      return (
        <>
          <SelectField
            label="Default key"
            value={opt.default}
            onChange={(d) => update({ ...opt, default: d })}
            options={IK_KEYS.map((k) => ({ value: k, label: k }))}
          />
          <CheckField
            label="Hold binding (fires on press AND release)"
            checked={opt.isHold === true}
            onChange={(isHold) => update({ ...opt, isHold: isHold || undefined })}
          />
        </>
      )
  }
}

function SelectorElements({ opt, update }: { opt: SelectorStringOption; update: (o: SettingsOption) => void }) {
  const setElements = (elements: string[]) => {
    const next: SelectorStringOption = {
      ...opt,
      elements,
      default: Math.min(opt.default, elements.length) || 1,
    }
    if (next.apply?.kind === 'selectorVariant') {
      const variants = [...next.apply.variants]
      while (variants.length < elements.length) variants.push('')
      variants.length = elements.length
      next.apply = { ...next.apply, variants }
    }
    update(next)
  }

  return (
    <div className="field">
      <span className="field-label">Choices</span>
      {opt.elements.map((el, i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <input type="text" value={el} onChange={(e) => {
            const elements = [...opt.elements]
            elements[i] = e.target.value
            setElements(elements)
          }} />
          <label className="check" style={{ flex: '0 0 auto', marginBottom: 0 }}>
            <input
              type="radio"
              name={`default_${opt.id}`}
              checked={opt.default === i + 1}
              onChange={() => update({ ...opt, default: i + 1 })}
            />
            default
          </label>
          <button
            className="icon danger"
            style={{ flex: '0 0 auto' }}
            disabled={opt.elements.length <= 2}
            onClick={() => setElements(opt.elements.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button onClick={() => setElements([...opt.elements, `Option ${String.fromCharCode(65 + opt.elements.length)}`])}>
        Add choice
      </button>
      <div className="hint">Choice texts are also the save keys; renaming one resets saved player choices for it.</div>
    </div>
  )
}
