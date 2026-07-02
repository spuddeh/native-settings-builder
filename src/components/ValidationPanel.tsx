import { useProjectStore } from '../state/store'
import type { Issue } from '../model/validate'

export function ValidationPanel({ issues }: { issues: Issue[] }) {
  const doc = useProjectStore((s) => s.doc)
  const selectOption = useProjectStore((s) => s.selectOption)
  const selectCategory = useProjectStore((s) => s.selectCategory)

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
      {issues.length === 0 ? (
        <span className="validation-ok">✓ No problems found</span>
      ) : (
        issues.map((issue, i) => (
          <div className="issue" key={i} onClick={() => focus(issue)}>
            <span className={`issue-dot ${issue.severity}`} />
            <span>{issue.message}</span>
          </div>
        ))
      )}
    </div>
  )
}
