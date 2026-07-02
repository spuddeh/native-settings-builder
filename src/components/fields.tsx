import { useEffect, type ReactNode } from 'react'

/** Modal shell: backdrop click and Escape both close. */
export function Dialog(props: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="dialog-backdrop" onClick={props.onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{props.title}</h2>
        <div className="dialog-scroll">{props.children}</div>
      </div>
    </div>
  )
}

export function TextField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        style={props.mono ? { fontFamily: 'Consolas, monospace', fontSize: 14 } : undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {props.hint && <div className="hint">{props.hint}</div>}
    </label>
  )
}

export function NumberField(props: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  hint?: string
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : ''}
        step={props.step ?? 'any'}
        onChange={(e) => props.onChange(e.target.valueAsNumber)}
      />
      {props.hint && <div className="hint">{props.hint}</div>}
    </label>
  )
}

export function SelectField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {props.hint && <div className="hint">{props.hint}</div>}
    </label>
  )
}

export function CheckField(props: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      {props.label}
    </label>
  )
}

export function Section(props: {
  title: string
  children: ReactNode
  open: boolean
  onToggle: () => void
  badge?: string
}) {
  return (
    <div className="section">
      <div className="section-head" onClick={props.onToggle}>
        <h2>{props.title}</h2>
        {props.badge && <span className="section-chip">{props.badge}</span>}
        <span className="caret">{props.open ? '▼' : '▶'}</span>
      </div>
      {props.open && <div className="section-body">{props.children}</div>}
    </div>
  )
}
