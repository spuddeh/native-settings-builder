import { useProjectStore } from '../state/store'
import type { Issue } from '../model/validate'

export function ValidationPanel({ issues }: { issues: Issue[] }) {
  const doc = useProjectStore((s) => s.doc)
  const selectOption = useProjectStore((s) => s.selectOption)
  const selectCategory = useProjectStore((s) => s.selectCategory)

  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.length - errors

  const focus = (issue: Issue) => {
    if (issue.path.startsWith('option:')) {
      const id = issue.path.slice('option:'.length)
      const opt = doc.options.find((o) => o.id === id)
      if (opt) {
        selectCategory(opt.category)
        selectOption(id)
      }
    } else if (issue.path.startsWith('category:')) {
      selectCategory(issue.path.slice('category:'.length))
    }
  }

  return (
    <div className="validation-panel">
      <div className="console-head">
        <span>/// System log</span>
        {issues.length === 0 ? (
          <span className="count-ok">All clear — ready to export</span>
        ) : (
          <>
            {errors > 0 && <span className="count-err">{errors} error{errors === 1 ? '' : 's'}</span>}
            {warnings > 0 && <span className="count-warn">{warnings} warning{warnings === 1 ? '' : 's'}</span>}
          </>
        )}
      </div>
      {issues.length > 0 && (
        <div className="console-body">
          {issues.map((issue, i) => (
            <div className="issue" key={i} onClick={() => focus(issue)}>
              <span className={`issue-dot ${issue.severity}`} />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
