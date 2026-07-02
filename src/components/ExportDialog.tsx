import { useState } from 'react'
import { useProjectStore } from '../state/store'
import type { Issue } from '../model/validate'
import { hasErrors } from '../model/validate'
import { deriveDependencies } from '../export/readmeTemplate'
import { buildZip, downloadBlob, downloadSettingsJson } from '../export/zipBuilder'
import { RUNTIME_VERSION } from '../model/defaults'
import { Dialog } from './fields'

export function ExportDialog({
  issues,
  onClose,
  onDone,
}: {
  issues: Issue[]
  onClose: () => void
  onDone: (message: string) => void
}) {
  const doc = useProjectStore((s) => s.doc)
  const [busy, setBusy] = useState(false)
  const blocked = hasErrors(issues)
  const warnings = issues.filter((i) => i.severity === 'warning')
  const deps = deriveDependencies(doc)

  return (
    <Dialog title="Export" onClose={onClose}>
      <div className="field-label">The zip will contain</div>
      <ul className="dep-list muted">
        <li>
          <code>bin/x64/plugins/cyber_engine_tweaks/mods/{doc.mod.cetFolderName}/</code> — fixed runtime
          (v{RUNTIME_VERSION}) + your generated <code>settings.json</code>
          {doc.options.some((o) => o.apply?.kind === 'callback') && (
            <> + <code>user_callbacks.lua</code></>
          )}
        </li>
        <li><code>README.md</code> — install instructions and requirements</li>
      </ul>

      <div className="field-label" style={{ marginTop: 12 }}>Player requirements (derived from your options)</div>
      <ul className="dep-list muted">
        <li>Cyber Engine Tweaks + Native Settings UI (always)</li>
        {(deps.codeware || deps.keybinds) && (
          <li>Codeware ({deps.codeware ? 'world variants' : 'key bindings'})</li>
        )}
        {deps.nif && <li>Native Interactions Framework (interaction toggles)</li>}
      </ul>

      {blocked && (
        <p className="error-text" style={{ marginTop: 12 }}>
          Fix the errors in the log below the preview before exporting.
        </p>
      )}
      {!blocked && warnings.length > 0 && (
        <p style={{ color: 'var(--yellow)', fontSize: 14, marginTop: 12 }}>
          {warnings.length} warning{warnings.length === 1 ? '' : 's'} — you can export anyway, but check the log below the preview.
        </p>
      )}

      <div className="dialog-actions">
        <button onClick={onClose}>Cancel</button>
        <button
          disabled={blocked}
          onClick={() => {
            downloadSettingsJson(doc)
            onDone('Downloaded settings.json')
            onClose()
          }}
        >
          settings.json only
        </button>
        <button
          className="primary"
          disabled={blocked || busy}
          onClick={async () => {
            setBusy(true)
            try {
              const { blob, filename } = await buildZip(doc)
              downloadBlob(blob, filename)
              onDone(`Exported ${filename}`)
              onClose()
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Building…' : 'Download mod zip'}
        </button>
      </div>
    </Dialog>
  )
}
