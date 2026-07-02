import type { Apply, ApplyKind, SettingsOption } from '../model/schema'
import { APPLY_LABELS, LEGAL_APPLY } from '../model/schema'
import { slugify } from '../model/defaults'
import { SelectField, TextField } from './fields'

function defaultApply(kind: ApplyKind, opt: SettingsOption): Apply {
  switch (kind) {
    case 'variant':
      return { kind, ref: '', variant: '' }
    case 'swap':
      return { kind, ref: '', variantOn: '', variantOff: '' }
    case 'selectorVariant':
      return {
        kind,
        ref: '',
        variants: opt.type === 'selectorString' ? opt.elements.map(() => '') : [],
      }
    case 'nif':
      return { kind, project: '' }
    case 'callback':
      return { kind, function: `${slugify(opt.id)}_changed`, lua: '' }
  }
}

export function ApplyEditor({ opt, update }: { opt: SettingsOption; update: (o: SettingsOption) => void }) {
  const legal = LEGAL_APPLY[opt.type]
  const kind = opt.apply?.kind ?? ''

  return (
    <div style={{ borderTop: '1px solid var(--app-line)', paddingTop: 10, marginTop: 4 }}>
      <SelectField
        label="Effect when changed"
        value={kind}
        onChange={(k) => {
          if (k === '') {
            const next = { ...opt }
            delete next.apply
            update(next as SettingsOption)
          } else {
            update({ ...opt, apply: defaultApply(k as ApplyKind, opt) } as SettingsOption)
          }
        }}
        options={legal.map((k) => ({
          value: k,
          label: k === '' ? 'None (plain value your scripts can read)' : APPLY_LABELS[k],
        }))}
      />
      <ApplyFields opt={opt} update={update} />
    </div>
  )
}

function ApplyFields({ opt, update }: { opt: SettingsOption; update: (o: SettingsOption) => void }) {
  const apply = opt.apply
  if (!apply) return null

  const set = (next: Apply) => update({ ...opt, apply: next } as SettingsOption)

  switch (apply.kind) {
    case 'variant':
      return (
        <>
          <TextField
            label="Variant NodeRef"
            value={apply.ref}
            onChange={(ref) => set({ ...apply, ref })}
            mono
            placeholder="$/yourname/your_location/variants"
            hint="The Variant Node Ref you set when exporting from World Builder"
          />
          <TextField
            label="Variant name"
            value={apply.variant}
            onChange={(variant) => set({ ...apply, variant })}
            mono
            hint="Shown when this option is ON; hidden when OFF"
          />
        </>
      )
    case 'swap':
      return (
        <>
          <TextField
            label="Variant NodeRef"
            value={apply.ref}
            onChange={(ref) => set({ ...apply, ref })}
            mono
            placeholder="$/yourname/your_location/variants"
          />
          <div className="row">
            <TextField
              label="Variant when ON"
              value={apply.variantOn}
              onChange={(variantOn) => set({ ...apply, variantOn })}
              mono
            />
            <TextField
              label="Variant when OFF"
              value={apply.variantOff}
              onChange={(variantOff) => set({ ...apply, variantOff })}
              mono
            />
          </div>
        </>
      )
    case 'selectorVariant': {
      if (opt.type !== 'selectorString') return null
      return (
        <>
          <TextField
            label="Variant NodeRef"
            value={apply.ref}
            onChange={(ref) => set({ ...apply, ref })}
            mono
            placeholder="$/yourname/your_location/variants"
          />
          <div className="field">
            <span className="field-label">Variant name per element</span>
            {opt.elements.map((el, i) => (
              <div className="row" key={i} style={{ marginBottom: 6, alignItems: 'center' }}>
                <span style={{ flex: '0 0 40%' }} className="dim">{el || `(element ${i + 1})`}</span>
                <input
                  type="text"
                  style={{ fontFamily: 'Consolas, monospace', fontSize: 14 }}
                  value={apply.variants[i] ?? ''}
                  onChange={(e) => {
                    const variants = [...apply.variants]
                    variants[i] = e.target.value
                    set({ ...apply, variants })
                  }}
                />
              </div>
            ))}
            <div className="hint">Exactly one of these is visible at a time; the selected one is turned on, the rest off.</div>
          </div>
        </>
      )
    }
    case 'nif':
      return (
        <TextField
          label="Native Interactions project"
          value={apply.project}
          onChange={(project) => set({ ...apply, project })}
          mono
          hint="Project name as defined in your Native Interactions Framework setup"
        />
      )
    case 'callback':
      return (
        <>
          <TextField
            label="Function name"
            value={apply.function}
            onChange={(fn) => set({ ...apply, function: fn })}
            mono
            hint="Emitted into user_callbacks.lua; lowercase_with_underscores"
          />
          <label className="field">
            <span>Lua code</span>
            <textarea
              className="code"
              value={apply.lua}
              spellCheck={false}
              placeholder={'-- runs when the value changes (buttons: on press)\n-- the new value is available as "value"\nprint("changed to " .. tostring(value))'}
              onChange={(e) => set({ ...apply, lua: e.target.value })}
            />
            <div className="hint">
              Wrapped in a function(value) in user_callbacks.lua. Errors are caught and logged, they cannot break the menu.
            </div>
          </label>
        </>
      )
  }
}
