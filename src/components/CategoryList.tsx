import { useState } from 'react'
import { useProjectStore } from '../state/store'
import type { Issue } from '../model/validate'
import { Dialog } from './fields'

export function CategoryList(props: { issues: Issue[] }) {
  const categories = useProjectStore((s) => s.doc.categories)
  const options = useProjectStore((s) => s.doc.options)
  const selectedCategoryId = useProjectStore((s) => s.selectedCategoryId)
  const { addCategory, updateCategory, moveCategory, removeCategory, selectCategory } = useProjectStore()
  const [newLabel, setNewLabel] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  const worstFor = (id: string): 'error' | 'warning' | null => {
    const relevant = props.issues.filter((i) => i.path === `category:${id}`)
    if (relevant.some((i) => i.severity === 'error')) return 'error'
    if (relevant.length) return 'warning'
    return null
  }

  return (
    <div>
      {categories.map((cat, i) => {
        const count = options.filter((o) => o.category === cat.id).length
        const dot = worstFor(cat.id)
        return (
          <div
            key={cat.id}
            className={`list-item ${selectedCategoryId === cat.id ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => selectCategory(cat.id)}
            onDoubleClick={() => setRenaming(cat.id)}
          >
            {dot && <span className={`issue-dot ${dot}`} />}
            {renaming === cat.id ? (
              <input
                type="text"
                value={cat.label}
                autoFocus
                style={{ flex: 1, padding: '2px 6px' }}
                onChange={(e) => updateCategory(cat.id, { label: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => setRenaming(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') setRenaming(null)
                }}
              />
            ) : (
              <span className="grow">{cat.label}</span>
            )}
            <span className="dim">{count}</span>
            <button
              className="icon"
              title="Rename section (or double-click the row)"
              onClick={(e) => {
                e.stopPropagation()
                setRenaming(renaming === cat.id ? null : cat.id)
              }}
            >
              ✎
            </button>
            <button className="icon" disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, -1) }}>▲</button>
            <button className="icon" disabled={i === categories.length - 1} onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, 1) }}>▼</button>
            <button className="icon danger" onClick={(e) => { e.stopPropagation(); setDeleting(cat.id) }}>✕</button>
          </div>
        )
      })}

      <div className="row" style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="New section label…"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLabel.trim()) {
              addCategory(newLabel.trim())
              setNewLabel('')
            }
          }}
        />
        <button
          style={{ flex: '0 0 auto' }}
          disabled={!newLabel.trim()}
          onClick={() => {
            addCategory(newLabel.trim())
            setNewLabel('')
          }}
        >
          Add section
        </button>
      </div>

      {deleting && (
        <DeleteCategoryDialog
          categoryId={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={(moveTo) => {
            removeCategory(deleting, moveTo)
            setDeleting(null)
          }}
        />
      )}
    </div>
  )
}

function DeleteCategoryDialog(props: {
  categoryId: string
  onClose: () => void
  onConfirm: (moveOptionsTo: string | null) => void
}) {
  const categories = useProjectStore((s) => s.doc.categories)
  const options = useProjectStore((s) => s.doc.options)
  const category = categories.find((c) => c.id === props.categoryId)
  const count = options.filter((o) => o.category === props.categoryId).length
  const others = categories.filter((c) => c.id !== props.categoryId)
  const [moveTo, setMoveTo] = useState<string>(others[0]?.id ?? '')

  if (!category) return null
  return (
    <Dialog title={`Delete section "${category.label}"`} onClose={props.onClose}>
      <>
        {count > 0 ? (
          <>
            <p>
              This section contains {count} option{count === 1 ? '' : 's'}.
            </p>
            {others.length > 0 && (
              <label className="field">
                <span>Move them to</span>
                <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  {others.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                  <option value="">(delete the options too)</option>
                </select>
              </label>
            )}
          </>
        ) : (
          <p>The section is empty.</p>
        )}
        <div className="dialog-actions">
          <button onClick={props.onClose}>Cancel</button>
          <button className="primary" onClick={() => props.onConfirm(count > 0 && moveTo ? moveTo : null)}>
            Delete
          </button>
        </div>
      </>
    </Dialog>
  )
}
