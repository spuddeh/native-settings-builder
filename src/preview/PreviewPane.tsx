import { useEffect, useState } from 'react'
import { useProjectStore } from '../state/store'
import type { SettingsDoc, SettingsOption } from '../model/schema'
import { ikDisplay } from '../model/ikKeys'
import './preview.css'

type PreviewValues = Record<string, boolean | number | string>

function defaults(doc: SettingsDoc): PreviewValues {
  const values: PreviewValues = {}
  for (const opt of doc.options) {
    if (opt.type !== 'button') values[opt.id] = opt.default
  }
  return values
}

/** Interactive, throwaway mock of the in-game Mods settings screen. */
export function PreviewPane() {
  const doc = useProjectStore((s) => s.doc)
  const [values, setValues] = useState<PreviewValues>(() => defaults(doc))
  const [view, setView] = useState<'landing' | 'detail'>(doc.mod.tabMode === 'shared' ? 'landing' : 'detail')

  // Re-seed preview values when the definition changes shape.
  useEffect(() => {
    setValues((prev) => {
      const next = defaults(doc)
      for (const key of Object.keys(next)) {
        if (key in prev && typeof prev[key] === typeof next[key]) next[key] = prev[key]
      }
      return next
    })
  }, [doc])

  useEffect(() => {
    setView(doc.mod.tabMode === 'shared' ? 'landing' : 'detail')
  }, [doc.mod.tabMode])

  const tabLabel = doc.mod.tabMode === 'shared' ? doc.mod.sharedTab?.label : doc.mod.ownTab?.label
  const visible = doc.options.filter((o) => o.showInMenu !== false)

  return (
    <div className="cp-pane">
      <div className="cp-tabbar">
        <span className="cp-tab">Audio</span>
        <span className="cp-tab">Video</span>
        <span className="cp-tab active">{tabLabel || 'My Mod'}</span>
        <span className="cp-tab">Gameplay</span>
      </div>

      {doc.mod.tabMode === 'shared' && view === 'landing' ? (
        <>
          <div className="cp-subheader">{doc.mod.sharedTab?.landingHeader || 'Select a mod to configure'}</div>
          <Row label={doc.mod.modName} desc="">
            <button className="cp-button" onClick={() => setView('detail')}>Enter</button>
          </Row>
          <div className="cp-hint">
            Other installed mods sharing the tab "{doc.mod.sharedTab?.label}" would be listed here too, alphabetically.
          </div>
        </>
      ) : (
        <>
          {doc.mod.tabMode === 'shared' && (
            <>
              <div className="cp-subheader">{doc.mod.modName}</div>
              <Row label="Back" desc="Return to the mod list">
                <button className="cp-button" onClick={() => setView('landing')}>Back</button>
              </Row>
            </>
          )}
          {doc.categories.map((cat) => {
            const options = visible.filter((o) => o.category === cat.id)
            if (options.length === 0) return null
            return (
              <div key={cat.id}>
                <div className="cp-subheader">
                  {doc.mod.subCategoryPrefix ? `${doc.mod.subCategoryPrefix.replace(/_/g, ' ')} - ` : ''}
                  {cat.label}
                </div>
                {options.map((opt) => (
                  <Row key={opt.id} label={opt.label} desc={opt.description}>
                    <Widget opt={opt} values={values} setValues={setValues} />
                  </Row>
                ))}
              </div>
            )
          })}
          {visible.length === 0 && <div className="cp-empty">Add options on the left to see them here.</div>}
        </>
      )}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="cp-row">
      <div className="cp-row-text">
        <div className="cp-row-label">{label}</div>
        {desc && <div className="cp-row-desc">{desc}</div>}
      </div>
      <div className="cp-widget">{children}</div>
    </div>
  )
}

function Widget({
  opt,
  values,
  setValues,
}: {
  opt: SettingsOption
  values: PreviewValues
  setValues: React.Dispatch<React.SetStateAction<PreviewValues>>
}) {
  const set = (v: boolean | number | string) => setValues((prev) => ({ ...prev, [opt.id]: v }))

  switch (opt.type) {
    case 'switch': {
      const on = values[opt.id] === true
      return (
        <div className="cp-toggle" onClick={() => set(!on)}>
          <span className={`cp-toggle-seg ${on ? 'on' : ''}`}>ON</span>
          <span className={`cp-toggle-seg ${on ? '' : 'on'}`}>OFF</span>
        </div>
      )
    }
    case 'rangeInt':
    case 'rangeFloat': {
      const value = typeof values[opt.id] === 'number' ? (values[opt.id] as number) : opt.default
      const decimals = opt.type === 'rangeFloat' ? Number(opt.format.match(/%\.(\d+)f/)?.[1] ?? 2) : 0
      const text = value.toFixed(decimals)
      return (
        <div className="cp-slider">
          <input
            type="range"
            min={opt.min}
            max={opt.max}
            step={opt.step}
            value={value}
            onChange={(e) => set(e.target.valueAsNumber)}
          />
          <span className="cp-slider-value">{text}</span>
        </div>
      )
    }
    case 'selectorString': {
      const index = typeof values[opt.id] === 'number' ? (values[opt.id] as number) : opt.default
      const cycle = (delta: number) => {
        const count = opt.elements.length
        set(((index - 1 + delta + count) % count) + 1)
      }
      return (
        <div className="cp-selector">
          <button onClick={() => cycle(-1)}>‹</button>
          <span className="cp-selector-value">{opt.elements[index - 1] ?? '?'}</span>
          <button onClick={() => cycle(1)}>›</button>
        </div>
      )
    }
    case 'button':
      return <button className="cp-button">{opt.buttonText || 'Apply'}</button>
    case 'keyBinding': {
      const key = typeof values[opt.id] === 'string' ? (values[opt.id] as string) : opt.default
      return <KeybindChip value={key} onChange={set} />
    }
  }
}

function KeybindChip({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [listening, setListening] = useState(false)
  return (
    <span
      className={`cp-keybind ${listening ? 'listening' : ''}`}
      tabIndex={0}
      onClick={() => setListening(true)}
      onBlur={() => setListening(false)}
      onKeyDown={(e) => {
        if (!listening) return
        e.preventDefault()
        const name = e.key.length === 1 ? e.key.toUpperCase() : e.key
        onChange(`IK_${name}`)
        setListening(false)
      }}
    >
      {listening ? 'press a key…' : ikDisplay(value)}
    </span>
  )
}
