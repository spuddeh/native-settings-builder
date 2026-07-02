import { useRef, useState } from 'react'
import { useProjectStore } from '../state/store'
import { ImportError, importDoc } from '../model/migrate'

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const loadDoc = useProjectStore((s) => s.loadDoc)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doImport = (source: string) => {
    try {
      loadDoc(importDoc(source))
      onClose()
    } catch (e) {
      setError(e instanceof ImportError ? e.message : `Unexpected error: ${(e as Error).message}`)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Import settings.json</h2>
        <p className="muted">
          Load a settings.json previously exported by this builder to continue editing it.
          The current project will be replaced.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) doImport(await file.text())
          }}
        />
        <p className="muted" style={{ margin: '10px 0 4px' }}>…or paste the JSON:</p>
        <textarea
          className="code"
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "schemaVersion": 1, ... }'
        />
        {error && <p className="error-text">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!text.trim()} onClick={() => doImport(text)}>
            Import
          </button>
        </div>
      </div>
    </div>
  )
}
