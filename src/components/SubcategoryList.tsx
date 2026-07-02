import { useState } from 'react'
import { useProjectStore } from '../state/store'
import type { Issue } from '../model/validate'
import { Dialog } from './fields'

export function SubcategoryList(props: { issues: Issue[] }) {
  const subcategories = useProjectStore((s) => s.doc.subcategories)
  const options = useProjectStore((s) => s.doc.options)
  const selectedSubcategoryId = useProjectStore((s) => s.selectedSubcategoryId)
  const { addSubcategory, updateSubcategory, moveSubcategory, removeSubcategory, selectSubcategory } = useProjectStore()
  const [newLabel, setNewLabel] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  const worstFor = (id: string): 'error' | 'warning' | null => {
    const relevant = props.issues.filter((i) => i.path === `subcategory:${id}`)
    if (relevant.some((i) => i.severity === 'error')) return 'error'
    if (relevant.length) return 'warning'
    return null
  }

  return (
    <div>
      {subcategories.map((cat, i) => {
        const count = options.filter((o) => o.subcategory === cat.id).length
        const dot = worstFor(cat.id)
        return (
          <div
            key={cat.id}
            className={`list-item ${selectedSubcategoryId === cat.id ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => selectSubcategory(cat.id)}
            onDoubleClick={() => setRenaming(cat.id)}
          >
            {dot && <span className={`issue-dot ${dot}`} />}
            {renaming === cat.id ? (
              <input
                type="text"
                value={cat.label}
                autoFocus
                style={{ flex: 1, padding: '2px 6px' }}
                onChange={(e) => updateSubcategory(cat.id, { label: e.target.value })}
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
              title="Rename subcategory (or double-click the row)"
              onClick={(e) => {
                e.stopPropagation()
                setRenaming(renaming === cat.id ? null : cat.id)
              }}
            >
              ✎
            </button>
            <button className="icon" disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveSubcategory(cat.id, -1) }}>▲</button>
            <button className="icon" disabled={i === subcategories.length - 1} onClick={(e) => { e.stopPropagation(); moveSubcategory(cat.id, 1) }}>▼</button>
            <button className="icon danger" onClick={(e) => { e.stopPropagation(); setDeleting(cat.id) }}>✕</button>
          </div>
        )
      })}

      <div className="row" style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="New subcategory label…"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newLabel.trim()) {
              addSubcategory(newLabel.trim())
              setNewLabel('')
            }
          }}
        />
        <button
          style={{ flex: '0 0 auto' }}
          disabled={!newLabel.trim()}
          onClick={() => {
            addSubcategory(newLabel.trim())
            setNewLabel('')
          }}
        >
          Add subcategory
        </button>
      </div>

      {deleting && (
        <DeleteSubcategoryDialog
          subcategoryId={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={(moveTo) => {
            removeSubcategory(deleting, moveTo)
            setDeleting(null)
          }}
        />
      )}
    </div>
  )
}

function DeleteSubcategoryDialog(props: {
  subcategoryId: string
  onClose: () => void
  onConfirm: (moveOptionsTo: string | null) => void
}) {
  const subcategories = useProjectStore((s) => s.doc.subcategories)
  const options = useProjectStore((s) => s.doc.options)
  const subcategory = subcategories.find((c) => c.id === props.subcategoryId)
  const count = options.filter((o) => o.subcategory === props.subcategoryId).length
  const others = subcategories.filter((c) => c.id !== props.subcategoryId)
  const [moveTo, setMoveTo] = useState<string>(others[0]?.id ?? '')

  if (!subcategory) return null
  return (
    <Dialog title={`Delete subcategory "${subcategory.label}"`} onClose={props.onClose}>
      <>
        {count > 0 ? (
          <>
            <p>
              This subcategory contains {count} option{count === 1 ? '' : 's'}.
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
          <p>The subcategory is empty.</p>
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
