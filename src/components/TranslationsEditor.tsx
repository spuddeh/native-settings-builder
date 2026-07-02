import { useState } from 'react'
import { useProjectStore } from '../state/store'

const GAME_LANGUAGES = [
  'ar-ar', 'cz-cz', 'de-de', 'es-es', 'es-mx', 'fr-fr', 'hu-hu', 'it-it',
  'jp-jp', 'kr-kr', 'pl-pl', 'pt-br', 'ru-ru', 'th-th', 'tr-tr',
  'zh-cn', 'zh-tw',
]

export function TranslationsEditor() {
  const doc = useProjectStore((s) => s.doc)
  const setTranslations = useProjectStore((s) => s.setTranslations)
  const [newLang, setNewLang] = useState(GAME_LANGUAGES[0])

  const translations = doc.translations ?? {}
  const languages = Object.keys(translations)

  const suggestedKeys = [
    'mod.modName',
    ...doc.categories.map((c) => `categories.${c.id}`),
    ...doc.options.flatMap((o) => [`${o.id}.label`, `${o.id}.description`]),
  ]

  const setLang = (lang: string, entries: Record<string, string | string[]> | null) => {
    const next = { ...translations }
    if (entries === null) delete next[lang]
    else next[lang] = entries
    setTranslations(Object.keys(next).length ? next : undefined)
  }

  return (
    <div>
      <p className="hint" style={{ marginTop: 0 }}>
        Optional. The texts you typed above are the English defaults; add per-language overrides here.
        Tip: any text starting with LocKey# is translated by the game itself, no overrides needed.
      </p>
      {languages.map((lang) => (
        <LangBlock
          key={lang}
          lang={lang}
          entries={translations[lang]}
          suggestedKeys={suggestedKeys}
          onChange={(entries) => setLang(lang, entries)}
        />
      ))}
      <div className="row">
        <select value={newLang} onChange={(e) => setNewLang(e.target.value)}>
          {GAME_LANGUAGES.filter((l) => !languages.includes(l)).map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button
          style={{ flex: '0 0 auto' }}
          disabled={languages.includes(newLang)}
          onClick={() => setLang(newLang, {})}
        >
          Add language
        </button>
      </div>
    </div>
  )
}

function LangBlock(props: {
  lang: string
  entries: Record<string, string | string[]>
  suggestedKeys: string[]
  onChange: (entries: Record<string, string | string[]> | null) => void
}) {
  const [newKey, setNewKey] = useState('')
  const keys = Object.keys(props.entries)

  return (
    <div style={{ border: '1px solid var(--app-line)', borderRadius: 4, padding: 10, marginBottom: 10 }}>
      <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ flex: 1 }}>{props.lang}</strong>
        <button className="icon danger" style={{ flex: '0 0 auto' }} onClick={() => props.onChange(null)}>
          Remove language
        </button>
      </div>
      {keys.map((key) => {
        const value = props.entries[key]
        if (typeof value !== 'string') return null // element arrays are import-only for now
        return (
          <div className="row" key={key} style={{ marginBottom: 6, alignItems: 'center' }}>
            <code style={{ flex: '0 0 42%', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{key}</code>
            <input
              type="text"
              value={value}
              onChange={(e) => props.onChange({ ...props.entries, [key]: e.target.value })}
            />
            <button
              className="icon danger"
              style={{ flex: '0 0 auto' }}
              onClick={() => {
                const next = { ...props.entries }
                delete next[key]
                props.onChange(next)
              }}
            >
              ✕
            </button>
          </div>
        )
      })}
      <div className="row">
        <input
          type="text"
          list={`nsb-keys-${props.lang}`}
          placeholder="key, e.g. my_option.label"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <datalist id={`nsb-keys-${props.lang}`}>
          {props.suggestedKeys.filter((k) => !(k in props.entries)).map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <button
          style={{ flex: '0 0 auto' }}
          disabled={!newKey.trim() || newKey in props.entries}
          onClick={() => {
            props.onChange({ ...props.entries, [newKey.trim()]: '' })
            setNewKey('')
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
