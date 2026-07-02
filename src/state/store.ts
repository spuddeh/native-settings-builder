import { create } from 'zustand'
import type { Subcategory, CompatRule, ModMeta, SettingsDoc, SettingsOption, WidgetType } from '../model/schema'
import { newDoc, newOption } from '../model/defaults'

interface ProjectState {
  doc: SettingsDoc
  /** id of the option currently open in the editor drawer, if any */
  selectedOptionId: string | null
  selectedSubcategoryId: string | null

  loadDoc: (doc: SettingsDoc) => void
  resetDoc: () => void
  setMod: (patch: Partial<ModMeta>) => void
  setTranslations: (translations: SettingsDoc['translations']) => void
  setCompat: (compat: CompatRule[] | undefined) => void

  addSubcategory: (label: string) => void
  updateSubcategory: (id: string, patch: Partial<Subcategory>) => void
  moveSubcategory: (id: string, delta: number) => void
  removeSubcategory: (id: string, moveOptionsTo: string | null) => void

  addOption: (type: WidgetType, subcategory: string) => void
  updateOption: (id: string, next: SettingsOption) => void
  moveOption: (id: string, delta: number) => void
  duplicateOption: (id: string) => void
  removeOption: (id: string) => void

  selectOption: (id: string | null) => void
  selectSubcategory: (id: string | null) => void
}

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const useProjectStore = create<ProjectState>((set) => ({
  doc: newDoc(),
  selectedOptionId: null,
  selectedSubcategoryId: 'general',

  loadDoc: (doc) =>
    set({
      doc,
      selectedOptionId: null,
      selectedSubcategoryId: doc.subcategories[0]?.id ?? null,
    }),

  resetDoc: () => set({ doc: newDoc(), selectedOptionId: null, selectedSubcategoryId: 'general' }),

  setMod: (patch) =>
    set((s) => ({ doc: { ...s.doc, mod: { ...s.doc.mod, ...patch } } })),

  setTranslations: (translations) =>
    set((s) => ({ doc: { ...s.doc, translations } })),

  setCompat: (compat) =>
    set((s) => ({ doc: { ...s.doc, compat } })),

  addSubcategory: (label) =>
    set((s) => {
      const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'subcategory'
      let id = base
      let n = 1
      while (s.doc.subcategories.some((c) => c.id === id)) {
        n += 1
        id = `${base}_${n}`
      }
      return {
        doc: { ...s.doc, subcategories: [...s.doc.subcategories, { id, label }] },
        selectedSubcategoryId: id,
      }
    }),

  updateSubcategory: (id, patch) =>
    set((s) => ({
      doc: {
        ...s.doc,
        subcategories: s.doc.subcategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    })),

  moveSubcategory: (id, delta) =>
    set((s) => {
      const idx = s.doc.subcategories.findIndex((c) => c.id === id)
      if (idx === -1) return s
      return { doc: { ...s.doc, subcategories: moveInArray(s.doc.subcategories, idx, idx + delta) } }
    }),

  removeSubcategory: (id, moveOptionsTo) =>
    set((s) => {
      const subcategories = s.doc.subcategories.filter((c) => c.id !== id)
      const options = moveOptionsTo
        ? s.doc.options.map((o) => (o.subcategory === id ? { ...o, subcategory: moveOptionsTo } : o))
        : s.doc.options.filter((o) => o.subcategory !== id)
      return {
        doc: { ...s.doc, subcategories, options },
        selectedSubcategoryId: subcategories[0]?.id ?? null,
        selectedOptionId: null,
      }
    }),

  addOption: (type, subcategory) =>
    set((s) => {
      const option = newOption(type, subcategory, new Set(s.doc.options.map((o) => o.id)))
      return {
        doc: { ...s.doc, options: [...s.doc.options, option] },
        selectedOptionId: option.id,
      }
    }),

  updateOption: (id, next) =>
    set((s) => ({
      doc: { ...s.doc, options: s.doc.options.map((o) => (o.id === id ? next : o)) },
      selectedOptionId: next.id,
    })),

  moveOption: (id, delta) =>
    set((s) => {
      const option = s.doc.options.find((o) => o.id === id)
      if (!option) return s
      // Move within the option's own subcategory while keeping the global array order stable.
      const siblings = s.doc.options.filter((o) => o.subcategory === option.subcategory)
      const sibIdx = siblings.findIndex((o) => o.id === id)
      const targetSib = siblings[sibIdx + delta]
      if (!targetSib) return s
      const from = s.doc.options.findIndex((o) => o.id === id)
      const to = s.doc.options.findIndex((o) => o.id === targetSib.id)
      return { doc: { ...s.doc, options: moveInArray(s.doc.options, from, to) } }
    }),

  duplicateOption: (id) =>
    set((s) => {
      const source = s.doc.options.find((o) => o.id === id)
      if (!source) return s
      const ids = new Set(s.doc.options.map((o) => o.id))
      let copyId = `${source.id}_copy`
      let n = 1
      while (ids.has(copyId)) {
        n += 1
        copyId = `${source.id}_copy_${n}`
      }
      const copy = structuredClone(source)
      copy.id = copyId
      if (copy.apply?.kind === 'callback') {
        copy.apply.function = `${copyId}_pressed`
      }
      const from = s.doc.options.findIndex((o) => o.id === id)
      const options = [...s.doc.options]
      options.splice(from + 1, 0, copy)
      return { doc: { ...s.doc, options }, selectedOptionId: copyId }
    }),

  removeOption: (id) =>
    set((s) => ({
      doc: { ...s.doc, options: s.doc.options.filter((o) => o.id !== id) },
      selectedOptionId: s.selectedOptionId === id ? null : s.selectedOptionId,
    })),

  selectOption: (id) => set({ selectedOptionId: id }),
  selectSubcategory: (id) => set({ selectedSubcategoryId: id, selectedOptionId: null }),
}))
