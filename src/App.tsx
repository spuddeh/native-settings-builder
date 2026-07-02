import { useEffect, useMemo, useRef, useState } from 'react'
import { useProjectStore } from './state/store'
import { loadAutosaved } from './state/autosave'
import { validate } from './model/validate'
import { importDoc } from './model/migrate'
import { RUNTIME_VERSION, SITE_VERSION } from './model/defaults'
import { Section } from './components/fields'
import { MetadataForm } from './components/MetadataForm'
import { SubcategoryList } from './components/SubcategoryList'
import { OptionList } from './components/OptionList'
import { OptionEditor } from './components/OptionEditor'
import { TranslationsEditor } from './components/TranslationsEditor'
import { CompatRulesEditor } from './components/CompatRulesEditor'
import { ValidationPanel } from './components/ValidationPanel'
import { ImportDialog } from './components/ImportDialog'
import { ExportDialog } from './components/ExportDialog'
import { PreviewPane } from './preview/PreviewPane'
import exampleJson from '../examples/northside-example.settings.json?raw'

type DialogName = 'import' | 'export' | null

export default function App() {
  const doc = useProjectStore((s) => s.doc)
  const loadDoc = useProjectStore((s) => s.loadDoc)
  const resetDoc = useProjectStore((s) => s.resetDoc)
  const [dialog, setDialog] = useState<DialogName>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(undefined)
  const [open, setOpen] = useState({
    mod: true,
    sections: true,
    options: true,
    editor: true,
    translations: false,
    compat: false,
  })

  const showToast = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  // ?example opens the example project (handy for sharing/demos); otherwise
  // offer to resume the autosaved project once, on first load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('example')) {
      const example = importDoc(exampleJson)
      loadDoc(example)
      const select = params.get('select')
      const target = example.options.find((o) => o.id === select)
      if (target) {
        useProjectStore.getState().selectSubcategory(target.subcategory)
        useProjectStore.getState().selectOption(target.id)
      }
      return
    }
    const saved = loadAutosaved()
    if (saved && window.confirm('Resume your last session? (Cancel starts a fresh project.)')) {
      loadDoc(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const issues = useMemo(() => validate(doc), [doc])
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const toggle = (key: keyof typeof open) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  const loadExample = () => {
    if (!window.confirm('Load the example project? Your current project will be replaced.')) return
    loadDoc(importDoc(exampleJson))
    showToast('Example project loaded')
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">
          Native Settings <em>Builder</em>
        </h1>
        <span className="badge">runtime v{RUNTIME_VERSION}</span>
        <div className="spacer" />
        <button
          onClick={() => {
            if (window.confirm('Start a new project? Unsaved changes are lost.')) resetDoc()
          }}
        >
          New
        </button>
        <button onClick={loadExample}>Load example</button>
        <button onClick={() => setDialog('import')}>Import</button>
        <button className="primary" onClick={() => setDialog('export')}>
          Export
          {errorCount > 0 && <span className="err-badge">{errorCount}</span>}
        </button>
      </header>

      <div className="app-main">
        <div className="editor-pane">
          <Section title="Mod setup" open={open.mod} onToggle={() => toggle('mod')}>
            <MetadataForm />
          </Section>
          <Section title="Subcategories" open={open.sections} onToggle={() => toggle('sections')} badge={String(doc.subcategories.length)}>
            <SubcategoryList issues={issues} />
          </Section>
          <Section title="Options" open={open.options} onToggle={() => toggle('options')} badge={String(doc.options.length)}>
            <OptionList issues={issues} />
          </Section>
          <Section title="Option editor" open={open.editor} onToggle={() => toggle('editor')}>
            <OptionEditor />
          </Section>
          <Section
            title="Translations"
            open={open.translations}
            onToggle={() => toggle('translations')}
            badge={doc.translations ? String(Object.keys(doc.translations).length) : undefined}
          >
            <TranslationsEditor />
          </Section>
          <Section
            title="Mod compatibility"
            open={open.compat}
            onToggle={() => toggle('compat')}
            badge={doc.compat?.length ? String(doc.compat.length) : undefined}
          >
            <CompatRulesEditor />
          </Section>
          <p className="hint">
            Native Settings Builder v{SITE_VERSION}. Your work autosaves in this browser.
          </p>
        </div>

        <div className="preview-side">
          <div className="preview-scroll">
            <PreviewPane />
          </div>
          <ValidationPanel issues={issues} />
        </div>
      </div>

      {dialog === 'import' && <ImportDialog onClose={() => setDialog(null)} onDone={showToast} />}
      {dialog === 'export' && <ExportDialog issues={issues} onClose={() => setDialog(null)} onDone={showToast} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
