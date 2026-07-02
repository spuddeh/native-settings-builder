import { useEffect, useMemo, useState } from 'react'
import { useProjectStore } from './state/store'
import { loadAutosaved } from './state/autosave'
import { validate } from './model/validate'
import { RUNTIME_VERSION, SITE_VERSION } from './model/defaults'
import { Section } from './components/fields'
import { MetadataForm } from './components/MetadataForm'
import { CategoryList } from './components/CategoryList'
import { OptionList } from './components/OptionList'
import { OptionEditor } from './components/OptionEditor'
import { TranslationsEditor } from './components/TranslationsEditor'
import { CompatRulesEditor } from './components/CompatRulesEditor'
import { ValidationPanel } from './components/ValidationPanel'
import { ImportDialog } from './components/ImportDialog'
import { ExportDialog } from './components/ExportDialog'
import { PreviewPane } from './preview/PreviewPane'

type Dialog = 'import' | 'export' | null

export default function App() {
  const doc = useProjectStore((s) => s.doc)
  const loadDoc = useProjectStore((s) => s.loadDoc)
  const resetDoc = useProjectStore((s) => s.resetDoc)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [open, setOpen] = useState({
    mod: true,
    sections: true,
    options: true,
    editor: true,
    translations: false,
    compat: false,
  })

  // Offer to resume the autosaved project once, on first load.
  useEffect(() => {
    const saved = loadAutosaved()
    if (saved && window.confirm('Resume your last session? (Cancel starts a fresh project.)')) {
      loadDoc(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const issues = useMemo(() => validate(doc), [doc])
  const toggle = (key: keyof typeof open) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="app">
      <header className="topbar">
        <h1>
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
        <button onClick={() => setDialog('import')}>Import</button>
        <button className="primary" onClick={() => setDialog('export')}>
          Export
        </button>
      </header>

      <div className="app-main">
        <div className="editor-pane">
          <Section title="Mod" open={open.mod} onToggle={() => toggle('mod')}>
            <MetadataForm />
          </Section>
          <Section title="Sections" open={open.sections} onToggle={() => toggle('sections')} badge={String(doc.categories.length)}>
            <CategoryList issues={issues} />
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

      {dialog === 'import' && <ImportDialog onClose={() => setDialog(null)} />}
      {dialog === 'export' && <ExportDialog issues={issues} onClose={() => setDialog(null)} />}
    </div>
  )
}
