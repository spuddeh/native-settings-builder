import { useProjectStore } from '../state/store'
import type { CompatRule } from '../model/schema'
import { CheckField, TextField } from './fields'

export function CompatRulesEditor() {
  const doc = useProjectStore((s) => s.doc)
  const setCompat = useProjectStore((s) => s.setCompat)
  const rules = doc.compat ?? []

  const setRule = (i: number, rule: CompatRule | null) => {
    const next = [...rules]
    if (rule === null) next.splice(i, 1)
    else next[i] = rule
    setCompat(next.length ? next : undefined)
  }

  const valueOptions = doc.options.filter((o) => o.type !== 'button')

  return (
    <div>
      <p className="hint" style={{ marginTop: 0 }}>
        Optional. Automatically set options when a companion mod's archive is installed,
        e.g. enable a compatibility variant when another location mod is present.
      </p>
      {rules.map((rule, i) => (
        <div key={i} style={{ border: '1px solid var(--app-line)', borderRadius: 4, padding: 10, marginBottom: 10 }}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <TextField
              label="If this archive exists"
              value={rule.ifArchive}
              onChange={(ifArchive) => setRule(i, { ...rule, ifArchive })}
              mono
              placeholder="some_other_mod.archive"
            />
            <button className="icon danger" style={{ flex: '0 0 auto', marginBottom: 10 }} onClick={() => setRule(i, null)}>
              ✕
            </button>
          </div>
          <CheckField
            label="Apply only once (player can change it back afterwards)"
            checked={rule.once}
            onChange={(once) => setRule(i, { ...rule, once })}
          />
          <div className="field-label">Then set</div>
          {Object.entries(rule.set).map(([optionId, value]) => {
            const opt = doc.options.find((o) => o.id === optionId)
            return (
              <div className="row" key={optionId} style={{ marginBottom: 6, alignItems: 'center' }}>
                <code style={{ flex: '0 0 38%', fontSize: 13 }}>{optionId}</code>
                <ValueInput
                  type={opt?.type}
                  value={value}
                  onChange={(v) => setRule(i, { ...rule, set: { ...rule.set, [optionId]: v } })}
                />
                <button
                  className="icon danger"
                  style={{ flex: '0 0 auto' }}
                  onClick={() => {
                    const set = { ...rule.set }
                    delete set[optionId]
                    setRule(i, { ...rule, set })
                  }}
                >
                  ✕
                </button>
              </div>
            )
          })}
          <AddSetRow
            candidates={valueOptions.map((o) => o.id).filter((id) => !(id in rule.set))}
            onAdd={(optionId) => {
              const opt = doc.options.find((o) => o.id === optionId)
              const initial = opt?.type === 'switch' ? true : opt && 'default' in opt ? opt.default : true
              setRule(i, { ...rule, set: { ...rule.set, [optionId]: initial } })
            }}
          />
        </div>
      ))}
      <button onClick={() => setCompat([...rules, { ifArchive: '', set: {}, once: true }])}>
        Add compatibility rule
      </button>
    </div>
  )
}

function ValueInput(props: {
  type: string | undefined
  value: boolean | number | string
  onChange: (v: boolean | number | string) => void
}) {
  if (props.type === 'switch') {
    return (
      <select value={String(props.value)} onChange={(e) => props.onChange(e.target.value === 'true')}>
        <option value="true">ON</option>
        <option value="false">OFF</option>
      </select>
    )
  }
  if (props.type === 'rangeInt' || props.type === 'rangeFloat') {
    return (
      <input
        type="number"
        value={typeof props.value === 'number' ? props.value : 0}
        onChange={(e) => props.onChange(e.target.valueAsNumber)}
      />
    )
  }
  // selectors (element string), keybindings (IK_*), unknown ids
  return (
    <input type="text" value={String(props.value)} onChange={(e) => props.onChange(e.target.value)} />
  )
}

function AddSetRow(props: { candidates: string[]; onAdd: (id: string) => void }) {
  if (props.candidates.length === 0) return null
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) props.onAdd(e.target.value)
      }}
    >
      <option value="">+ set an option…</option>
      {props.candidates.map((id) => (
        <option key={id} value={id}>{id}</option>
      ))}
    </select>
  )
}
